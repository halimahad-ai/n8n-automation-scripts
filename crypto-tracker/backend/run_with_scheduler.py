"""Script to run the application with background scheduler."""
import logging
import uvicorn
from threading import Thread

from config import settings
from models.database import init_db
from utils.scheduler import scheduler

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


def main():
    """Main entry point."""
    logger.info("Initializing database...")
    init_db()

    # Start scheduler in background
    logger.info("Starting data fetch scheduler...")
    scheduler.start(interval_minutes=settings.fetch_interval_seconds // 60)

    # Run FastAPI server
    logger.info(f"Starting API server on {settings.api_host}:{settings.api_port}")
    try:
        uvicorn.run(
            "main:app",
            host=settings.api_host,
            port=settings.api_port,
            reload=settings.debug
        )
    except KeyboardInterrupt:
        logger.info("Shutting down...")
        scheduler.stop()


if __name__ == "__main__":
    main()
