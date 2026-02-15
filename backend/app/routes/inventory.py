from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.schemas.inventory import InventoryCreate, InventoryRead, InventoryUpdate, InventoryStats
from app.crud.inventory import (
    create_inventory, get_inventory_items, get_inventory_item,
    get_inventory_by_barcode, get_inventory_by_sku, update_inventory,
    delete_inventory, update_last_scanned, get_inventory_stats, get_categories
)
from app.crud.activity import create_activity_log
from app.schemas.activity import ActivityLogCreate, ActionType

router = APIRouter(prefix="/api/inventory", tags=["Inventory"])


@router.post("/", response_model=InventoryRead, status_code=status.HTTP_201_CREATED)
def add_inventory(
    payload: InventoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new inventory item"""
    # Check if SKU already exists
    if payload.sku and get_inventory_by_sku(db, payload.sku):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SKU already exists"
        )
    
    # Check if barcode already exists
    if payload.barcode and get_inventory_by_barcode(db, payload.barcode):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Barcode already exists"
        )
    
    item = create_inventory(db, payload)
    
    # Log activity
    create_activity_log(db, ActivityLogCreate(
        inventory_item_id=item.id,
        user_id=current_user.id,
        action=f"Created item: {item.name}",
        action_type=ActionType.CREATED,
        user=current_user.full_name or current_user.email,
        location=item.location,
    ))
    
    return item


@router.get("/", response_model=list[InventoryRead])
def list_inventory(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    location: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all inventory items with optional filters"""
    return get_inventory_items(
        db, skip=skip, limit=limit, search=search,
        category=category, status=status, location=location
    )


@router.get("/stats", response_model=InventoryStats)
def inventory_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get inventory statistics"""
    return get_inventory_stats(db)


@router.get("/categories", response_model=list[str])
def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all unique categories"""
    return get_categories(db)


@router.get("/barcode/{barcode}", response_model=InventoryRead)
def get_by_barcode(
    barcode: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get inventory item by barcode"""
    item = get_inventory_by_barcode(db, barcode)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.get("/{item_id}", response_model=InventoryRead)
def read_inventory(
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single inventory item"""
    item = get_inventory_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.patch("/{item_id}", response_model=InventoryRead)
def modify_inventory(
    item_id: UUID,
    payload: InventoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an inventory item"""
    item = get_inventory_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    updated_item = update_inventory(db, item, payload)
    
    # Log activity
    create_activity_log(db, ActivityLogCreate(
        inventory_item_id=item_id,
        user_id=current_user.id,
        action=f"Updated item: {updated_item.name}",
        action_type=ActionType.UPDATED,
        user=current_user.full_name or current_user.email,
        location=updated_item.location,
    ))
    
    return updated_item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_inventory(
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an inventory item"""
    item = get_inventory_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    item_name = item.name
    delete_inventory(db, item)
    
    # Log activity
    create_activity_log(db, ActivityLogCreate(
        user_id=current_user.id,
        action=f"Deleted item: {item_name}",
        action_type=ActionType.DELETED,
        user=current_user.full_name or current_user.email,
    ))


@router.post("/{item_id}/scan", response_model=InventoryRead)
def scan_inventory(
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record a scan for an inventory item"""
    item = get_inventory_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    updated_item = update_last_scanned(db, item, current_user.id)
    
    # Log activity
    create_activity_log(db, ActivityLogCreate(
        inventory_item_id=item_id,
        user_id=current_user.id,
        action=f"Scanned item: {item.name}",
        action_type=ActionType.SCANNED,
        user=current_user.full_name or current_user.email,
        location=item.location,
        has_barcode_scan=True,
    ))
    
    return updated_item
