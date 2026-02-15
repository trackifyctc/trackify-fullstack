import uuid
import json
from typing import Optional, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func
import qrcode
import io
import base64

from app.models.inventory import Inventory, InventoryStatus
from app.schemas.inventory import InventoryCreate, InventoryUpdate


def generate_qr_code(data: str) -> str:
    """Generate QR code and return as base64 data URL"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    base64_image = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/png;base64,{base64_image}"


def generate_sku(db: Session) -> str:
    """Generate unique SKU"""
    count = db.query(Inventory).count()
    return f"TRK-{str(count + 1).zfill(6)}"


def create_inventory(db: Session, payload: InventoryCreate) -> Inventory:
    """Create a new inventory item with auto-generated QR code"""
    item_id = uuid.uuid4()
    sku = payload.sku if payload.sku else generate_sku(db)
    
    # Generate QR code data - simple SKU text for easy scanning
    qr_code = generate_qr_code(sku)
    
    item = Inventory(
        id=item_id,
        name=payload.name,
        description=payload.description,
        sku=sku,
        barcode=payload.barcode,
        qr_code=qr_code,
        category=payload.category,
        location=payload.location,
        location_id=payload.location_id,
        status=payload.status.value if payload.status else 'Tersedia',
        quantity=payload.quantity,
        min_quantity=payload.min_quantity,
        max_quantity=payload.max_quantity,
        unit=payload.unit,
        price=payload.price,
        image_url=payload.image_url,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def get_inventory_items(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    location: Optional[str] = None,
) -> List[Inventory]:
    """Get inventory items with optional filters"""
    query = db.query(Inventory)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Inventory.name.ilike(search_filter)) |
            (Inventory.sku.ilike(search_filter)) |
            (Inventory.barcode.ilike(search_filter))
        )
    
    if category:
        query = query.filter(Inventory.category == category)
    
    if status:
        query = query.filter(Inventory.status == status)
    
    if location:
        query = query.filter(Inventory.location.ilike(f"%{location}%"))
    
    return query.order_by(Inventory.created_at.desc()).offset(skip).limit(limit).all()


def get_inventory_item(db: Session, item_id: uuid.UUID) -> Optional[Inventory]:
    """Get a single inventory item by ID"""
    return db.query(Inventory).filter(Inventory.id == item_id).first()


def get_inventory_by_barcode(db: Session, barcode: str) -> Optional[Inventory]:
    """Get inventory item by barcode"""
    return db.query(Inventory).filter(Inventory.barcode == barcode).first()


def get_inventory_by_sku(db: Session, sku: str) -> Optional[Inventory]:
    """Get inventory item by SKU"""
    return db.query(Inventory).filter(Inventory.sku == sku).first()


def update_inventory(db: Session, item: Inventory, payload: InventoryUpdate) -> Inventory:
    """Update an inventory item"""
    update_data = payload.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        if field == "status" and value:
            setattr(item, field, value.value if hasattr(value, 'value') else value)
        else:
            setattr(item, field, value)
    
    db.commit()
    db.refresh(item)
    return item


def delete_inventory(db: Session, item: Inventory) -> None:
    """Delete an inventory item"""
    db.delete(item)
    db.commit()


def update_last_scanned(db: Session, item: Inventory, user_id: Optional[uuid.UUID] = None) -> Inventory:
    """Update last scanned timestamp"""
    item.last_scanned_at = datetime.now(timezone.utc)
    if user_id:
        item.last_scanned_by = user_id
    db.commit()
    db.refresh(item)
    return item


def get_inventory_stats(db: Session) -> dict:
    """Get inventory statistics"""
    total = db.query(Inventory).count()
    available = db.query(Inventory).filter(Inventory.status == InventoryStatus.AVAILABLE).count()
    borrowed = db.query(Inventory).filter(Inventory.status == InventoryStatus.BORROWED).count()
    missing = db.query(Inventory).filter(Inventory.status == InventoryStatus.MISSING).count()
    damaged = db.query(Inventory).filter(Inventory.status == InventoryStatus.DAMAGED).count()
    
    low_stock = db.query(Inventory).filter(Inventory.quantity <= Inventory.min_quantity).count()
    
    total_value = db.query(func.sum(Inventory.price * Inventory.quantity)).scalar() or 0
    
    return {
        "total_items": total,
        "available_items": available,
        "borrowed_items": borrowed,
        "missing_items": missing,
        "damaged_items": damaged,
        "low_stock_items": low_stock,
        "total_value": float(total_value),
    }


def get_categories(db: Session) -> List[str]:
    """Get all unique categories"""
    categories = db.query(Inventory.category).distinct().all()
    return [c[0] for c in categories if c[0]]
