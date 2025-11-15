"""API routes for the crypto tracker application."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import datetime, timedelta

from models.database import (
    Cryptocurrency,
    PriceHistory,
    MarketMetrics,
    TradingSignal,
    get_db
)
from data_collectors import DataIngestionService
from analysis import SignalGenerator
from api.schemas import (
    CryptocurrencyResponse,
    PriceHistoryResponse,
    TradingSignalResponse,
    MarketMetricsResponse,
    DashboardResponse,
    SignalGenerationRequest
)

router = APIRouter()


@router.get("/cryptocurrencies", response_model=List[CryptocurrencyResponse])
async def get_cryptocurrencies(
    limit: int = Query(50, ge=1, le=250),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Get list of tracked cryptocurrencies."""
    cryptos = (
        db.query(Cryptocurrency)
        .filter(Cryptocurrency.is_active == True)
        .order_by(Cryptocurrency.market_cap_rank)
        .offset(offset)
        .limit(limit)
        .all()
    )
    return cryptos


@router.get("/cryptocurrencies/{crypto_id}", response_model=CryptocurrencyResponse)
async def get_cryptocurrency(crypto_id: str, db: Session = Depends(get_db)):
    """Get detailed information for a specific cryptocurrency."""
    crypto = db.query(Cryptocurrency).filter(Cryptocurrency.id == crypto_id).first()
    if not crypto:
        raise HTTPException(status_code=404, detail="Cryptocurrency not found")
    return crypto


@router.get("/cryptocurrencies/{crypto_id}/price-history", response_model=List[PriceHistoryResponse])
async def get_price_history(
    crypto_id: str,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Get price history for a cryptocurrency."""
    cutoff_date = datetime.utcnow() - timedelta(days=days)

    history = (
        db.query(PriceHistory)
        .filter(
            PriceHistory.crypto_id == crypto_id,
            PriceHistory.timestamp >= cutoff_date
        )
        .order_by(PriceHistory.timestamp.asc())
        .all()
    )

    if not history:
        raise HTTPException(status_code=404, detail="No price history found")

    return history


@router.get("/cryptocurrencies/{crypto_id}/metrics", response_model=MarketMetricsResponse)
async def get_market_metrics(crypto_id: str, db: Session = Depends(get_db)):
    """Get latest market metrics for a cryptocurrency."""
    metrics = (
        db.query(MarketMetrics)
        .filter(MarketMetrics.crypto_id == crypto_id)
        .order_by(desc(MarketMetrics.timestamp))
        .first()
    )

    if not metrics:
        raise HTTPException(status_code=404, detail="No metrics found")

    return metrics


@router.get("/cryptocurrencies/{crypto_id}/signals", response_model=List[TradingSignalResponse])
async def get_trading_signals(
    crypto_id: str,
    timeframe: Optional[str] = Query(None, regex="^(short|medium|long)$"),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get trading signals for a cryptocurrency."""
    query = db.query(TradingSignal).filter(TradingSignal.crypto_id == crypto_id)

    if timeframe:
        query = query.filter(TradingSignal.timeframe == timeframe)

    signals = (
        query
        .order_by(desc(TradingSignal.timestamp))
        .limit(limit)
        .all()
    )

    return signals


@router.post("/cryptocurrencies/{crypto_id}/generate-signal", response_model=TradingSignalResponse)
async def generate_signal(
    crypto_id: str,
    request: SignalGenerationRequest,
    db: Session = Depends(get_db)
):
    """Generate a new trading signal for a cryptocurrency."""
    # Check if cryptocurrency exists
    crypto = db.query(Cryptocurrency).filter(Cryptocurrency.id == crypto_id).first()
    if not crypto:
        raise HTTPException(status_code=404, detail="Cryptocurrency not found")

    # Get price history
    cutoff_date = datetime.utcnow() - timedelta(days=90)
    price_history = (
        db.query(PriceHistory)
        .filter(
            PriceHistory.crypto_id == crypto_id,
            PriceHistory.timestamp >= cutoff_date
        )
        .order_by(PriceHistory.timestamp.asc())
        .all()
    )

    if len(price_history) < 30:
        raise HTTPException(
            status_code=400,
            detail="Insufficient price history to generate signal"
        )

    # Generate signal
    signal_generator = SignalGenerator(db)
    signal = signal_generator.generate_signals(
        crypto_id,
        price_history,
        timeframe=request.timeframe
    )

    if not signal:
        raise HTTPException(status_code=500, detail="Failed to generate signal")

    # Save to database
    db.add(signal)
    db.commit()
    db.refresh(signal)

    return signal


@router.get("/dashboard")
async def get_dashboard(db: Session = Depends(get_db)):
    """Get dashboard data with top movers and latest signals."""
    # Get top 20 cryptocurrencies
    top_cryptos = (
        db.query(Cryptocurrency)
        .filter(Cryptocurrency.is_active == True)
        .order_by(Cryptocurrency.market_cap_rank)
        .limit(20)
        .all()
    )

    # Get latest price for each
    dashboard_data = []
    for crypto in top_cryptos:
        latest_price = (
            db.query(PriceHistory)
            .filter(PriceHistory.crypto_id == crypto.id)
            .order_by(desc(PriceHistory.timestamp))
            .first()
        )

        latest_signal = (
            db.query(TradingSignal)
            .filter(TradingSignal.crypto_id == crypto.id)
            .order_by(desc(TradingSignal.timestamp))
            .first()
        )

        if latest_price:
            dashboard_data.append({
                "cryptocurrency": CryptocurrencyResponse.model_validate(crypto),
                "latest_price": PriceHistoryResponse.model_validate(latest_price),
                "latest_signal": TradingSignalResponse.model_validate(latest_signal) if latest_signal else None
            })

    # Sort by 24h change to get top movers
    gainers = sorted(
        [d for d in dashboard_data if d["latest_price"].price_change_percentage_24h],
        key=lambda x: x["latest_price"].price_change_percentage_24h or 0,
        reverse=True
    )[:5]

    losers = sorted(
        [d for d in dashboard_data if d["latest_price"].price_change_percentage_24h],
        key=lambda x: x["latest_price"].price_change_percentage_24h or 0
    )[:5]

    return {
        "top_gainers": gainers,
        "top_losers": losers,
        "recent_signals": [d["latest_signal"] for d in dashboard_data if d.get("latest_signal")][:10]
    }


@router.post("/data/fetch")
async def fetch_latest_data(
    limit: int = Query(50, ge=1, le=250),
    db: Session = Depends(get_db)
):
    """Manually trigger data fetching from CoinGecko."""
    try:
        service = DataIngestionService(db)
        count = service.fetch_and_store_top_coins(limit=limit)

        return {
            "status": "success",
            "coins_updated": count,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/data/fetch-history/{crypto_id}")
async def fetch_historical_data(
    crypto_id: str,
    days: int = Query(90, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Fetch historical data for a specific cryptocurrency."""
    # Check if crypto exists
    crypto = db.query(Cryptocurrency).filter(Cryptocurrency.id == crypto_id).first()
    if not crypto:
        raise HTTPException(status_code=404, detail="Cryptocurrency not found")

    try:
        service = DataIngestionService(db)
        success = service.fetch_historical_data(crypto_id, days=days)

        if success:
            return {
                "status": "success",
                "crypto_id": crypto_id,
                "days": days,
                "timestamp": datetime.utcnow().isoformat()
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to fetch historical data")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}
