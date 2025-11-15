"""Database models for cryptocurrency tracking."""
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
from config import settings

Base = declarative_base()


class Cryptocurrency(Base):
    """Model for storing cryptocurrency information."""
    __tablename__ = "cryptocurrencies"

    id = Column(String, primary_key=True)  # e.g., 'bitcoin'
    symbol = Column(String, nullable=False, index=True)  # e.g., 'BTC'
    name = Column(String, nullable=False)  # e.g., 'Bitcoin'
    market_cap_rank = Column(Integer)
    image_url = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    price_history = relationship("PriceHistory", back_populates="cryptocurrency", cascade="all, delete-orphan")
    market_metrics = relationship("MarketMetrics", back_populates="cryptocurrency", cascade="all, delete-orphan")
    trading_signals = relationship("TradingSignal", back_populates="cryptocurrency", cascade="all, delete-orphan")


class PriceHistory(Base):
    """Model for storing historical price data."""
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    crypto_id = Column(String, ForeignKey("cryptocurrencies.id"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    price_usd = Column(Float, nullable=False)
    volume_24h = Column(Float)
    market_cap = Column(Float)
    price_change_24h = Column(Float)
    price_change_percentage_24h = Column(Float)
    price_change_percentage_7d = Column(Float)
    price_change_percentage_30d = Column(Float)
    data_source = Column(String, default="coingecko")  # Track which API provided the data
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    cryptocurrency = relationship("Cryptocurrency", back_populates="price_history")


class MarketMetrics(Base):
    """Model for storing market metrics and indicators."""
    __tablename__ = "market_metrics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    crypto_id = Column(String, ForeignKey("cryptocurrencies.id"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)

    # Technical Indicators
    rsi_14 = Column(Float)  # Relative Strength Index (14 periods)
    sma_20 = Column(Float)  # Simple Moving Average (20 periods)
    sma_50 = Column(Float)  # Simple Moving Average (50 periods)
    sma_200 = Column(Float)  # Simple Moving Average (200 periods)
    ema_20 = Column(Float)  # Exponential Moving Average (20 periods)
    ema_50 = Column(Float)  # Exponential Moving Average (50 periods)
    macd = Column(Float)  # MACD line
    macd_signal = Column(Float)  # MACD signal line
    macd_histogram = Column(Float)  # MACD histogram
    bollinger_upper = Column(Float)  # Bollinger Band upper
    bollinger_middle = Column(Float)  # Bollinger Band middle
    bollinger_lower = Column(Float)  # Bollinger Band lower
    vwap = Column(Float)  # Volume Weighted Average Price

    # Market Metrics
    total_volume = Column(Float)
    circulating_supply = Column(Float)
    total_supply = Column(Float)
    max_supply = Column(Float)
    ath = Column(Float)  # All Time High
    ath_date = Column(DateTime)
    atl = Column(Float)  # All Time Low
    atl_date = Column(DateTime)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    cryptocurrency = relationship("Cryptocurrency", back_populates="market_metrics")


class TradingSignal(Base):
    """Model for storing trading signals and recommendations."""
    __tablename__ = "trading_signals"

    id = Column(Integer, primary_key=True, autoincrement=True)
    crypto_id = Column(String, ForeignKey("cryptocurrencies.id"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)

    # Signal Information
    signal_type = Column(String, nullable=False)  # 'BUY', 'SELL', 'HOLD'
    timeframe = Column(String, nullable=False)  # 'short', 'medium', 'long'
    strength_score = Column(Float, nullable=False)  # 0-100
    confidence_level = Column(Float, nullable=False)  # 0-100

    # Contributing Factors (JSON for flexibility)
    indicator_scores = Column(JSON)  # e.g., {"rsi": 65, "macd": "bullish", ...}
    risk_assessment = Column(String)  # 'low', 'medium', 'high'
    volatility_score = Column(Float)

    # Additional Context
    support_level = Column(Float)
    resistance_level = Column(Float)
    target_price = Column(Float)
    stop_loss = Column(Float)
    reason = Column(String)  # Human-readable explanation

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    cryptocurrency = relationship("Cryptocurrency", back_populates="trading_signals")


# Database setup
engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Initialize the database by creating all tables."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Dependency for getting database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
