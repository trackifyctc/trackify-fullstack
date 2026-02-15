from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field
from enum import Enum


class DeviceStatus(str, Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    WARNING = "warning"


class DeviceType(str, Enum):
    SCANNER = "scanner"
    SENSOR = "sensor"
    CAMERA = "camera"
    GATEWAY = "gateway"


class AlertType(str, Enum):
    MOTION = "motion"
    TEMPERATURE = "temperature"
    HUMIDITY = "humidity"
    UNAUTHORIZED = "unauthorized"
    LOW_STOCK = "low_stock"
    DEVICE_OFFLINE = "device_offline"
    CUSTOM = "custom"


class AlertSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


# Device Schemas
class DeviceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    device_type: DeviceType = DeviceType.SCANNER
    serial_number: str = Field(..., min_length=1, max_length=100)
    location_id: Optional[UUID] = None
    location: Optional[str] = None
    firmware_version: Optional[str] = None
    ip_address: Optional[str] = None
    mac_address: Optional[str] = None
    configuration: Optional[str] = None


class DeviceCreate(DeviceBase):
    pass


class DeviceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    device_type: Optional[DeviceType] = None
    location_id: Optional[UUID] = None
    location: Optional[str] = None
    firmware_version: Optional[str] = None
    ip_address: Optional[str] = None
    mac_address: Optional[str] = None
    configuration: Optional[str] = None
    is_active: Optional[bool] = None


class DeviceRead(DeviceBase):
    id: UUID
    api_key: str
    status: DeviceStatus
    last_heartbeat: Optional[datetime] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DeviceReadPublic(BaseModel):
    """Public device info without API key"""
    id: UUID
    name: str
    device_type: DeviceType
    serial_number: str
    location: Optional[str] = None
    status: DeviceStatus
    last_heartbeat: Optional[datetime] = None
    is_active: bool

    class Config:
        from_attributes = True


# Alert Schemas
class DeviceAlertBase(BaseModel):
    alert_type: AlertType
    severity: AlertSeverity = AlertSeverity.MEDIUM
    title: str = Field(..., min_length=1, max_length=200)
    message: Optional[str] = None
    data: Optional[str] = None


class DeviceAlertCreate(DeviceAlertBase):
    device_id: Optional[UUID] = None


class DeviceAlertFromDevice(BaseModel):
    """Alert payload sent from hardware device"""
    alert_type: AlertType
    severity: AlertSeverity = AlertSeverity.MEDIUM
    title: str = Field(..., min_length=1, max_length=200)
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class DeviceAlertUpdate(BaseModel):
    is_acknowledged: Optional[bool] = None
    is_resolved: Optional[bool] = None


class DeviceAlertRead(DeviceAlertBase):
    id: UUID
    device_id: UUID
    is_acknowledged: bool
    acknowledged_by: Optional[UUID] = None
    acknowledged_at: Optional[datetime] = None
    is_resolved: bool
    resolved_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Heartbeat Schema
class HeartbeatPayload(BaseModel):
    firmware_version: Optional[str] = None
    ip_address: Optional[str] = None
    status: Optional[str] = None


class HeartbeatResponse(BaseModel):
    status: str
    device_id: UUID
    server_time: datetime


# Scan Schema from Device
class DeviceScanPayload(BaseModel):
    scan_type: str = "qr_code"
    scanned_data: str
    location: Optional[str] = None


class DeviceScanResponse(BaseModel):
    status: str
    item_found: bool
    item: Optional[Dict[str, Any]] = None
    message: str
