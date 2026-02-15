from datetime import datetime, date, timezone
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.camera_capture import CameraCapture
from app.models.device import Device
from app.schemas.camera_capture import CameraCaptureCreate, CameraCaptureUpdate


def create_camera_capture(db: Session, payload: CameraCaptureCreate) -> CameraCapture:
    """Create a new camera capture entry"""
    capture = CameraCapture(
        device_id=payload.device_id,
        location_id=payload.location_id,
        image_url=payload.image_url,
        image_base64=payload.image_base64,
        thumbnail_url=payload.thumbnail_url,
        title=payload.title,
        description=payload.description,
        location_name=payload.location_name,
        detected_objects=payload.detected_objects,
        detected_count=payload.detected_count,
        is_alert=payload.is_alert,
        alert_type=payload.alert_type,
        captured_at=payload.captured_at or datetime.now(timezone.utc),
    )
    db.add(capture)
    db.commit()
    db.refresh(capture)
    return capture


def get_camera_capture(db: Session, capture_id: UUID) -> Optional[CameraCapture]:
    """Get a single camera capture by ID"""
    return db.query(CameraCapture).filter(CameraCapture.id == capture_id).first()


def get_camera_captures(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    device_id: Optional[UUID] = None,
    location_id: Optional[UUID] = None,
    is_alert: Optional[bool] = None,
    is_reviewed: Optional[bool] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> List[CameraCapture]:
    """Get camera captures with optional filters"""
    query = db.query(CameraCapture)
    
    if device_id:
        query = query.filter(CameraCapture.device_id == device_id)
    
    if location_id:
        query = query.filter(CameraCapture.location_id == location_id)
    
    if is_alert is not None:
        query = query.filter(CameraCapture.is_alert == is_alert)
    
    if is_reviewed is not None:
        query = query.filter(CameraCapture.is_reviewed == is_reviewed)
    
    if start_date:
        query = query.filter(CameraCapture.captured_at >= datetime.combine(start_date, datetime.min.time()))
    
    if end_date:
        query = query.filter(CameraCapture.captured_at <= datetime.combine(end_date, datetime.max.time()))
    
    return query.order_by(CameraCapture.captured_at.desc()).offset(skip).limit(limit).all()


def count_camera_captures(
    db: Session,
    device_id: Optional[UUID] = None,
    location_id: Optional[UUID] = None,
    is_alert: Optional[bool] = None,
    is_reviewed: Optional[bool] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> int:
    """Count camera captures with optional filters"""
    query = db.query(func.count(CameraCapture.id))
    
    if device_id:
        query = query.filter(CameraCapture.device_id == device_id)
    
    if location_id:
        query = query.filter(CameraCapture.location_id == location_id)
    
    if is_alert is not None:
        query = query.filter(CameraCapture.is_alert == is_alert)
    
    if is_reviewed is not None:
        query = query.filter(CameraCapture.is_reviewed == is_reviewed)
    
    if start_date:
        query = query.filter(CameraCapture.captured_at >= datetime.combine(start_date, datetime.min.time()))
    
    if end_date:
        query = query.filter(CameraCapture.captured_at <= datetime.combine(end_date, datetime.max.time()))
    
    return query.scalar() or 0


def update_camera_capture(
    db: Session, 
    capture_id: UUID, 
    payload: CameraCaptureUpdate
) -> Optional[CameraCapture]:
    """Update a camera capture"""
    capture = get_camera_capture(db, capture_id)
    if not capture:
        return None
    
    update_data = payload.model_dump(exclude_unset=True)
    
    # Handle review timestamp
    if "is_reviewed" in update_data and update_data["is_reviewed"]:
        update_data["reviewed_at"] = datetime.now(timezone.utc)
    
    for key, value in update_data.items():
        setattr(capture, key, value)
    
    db.commit()
    db.refresh(capture)
    return capture


def delete_camera_capture(db: Session, capture_id: UUID) -> bool:
    """Delete a camera capture"""
    capture = get_camera_capture(db, capture_id)
    if not capture:
        return False
    
    db.delete(capture)
    db.commit()
    return True


def get_captures_by_device(db: Session, device_id: UUID, limit: int = 20) -> List[CameraCapture]:
    """Get recent captures from a specific device"""
    return (
        db.query(CameraCapture)
        .filter(CameraCapture.device_id == device_id)
        .order_by(CameraCapture.captured_at.desc())
        .limit(limit)
        .all()
    )


def get_alert_captures(db: Session, limit: int = 50) -> List[CameraCapture]:
    """Get captures that are alerts"""
    return (
        db.query(CameraCapture)
        .filter(CameraCapture.is_alert == True)
        .order_by(CameraCapture.captured_at.desc())
        .limit(limit)
        .all()
    )
