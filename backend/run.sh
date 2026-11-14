#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Detect virtualenv if available
PYTHON_BIN="python3"
UVICORN_BIN="uvicorn"
if [ -f "$DIR/../.venv/bin/python" ]; then
    PYTHON_BIN="$DIR/../.venv/bin/python"
    UVICORN_BIN="$DIR/../.venv/bin/uvicorn"
elif [ -f "$DIR/.venv/bin/python" ]; then
    PYTHON_BIN="$DIR/.venv/bin/python"
    UVICORN_BIN="$DIR/.venv/bin/uvicorn"
fi

# Seed if database does not exist
if [ ! -f "sociotrack.db" ]; then
    echo "🌱 Initializing and seeding database..."
    PYTHONPATH=. "$PYTHON_BIN" db/seed.py
fi

echo "🚀 Starting SocioTrack FastAPI Backend on http://localhost:8000"
echo "📖 Swagger API documentation available at http://localhost:8000/docs"
PYTHONPATH=. "$UVICORN_BIN" app.main:app --host 0.0.0.0 --port 8000 --reload
