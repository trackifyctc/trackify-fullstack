# 🚀 Trackify - Warehouse Inventory Management System

Aplikasi warehouse inventory management dengan real-time tracking menggunakan **React Frontend** dan **NestJS Backend**.

---

## 📋 Prerequisites

Pastikan sudah terinstall:
- **Node.js 20+** - [Download](https://nodejs.org/)
- **PostgreSQL 13+** - [Download](https://www.postgresql.org/)
- **Git** - [Download](https://git-scm.com/)
- **Docker & Docker Compose** (optional, untuk containerized development)

---

## 🔧 Setup Database

### 1. Create PostgreSQL Database

```bash
# Connect ke PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE trackify;

# Create user (optional, or use default postgres user)
CREATE USER trackify_user WITH PASSWORD 'trackify123';
ALTER ROLE trackify_user SET client_encoding TO 'utf8';
ALTER ROLE trackify_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE trackify_user SET default_transaction_deferrable TO on;
ALTER ROLE trackify_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE trackify TO trackify_user;

# Exit
\q
```

### 2. Verify Database Connection

```bash
psql -U postgres -h localhost -d trackify -c "SELECT version();"
```

---

## 🚀 OPTION 1: Local Development (2 Terminal Windows)

### Terminal 1: Backend (NestJS)

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start development server (port 3001)
npm run start:dev
```

**Output yang diharapkan:**
```
✓ Webpack building...
✓ Webpack built in 694ms
✓ NestFactory creating AppModule
✓ Application is running on: http://localhost:3001
```

### Terminal 2: Frontend (React + Vite)

```bash
# Navigate to root directory (or open new terminal in project root)
cd .

# Install dependencies
npm install

# Start development server (port 5173)
npm run dev
```

**Output yang diharapkan:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

---

## 🐳 OPTION 2: Docker Compose (Recommended for Development)

### 1. Pastikan PostgreSQL Running (Windows)

```bash
# Start PostgreSQL service (jika belum running)
# Windows: Services > PostgreSQL > Start
# Or via command line:
net start postgresql-x64-13
```

### 2. Run Docker Compose

```bash
# Dari root directory (c:\Users\Catherine Claudia\Downloads\trackify)
docker-compose up -d

# Check status
docker-compose ps
```

**Expected output:**
```
NAME                   STATUS              PORTS
trackify-backend       Up x seconds        0.0.0.0:3001->3001/tcp
trackify-frontend      Up x seconds        0.0.0.0:3000->5173/tcp
```

### 3. Access Applications

- **Backend API**: http://localhost:3001/api
- **Frontend**: http://localhost:3000 (or http://localhost:5173)

### 4. Stop Services

```bash
docker-compose down
```

---

## 🌐 Accessing the Application

### Frontend (React UI)
- **URL**: http://localhost:5173 (dev) or http://localhost:3000 (docker)
- **Features**: Dashboard, Inventory, Locations, Devices, Tasks, etc.

### Backend API
- **Base URL**: http://localhost:3001/api
- **Health Check**: GET http://localhost:3001

### API Endpoints

#### Authentication
```bash
# Register
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "role": "admin"
}

# Login
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

# Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": "1h",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "admin",
    "is_active": true,
    "created_at": "2026-04-16T..."
  }
}
```

#### Protected Endpoints (Require JWT Token)
```bash
# Get all inventory items
GET http://localhost:3001/api/inventory
Authorization: Bearer YOUR_JWT_TOKEN

# Get all tasks
GET http://localhost:3001/api/tasks
Authorization: Bearer YOUR_JWT_TOKEN

# Get dashboard
GET http://localhost:3001/api/dashboard
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📁 Project Structure

```
trackify/
├── backend/                          # NestJS Backend
│   ├── src/
│   │   ├── main.ts                  # Entry point
│   │   ├── app.module.ts            # Root module
│   │   ├── entities/                # Database models
│   │   ├── dtos/                    # Data transfer objects
│   │   ├── modules/                 # Feature modules
│   │   │   ├── auth/               # Authentication
│   │   │   ├── inventory/          # Inventory management
│   │   │   ├── devices/            # Device management
│   │   │   ├── locations/          # Location tracking
│   │   │   ├── tasks/              # Task management
│   │   │   ├── activity/           # Activity logging
│   │   │   ├── camera-captures/    # Camera imaging
│   │   │   └── dashboard/          # Dashboard stats
│   │   ├── guards/                  # Auth guards
│   │   └── decorators/              # Custom decorators
│   ├── dist/                        # Compiled output
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── .env                         # Environment variables
│
├── src/                             # React Frontend
│   ├── components/                  # React components
│   ├── pages/                       # Page components
│   ├── hooks/                       # Custom hooks
│   ├── api/                         # API calls
│   ├── styles/                      # Tailwind CSS
│   └── App.tsx                      # Main app
│
├── docker-compose.yml               # Docker services config
├── package.json                     # Frontend dependencies
└── vite.config.ts                   # Vite config
```

---

## 🔌 Environment Variables

