"""Add sample cryptocurrency data for testing."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from models.database import SessionLocal, Cryptocurrency, PriceHistory, TradingSignal
from datetime import datetime, timedelta
import random

def add_sample_data():
    """Add sample cryptocurrency data."""
    db = SessionLocal()

    # Sample cryptocurrencies
    cryptos_data = [
        {"id": "bitcoin", "symbol": "BTC", "name": "Bitcoin", "rank": 1, "base_price": 43000},
        {"id": "ethereum", "symbol": "ETH", "name": "Ethereum", "rank": 2, "base_price": 2300},
        {"id": "binancecoin", "symbol": "BNB", "name": "BNB", "rank": 3, "base_price": 310},
        {"id": "solana", "symbol": "SOL", "name": "Solana", "rank": 4, "base_price": 95},
        {"id": "cardano", "symbol": "ADA", "name": "Cardano", "rank": 5, "base_price": 0.48},
        {"id": "ripple", "symbol": "XRP", "name": "XRP", "rank": 6, "base_price": 0.62},
        {"id": "polkadot", "symbol": "DOT", "name": "Polkadot", "rank": 7, "base_price": 7.2},
        {"id": "dogecoin", "symbol": "DOGE", "name": "Dogecoin", "rank": 8, "base_price": 0.085},
        {"id": "avalanche", "symbol": "AVAX", "name": "Avalanche", "rank": 9, "base_price": 38},
        {"id": "chainlink", "symbol": "LINK", "name": "Chainlink", "rank": 10, "base_price": 14.5},
    ]

    print("Adding sample cryptocurrencies...")

    for crypto_data in cryptos_data:
        # Add cryptocurrency
        crypto = Cryptocurrency(
            id=crypto_data["id"],
            symbol=crypto_data["symbol"],
            name=crypto_data["name"],
            market_cap_rank=crypto_data["rank"],
            image_url=f"https://assets.coingecko.com/coins/images/{crypto_data['rank']}/large/{crypto_data['id']}.png",
            is_active=True
        )
        db.merge(crypto)

        # Add price history (90 days)
        print(f"  Adding price history for {crypto_data['name']}...")
        base_price = crypto_data["base_price"]

        for i in range(90):
            timestamp = datetime.utcnow() - timedelta(days=90-i)

            # Create realistic price movement
            days_from_start = i
            trend = 1 + (days_from_start / 90) * 0.2  # Slight upward trend
            volatility = random.uniform(0.95, 1.05)
            price = base_price * trend * volatility

            # 24h change
            if i > 0:
                prev_price = base_price * (1 + ((i-1) / 90) * 0.2) * random.uniform(0.95, 1.05)
                change_24h = ((price - prev_price) / prev_price) * 100
            else:
                change_24h = random.uniform(-5, 5)

            price_entry = PriceHistory(
                crypto_id=crypto_data["id"],
                timestamp=timestamp,
                price_usd=price,
                volume_24h=random.uniform(1e9, 5e9),
                market_cap=price * random.uniform(1e7, 1e8),
                price_change_24h=price * (change_24h / 100),
                price_change_percentage_24h=change_24h,
                price_change_percentage_7d=random.uniform(-15, 15),
                price_change_percentage_30d=random.uniform(-30, 30),
                data_source="sample"
            )
            db.add(price_entry)

        # Add trading signals
        print(f"  Adding trading signals for {crypto_data['name']}...")

        # BUY signal
        buy_signal = TradingSignal(
            crypto_id=crypto_data["id"],
            timestamp=datetime.utcnow() - timedelta(hours=2),
            signal_type="BUY",
            timeframe="short",
            strength_score=75,
            confidence_level=82,
            indicator_scores={
                "rsi": -65,
                "macd": -55,
                "moving_averages": -70,
                "bollinger_bands": -60,
                "volume": -50
            },
            risk_assessment="medium",
            volatility_score=45,
            support_level=base_price * 0.95,
            resistance_level=base_price * 1.1,
            target_price=base_price * 1.15,
            stop_loss=base_price * 0.92,
            reason="RSI indicates oversold conditions; MACD shows bullish momentum; Price above key moving averages. Recommendation: BUY",
            is_active=True
        )
        db.add(buy_signal)

        # SELL signal
        sell_signal = TradingSignal(
            crypto_id=crypto_data["id"],
            timestamp=datetime.utcnow() - timedelta(days=1),
            signal_type="SELL",
            timeframe="medium",
            strength_score=68,
            confidence_level=74,
            indicator_scores={
                "rsi": 72,
                "macd": 60,
                "moving_averages": 65,
                "bollinger_bands": 70,
                "volume": 58
            },
            risk_assessment="high",
            volatility_score=72,
            support_level=base_price * 0.9,
            resistance_level=base_price * 1.05,
            target_price=base_price * 0.88,
            stop_loss=base_price * 1.08,
            reason="RSI indicates overbought conditions; Price near upper Bollinger Band. Recommendation: SELL",
            is_active=True
        )
        db.add(sell_signal)

    db.commit()
    print("\n✅ Sample data added successfully!")
    print(f"Added {len(cryptos_data)} cryptocurrencies with price history and signals")
    print("\nYou can now access:")
    print("  Frontend: http://localhost:3000")
    print("  API: http://localhost:8000")
    print("  API Docs: http://localhost:8000/docs")

    db.close()

if __name__ == "__main__":
    add_sample_data()
