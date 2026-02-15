from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field
from uuid import UUID


class CameraCaptureBase(BaseModel):
    """Base schema for camera capture"""
    device_id: Optional[UUID] = None
    location_id: Optional[UUID] = None
    image_url: Optional[str] = None
    image_base64: Optional[str] = None
    thumbnail_url: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    location_name: Optional[str] = None
    detected_objects: Optional[str] = None  # JSON string
    detected_count: int = 0
    is_alert: bool = False
    alert_type: Optional[str] = None
    captured_at: Optional[datetime] = None


class CameraCaptureCreate(CameraCaptureBase):
    """Schema for creating camera capture"""
    pass


class CameraCaptureUpdate(BaseModel):
    """Schema for updating camera capture"""
    title: Optional[str] = None
    description: Optional[str] = None
    is_reviewed: Optional[bool] = None
    reviewed_by: Optional[str] = None


class CameraCaptureRead(CameraCaptureBase):
    """Schema for reading camera capture"""
    id: UUID
    is_reviewed: bool = False
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    
    # Related data
    device_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class CameraCaptureDetail(CameraCaptureRead):
    """Detailed schema with device info"""
    device_serial: Optional[str] = None
    device_type: Optional[str] = None


class CameraCaptureListResponse(BaseModel):
    """Response for paginated list"""
    items: List[CameraCaptureRead]
    total: int
    page: int
    limit: int
    pages: int
