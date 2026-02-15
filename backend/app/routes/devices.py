from uuid import UUID
from typing import Optional
from datetime import datetime, timezone
import json

from fastapi import APIRouter, Depends, HTTPException, status, Query, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.schemas.device import (
    DeviceCreate, DeviceRead, DeviceReadPublic, DeviceUpdate,
    DeviceAlertCreate, DeviceAlertRead, DeviceAlertFromDevice,
    HeartbeatPayload, HeartbeatResponse,
    DeviceScanPayload, DeviceScanResponse
)
from app.crud.device import (
    create_device, get_devices, get_device, get_device_by_api_key,
    get_device_by_serial, update_device, delete_device, regenerate_api_key,
    update_heartbeat, create_alert, get_alerts, get_alert,
    acknowledge_alert, resolve_alert, get_device_stats
)
from app.crud.inventory import get_inventory_by_barcode, get_inventory_by_sku, update_last_scanned
from app.crud.activity import create_activity_log, create_scan_history
from app.schemas.activity import ActivityLogCreate, ActionType, ScanHistoryCreate

router = APIRouter(prefix="/api/devices", tags=["Devices"])


# ============================================================================
# Device Management (requires authentication)
# ============================================================================

@router.post("/", response_model=DeviceRead, status_code=status.HTTP_201_CREATED)
def add_device(
    payload: DeviceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Register a new device"""
    # Check if serial number already exists
    if get_device_by_serial(db, payload.serial_number):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Device with this serial number already exists"
        )
    
    return create_device(db, payload)


@router.get("/", response_model=list[DeviceRead])
def list_devices(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: Optional[str] = None,
    device_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all devices with optional filters"""
    return get_devices(
        db, skip=skip, limit=limit,
        status=status, device_type=device_type, is_active=is_active
    )


@router.get("/stats")
def device_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get device statistics"""
    return get_device_stats(db)


@router.get("/{device_id}", response_model=DeviceRead)
def read_device(
    device_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single device"""
    device = get_device(db, device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device


@router.patch("/{device_id}", response_model=DeviceRead)
def modify_device(
    device_id: UUID,
    payload: DeviceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a device"""
    device = get_device(db, device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return update_device(db, device, payload)


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_device(
    device_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a device"""
    device = get_device(db, device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    delete_device(db, device)


@router.post("/{device_id}/regenerate-key", response_model=DeviceRead)
def regenerate_device_api_key(
    device_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Regenerate API key for a device"""
    device = get_device(db, device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return regenerate_api_key(db, device)


# ============================================================================
# Alerts Management (requires authentication)
# ============================================================================

@router.get("/alerts/all", response_model=list[DeviceAlertRead])
def list_all_alerts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    device_id: Optional[UUID] = None,
    alert_type: Optional[str] = None,
    is_acknowledged: Optional[bool] = None,
    is_resolved: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all alerts with optional filters"""
    return get_alerts(
        db, skip=skip, limit=limit,
        device_id=device_id, alert_type=alert_type,
        is_acknowledged=is_acknowledged, is_resolved=is_resolved
    )


@router.post("/alerts/{alert_id}/acknowledge", response_model=DeviceAlertRead)
def ack_alert(
    alert_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Acknowledge an alert"""
    alert = get_alert(db, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return acknowledge_alert(db, alert, current_user.id)


@router.post("/alerts/{alert_id}/resolve", response_model=DeviceAlertRead)
def res_alert(
    alert_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Resolve an alert"""
    alert = get_alert(db, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return resolve_alert(db, alert)


# ============================================================================
# Hardware Device API Endpoints (uses API key authentication)
# ============================================================================

def get_device_by_key(
    x_api_key: str = Header(..., description="Device API Key"),
    db: Session = Depends(get_db),
) -> tuple:
    """Dependency to authenticate device by API key"""
    device = get_device_by_api_key(db, x_api_key)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    if not device.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Device is deactivated"
        )
    return device, db


@router.post("/hardware/heartbeat", response_model=HeartbeatResponse, tags=["Hardware API"])
def device_heartbeat(
    payload: HeartbeatPayload = None,
    device_data: tuple = Depends(get_device_by_key),
):
    """
    Hardware device heartbeat endpoint.
    
    Call this endpoint periodically (recommended: every 30 seconds) to:
    - Keep device status as "online"
    - Update firmware version and IP address
    
    **Authentication:** Include `X-API-Key` header with your device's API key.
    """
    device, db = device_data
    
    update_heartbeat(
        db, device,
        firmware_version=payload.firmware_version if payload else None,
        ip_address=payload.ip_address if payload else None,
    )
    
    return HeartbeatResponse(
        status="ok",
        device_id=device.id,
        server_time=datetime.now(timezone.utc)
    )


@router.post("/hardware/alert", response_model=DeviceAlertRead, tags=["Hardware API"])
def device_send_alert(
    payload: DeviceAlertFromDevice,
    device_data: tuple = Depends(get_device_by_key),
):
    """
    Hardware device alert endpoint.
    
    Send alerts from your device when detecting:
    - Motion detection
    - Temperature/humidity anomalies
    - Unauthorized access
    - Custom alerts
    
    **Authentication:** Include `X-API-Key` header with your device's API key.
    
    **Alert Types:** motion, temperature, humidity, unauthorized, low_stock, device_offline, custom
    
    **Severity Levels:** low, medium, high, critical
    """
    device, db = device_data
    
    # Convert data dict to JSON string if present
    data_str = json.dumps(payload.data) if payload.data else None
    
    alert = create_alert(db, device.id, DeviceAlertCreate(
        alert_type=payload.alert_type,
        severity=payload.severity,
        title=payload.title,
        message=payload.message,
        data=data_str,
    ))
    
    # Log activity
    create_activity_log(db, ActivityLogCreate(
        action=f"Alert from device {device.name}: {payload.title}",
        action_type=ActionType.ALERT,
        user=f"Device: {device.serial_number}",
        location=device.location,
        is_alert=True,
        details=data_str,
    ))
    
    return alert


@router.post("/hardware/scan", response_model=DeviceScanResponse, tags=["Hardware API"])
def device_scan(
    payload: DeviceScanPayload,
    device_data: tuple = Depends(get_device_by_key),
):
    """
    Hardware device scan endpoint.
    
    Send scanned QR code or barcode data from your device.
    
    **Authentication:** Include `X-API-Key` header with your device's API key.
    
    **Scan Types:** qr_code, barcode, rfid
    
    **Response:** Returns item information if found, or error message if not.
    """
    device, db = device_data
    
    # Try to find item by barcode/QR code data
    item = None
    
    # Try parsing as JSON (QR code format)
    try:
        qr_data = json.loads(payload.scanned_data)
        if "sku" in qr_data:
            item = get_inventory_by_sku(db, qr_data["sku"])
    except json.JSONDecodeError:
        # Not JSON, try as barcode
        item = get_inventory_by_barcode(db, payload.scanned_data)
    
    # Create scan history
    create_scan_history(db, ScanHistoryCreate(
        inventory_item_id=item.id if item else None,
        device_id=device.id,
        scan_type=payload.scan_type,
        scanned_data=payload.scanned_data,
        location=payload.location or device.location,
        is_successful=item is not None,
        error_message="Item not found" if not item else None,
    ))
    
    if item:
        # Update last scanned
        update_last_scanned(db, item)
        
        # Log activity
        create_activity_log(db, ActivityLogCreate(
            inventory_item_id=item.id,
            action=f"Scanned by device: {device.name}",
            action_type=ActionType.SCANNED,
            user=f"Device: {device.serial_number}",
            location=payload.location or device.location,
            has_barcode_scan=True,
        ))
        
        return DeviceScanResponse(
            status="ok",
            item_found=True,
            item={
                "id": str(item.id),
                "name": item.name,
                "sku": item.sku,
                "location": item.location,
                "status": item.status.value,
                "quantity": item.quantity,
            },
            message=f"Item found: {item.name}"
        )
    else:
        return DeviceScanResponse(
            status="ok",
            item_found=False,
            item=None,
            message="Item not found with scanned data"
        )
