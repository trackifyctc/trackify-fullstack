from uuid import UUID
from typing import Optional
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.schemas.activity import ActivityLogRead, ScanHistoryRead
from app.crud.activity import (
    get_activity_logs, get_recent_activities, get_alert_logs,
    get_scan_history, get_activity_stats
)

router = APIRouter(prefix="/api/activity", tags=["Activity & History"])


@router.get("/logs", response_model=list[ActivityLogRead])
def list_activity_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    inventory_item_id: Optional[UUID] = None,
    action_type: Optional[str] = None,
    is_alert: Optional[bool] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get activity logs with optional filters"""
    return get_activity_logs(
        db, skip=skip, limit=limit,
        inventory_item_id=inventory_item_id,
        action_type=action_type, is_alert=is_alert,
        start_date=start_date, end_date=end_date
    )


@router.get("/recent", response_model=list[ActivityLogRead])
def list_recent_activities(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get most recent activity logs"""
    return get_recent_activities(db, limit=limit)


@router.get("/alerts", response_model=list[ActivityLogRead])
def list_alert_activities(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get only alert activity logs"""
    return get_alert_logs(db, skip=skip, limit=limit)


@router.get("/scans", response_model=list[ScanHistoryRead])
def list_scan_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    inventory_item_id: Optional[UUID] = None,
    device_id: Optional[UUID] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get scan history with optional filters"""
    return get_scan_history(
        db, skip=skip, limit=limit,
        inventory_item_id=inventory_item_id,
        device_id=device_id,
        start_date=start_date, end_date=end_date
    )


@router.get("/stats")
def activity_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get activity statistics"""
    return get_activity_stats(db)
