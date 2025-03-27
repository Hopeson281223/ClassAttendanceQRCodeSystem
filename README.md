# QR Code Class Attendance System

## Overview
The **QR Code Class Attendance System** is a web-based application that allows instructors to track student attendance using QR codes. The system consists of a **Flask backend** and a **React frontend**, making it efficient and easy to use.

## Features
- Generate unique QR codes for instructors.
- Scan QR codes to mark attendance.
- View attendance records.
- Secure and easy-to-use interface.

## Tech Stack
### Backend:
- Python
- Flask
- Flask-CORS
- SQLAlchemy (for database management)
- Alembic (for database migrations)
- QR Code library  `qrcode` Python package

### Frontend:
- React
- Axios (for API requests)
- React Router (for navigation)

## Project Structure

### **Frontend (`frontend/`)**
```
frontend/
│── build/  # Production build files
│── node_modules/  # Dependencies
│── public/  # Static files
│── src/
│   ├── components/
│   │   ├── Login.js  # Login component
│   │   ├── ProtectedRoute.js  # Route protection
│   │   ├── Register.js  # Registration component
│   ├── pages/
│   │   ├── AdminDashboard.js  # Admin dashboard
│   │   ├── InstructorDashboard.js  # Instructor dashboard
│   │   ├── StudentDashboard.js  # Student dashboard
│   ├── App.js  # Main React component
│   ├── index.js  # Entry point
│   ├── App.css, index.css  # Stylesheets
│── package.json  # Frontend dependencies
│── .gitignore  # Git ignore file
```

### **Backend (`backend/`)**
```
backend/
│── __pycache__/  # Compiled Python files
│── .venv/  # Virtual environment
│── alembic/  # Database migration folder
│── extensions/  # Flask extensions
│── instance/  # Configuration and database storage
│── migrations/  # Alembic migrations
│── models/  # Database models
│── routes/  # API routes
│── static/  # Static assets
│── .env  # Environment variables
│── alembic.ini  # Alembic configuration
│── app.py  # Main Flask application
│── config.py  # Configuration settings
│── package.json, package-lock.json  # Backend dependencies (if applicable)
│── requirements.txt  # Python dependencies
│── quickstart.ps1  # Script for quick setup
```

## Installation & Setup

### Backend Setup
1. Navigate to the backend folder:
   ```sh
   cd backend
   ```
2. Create a virtual environment (optional but recommended):
   ```sh
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```
4. Apply database migrations:
   ```sh
   flask db upgrade
   ```
5. Run the Flask app:
   ```sh
   flask run
   ```

### Frontend Setup
1. Navigate to the frontend folder:
   ```sh
   cd frontend
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the development server:
   ```sh
   npm start
   ```

## Usage
1. Open the frontend in your browser (usually at `https://class-attendance-qr-code-system.vercel.app`).
2. Generate QR codes for students.
3. Use a mobile scanner or webcam to scan QR codes.
4. View and manage attendance records.

## Future Improvements
- Add more secure authentication.
- Generate reports and analytics.
- Implement more features for all users.

## License
This project is open-source and available under the MIT License.

