# 🏢 HR Attendance & Payroll Management System

A complete enterprise HR management system with mobile attendance tracking, geofencing validation, and automated payroll generation. Built with Firebase, Node.js, React, and Kotlin.

---

## 📋 Table of Contents

- [System Overview](#system-overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Required API Keys & Credentials](#required-api-keys--credentials)
- [Installation](#installation)
- [Running the System](#running-the-system)
- [Features](#features)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)

---

## 🎯 System Overview

This system consists of **three main components**:

1. **Firebase Backend** (`/backend`) - Node.js/Express API for attendance and payroll
2. **HR Portal** (`/hr-portal`) - React web app for HR administrators
3. **Mobile App** (`/HRHelpdesk`) - Kotlin/Jetpack Compose Android app for employees

---

## 🏗️ Architecture

```
┌──────────────────┐
│  Mobile App      │ ──► Punch In/Out (Geo + WiFi validation)
│  (Android)       │
└─────────┬────────┘
          │
          ▼
┌──────────────────────────────────────────────┐
│         Firebase Firestore Database          │
│  Collections: employees, attendance, config  │
└─────────┬────────────────────────────────────┘
          │
          ▼
┌──────────────────┐        ┌─────────────────┐
│  Backend Server  │◄──────►│   HR Portal     │
│  (Node.js)       │        │   (React)       │
└─────────┬────────┘        └─────────────────┘
          │
          ▼
┌──────────────────┐
│ Payroll System   │ ──► PDF Generation
│ (Python)         │
└──────────────────┘
```

---

## ✅ Prerequisites

### Software Requirements

- **Node.js** v18+ and npm
- **Python** 3.8+ (for payroll scripts)
- **Android Studio** (for mobile app development)
- **Git** (for cloning)

### Services Required

1. **Firebase Project** (Free tier works)
2. **MongoDB Atlas** (Optional - for legacy mobile backend)
3. **Supabase** (Optional - for HR portal data storage)

---

## 🔑 Required API Keys & Credentials

### 1️⃣ Firebase Service Account Key

**Required for:** Backend server, Payroll system, Mobile app

**How to get:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project → Project Settings → Service Accounts
3. Click "Generate New Private Key"
4. Download the JSON file
5. **Save as:** `backend/serviceAccountKey.json`

**Collections to create in Firestore:**
- `employees` - Employee master data
- `attendance` - Daily attendance records
- `office_config` - Office location and WiFi BSSID settings
- `payroll_policies` - Payroll calculation policies (PF, ESI, etc.)

---

### 2️⃣ MongoDB Connection String

**Required for:** Backend server (if using MongoDB)

**How to get:**
1. Create free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Go to Database → Connect → Connect your application
3. Copy connection string (looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/hrdb`)

**Where to add:** Create `backend/.env` file:
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/hrdb
PORT=5000
```

---

### 3️⃣ Supabase Credentials (Optional)

**Required for:** HR Portal backend (optional data store)

**How to get:**
1. Go to [Supabase](https://supabase.com/) and create project
2. Go to Project Settings → API
3. Copy the URL and `anon` public key

**Where to add:** Create `hr-portal/backend/.env` file:
```env
PORT=4000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
JWT_SECRET=your-secret-key-change-me
JWT_EXPIRES_IN=8h
ADMIN_EMAIL=admin@company.com
ADMIN_PASSWORD=admin123
```

---

### 4️⃣ Firebase for Android (Mobile App)

**Required for:** Mobile app authentication

**How to get:**
1. In Firebase Console → Project Settings
2. Add Android app
3. Package name: `com.example.hrhelpdesk`
4. Download `google-services.json`
5. **Save to:** `HRHelpdesk/HRHelpdesk/app/google-services.json`

---

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Sxmxrth05/hrbackup.git
cd hrbackup
```

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Add your Firebase service account key
# Place serviceAccountKey.json in this directory

# Create .env file (optional, for MongoDB)
echo "PORT=5000" > .env
echo "MONGO_URI=your-mongodb-connection-string" >> .env

# Start the server
npm start
# or for development with auto-reload:
npm run dev
```

**Server will run on:** `http://localhost:5000`

---

### 3. HR Portal Setup

```bash
cd hr-portal

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Create .env file (copy from example)
cp .env.example .env
# Edit .env and add your credentials

# Start backend server (from hr-portal/backend)
npm run dev

# In a new terminal, start frontend (from hr-portal)
cd ..
npm run dev
```

**HR Portal Frontend:** `http://localhost:5173`  
**HR Portal Backend:** `http://localhost:4000`

---

### 4. Mobile App Setup

```bash
# Open in Android Studio
# File → Open → Navigate to HRHelpdesk/HRHelpdesk

# Add google-services.json to:
# HRHelpdesk/HRHelpdesk/app/google-services.json

# Update backend URL in the app code if needed
# Location: app/src/main/.../network/ApiService.kt

# Sync Gradle and Run
```

---

### 5. Python Payroll System

```bash
# Install Python dependencies
pip install pandas firebase-admin fpdf

# Or use a virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install pandas firebase-admin fpdf

# Run payroll for current month
python payroll_system.py --json

# Run for specific month/employee
python payroll_system.py --month 12 --year 2025 --employee EMP001
```

---

## 🚀 Running the System

### Complete System Startup

1. **Start Firebase Backend:**
   ```bash
   cd backend
   npm start
   ```

2. **Start HR Portal Backend:**
   ```bash
   cd hr-portal/backend
   npm run dev
   ```

3. **Start HR Portal Frontend:**
   ```bash
   cd hr-portal
   npm run dev
   ```

4. **Run Mobile App:**
   - Open in Android Studio and click Run
   - Or build APK: `./gradlew assembleDebug`

5. **Generate Payroll (when needed):**
   ```bash
   python payroll_system.py --month 12 --year 2025 --json
   ```

---

## ✨ Features

### 🔐 Authentication
- Firebase Auth for mobile app
- JWT-based auth for HR portal
- Admin login for HR operations

### 📍 Attendance Tracking
- **Geofencing**: GPS location validation
- **WiFi BSSID**: Office WiFi network validation
- **Dual Validation**: Both GPS and WiFi must match
- **Real-time Updates**: Immediate sync to Firebase
- **Status Types**: Present, Late, Half-day, Absent

### 👥 Employee Management
- Add/Edit/Delete employees
- Salary breakdown (Basic, HRA, Allowances)
- Automatic Firebase Auth user creation
- Employee profiles with UIDs

### 💰 Payroll System
- Automated salary calculation
- Loss of Pay (LOP) calculation
- Statutory deductions: PF, ESI, Professional Tax
- PDF payslip generation
- Leave encashment support
- Monthly summary reports

### 📊 HR Dashboard
- Real-time attendance overview
- Employee attendance history
- Monthly reports
- Payslip management
- Office configuration

---

## 📂 Project Structure

```
hrbackup/
├── backend/                    # Firebase-based attendance backend
│   ├── server.js              # Main Express server
│   ├── firebaseConfig.js      # Firebase initialization
│   ├── routes/                # API routes
│   │   ├── attendanceRoutes.js
│   │   ├── employeeRoutes.js
│   │   ├── payrollRoutes.js
│   │   └── configRoutes.js
│   ├── models/                # Data models
│   └── serviceAccountKey.json # 🔑 Firebase credentials (YOU NEED THIS)
│
├── hr-portal/                 # React HR admin portal
│   ├── src/                   # React frontend
│   │   ├── pages/            # Dashboard, Employees, Attendance, etc.
│   │   ├── components/       # Reusable UI components (shadcn/ui)
│   │   └── services/         # API integration
│   ├── backend/              # HR portal backend (TypeScript)
│   │   ├── src/
│   │   │   ├── routes/       # API endpoints
│   │   │   ├── services/     # Business logic
│   │   │   └── lib/          # Supabase client
│   │   └── .env.example      # Environment variables template
│   └── package.json
│
├── HRHelpdesk/               # Android mobile app
│   └── HRHelpdesk/
│       ├── app/
│       │   ├── src/main/
│       │   │   ├── java/.../hrhelpdesk/
│       │   │   │   ├── ui/           # Compose UI screens
│       │   │   │   ├── viewmodel/    # ViewModels
│       │   │   │   └── util/         # Location helpers
│       │   │   └── res/              # Resources
│       │   ├── google-services.json  # 🔑 Firebase config (YOU NEED THIS)
│       │   └── build.gradle.kts
│       └── gradle/
│
├── payroll_system.py         # Python payroll processor
├── seed_firebase.py          # Seed initial employee data
├── generate_test_attendance.py  # Generate test data
└── .gitignore
```

---

## 🛠️ Troubleshooting

### Backend won't start
**Error:** `Cannot find module './serviceAccountKey.json'`
- **Solution:** Download Firebase service account key and place in `backend/` folder

### Mobile app build fails
**Error:** `google-services.json missing`
- **Solution:** Download `google-services.json` from Firebase and place in `HRHelpdesk/HRHelpdesk/app/`

### Attendance not recording
- Check office configuration in Firebase: `office_config` collection
- Verify GPS coordinates and WiFi BSSID are set correctly
- Check mobile app location permissions

### Payroll script errors
**Error:** `firebase_admin.exceptions.NotFoundError`
- **Solution:** Ensure `serviceAccountKey.json` is in the root directory

### HR Portal login issues
- Default credentials (unless changed):
  - Email: `admin@company.com`
  - Password: `admin123`
- Update in `hr-portal/backend/.env`

---

## 🔒 Security Notes

### ⚠️ IMPORTANT: Never commit these files to Git

- `serviceAccountKey.json` - Contains Firebase admin credentials
- `.env` files - Contains API keys and secrets
- `google-services.json` - Contains Firebase app config

These files are already in `.gitignore` and should **never** be pushed to GitHub!

### 🔐 How to share credentials with your team

1. **Use environment variables** for production
2. **Use secret management tools** (AWS Secrets Manager, etc.)
3. **Share via secure channels** (encrypted files, password managers)
4. **Never share via email or Slack**

---

## 📝 API Documentation

### Backend API (`http://localhost:5000`)

#### Attendance
- `GET /api/attendance/today` - Today's attendance
- `POST /api/attendance/punch-in` - Record punch in
- `POST /api/attendance/punch-out` - Record punch out

#### Employees
- `GET /api/employees` - List all employees
- `POST /api/employees` - Add new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

#### Payroll
- `POST /api/payroll/generate` - Generate payroll for month

---

## 🤝 Contributing

If you want to contribute or extend this system:

1. Create a new branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test thoroughly
4. Submit a pull request

---

## 📄 License

ISC License - Feel free to use for personal or commercial projects.

---

## 👨‍💻 Support

For issues or questions:
- Create an issue on GitHub
- Check the troubleshooting section above
- Review Firebase documentation for service-specific issues

---

## 🎯 Quick Start Checklist

- [ ] Clone repository
- [ ] Download Firebase `serviceAccountKey.json`
- [ ] Download `google-services.json` for mobile app
- [ ] Install Node.js dependencies (`backend/`, `hr-portal/`)
- [ ] Create `.env` files
- [ ] Setup Firebase Firestore collections
- [ ] Start backend server
- [ ] Start HR portal
- [ ] Build mobile app in Android Studio
- [ ] Test attendance flow
- [ ] Run payroll script

---

**Built with ❤️ for efficient HR management**
