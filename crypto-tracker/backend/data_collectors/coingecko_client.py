"""CoinGecko API client for fetching cryptocurrency data."""
import requests
import time
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class CoinGeckoClient:
    """Client for interacting with the CoinGecko API."""

    BASE_URL = "https://api.coingecko.com/api/v3"

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize CoinGecko client.

        Args:
            api_key: Optional API key for pro tier (free tier works without key)
        """
        self.api_key = api_key
        self.session = requests.Session()
        if api_key:
            self.session.headers.update({"x-cg-pro-api-key": api_key})

    def _make_request(self, endpoint: str, params: Optional[Dict] = None) -> Dict:
        """
        Make a request to the CoinGecko API with error handling and rate limiting.

        Args:
            endpoint: API endpoint path
            params: Query parameters

        Returns:
            JSON response as dictionary
        """
        url = f"{self.BASE_URL}/{endpoint}"
        try:
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()

            # Respect rate limits (free tier: 10-30 calls/minute)
            time.sleep(2)  # Simple rate limiting

            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching data from CoinGecko: {e}")
            raise

    def get_top_coins(self, limit: int = 50, currency: str = "usd") -> List[Dict]:
        """
        Fetch top cryptocurrencies by market cap.

        Args:
            limit: Number of coins to fetch (max 250)
            currency: Currency for price data (default: usd)

        Returns:
            List of cryptocurrency data dictionaries
        """
        params = {
            "vs_currency": currency,
            "order": "market_cap_desc",
            "per_page": limit,
            "page": 1,
            "sparkline": False,
            "price_change_percentage": "24h,7d,30d"
        }

        try:
            data = self._make_request("coins/markets", params)
            logger.info(f"Fetched {len(data)} coins from CoinGecko")
            return data
        except Exception as e:
            logger.error(f"Failed to fetch top coins: {e}")
            return []

    def get_coin_details(self, coin_id: str) -> Optional[Dict]:
        """
        Fetch detailed information for a specific cryptocurrency.

        Args:
            coin_id: CoinGecko coin ID (e.g., 'bitcoin')

        Returns:
            Detailed coin data dictionary or None if error
        """
        try:
            params = {
                "localization": False,
                "tickers": False,
                "market_data": True,
                "community_data": False,
                "developer_data": False
            }
            data = self._make_request(f"coins/{coin_id}", params)
            return data
        except Exception as e:
            logger.error(f"Failed to fetch details for {coin_id}: {e}")
            return None

    def get_coin_history(
        self,
        coin_id: str,
        days: int = 90,
        currency: str = "usd"
    ) -> Optional[Dict]:
        """
        Fetch historical market data for a cryptocurrency.

        Args:
            coin_id: CoinGecko coin ID
            days: Number of days of history (1, 7, 14, 30, 90, 180, 365, max)
            currency: Currency for price data

        Returns:
            Historical price data or None if error
        """
        try:
            params = {
                "vs_currency": currency,
                "days": days,
                "interval": "daily" if days > 1 else "hourly"
            }
            data = self._make_request(f"coins/{coin_id}/market_chart", params)
            return data
        except Exception as e:
            logger.error(f"Failed to fetch history for {coin_id}: {e}")
            return None

    def get_coin_ohlc(self, coin_id: str, days: int = 90, currency: str = "usd") -> Optional[List]:
        """
        Fetch OHLC (Open, High, Low, Close) data for charting.

        Args:
            coin_id: CoinGecko coin ID
            days: Number of days (1, 7, 14, 30, 90, 180, 365)
            currency: Currency for price data

        Returns:
            OHLC data as list of [timestamp, open, high, low, close]
        """
        try:
            params = {"vs_currency": currency, "days": days}
            data = self._make_request(f"coins/{coin_id}/ohlc", params)
            return data
        except Exception as e:
            logger.error(f"Failed to fetch OHLC for {coin_id}: {e}")
            return None

    def get_global_market_data(self) -> Optional[Dict]:
        """
        Fetch global cryptocurrency market data.

        Returns:
            Global market statistics or None if error
        """
        try:
            data = self._make_request("global")
            return data.get("data", {})
        except Exception as e:
            logger.error(f"Failed to fetch global market data: {e}")
            return None

    def search_coins(self, query: str) -> List[Dict]:
        """
        Search for cryptocurrencies by name or symbol.

        Args:
            query: Search query

        Returns:
            List of matching coins
        """
        try:
            data = self._make_request("search", {"query": query})
            return data.get("coins", [])
        except Exception as e:
            logger.error(f"Failed to search for coins: {e}")
            return []

    def ping(self) -> bool:
        """
        Check if the CoinGecko API is accessible.

        Returns:
            True if API is accessible, False otherwise
        """
        try:
            self._make_request("ping")
            return True
        except Exception:
            return False
