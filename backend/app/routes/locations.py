from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.schemas.location import LocationCreate, LocationRead, LocationUpdate
from app.schemas.inventory import InventoryRead
from app.crud.location import (
    create_location, get_locations, get_location, get_location_by_code,
    update_location, delete_location, get_location_items, get_location_stats
)

router = APIRouter(prefix="/api/locations", tags=["Locations"])


@router.post("/", response_model=LocationRead, status_code=status.HTTP_201_CREATED)
def add_location(
    payload: LocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new location"""
    # Check if code already exists
    if get_location_by_code(db, payload.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Location code already exists"
        )
    
    return create_location(db, payload)


@router.get("/", response_model=list[LocationRead])
def list_locations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    is_active: Optional[bool] = None,
    floor: Optional[str] = None,
    zone: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all locations with optional filters"""
    return get_locations(
        db, skip=skip, limit=limit,
        is_active=is_active, floor=floor, zone=zone
    )


@router.get("/stats")
def location_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get location statistics"""
    return get_location_stats(db)


@router.get("/{location_id}", response_model=LocationRead)
def read_location(
    location_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single location"""
    location = get_location(db, location_id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    return location


@router.get("/{location_id}/items", response_model=list[InventoryRead])
def read_location_items(
    location_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all items in a location"""
    location = get_location(db, location_id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    return get_location_items(db, location_id)


@router.patch("/{location_id}", response_model=LocationRead)
def modify_location(
    location_id: UUID,
    payload: LocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a location"""
    location = get_location(db, location_id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    # Check if new code already exists
    if payload.code and payload.code != location.code:
        if get_location_by_code(db, payload.code):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Location code already exists"
            )
    
    return update_location(db, location, payload)


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_location(
    location_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a location"""
    location = get_location(db, location_id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    # Check if location has items
    items = get_location_items(db, location_id)
    if items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete location with items. Move or delete items first."
        )
    
    delete_location(db, location)
