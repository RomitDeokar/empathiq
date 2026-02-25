#!/bin/bash
# EmpathIQ — Quick Start Script

echo ""
echo "██████╗ ███╗   ███╗██████╗  █████╗ ████████╗██╗  ██╗██╗ ██████╗ "
echo "██╔════╝████╗ ████║██╔══██╗██╔══██╗╚══██╔══╝██║  ██║██║██╔═══██╗"
echo "█████╗  ██╔████╔██║██████╔╝███████║   ██║   ███████║██║██║   ██║"
echo "██╔══╝  ██║╚██╔╝██║██╔═══╝ ██╔══██║   ██║   ██╔══██║██║██║▄▄ ██║"
echo "███████╗██║ ╚═╝ ██║██║     ██║  ██║   ██║   ██║  ██║██║╚██████╔╝"
echo "╚══════╝╚═╝     ╚═╝╚═╝     ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝ ╚══▀▀═╝ "
echo ""
echo "  Emotional Context Layer for Customer Support"
echo "  ─────────────────────────────────────────────"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Install Python 3.10+ first."
    exit 1
fi

# Check Node
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install Node 18+ first."
    exit 1
fi

# Backend setup
echo "📦 Setting up Python backend..."
cd backend

if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "  Created virtual environment"
fi

source venv/bin/activate 2>/dev/null || . venv/Scripts/activate 2>/dev/null
pip install -q -r requirements.txt
echo "  ✅ Python dependencies installed"

# Start backend in background
echo ""
echo "🚀 Starting FastAPI backend on http://localhost:8000"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID"

# Frontend setup
cd ../frontend
echo ""
echo "📦 Setting up frontend..."
if [ ! -d "node_modules" ]; then
    npm install --legacy-peer-deps --silent
    echo "  ✅ Node dependencies installed"
fi

echo ""
echo "🚀 Starting React frontend on http://localhost:5173"
echo ""
echo "  ┌─────────────────────────────────────────────┐"
echo "  │  EmpathIQ is running!                       │"
echo "  │                                              │"
echo "  │  Frontend: http://localhost:5173             │"
echo "  │  API Docs: http://localhost:8000/docs        │"
echo "  │  API Health: http://localhost:8000/health    │"
echo "  │                                              │"
echo "  │  Press Ctrl+C to stop both servers          │"
echo "  └─────────────────────────────────────────────┘"
echo ""

# Cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down..."
    kill $BACKEND_PID 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

npm run dev
