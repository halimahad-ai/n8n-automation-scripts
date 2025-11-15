"""Pydantic schemas for API request/response models."""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class CryptocurrencyResponse(BaseModel):
    """Schema for cryptocurrency response."""
    id: str
    symbol: str
    name: str
    market_cap_rank: Optional[int]
    image_url: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PriceHistoryResponse(BaseModel):
    """Schema for price history response."""
    id: int
    crypto_id: str
    timestamp: datetime
    price_usd: float
    volume_24h: Optional[float]
    market_cap: Optional[float]
    price_change_24h: Optional[float]
    price_change_percentage_24h: Optional[float]
    price_change_percentage_7d: Optional[float]
    price_change_percentage_30d: Optional[float]
    data_source: str

    class Config:
        from_attributes = True


class MarketMetricsResponse(BaseModel):
    """Schema for market metrics response."""
    id: int
    crypto_id: str
    timestamp: datetime
    rsi_14: Optional[float]
    sma_20: Optional[float]
    sma_50: Optional[float]
    sma_200: Optional[float]
    ema_20: Optional[float]
    ema_50: Optional[float]
    macd: Optional[float]
    macd_signal: Optional[float]
    macd_histogram: Optional[float]
    bollinger_upper: Optional[float]
    bollinger_middle: Optional[float]
    bollinger_lower: Optional[float]
    vwap: Optional[float]
    total_volume: Optional[float]
    circulating_supply: Optional[float]
    total_supply: Optional[float]
    max_supply: Optional[float]
    ath: Optional[float]
    ath_date: Optional[datetime]
    atl: Optional[float]
    atl_date: Optional[datetime]

    class Config:
        from_attributes = True


class TradingSignalResponse(BaseModel):
    """Schema for trading signal response."""
    id: int
    crypto_id: str
    timestamp: datetime
    signal_type: str
    timeframe: str
    strength_score: float
    confidence_level: float
    indicator_scores: Optional[Dict[str, Any]]
    risk_assessment: str
    volatility_score: Optional[float]
    support_level: Optional[float]
    resistance_level: Optional[float]
    target_price: Optional[float]
    stop_loss: Optional[float]
    reason: str
    is_active: bool

    class Config:
        from_attributes = True


class SignalGenerationRequest(BaseModel):
    """Schema for signal generation request."""
    timeframe: str = Field(
        default="short",
        pattern="^(short|medium|long)$",
        description="Signal timeframe: short (1-7 days), medium (1-4 weeks), long (1-3 months)"
    )


class DashboardItemResponse(BaseModel):
    """Schema for dashboard item."""
    cryptocurrency: CryptocurrencyResponse
    latest_price: PriceHistoryResponse
    latest_signal: Optional[TradingSignalResponse]

    class Config:
        from_attributes = True


class DashboardResponse(BaseModel):
    """Schema for dashboard response."""
    top_gainers: List[Dict[str, Any]]
    top_losers: List[Dict[str, Any]]
    recent_signals: List[TradingSignalResponse]

    class Config:
        from_attributes = True
