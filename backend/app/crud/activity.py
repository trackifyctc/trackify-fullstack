import uuid
import json
from typing import Optional, List
from datetime import datetime, timezone, date
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.models.activity import ActivityLog, ScanHistory, ActionType
from app.schemas.activity import ActivityLogCreate, ScanHistoryCreate


def create_activity_log(db: Session, payload: ActivityLogCreate) -> ActivityLog:
    """Create a new activity log entry"""
    log = ActivityLog(
        inventory_item_id=payload.inventory_item_id,
        user_id=payload.user_id,
        action=payload.action,
        action_type=ActionType(payload.action_type.value) if payload.action_type else None,
        user=payload.user,
        location=payload.location,
        has_barcode_scan=payload.has_barcode_scan,
        is_alert=payload.is_alert,
        details=payload.details,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def get_activity_logs(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    inventory_item_id: Optional[uuid.UUID] = None,
    user_id: Optional[uuid.UUID] = None,
    action_type: Optional[str] = None,
    is_alert: Optional[bool] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> List[ActivityLog]:
    """Get activity logs with optional filters"""
    query = db.query(ActivityLog)
    
    if inventory_item_id:
        query = query.filter(ActivityLog.inventory_item_id == inventory_item_id)
    
    if user_id:
        query = query.filter(ActivityLog.user_id == user_id)
    
    if action_type:
        query = query.filter(ActivityLog.action_type == ActionType(action_type))
    
    if is_alert is not None:
        query = query.filter(ActivityLog.is_alert == is_alert)
    
    if start_date:
        query = query.filter(ActivityLog.created_at >= datetime.combine(start_date, datetime.min.time()))
    
    if end_date:
        query = query.filter(ActivityLog.created_at <= datetime.combine(end_date, datetime.max.time()))
    
    return query.order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit).all()


def get_recent_activities(db: Session, limit: int = 10) -> List[ActivityLog]:
    """Get most recent activity logs"""
    return db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(limit).all()


def get_alert_logs(db: Session, skip: int = 0, limit: int = 100) -> List[ActivityLog]:
    """Get only alert activity logs"""
    return db.query(ActivityLog).filter(
        ActivityLog.is_alert == True
    ).order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit).all()


# Scan History CRUD
def create_scan_history(db: Session, payload: ScanHistoryCreate) -> ScanHistory:
    """Create a new scan history entry"""
    scan = ScanHistory(
        inventory_item_id=payload.inventory_item_id,
        device_id=payload.device_id,
        user_id=payload.user_id,
        scan_type=payload.scan_type,
        scanned_data=payload.scanned_data,
        location=payload.location,
        is_successful=payload.is_successful,
        error_message=payload.error_message,
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    return scan


def get_scan_history(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    inventory_item_id: Optional[uuid.UUID] = None,
    device_id: Optional[uuid.UUID] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> List[ScanHistory]:
    """Get scan history with optional filters"""
    query = db.query(ScanHistory)
    
    if inventory_item_id:
        query = query.filter(ScanHistory.inventory_item_id == inventory_item_id)
    
    if device_id:
        query = query.filter(ScanHistory.device_id == device_id)
    
    if start_date:
        query = query.filter(ScanHistory.created_at >= datetime.combine(start_date, datetime.min.time()))
    
    if end_date:
        query = query.filter(ScanHistory.created_at <= datetime.combine(end_date, datetime.max.time()))
    
    return query.order_by(ScanHistory.created_at.desc()).offset(skip).limit(limit).all()


def get_today_scans_count(db: Session) -> int:
    """Get count of scans made today"""
    today = date.today()
    return db.query(ScanHistory).filter(
        func.date(ScanHistory.created_at) == today
    ).count()


def get_activity_stats(db: Session) -> dict:
    """Get activity statistics"""
    total_logs = db.query(ActivityLog).count()
    total_scans = db.query(ScanHistory).count()
    today_scans = get_today_scans_count(db)
    total_alerts = db.query(ActivityLog).filter(ActivityLog.is_alert == True).count()
    
    # Get activity by type
    activity_by_type = db.query(
        ActivityLog.action_type,
        func.count(ActivityLog.id)
    ).group_by(ActivityLog.action_type).all()
    
    return {
        "total_logs": total_logs,
        "total_scans": total_scans,
        "today_scans": today_scans,
        "total_alerts": total_alerts,
        "activity_by_type": {str(t[0]): t[1] for t in activity_by_type if t[0]},
    }
