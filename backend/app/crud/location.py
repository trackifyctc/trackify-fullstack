import uuid
import json
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.location import Location
from app.models.inventory import Inventory
from app.schemas.location import LocationCreate, LocationUpdate


def create_location(db: Session, payload: LocationCreate) -> Location:
    """Create a new location"""
    # Convert coordinates to JSON string if present
    coordinates_json = json.dumps(payload.coordinates) if payload.coordinates else None
    
    location = Location(
        name=payload.name,
        code=payload.code,
        description=payload.description,
        floor=payload.floor,
        zone=payload.zone,
        capacity=payload.capacity,
        coordinates=payload.coordinates,
        is_active=payload.is_active,
    )
    db.add(location)
    db.commit()
    db.refresh(location)
    return location


def get_locations(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
    floor: Optional[str] = None,
    zone: Optional[str] = None,
) -> List[Location]:
    """Get locations with optional filters"""
    query = db.query(Location)
    
    if is_active is not None:
        query = query.filter(Location.is_active == is_active)
    
    if floor:
        query = query.filter(Location.floor == floor)
    
    if zone:
        query = query.filter(Location.zone == zone)
    
    return query.order_by(Location.name).offset(skip).limit(limit).all()


def get_location(db: Session, location_id: uuid.UUID) -> Optional[Location]:
    """Get a single location by ID"""
    return db.query(Location).filter(Location.id == location_id).first()


def get_location_by_code(db: Session, code: str) -> Optional[Location]:
    """Get location by code"""
    return db.query(Location).filter(Location.code == code).first()


def update_location(db: Session, location: Location, payload: LocationUpdate) -> Location:
    """Update a location"""
    update_data = payload.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(location, field, value)
    
    db.commit()
    db.refresh(location)
    return location


def delete_location(db: Session, location: Location) -> None:
    """Delete a location"""
    db.delete(location)
    db.commit()


def update_location_item_count(db: Session, location_id: uuid.UUID) -> Optional[Location]:
    """Update the current items count for a location"""
    location = get_location(db, location_id)
    if location:
        count = db.query(Inventory).filter(Inventory.location_id == location_id).count()
        location.current_items = count
        db.commit()
        db.refresh(location)
    return location


def get_location_items(db: Session, location_id: uuid.UUID) -> List[Inventory]:
    """Get all items in a location"""
    return db.query(Inventory).filter(Inventory.location_id == location_id).all()


def get_location_stats(db: Session) -> dict:
    """Get location statistics"""
    total = db.query(Location).count()
    active = db.query(Location).filter(Location.is_active == True).count()
    
    # Get total capacity and usage
    total_capacity = db.query(func.sum(Location.capacity)).scalar() or 0
    total_items = db.query(func.sum(Location.current_items)).scalar() or 0
    
    return {
        "total_locations": total,
        "active_locations": active,
        "total_capacity": int(total_capacity),
        "total_items_stored": int(total_items),
        "utilization_percentage": round((total_items / total_capacity * 100) if total_capacity > 0 else 0, 2),
    }
