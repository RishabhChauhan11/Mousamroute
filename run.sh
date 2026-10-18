#!/usr/bin/env bash

# ==============================================================================
# WeatherRoute — 1-Click Startup Script (Bash / Git Bash / macOS / Linux)
# Starts both the Django Backend and React Frontend concurrently.
# ==============================================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "🚛 Starting WeatherRoute Application..."
echo "📂 Working directory: $PROJECT_ROOT"

# 1. Virtual Environment Setup
if [ -d "$PROJECT_ROOT/venv" ]; then
    echo "🐍 Activating existing virtual environment..."
    if [ -f "$PROJECT_ROOT/venv/Scripts/activate" ]; then
        # Windows / Git Bash
        source "$PROJECT_ROOT/venv/Scripts/activate"
    else
        # Linux / macOS
        source "$PROJECT_ROOT/venv/bin/activate"
    fi
else
    echo "📦 Creating new virtual environment..."
    python -m venv "$PROJECT_ROOT/venv"
    if [ -f "$PROJECT_ROOT/venv/Scripts/activate" ]; then
        source "$PROJECT_ROOT/venv/Scripts/activate"
    else
        source "$PROJECT_ROOT/venv/bin/activate"
    fi
    echo "⬇️ Installing backend requirements..."
    pip install -r "$PROJECT_ROOT/backend/requirements.txt"
fi

# Run Django migrations
echo "🔄 Checking database migrations..."
python "$PROJECT_ROOT/backend/manage.py" migrate --noinput

# 2. Check Frontend node_modules
if [ ! -d "$PROJECT_ROOT/frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    (cd "$PROJECT_ROOT/frontend" && npm install)
fi

# 3. Clean exit handler to kill both processes on Ctrl+C
cleanup() {
    echo ""
    echo "🛑 Shutting down WeatherRoute servers..."
    kill "$BACKEND_PID" 2>/dev/null || true
    kill "$FRONTEND_PID" 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 4. Start Django Backend Server
echo "🚀 Starting Django backend on http://127.0.0.1:8000..."
python "$PROJECT_ROOT/backend/manage.py" runserver 127.0.0.1:8000 &
BACKEND_PID=$!

# Wait for backend to be ready
sleep 2

# 5. Start Frontend Dev Server
echo "⚡ Starting Vite frontend on http://127.0.0.1:5173..."
(cd "$PROJECT_ROOT/frontend" && npx vite --host 127.0.0.1 --port 5173) &
FRONTEND_PID=$!

sleep 2

# 6. Open Browser
URL="http://127.0.0.1:5173"
echo "🌐 Opening $URL in your default browser..."
if command -v start >/dev/null 2>&1; then
    start "$URL" || true
elif command -v open >/dev/null 2>&1; then
    open "$URL" || true
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$URL" || true
fi

echo "=========================================================="
echo "✅ WeatherRoute is live!"
echo "   • Frontend: http://127.0.0.1:5173"
echo "   • Backend API: http://127.0.0.1:8000/api/"
echo "   Press Ctrl+C in this terminal to stop both servers."
echo "=========================================================="

wait
