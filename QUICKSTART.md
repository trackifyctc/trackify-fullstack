## 🎯 QUICK START - Jalankan Trackify

Ada 2 cara menjalankan aplikasi:

---

## ⚡ CARA 1: Local Development (Termudah untuk Development)

### Step 1: Setup Database (1x saja)

```bash
# Buka PostgreSQL
psql -U postgres

# Copy-paste ini:
CREATE DATABASE trackify;
\q

# Atau dari PowerShell:
psql -U postgres -c "CREATE DATABASE trackify;"
```

### Step 2: Terminal 1 - Jalankan Backend

```bash
cd backend
npm install
npm run start:dev
```

Tunggu sampai keluar:
```
🚀 Application is running on: http://localhost:3001
```

### Step 3: Terminal 2 - Jalankan Frontend

```bash
npm install
npm run dev
```

Tunggu sampai keluar:
```
➜  Local:   http://localhost:5173/
```

### ✅ Done!

Buka browser:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001/api

---

## 🐳 CARA 2: Docker (Recommended - Semua otomatis)

### Step 1: Pastikan PostgreSQL Running

```powershell
# Windows PowerShell - Start PostgreSQL service
Start-Service -Name postgresql-x64-13

# Atau cek PostgreSQL sudah jalan
psql -U postgres -c "SELECT version();"
```

### Step 2: Run Docker Compose

```bash
# Dari root directory (c:\Users\Catherine Claudia\Downloads\trackify)
docker-compose up -d

# Tunggu sampai kedua container running
docker-compose ps
```

**Output:**
```
NAME                   STATUS
trackify-backend       Up 10 seconds
trackify-frontend      Up 10 seconds
```

### ✅ Done!

Buka browser:
- **Frontend**: http://localhost:3000 atau http://localhost:5173
- **Backend**: http://localhost:3001/api

### Stop Services

```bash
docker-compose down
```

---

## 🔐 Login Credentials

**Database sudah terinstall user default:**

```
Email: admin@example.com
Password: password123
Role: admin
```

**Atau register user baru:**
1. Buka frontend
2. Klik "Register"
3. Isi form
4. Login dengan credentials baru

---

## 🚨 Troubleshooting Cepat

### Backend tidak start?
```bash
cd backend
npm install
npm run build
npm run start:dev
```

### PostgreSQL connection error?
```bash
# Check PostgreSQL running
psql -U postgres -c "SELECT 1;"

# Update .env pada backend folder
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=trackify123
DATABASE_NAME=trackify
```

### Port sudah digunakan?
```bash
# Change port di docker-compose.yml
# Atau kill proses yang gunakan port:
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Docker gagal?
```bash
# Clean and restart
docker-compose down
docker-compose up -d --build
```

---

## 📚 File Structure

```
trackify/
├── backend/              ← NestJS Backend (Port 3001)
│   ├── src/
│   ├── package.json
│   └── .env             ← Database config
│
├── src/                 ← React Frontend (Port 5173)
├── package.json
└── docker-compose.yml   ← Start Backend + Frontend sekaligus
```

---

## 🎓 Next Steps

1. **Explore Frontend** - Dashboard ada di http://localhost:5173
2. **Test API** - Endpoints ada di http://localhost:3001/api
3. **Lihat Database** - Connect ke PostgreSQL dengan:
   ```bash
   psql -U postgres -h localhost -d trackify
   ```
4. **Deploy** - Lihat README.md untuk instruksi production

---

## ✅ Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Browser / Client                    │
│              http://localhost:5173                   │
└────────────────────────┬────────────────────────────┘
                         │
                    HTTP/REST
                         │
┌────────────────────────▼────────────────────────────┐
│        React Frontend (src/)                         │
│        - Dashboard, Inventory, Devices, etc          │
│        - Komunikasi via API Calls                    │
└────────────────────────┬────────────────────────────┘
                         │
                   API Calls (JSON)
                         │
┌────────────────────────▼────────────────────────────┐
│      NestJS Backend (backend/src/)                   │
│      http://localhost:3001/api                       │
│      - Auth (JWT)                                    │
│      - Inventory Management                          │
│      - Device Management                             │
│      - Activity Logging                              │
└────────────────────────┬────────────────────────────┘
                         │
                      SQL Query
                         │
┌────────────────────────▼────────────────────────────┐
│        PostgreSQL Database                           │
│        localhost:5432/trackify                       │
│        - Users, Inventory, Devices, etc              │
└─────────────────────────────────────────────────────┘
```

---

**Status: ✅ READY TO RUN**

Pilih salah satu cara di atas dan jalankan! 🚀
