"""Data ingestion service for collecting and storing cryptocurrency data."""
import logging
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from models.database import (
    Cryptocurrency,
    PriceHistory,
    MarketMetrics,
    get_db
)
from data_collectors.coingecko_client import CoinGeckoClient
from config import settings

logger = logging.getLogger(__name__)


class DataIngestionService:
    """Service for ingesting cryptocurrency data from external APIs."""

    def __init__(self, db: Session, api_key: Optional[str] = None):
        """
        Initialize data ingestion service.

        Args:
            db: Database session
            api_key: Optional CoinGecko API key
        """
        self.db = db
        self.client = CoinGeckoClient(api_key)

    def fetch_and_store_top_coins(self, limit: int = 50) -> int:
        """
        Fetch top cryptocurrencies and store in database.

        Args:
            limit: Number of top coins to fetch

        Returns:
            Number of coins successfully stored
        """
        try:
            coins_data = self.client.get_top_coins(limit=limit)
            stored_count = 0

            for coin_data in coins_data:
                try:
                    # Store or update cryptocurrency
                    crypto = self._store_cryptocurrency(coin_data)

                    # Store price history
                    self._store_price_data(crypto.id, coin_data)

                    # Store market metrics
                    self._store_market_metrics(crypto.id, coin_data)

                    stored_count += 1
                except Exception as e:
                    logger.error(f"Error storing coin {coin_data.get('id')}: {e}")
                    continue

            self.db.commit()
            logger.info(f"Successfully stored data for {stored_count} coins")
            return stored_count

        except Exception as e:
            logger.error(f"Error in fetch_and_store_top_coins: {e}")
            self.db.rollback()
            return 0

    def _store_cryptocurrency(self, coin_data: dict) -> Cryptocurrency:
        """Store or update cryptocurrency base information."""
        crypto = self.db.query(Cryptocurrency).filter_by(id=coin_data["id"]).first()

        if crypto:
            # Update existing
            crypto.symbol = coin_data["symbol"].upper()
            crypto.name = coin_data["name"]
            crypto.market_cap_rank = coin_data.get("market_cap_rank")
            crypto.image_url = coin_data.get("image")
            crypto.updated_at = datetime.utcnow()
        else:
            # Create new
            crypto = Cryptocurrency(
                id=coin_data["id"],
                symbol=coin_data["symbol"].upper(),
                name=coin_data["name"],
                market_cap_rank=coin_data.get("market_cap_rank"),
                image_url=coin_data.get("image"),
                is_active=True
            )
            self.db.add(crypto)

        return crypto

    def _store_price_data(self, crypto_id: str, coin_data: dict) -> PriceHistory:
        """Store current price data in history."""
        price_entry = PriceHistory(
            crypto_id=crypto_id,
            timestamp=datetime.utcnow(),
            price_usd=coin_data.get("current_price", 0),
            volume_24h=coin_data.get("total_volume"),
            market_cap=coin_data.get("market_cap"),
            price_change_24h=coin_data.get("price_change_24h"),
            price_change_percentage_24h=coin_data.get("price_change_percentage_24h"),
            price_change_percentage_7d=coin_data.get("price_change_percentage_7d_in_currency"),
            price_change_percentage_30d=coin_data.get("price_change_percentage_30d_in_currency"),
            data_source="coingecko"
        )
        self.db.add(price_entry)
        return price_entry

    def _store_market_metrics(self, crypto_id: str, coin_data: dict) -> MarketMetrics:
        """Store market metrics data."""
        metrics = MarketMetrics(
            crypto_id=crypto_id,
            timestamp=datetime.utcnow(),
            total_volume=coin_data.get("total_volume"),
            circulating_supply=coin_data.get("circulating_supply"),
            total_supply=coin_data.get("total_supply"),
            max_supply=coin_data.get("max_supply"),
            ath=coin_data.get("ath"),
            ath_date=datetime.fromisoformat(coin_data["ath_date"].replace("Z", "+00:00"))
            if coin_data.get("ath_date") else None,
            atl=coin_data.get("atl"),
            atl_date=datetime.fromisoformat(coin_data["atl_date"].replace("Z", "+00:00"))
            if coin_data.get("atl_date") else None,
        )
        self.db.add(metrics)
        return metrics

    def fetch_historical_data(self, crypto_id: str, days: int = 90) -> bool:
        """
        Fetch and store historical price data for a cryptocurrency.

        Args:
            crypto_id: Cryptocurrency ID
            days: Number of days of history to fetch

        Returns:
            True if successful, False otherwise
        """
        try:
            historical_data = self.client.get_coin_history(crypto_id, days=days)
            if not historical_data or "prices" not in historical_data:
                logger.warning(f"No historical data found for {crypto_id}")
                return False

            # Store each historical price point
            for timestamp_ms, price in historical_data["prices"]:
                timestamp = datetime.fromtimestamp(timestamp_ms / 1000)

                # Check if we already have this data point
                existing = self.db.query(PriceHistory).filter_by(
                    crypto_id=crypto_id,
                    timestamp=timestamp
                ).first()

                if not existing:
                    price_entry = PriceHistory(
                        crypto_id=crypto_id,
                        timestamp=timestamp,
                        price_usd=price,
                        data_source="coingecko"
                    )
                    self.db.add(price_entry)

            self.db.commit()
            logger.info(f"Stored historical data for {crypto_id}")
            return True

        except Exception as e:
            logger.error(f"Error fetching historical data for {crypto_id}: {e}")
            self.db.rollback()
            return False

    def get_price_history(
        self,
        crypto_id: str,
        days: int = 30
    ) -> List[PriceHistory]:
        """
        Retrieve price history from database.

        Args:
            crypto_id: Cryptocurrency ID
            days: Number of days to retrieve

        Returns:
            List of price history entries
        """
        from datetime import timedelta

        cutoff_date = datetime.utcnow() - timedelta(days=days)
        return (
            self.db.query(PriceHistory)
            .filter(
                PriceHistory.crypto_id == crypto_id,
                PriceHistory.timestamp >= cutoff_date
            )
            .order_by(PriceHistory.timestamp.asc())
            .all()
        )

    def get_latest_price(self, crypto_id: str) -> Optional[PriceHistory]:
        """
        Get the most recent price entry for a cryptocurrency.

        Args:
            crypto_id: Cryptocurrency ID

        Returns:
            Latest price history entry or None
        """
        return (
            self.db.query(PriceHistory)
            .filter(PriceHistory.crypto_id == crypto_id)
            .order_by(desc(PriceHistory.timestamp))
            .first()
        )
