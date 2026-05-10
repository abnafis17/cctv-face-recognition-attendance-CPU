# CCTV Attendance Pro - Production Build & Run Logic

## 🚀 Quick Start Commands
| Component | Build Command | Production Run Command |
| :--- | :--- | :--- |
| **Backend** | `npx tsc` | `node dist/index.js` |
| **Frontend** | `npm run build` | `npm run start` |
| **AI Engine** | `pip install -r requirements.txt` | `python -m uvicorn app.api_server:app ...` |

---

## 1. AI Engine (FastAPI)
The AI engine handles real-time computer vision tasks. While it doesn't require a compilation step, it should be run using an optimized ASGI server configuration.

### Build / Setup
1. **Initialize Virtual Environment**:
   ```bash
   cd ai
   python3 -m venv .venv
   source .venv/bin/activate
   ```
2. **Install Dependencies**:
   ```bash
   pip install -U pip
   pip install -r requirements.txt
   ```

### Production Run
Run the server with optimized flags to reduce logging overhead:
```bash
python -m uvicorn app.api_server:app --host 0.0.0.0 --port 8000 --no-access-log --workers 1
```

---

## 2. Backend (Node.js/Prisma)
The backend must be compiled from TypeScript to JavaScript for optimal performance.

### Build
1. **Install & Generate**:
   ```bash
   cd backend
   npm install
   npx prisma generate
   ```
2. **Compile**:
   ```bash
   npx tsc
   ```
   *This creates a `/dist` directory containing the production-ready JavaScript files.*

### Production Run
Execute the compiled entry point directly using Node.js:
```bash
node dist/index.js
```

---

## 3. Frontend (Next.js)
The frontend must be statically optimized and bundled for production.

### Build
1. **Production Bundle**:
   ```bash
   cd front-end
   npm install
   npm run build
   ```
   *Note: Ensure your `.env` contains the correct production URLs for the AI and Backend services before building.*

### Production Run
Serve the optimized bundle:
```bash
npm run start
```

---

## Architecture Port Mapping
| Service | Production Port |
| :--- | :--- |
| **Frontend Dashboard** | `3000` |
| **Backend API** | `3001` |
| **AI Stream Engine** | `8000` |
