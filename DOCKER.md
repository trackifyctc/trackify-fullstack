# Trackify Docker Setup

## Quick Start - Development (Recommended)

Untuk development, gunakan database di Docker dan run backend/frontend secara lokal:

```bash
# 1. Start hanya database
docker compose -f docker-compose.dev.yml up -d

# 2. Backend (terminal 1)
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload

# 3. Frontend (terminal 2)
npm install
npm run dev
```

**Akses:**
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Database: localhost:5432

---

## Full Docker Setup (Production-like)

Untuk run semua services dalam Docker:

```bash
# Build dan start semua services
docker compose up -d --build

# Atau tanpa build
docker compose up -d

# Lihat logs
docker compose logs -f

# Stop semua services
docker compose down

# Stop dan hapus data
docker compose down -v
```

**Akses:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Database: localhost:5432

---

## Docker Commands

```bash
# Cek status containers
docker compose ps

# Restart service tertentu
docker compose restart backend

# Lihat logs service tertentu
docker compose logs -f backend

# Masuk ke container
docker compose exec backend sh
docker compose exec db psql -U postgres -d trackify

# Rebuild service tertentu
docker compose up --build backend -d

# Remove semua (containers, networks, volumes)
docker compose down -v --remove-orphans
```

---

## File Structure

```
.
├── docker-compose.yml           # Full stack setup
├── docker-compose.dev.yml       # Database only (untuk dev lokal)
├── Dockerfile                   # Frontend production build
├── backend/
│   ├── Dockerfile              # Backend image
│   └── requirements.txt
└── nginx.conf                   # Nginx config untuk frontend
```

---

## Environment Variables

Edit [backend/.env](backend/.env):

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trackify
SECRET_KEY=your-secret-key-here
```

Untuk Docker, URL database otomatis menggunakan service name `db`:
```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/trackify
```

---

## Troubleshooting

### Port sudah digunakan
```bash
# Cek port yang digunakan
netstat -ano | findstr :5432
netstat -ano | findstr :8000
netstat -ano | findstr :3000

# Kill process
taskkill /PID <PID> /F
```

### Database connection error
```bash
# Cek database sudah running
docker compose ps

# Restart database
docker compose restart db

# Cek logs
docker compose logs db
```

### Build error
```bash
# Clean rebuild
docker compose down
docker compose build --no-cache
docker compose up -d
```