### Backend (.env)

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=trackify123
DATABASE_NAME=trackify

# JWT
JWT_SECRET=super-secret-change-me-in-production
JWT_EXPIRES_IN=1h

# Application
NODE_ENV=development
PORT=3001
API_PREFIX=/api

# Frontend
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env.local)

```bash
VITE_API_URL=http://localhost:3001/api
```

---

## 🧪 Testing the Application

### 1. Login ke Frontend

1. Buka http://localhost:5173
2. Register akun baru atau login dengan credentials
3. Lihat dashboard dengan data

### 2. Test API dengan cURL

```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  | jq -r '.access_token')

# Get inventory
curl -s -X GET http://localhost:3001/api/inventory \
  -H "Authorization: Bearer $TOKEN" | jq

# Get inventory stats
curl -s -X GET http://localhost:3001/api/inventory/stats \
  -H "Authorization: Bearer $TOKEN" | jq

# Get dashboard
curl -s -X GET http://localhost:3001/api/dashboard \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 3. Test dengan Postman

Import endpoints dari:
- `/api/` endpoints (dengan JWT Bearer token)
- `/camera-captures/from-device` (dengan X-API-Key header)
- `/devices/hardware/*` (dengan X-API-Key header)

---

## 🐛 Troubleshooting

### Backend fails to start

**Error**: `Cannot find module '@nestjs/core'`
```bash
# Solution
cd backend
npm install
npm run build
```

**Error**: `Database connection failed`
```bash
# Check PostgreSQL running
psql -U postgres -h localhost -d trackify -c "SELECT 1;"

# Update .env DATABASE_* variables
# Verify firewall allows localhost:5432
```

### Frontend fails to start

**Error**: `VITE_API_URL not set`
```bash
# Create .env.local in root directory
echo "VITE_API_URL=http://localhost:3001/api" > .env.local
npm run dev
```

**Error**: `CORS error`
```bash
# Backend CORS already configured for:
# - http://localhost:5173
# - http://localhost:3000
# If still failing, check browser console for specific error
```

### Docker issues

**Error**: `Bind for 0.0.0.0:3001 failed`
```bash
# Port already in use
# Check what's using port 3001
netstat -ano | findstr :3001

# Or use different port in docker-compose.yml
# Change "3001:3001" to "3002:3001"
```

**Error**: `Cannot connect to PostgreSQL from Docker`
```bash
# Use host.docker.internal on Windows
# Already configured in docker-compose.yml
# Verify PostgreSQL is running on host machine
```

---

## 📝 Scripts

### Backend

```bash
# Development with hot reload
npm run start:dev

# Production build
npm run build
npm run start:prod

# Format code
npm run format

# Run tests
npm run test
npm run test:watch
npm run test:cov
```

### Frontend

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Format code
npm run format

# Lint
npm run lint
```

---

## 🔐 Security Notes

### For Production

1. **Change JWT_SECRET**
   ```bash
   # Generate strong random key
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Change Database Password**
   ```bash
   ALTER USER postgres WITH PASSWORD 'new_strong_password';
   ```

3. **Enable HTTPS**
   - Setup SSL/TLS certificate
   - Update CORS origins to use https://

4. **Environment Variables**
   - Never commit `.env` file
   - Use `.env.example` as template
   - Store secrets in secure environment management system

---

## 📊 Database Schema

Aplikasi menggunakan 9 tables utama:

```sql
-- Users & Authentication
users

-- Inventory & Locations
locations
inventory

-- Devices & Monitoring
devices
device_alerts
camera_captures

-- Activity & Tracking
activity_logs
scan_history

-- Tasks
tasks
```

Semua relasi sudah dikonfigurasi dengan proper foreign keys dan cascading deletes.

---

## 🚀 Deployment

### Production Build

```bash
# Backend
cd backend
npm run build
npm run start:prod

# Frontend
npm run build
# Upload dist/ folder to web server
```

### Docker Production

```bash
# Build and push image
docker build -f backend/Dockerfile -t trackify-backend:latest .
docker push your-registry/trackify-backend:latest

# Run with docker-compose (update image references)
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📚 API Documentation

Semua endpoints terdokumentasi di:
- **Swagger UI**: http://localhost:3001/docs (jika enabled)
- **Postman Collection**: Ada di `/docs/postman_collection.json`
- **OpenAPI Schema**: http://localhost:3001/api-json

---

## 💡 Tips

1. **Backend crashes?** Check logs dengan: `npm run start:dev`
2. **Frontend blank page?** Check browser console dan CORS errors
3. **Database empty?** Pastikan sudah create database dan tables
4. **Token expired?** Login ulang untuk mendapat token baru
5. **Device API Key?** Generate dari dashboard saat register device

---

## 📞 Support

Jika ada issues:

1. Check error logs
2. Verify .env variables
3. Ensure PostgreSQL running
4. Check network connectivity
5. Clear browser cache (Ctrl+Shift+Del)

---

**Status**: ✅ Ready for Development & Production

**Last Updated**: April 16, 2026
**Version**: 2.0.0 (NestJS)
