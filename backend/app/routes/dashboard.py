from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.schemas.activity import DashboardStats
from app.crud.inventory import get_inventory_stats
from app.crud.location import get_location_stats
from app.crud.device import get_device_stats, get_active_alerts_count
from app.crud.activity import get_recent_activities, get_today_scans_count

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/", response_model=DashboardStats)
def get_dashboard_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get dashboard statistics"""
    inventory_stats = get_inventory_stats(db)
    location_stats = get_location_stats(db)
    device_stats = get_device_stats(db)
    recent = get_recent_activities(db, limit=5)
    
    return DashboardStats(
        total_items=inventory_stats["total_items"],
        total_value=inventory_stats["total_value"],
        items_scanned_today=get_today_scans_count(db),
        active_alerts=get_active_alerts_count(db),
        locations=location_stats["total_locations"],
        devices_online=device_stats["online_devices"],
        low_stock_alerts=inventory_stats["low_stock_items"],
        recent_activity=[
            {
                "id": str(log.id),
                "action": log.action,
                "user": log.user,
                "location": log.location,
                "is_alert": log.is_alert,
                "created_at": log.created_at.isoformat(),
            }
            for log in recent
        ]
    )


@router.get("/stats/all")
def get_all_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get comprehensive statistics from all modules"""
    return {
        "inventory": get_inventory_stats(db),
        "locations": get_location_stats(db),
        "devices": get_device_stats(db),
    }
