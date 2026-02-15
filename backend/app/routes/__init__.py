from app.routes.auth import router as auth_router
from app.routes.tasks import router as tasks_router
from app.routes.inventory import router as inventory_router
from app.routes.locations import router as locations_router
from app.routes.devices import router as devices_router
from app.routes.activity import router as activity_router
from app.routes.dashboard import router as dashboard_router
from app.routes.camera_captures import router as camera_captures_router

__all__ = [
    "auth_router",
    "tasks_router", 
    "inventory_router",
    "locations_router",
    "devices_router",
    "activity_router",
    "dashboard_router",
    "camera_captures_router",
]
