"""Script to fetch initial cryptocurrency data."""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from models.database import SessionLocal, init_db
from data_collectors import DataIngestionService
from analysis import SignalGenerator
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


def main():
    """Fetch initial data for top cryptocurrencies."""
    logger.info("Initializing database...")
    init_db()

    db = SessionLocal()

    try:
        logger.info("Fetching top 50 cryptocurrencies from CoinGecko...")
        service = DataIngestionService(db)
        count = service.fetch_and_store_top_coins(limit=50)
        logger.info(f"Successfully fetched data for {count} cryptocurrencies")

        # Fetch historical data for top 10
        logger.info("Fetching historical data for top cryptocurrencies...")
        from models.database import Cryptocurrency

        top_cryptos = (
            db.query(Cryptocurrency)
            .filter(Cryptocurrency.is_active == True)
            .order_by(Cryptocurrency.market_cap_rank)
            .limit(10)
            .all()
        )

        for crypto in top_cryptos:
            logger.info(f"Fetching 90-day history for {crypto.name}...")
            service.fetch_historical_data(crypto.id, days=90)

        # Generate signals
        logger.info("Generating trading signals...")
        signal_generator = SignalGenerator(db)
        signal_count = 0

        for crypto in top_cryptos:
            price_history = service.get_price_history(crypto.id, days=90)

            if len(price_history) >= 30:
                for timeframe in ["short", "medium", "long"]:
                    signal = signal_generator.generate_signals(
                        crypto.id,
                        price_history,
                        timeframe=timeframe
                    )

                    if signal:
                        db.add(signal)
                        signal_count += 1

        db.commit()
        logger.info(f"Generated {signal_count} trading signals")

        logger.info("Initial data fetch completed successfully!")
        logger.info("You can now start the application with: python backend/main.py")

    except Exception as e:
        logger.error(f"Error fetching initial data: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
