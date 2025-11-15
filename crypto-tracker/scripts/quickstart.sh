#!/bin/bash

# Cryptocurrency Tracker - Quick Start Script

set -e

echo "🚀 Cryptocurrency Tracker - Quick Start"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.9 or higher."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"
echo ""

# Navigate to backend directory
cd "$(dirname "$0")/../backend"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo "✅ Dependencies installed"

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created (you can edit it later)"
else
    echo "✅ .env file already exists"
fi

# Initialize database
echo "🗄️  Initializing database..."
python3 -c "from models.database import init_db; init_db()"
echo "✅ Database initialized"

# Fetch initial data
echo ""
echo "📡 Fetching initial cryptocurrency data..."
echo "This may take a few minutes due to API rate limits..."
cd ..
python3 scripts/fetch_initial_data.py

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "🎉 You're all set! To start the application:"
echo ""
echo "1. Start the backend:"
echo "   cd backend"
echo "   python main.py"
echo ""
echo "2. Open the frontend:"
echo "   Open frontend/index.html in your browser"
echo "   Or run: cd frontend && python -m http.server 3000"
echo ""
echo "3. API Documentation:"
echo "   http://localhost:8000/docs"
echo ""
echo "Happy trading! 🚀📈"
