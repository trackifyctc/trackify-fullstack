from datetime import date
from typing import Optional
from uuid import UUID
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.models.device import Device
from app.crud.camera_capture import (
    create_camera_capture,
    get_camera_capture,
    get_camera_captures,
    count_camera_captures,
    update_camera_capture,
    delete_camera_capture,
    get_alert_captures,
)
from app.schemas.camera_capture import (
    CameraCaptureCreate,
    CameraCaptureRead,
    CameraCaptureUpdate,
    CameraCaptureDetail,
    CameraCaptureListResponse,
)

router = APIRouter(prefix="/camera-captures", tags=["camera-captures"])


@router.get("", response_model=CameraCaptureListResponse)
def list_camera_captures(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    device_id: Optional[UUID] = None,
    location_id: Optional[UUID] = None,
    is_alert: Optional[bool] = None,
    is_reviewed: Optional[bool] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get paginated list of camera captures with filters"""
    skip = (page - 1) * limit
    
    captures = get_camera_captures(
        db,
        skip=skip,
        limit=limit,
        device_id=device_id,
        location_id=location_id,
        is_alert=is_alert,
        is_reviewed=is_reviewed,
        start_date=start_date,
        end_date=end_date,
    )
    
    total = count_camera_captures(
        db,
        device_id=device_id,
        location_id=location_id,
        is_alert=is_alert,
        is_reviewed=is_reviewed,
        start_date=start_date,
        end_date=end_date,
    )
    
    # Add device name to each capture
    items = []
    for capture in captures:
        item_dict = {
            "id": capture.id,
            "device_id": capture.device_id,
            "location_id": capture.location_id,
            "image_url": capture.image_url,
            "image_base64": capture.image_base64,
            "thumbnail_url": capture.thumbnail_url,
            "title": capture.title,
            "description": capture.description,
            "location_name": capture.location_name,
            "detected_objects": capture.detected_objects,
            "detected_count": capture.detected_count,
            "is_alert": capture.is_alert,
            "alert_type": capture.alert_type,
            "captured_at": capture.captured_at,
            "is_reviewed": capture.is_reviewed,
            "reviewed_by": capture.reviewed_by,
            "reviewed_at": capture.reviewed_at,
            "created_at": capture.created_at,
            "device_name": capture.device.name if capture.device else None,
        }
        items.append(CameraCaptureRead(**item_dict))
    
    return CameraCaptureListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=ceil(total / limit) if limit > 0 else 0,
    )


@router.get("/alerts", response_model=list[CameraCaptureRead])
def list_alert_captures(
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get captures marked as alerts"""
    captures = get_alert_captures(db, limit=limit)
    
    items = []
    for capture in captures:
        item_dict = {
            "id": capture.id,
            "device_id": capture.device_id,
            "location_id": capture.location_id,
            "image_url": capture.image_url,
            "image_base64": capture.image_base64,
            "thumbnail_url": capture.thumbnail_url,
            "title": capture.title,
            "description": capture.description,
            "location_name": capture.location_name,
            "detected_objects": capture.detected_objects,
            "detected_count": capture.detected_count,
            "is_alert": capture.is_alert,
            "alert_type": capture.alert_type,
            "captured_at": capture.captured_at,
            "is_reviewed": capture.is_reviewed,
            "reviewed_by": capture.reviewed_by,
            "reviewed_at": capture.reviewed_at,
            "created_at": capture.created_at,
            "device_name": capture.device.name if capture.device else None,
        }
        items.append(CameraCaptureRead(**item_dict))
    
    return items


@router.get("/{capture_id}", response_model=CameraCaptureDetail)
def get_capture_detail(
    capture_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get detailed camera capture by ID"""
    capture = get_camera_capture(db, capture_id)
    if not capture:
        raise HTTPException(status_code=404, detail="Camera capture not found")
    
    return CameraCaptureDetail(
        id=capture.id,
        device_id=capture.device_id,
        location_id=capture.location_id,
        image_url=capture.image_url,
        image_base64=capture.image_base64,
        thumbnail_url=capture.thumbnail_url,
        title=capture.title,
        description=capture.description,
        location_name=capture.location_name,
        detected_objects=capture.detected_objects,
        detected_count=capture.detected_count,
        is_alert=capture.is_alert,
        alert_type=capture.alert_type,
        captured_at=capture.captured_at,
        is_reviewed=capture.is_reviewed,
        reviewed_by=capture.reviewed_by,
        reviewed_at=capture.reviewed_at,
        created_at=capture.created_at,
        device_name=capture.device.name if capture.device else None,
        device_serial=capture.device.serial_number if capture.device else None,
        device_type=capture.device.device_type.value if capture.device else None,
    )


@router.post("", response_model=CameraCaptureRead, status_code=201)
def create_capture(
    payload: CameraCaptureCreate,
    db: Session = Depends(get_db),
):
    """Create a new camera capture (usually from device API)"""
    # Validate device exists if provided
    if payload.device_id:
        device = db.query(Device).filter(Device.id == payload.device_id).first()
        if not device:
            raise HTTPException(status_code=404, detail="Device not found")
        
        # Set location name from device if not provided
        if not payload.location_name and device.location:
            payload = CameraCaptureCreate(
                **payload.model_dump(),
                location_name=device.location,
            )
    
    capture = create_camera_capture(db, payload)
    
    return CameraCaptureRead(
        id=capture.id,
        device_id=capture.device_id,
        location_id=capture.location_id,
        image_url=capture.image_url,
        image_base64=capture.image_base64,
        thumbnail_url=capture.thumbnail_url,
        title=capture.title,
        description=capture.description,
        location_name=capture.location_name,
        detected_objects=capture.detected_objects,
        detected_count=capture.detected_count,
        is_alert=capture.is_alert,
        alert_type=capture.alert_type,
        captured_at=capture.captured_at,
        is_reviewed=capture.is_reviewed,
        reviewed_by=capture.reviewed_by,
        reviewed_at=capture.reviewed_at,
        created_at=capture.created_at,
        device_name=capture.device.name if capture.device else None,
    )


@router.post("/from-device", response_model=CameraCaptureRead, status_code=201)
def create_capture_from_device(
    payload: CameraCaptureCreate,
    api_key: str = Query(..., description="Device API key"),
    db: Session = Depends(get_db),
):
    """Create a new camera capture from a device using API key"""
    # Find device by API key
    device = db.query(Device).filter(Device.api_key == api_key).first()
    if not device:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    if not device.is_active:
        raise HTTPException(status_code=403, detail="Device is inactive")
    
    # Set device_id from authenticated device
    capture_data = payload.model_dump()
    capture_data["device_id"] = device.id
    
    # Set location from device if not provided
    if not capture_data.get("location_name") and device.location:
        capture_data["location_name"] = device.location
    if not capture_data.get("location_id") and device.location_id:
        capture_data["location_id"] = device.location_id
    
    capture = create_camera_capture(db, CameraCaptureCreate(**capture_data))
    
    return CameraCaptureRead(
        id=capture.id,
        device_id=capture.device_id,
        location_id=capture.location_id,
        image_url=capture.image_url,
        image_base64=capture.image_base64,
        thumbnail_url=capture.thumbnail_url,
        title=capture.title,
        description=capture.description,
        location_name=capture.location_name,
        detected_objects=capture.detected_objects,
        detected_count=capture.detected_count,
        is_alert=capture.is_alert,
        alert_type=capture.alert_type,
        captured_at=capture.captured_at,
        is_reviewed=capture.is_reviewed,
        reviewed_by=capture.reviewed_by,
        reviewed_at=capture.reviewed_at,
        created_at=capture.created_at,
        device_name=device.name,
    )


@router.patch("/{capture_id}", response_model=CameraCaptureRead)
def update_capture(
    capture_id: UUID,
    payload: CameraCaptureUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a camera capture (mark as reviewed, add notes, etc.)"""
    # If marking as reviewed, add reviewer info
    if payload.is_reviewed and not payload.reviewed_by:
        payload.reviewed_by = current_user.full_name or current_user.email
    
    capture = update_camera_capture(db, capture_id, payload)
    if not capture:
        raise HTTPException(status_code=404, detail="Camera capture not found")
    
    return CameraCaptureRead(
        id=capture.id,
        device_id=capture.device_id,
        location_id=capture.location_id,
        image_url=capture.image_url,
        image_base64=capture.image_base64,
        thumbnail_url=capture.thumbnail_url,
        title=capture.title,
        description=capture.description,
        location_name=capture.location_name,
        detected_objects=capture.detected_objects,
        detected_count=capture.detected_count,
        is_alert=capture.is_alert,
        alert_type=capture.alert_type,
        captured_at=capture.captured_at,
        is_reviewed=capture.is_reviewed,
        reviewed_by=capture.reviewed_by,
        reviewed_at=capture.reviewed_at,
        created_at=capture.created_at,
        device_name=capture.device.name if capture.device else None,
    )


@router.delete("/{capture_id}", status_code=204)
def delete_capture(
    capture_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a camera capture"""
    if not delete_camera_capture(db, capture_id):
        raise HTTPException(status_code=404, detail="Camera capture not found")
