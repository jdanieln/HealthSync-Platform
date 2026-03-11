# HealthSync Platform

HealthSync is a platform designed to synchronize health data seamlessly. It features a React frontend and a Python (Flask) backend API.

## Project Structure

The project is divided into two main parts:

- `frontend/`: A modern web application built with React, Vite, and Tailwind CSS.
- `backend/`: A RESTful API built with Python, Flask, and Firebase Admin.

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v20.20.1 recommended) and npm
- Python (v3.10+)

## Quick Start

### 1. Setting Up the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the Flask application:
   ```bash
   python app.py
   ```
The backend server will normally start on `http://127.0.0.1:5005` or port `5001`.

### 2. Setting Up the Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
The frontend application will be available at `http://localhost:5173/`.

## Technology Stack

### Frontend
- **React 19** 
- **Vite**
- **Tailwind CSS v4**
- **Firebase**
- **ESLint**

### Backend
- **Python 3**
- **Flask**
- **Firebase Admin SDK**
- **Google Cloud Access**

## Scripts

### Frontend Scripts
- `npm run dev`: Starts the local development server.
- `npm run build`: Bundles the app for production.
- `npm run lint`: Runs ESLint to check for code quality.
- `npm run preview`: Locally previews the production build.

## Contributing

Make sure to configure your remote repository properly when pushing changes.
```bash
git remote set-url origin https://github.com/tu-usuario/tu-repositorio.git
git push origin main
```
