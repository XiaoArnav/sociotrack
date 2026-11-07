#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Seed if database does not exist
if [ ! -f "sociotrack.db" ]; then
    echo "🌱 Initializing and seeding database..."
    PYTHONPATH=. python3 db/seed.py
fi

echo "🚀 Starting SocioTrack FastAPI Backend on http://localhost:8000"
echo "📖 Swagger API documentation available at http://localhost:8000/docs"
PYTHONPATH=. uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
