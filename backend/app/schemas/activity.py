from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field
from enum import Enum


class ActionType(str, Enum):
    CREATED = "created"
    UPDATED = "updated"
    DELETED = "deleted"
    SCANNED = "scanned"
    MOVED = "moved"
    BORROWED = "borrowed"
    RETURNED = "returned"
    ALERT = "alert"
    LOGIN = "login"
    LOGOUT = "logout"


class ActivityLogBase(BaseModel):
    inventory_item_id: Optional[UUID] = None
    action: str = Field(..., min_length=1, max_length=100)
    action_type: Optional[ActionType] = None
    user: Optional[str] = None
    location: Optional[str] = None
    has_barcode_scan: bool = False
    is_alert: bool = False
    details: Optional[str] = None


class ActivityLogCreate(ActivityLogBase):
    user_id: Optional[UUID] = None


class ActivityLogRead(ActivityLogBase):
    id: UUID
    user_id: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ScanHistoryBase(BaseModel):
    scan_type: str = "qr_code"
    scanned_data: str
    location: Optional[str] = None
    is_successful: bool = True
    error_message: Optional[str] = None


class ScanHistoryCreate(ScanHistoryBase):
    inventory_item_id: Optional[UUID] = None
    device_id: Optional[UUID] = None
    user_id: Optional[UUID] = None


class ScanHistoryRead(ScanHistoryBase):
    id: UUID
    inventory_item_id: Optional[UUID] = None
    device_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total_items: int
    total_value: float
    items_scanned_today: int
    active_alerts: int
    locations: int
    devices_online: int
    low_stock_alerts: int
    recent_activity: list[Dict[str, Any]]
