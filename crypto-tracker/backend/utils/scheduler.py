"""Background scheduler for automated data fetching."""
import logging
import time
import schedule
from datetime import datetime
from threading import Thread

from models.database import SessionLocal
from data_collectors import DataIngestionService
from analysis import SignalGenerator
from config import settings

logger = logging.getLogger(__name__)


class DataFetchScheduler:
    """Scheduler for periodic data fetching and signal generation."""

    def __init__(self):
        """Initialize scheduler."""
        self.running = False
        self.thread = None

    def fetch_and_analyze(self):
        """Fetch latest data and generate signals."""
        logger.info("Starting scheduled data fetch...")

        db = SessionLocal()
        try:
            # Fetch latest data
            service = DataIngestionService(db)
            count = service.fetch_and_store_top_coins(limit=settings.top_coins_count)
            logger.info(f"Fetched data for {count} cryptocurrencies")

            # Generate signals for top cryptocurrencies
            signal_generator = SignalGenerator(db)
            signal_count = 0

            # Get top cryptocurrencies
            from models.database import Cryptocurrency
            cryptos = (
                db.query(Cryptocurrency)
                .filter(Cryptocurrency.is_active == True)
                .order_by(Cryptocurrency.market_cap_rank)
                .limit(20)  # Generate signals for top 20
                .all()
            )

            for crypto in cryptos:
                try:
                    # Get price history
                    price_history = service.get_price_history(crypto.id, days=90)

                    if len(price_history) >= 30:
                        # Generate signal for each timeframe
                        for timeframe in ["short", "medium", "long"]:
                            signal = signal_generator.generate_signals(
                                crypto.id,
                                price_history,
                                timeframe=timeframe
                            )

                            if signal:
                                db.add(signal)
                                signal_count += 1

                except Exception as e:
                    logger.error(f"Error generating signal for {crypto.id}: {e}")
                    continue

            db.commit()
            logger.info(f"Generated {signal_count} trading signals")

        except Exception as e:
            logger.error(f"Error in scheduled fetch: {e}")
            db.rollback()
        finally:
            db.close()

        logger.info("Scheduled data fetch completed")

    def run_schedule(self):
        """Run the scheduler in a loop."""
        while self.running:
            schedule.run_pending()
            time.sleep(60)  # Check every minute

    def start(self, interval_minutes: int = 5):
        """
        Start the scheduler.

        Args:
            interval_minutes: Interval between fetches in minutes
        """
        if self.running:
            logger.warning("Scheduler is already running")
            return

        logger.info(f"Starting scheduler with {interval_minutes} minute interval")

        # Schedule the job
        schedule.every(interval_minutes).minutes.do(self.fetch_and_analyze)

        # Run immediately on start
        self.fetch_and_analyze()

        # Start the scheduler thread
        self.running = True
        self.thread = Thread(target=self.run_schedule, daemon=True)
        self.thread.start()

        logger.info("Scheduler started successfully")

    def stop(self):
        """Stop the scheduler."""
        if not self.running:
            logger.warning("Scheduler is not running")
            return

        logger.info("Stopping scheduler...")
        self.running = False

        if self.thread:
            self.thread.join(timeout=5)

        schedule.clear()
        logger.info("Scheduler stopped")


# Global scheduler instance
scheduler = DataFetchScheduler()
