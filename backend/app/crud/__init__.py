from app.crud.user import create_user, get_user_by_email
from app.crud.task import create_task, get_tasks, get_task, update_task, delete_task
from app.crud.inventory import (
    create_inventory, get_inventory_items, get_inventory_item,
    get_inventory_by_barcode, get_inventory_by_sku, update_inventory,
    delete_inventory, update_last_scanned, get_inventory_stats, get_categories,
    generate_qr_code
)
from app.crud.location import (
    create_location, get_locations, get_location, get_location_by_code,
    update_location, delete_location, update_location_item_count,
    get_location_items, get_location_stats
)
from app.crud.device import (
    create_device, get_devices, get_device, get_device_by_api_key,
    get_device_by_serial, update_device, delete_device, regenerate_api_key,
    update_heartbeat, check_offline_devices, create_alert, get_alerts,
    get_alert, acknowledge_alert, resolve_alert, get_active_alerts_count,
    get_device_stats
)
from app.crud.activity import (
    create_activity_log, get_activity_logs, get_recent_activities,
    get_alert_logs, create_scan_history, get_scan_history,
    get_today_scans_count, get_activity_stats
)

__all__ = [
    "create_user", "get_user_by_email",
    "create_task", "get_tasks", "get_task", "update_task", "delete_task",
    "create_inventory", "get_inventory_items", "get_inventory_item",
    "get_inventory_by_barcode", "get_inventory_by_sku", "update_inventory",
    "delete_inventory", "update_last_scanned", "get_inventory_stats", "get_categories",
    "generate_qr_code",
    "create_location", "get_locations", "get_location", "get_location_by_code",
    "update_location", "delete_location", "update_location_item_count",
    "get_location_items", "get_location_stats",
    "create_device", "get_devices", "get_device", "get_device_by_api_key",
    "get_device_by_serial", "update_device", "delete_device", "regenerate_api_key",
    "update_heartbeat", "check_offline_devices", "create_alert", "get_alerts",
    "get_alert", "acknowledge_alert", "resolve_alert", "get_active_alerts_count",
    "get_device_stats",
    "create_activity_log", "get_activity_logs", "get_recent_activities",
    "get_alert_logs", "create_scan_history", "get_scan_history",
    "get_today_scans_count", "get_activity_stats",
]
