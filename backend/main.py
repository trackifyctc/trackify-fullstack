from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routes import auth, tasks
from app.routes.inventory import router as inventory_router
from app.routes.locations import router as locations_router
from app.routes.devices import router as devices_router
from app.routes.activity import router as activity_router
from app.routes.dashboard import router as dashboard_router
from app.routes.camera_captures import router as camera_captures_router

# Note: Tables are created via Alembic migrations (alembic upgrade head)
# The line below is a fallback for development without migrations
# Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Trackify API",
    version="2.0.0",
    description="FastAPI backend for the Trackify Warehouse Inventory System",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS – allow the Vite dev server to talk to the API
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite default
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:80",
        "*",  # Allow all in development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(inventory_router)
app.include_router(locations_router)
app.include_router(devices_router)
app.include_router(activity_router)
app.include_router(dashboard_router)
app.include_router(camera_captures_router)


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "message": "Trackify API is running", "version": "2.0.0"}
