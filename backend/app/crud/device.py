import uuid
import secrets
import json
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.device import Device, DeviceAlert, DeviceStatus, DeviceType, AlertType, AlertSeverity
from app.schemas.device import DeviceCreate, DeviceUpdate, DeviceAlertCreate, DeviceAlertUpdate


def generate_api_key() -> str:
    """Generate a secure API key for device"""
    return secrets.token_hex(32)


def create_device(db: Session, payload: DeviceCreate) -> Device:
    """Create a new device with auto-generated API key"""
    device = Device(
        name=payload.name,
        device_type=DeviceType(payload.device_type.value),
        serial_number=payload.serial_number,
        api_key=generate_api_key(),
        location_id=payload.location_id,
        location=payload.location,
        firmware_version=payload.firmware_version,
        ip_address=payload.ip_address,
        mac_address=payload.mac_address,
        configuration=payload.configuration,
        status=DeviceStatus.OFFLINE,
    )
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


def get_devices(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    device_type: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> List[Device]:
    """Get devices with optional filters"""
    query = db.query(Device)
    
    if status:
        query = query.filter(Device.status == DeviceStatus(status))
    
    if device_type:
        query = query.filter(Device.device_type == DeviceType(device_type))
    
    if is_active is not None:
        query = query.filter(Device.is_active == is_active)
    
    return query.order_by(Device.created_at.desc()).offset(skip).limit(limit).all()


def get_device(db: Session, device_id: uuid.UUID) -> Optional[Device]:
    """Get a single device by ID"""
    return db.query(Device).filter(Device.id == device_id).first()


def get_device_by_api_key(db: Session, api_key: str) -> Optional[Device]:
    """Get device by API key"""
    return db.query(Device).filter(Device.api_key == api_key).first()


def get_device_by_serial(db: Session, serial_number: str) -> Optional[Device]:
    """Get device by serial number"""
    return db.query(Device).filter(Device.serial_number == serial_number).first()


def update_device(db: Session, device: Device, payload: DeviceUpdate) -> Device:
    """Update a device"""
    update_data = payload.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        if field == "device_type" and value:
            setattr(device, field, DeviceType(value.value))
        else:
            setattr(device, field, value)
    
    db.commit()
    db.refresh(device)
    return device


def delete_device(db: Session, device: Device) -> None:
    """Delete a device"""
    db.delete(device)
    db.commit()


def regenerate_api_key(db: Session, device: Device) -> Device:
    """Regenerate API key for a device"""
    device.api_key = generate_api_key()
    db.commit()
    db.refresh(device)
    return device


def update_heartbeat(
    db: Session,
    device: Device,
    firmware_version: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> Device:
    """Update device heartbeat and status"""
    device.last_heartbeat = datetime.now(timezone.utc)
    device.status = DeviceStatus.ONLINE
    
    if firmware_version:
        device.firmware_version = firmware_version
    if ip_address:
        device.ip_address = ip_address
    
    db.commit()
    db.refresh(device)
    return device


def check_offline_devices(db: Session, timeout_minutes: int = 5) -> List[Device]:
    """Check and mark offline devices"""
    threshold = datetime.now(timezone.utc) - timedelta(minutes=timeout_minutes)
    
    offline_devices = db.query(Device).filter(
        Device.status == DeviceStatus.ONLINE,
        Device.last_heartbeat < threshold
    ).all()
    
    for device in offline_devices:
        device.status = DeviceStatus.OFFLINE
    
    db.commit()
    return offline_devices


# Alert CRUD
def create_alert(db: Session, device_id: uuid.UUID, payload: DeviceAlertCreate) -> DeviceAlert:
    """Create a new device alert"""
    alert = DeviceAlert(
        device_id=device_id,
        alert_type=AlertType(payload.alert_type.value),
        severity=AlertSeverity(payload.severity.value),
        title=payload.title,
        message=payload.message,
        data=payload.data,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


def get_alerts(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    device_id: Optional[uuid.UUID] = None,
    alert_type: Optional[str] = None,
    is_acknowledged: Optional[bool] = None,
    is_resolved: Optional[bool] = None,
) -> List[DeviceAlert]:
    """Get alerts with optional filters"""
    query = db.query(DeviceAlert)
    
    if device_id:
        query = query.filter(DeviceAlert.device_id == device_id)
    
    if alert_type:
        query = query.filter(DeviceAlert.alert_type == AlertType(alert_type))
    
    if is_acknowledged is not None:
        query = query.filter(DeviceAlert.is_acknowledged == is_acknowledged)
    
    if is_resolved is not None:
        query = query.filter(DeviceAlert.is_resolved == is_resolved)
    
    return query.order_by(DeviceAlert.created_at.desc()).offset(skip).limit(limit).all()


def get_alert(db: Session, alert_id: uuid.UUID) -> Optional[DeviceAlert]:
    """Get a single alert by ID"""
    return db.query(DeviceAlert).filter(DeviceAlert.id == alert_id).first()


def acknowledge_alert(db: Session, alert: DeviceAlert, user_id: uuid.UUID) -> DeviceAlert:
    """Acknowledge an alert"""
    alert.is_acknowledged = True
    alert.acknowledged_by = user_id
    alert.acknowledged_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alert)
    return alert


def resolve_alert(db: Session, alert: DeviceAlert) -> DeviceAlert:
    """Resolve an alert"""
    alert.is_resolved = True
    alert.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alert)
    return alert


def get_active_alerts_count(db: Session) -> int:
    """Get count of active (unresolved) alerts"""
    return db.query(DeviceAlert).filter(DeviceAlert.is_resolved == False).count()


def get_device_stats(db: Session) -> dict:
    """Get device statistics"""
    total = db.query(Device).count()
    online = db.query(Device).filter(Device.status == DeviceStatus.ONLINE).count()
    offline = db.query(Device).filter(Device.status == DeviceStatus.OFFLINE).count()
    warning = db.query(Device).filter(Device.status == DeviceStatus.WARNING).count()
    
    active_alerts = get_active_alerts_count(db)
    
    return {
        "total_devices": total,
        "online_devices": online,
        "offline_devices": offline,
        "warning_devices": warning,
        "active_alerts": active_alerts,
    }
