# 🚀 Cryptocurrency Tracker & Insights Tool

A comprehensive cryptocurrency tracking and analysis application that provides real-time data monitoring, technical analysis, and trading signal generation with buy/sell position strength recommendations.

## 📋 Features

### Phase 1 (MVP) - ✅ Completed

- ✅ **Real-time Data Ingestion** from CoinGecko API
- ✅ **Database Storage** with SQLite/PostgreSQL support
- ✅ **Technical Indicators** including:
  - RSI (Relative Strength Index)
  - SMA (Simple Moving Average - 20, 50, 200 periods)
  - EMA (Exponential Moving Average - 20, 50 periods)
  - MACD (Moving Average Convergence Divergence)
  - Bollinger Bands
  - VWAP (Volume Weighted Average Price)
- ✅ **Trading Signal Generation** with strength scoring (0-100)
- ✅ **Buy/Sell/Hold Recommendations** with confidence levels
- ✅ **RESTful API** built with FastAPI
- ✅ **Interactive Web Dashboard** with real-time updates
- ✅ **Support & Resistance Detection**
- ✅ **Risk Assessment** based on volatility

## 🏗️ Architecture

```
crypto-tracker/
├── backend/                 # Python FastAPI backend
│   ├── api/                # API routes and schemas
│   ├── data_collectors/    # Data ingestion from APIs
│   ├── analysis/           # Technical analysis & signals
│   ├── models/             # Database models
│   ├── utils/              # Utilities & scheduler
│   ├── config.py           # Configuration
│   └── main.py             # FastAPI application
├── frontend/               # Web dashboard
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── database/               # Database migrations
└── tests/                  # Unit & integration tests
```

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- pip (Python package manager)
- Node.js (for frontend development, optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd crypto-tracker
   ```

2. **Set up Python virtual environment**
   ```bash
   cd backend
   python -m venv venv

   # Activate virtual environment
   # On Linux/Mac:
   source venv/bin/activate
   # On Windows:
   venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your preferences
   ```

5. **Initialize database**
   ```bash
   python -c "from models.database import init_db; init_db()"
   ```

6. **Start the backend server**
   ```bash
   python main.py
   ```

   The API will be available at: `http://localhost:8000`
   API documentation: `http://localhost:8000/docs`

7. **Open the frontend**
   - Navigate to the `frontend/` directory
   - Open `index.html` in your browser
   - Or use a simple HTTP server:
     ```bash
     cd frontend
     python -m http.server 3000
     ```
   - Access at: `http://localhost:3000`

## 📊 Usage Guide

### Fetching Initial Data

1. **Via API** (recommended for first-time setup):
   ```bash
   curl -X POST http://localhost:8000/api/v1/data/fetch
   ```

2. **Via Web Interface**:
   - Click the "📡 Fetch Latest" button in the dashboard
   - This will fetch data for the top 50 cryptocurrencies

3. **Via Python Script**:
   ```python
   from models.database import SessionLocal
   from data_collectors import DataIngestionService

   db = SessionLocal()
   service = DataIngestionService(db)
   service.fetch_and_store_top_coins(limit=50)
   ```

### Generating Trading Signals

Signals are automatically generated when fetching data. To manually generate:

```bash
curl -X POST http://localhost:8000/api/v1/cryptocurrencies/bitcoin/generate-signal \
  -H "Content-Type: application/json" \
  -d '{"timeframe": "short"}'
```

Timeframes:
- `short`: 1-7 days
- `medium`: 1-4 weeks
- `long`: 1-3 months

### API Endpoints

#### Cryptocurrencies
- `GET /api/v1/cryptocurrencies` - List all tracked cryptos
- `GET /api/v1/cryptocurrencies/{crypto_id}` - Get crypto details
- `GET /api/v1/cryptocurrencies/{crypto_id}/price-history` - Price history
- `GET /api/v1/cryptocurrencies/{crypto_id}/metrics` - Technical metrics
- `GET /api/v1/cryptocurrencies/{crypto_id}/signals` - Trading signals

#### Data Management
- `POST /api/v1/data/fetch` - Fetch latest data from CoinGecko
- `POST /api/v1/data/fetch-history/{crypto_id}` - Fetch historical data

#### Dashboard
- `GET /api/v1/dashboard` - Dashboard summary with top movers

Full API documentation: `http://localhost:8000/docs`

## 🔧 Configuration

Edit the `.env` file to customize:

```env
# Database (SQLite or PostgreSQL)
DATABASE_URL=sqlite:///./crypto_tracker.db

# Data fetching
FETCH_INTERVAL_SECONDS=300  # 5 minutes
TOP_COINS_COUNT=50

# API settings
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True

# CORS (for frontend)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

## 📈 Technical Indicators Explained

### RSI (Relative Strength Index)
- **Range**: 0-100
- **Oversold**: < 30 (potential buy)
- **Overbought**: > 70 (potential sell)

### MACD
- **Bullish Signal**: MACD line crosses above signal line
- **Bearish Signal**: MACD line crosses below signal line

### Moving Averages
- **Golden Cross**: SMA 20 > SMA 50 (bullish)
- **Death Cross**: SMA 20 < SMA 50 (bearish)

### Bollinger Bands
- Price near lower band = oversold
- Price near upper band = overbought

## 🎯 Signal Strength Scoring

Signals are scored from 0-100 based on weighted technical indicators:

- **RSI**: 25% weight
- **MACD**: 25% weight
- **Moving Averages**: 20% weight
- **Bollinger Bands**: 15% weight
- **Volume Trends**: 15% weight

### Signal Types
- **BUY**: Strength score < -30
- **SELL**: Strength score > 30
- **HOLD**: Strength score between -30 and 30

### Risk Assessment
- **Low Risk**: Volatility < 30
- **Medium Risk**: Volatility 30-60
- **High Risk**: Volatility > 60

## 🐳 Docker Support (Coming Soon)

```bash
docker-compose up -d
```

## 🧪 Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=backend --cov-report=html
```

## 📝 Development Roadmap

### Phase 2 (Planned)
- [ ] Multiple data sources (Binance, CoinMarketCap)
- [ ] Enhanced UI with real-time WebSocket updates
- [ ] Portfolio tracking functionality
- [ ] Alert system (email/push notifications)
- [ ] More technical indicators (Fibonacci, Ichimoku)

### Phase 3 (Planned)
- [ ] Backtesting framework
- [ ] Market correlation analysis
- [ ] Machine learning price predictions
- [ ] Mobile app
- [ ] Social sentiment analysis

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## ⚠️ Disclaimer

This tool is for educational and informational purposes only. Trading cryptocurrencies carries substantial risk. Always do your own research and consult with financial advisors before making investment decisions. The signals generated by this tool should not be considered as financial advice.

## 🆘 Troubleshooting

### Database Issues
```bash
# Reset database
rm crypto_tracker.db
python -c "from models.database import init_db; init_db()"
```

### API Rate Limiting
CoinGecko free tier has rate limits:
- 10-30 calls/minute
- The application automatically adds delays between requests

### CORS Errors
Make sure your frontend URL is listed in `CORS_ORIGINS` in `.env`

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

**Happy Trading! 🚀📈**
