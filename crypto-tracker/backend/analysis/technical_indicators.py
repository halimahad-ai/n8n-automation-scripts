"""Technical analysis indicators for cryptocurrency price data."""
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
import logging

logger = logging.getLogger(__name__)


class TechnicalAnalyzer:
    """Calculate technical indicators for cryptocurrency price analysis."""

    def __init__(self, price_data: List[Dict]):
        """
        Initialize technical analyzer with price data.

        Args:
            price_data: List of price dictionaries with 'timestamp' and 'price' keys
        """
        self.df = self._prepare_dataframe(price_data)

    def _prepare_dataframe(self, price_data: List[Dict]) -> pd.DataFrame:
        """
        Convert price data to pandas DataFrame.

        Args:
            price_data: List of price dictionaries

        Returns:
            DataFrame with datetime index and OHLCV columns
        """
        if not price_data:
            return pd.DataFrame()

        df = pd.DataFrame(price_data)

        # If we have timestamp and price_usd, use those
        if 'timestamp' in df.columns and 'price_usd' in df.columns:
            df['date'] = pd.to_datetime(df['timestamp'])
            df = df.set_index('date')
            df = df.sort_index()

            # For simplicity, treat price as close and approximate OHLC
            df['close'] = df['price_usd']
            df['open'] = df['close']
            df['high'] = df['close']
            df['low'] = df['close']
            df['volume'] = df.get('volume_24h', 0)

        return df

    def calculate_rsi(self, period: int = 14) -> Optional[float]:
        """
        Calculate Relative Strength Index (RSI).

        Args:
            period: RSI period (default: 14)

        Returns:
            Current RSI value or None if insufficient data
        """
        if len(self.df) < period + 1:
            return None

        try:
            # Calculate price changes
            delta = self.df['close'].diff()

            # Separate gains and losses
            gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()

            # Calculate RS and RSI
            rs = gain / loss
            rsi = 100 - (100 / (1 + rs))

            return float(rsi.iloc[-1])
        except Exception as e:
            logger.error(f"Error calculating RSI: {e}")
            return None

    def calculate_sma(self, period: int = 20) -> Optional[float]:
        """
        Calculate Simple Moving Average (SMA).

        Args:
            period: SMA period (default: 20)

        Returns:
            Current SMA value or None if insufficient data
        """
        if len(self.df) < period:
            return None

        try:
            sma = self.df['close'].rolling(window=period).mean()
            return float(sma.iloc[-1])
        except Exception as e:
            logger.error(f"Error calculating SMA: {e}")
            return None

    def calculate_ema(self, period: int = 20) -> Optional[float]:
        """
        Calculate Exponential Moving Average (EMA).

        Args:
            period: EMA period (default: 20)

        Returns:
            Current EMA value or None if insufficient data
        """
        if len(self.df) < period:
            return None

        try:
            ema = self.df['close'].ewm(span=period, adjust=False).mean()
            return float(ema.iloc[-1])
        except Exception as e:
            logger.error(f"Error calculating EMA: {e}")
            return None

    def calculate_macd(
        self,
        fast_period: int = 12,
        slow_period: int = 26,
        signal_period: int = 9
    ) -> Optional[Tuple[float, float, float]]:
        """
        Calculate MACD (Moving Average Convergence Divergence).

        Args:
            fast_period: Fast EMA period (default: 12)
            slow_period: Slow EMA period (default: 26)
            signal_period: Signal line period (default: 9)

        Returns:
            Tuple of (MACD line, Signal line, Histogram) or None if insufficient data
        """
        if len(self.df) < slow_period + signal_period:
            return None

        try:
            # Calculate EMAs
            ema_fast = self.df['close'].ewm(span=fast_period, adjust=False).mean()
            ema_slow = self.df['close'].ewm(span=slow_period, adjust=False).mean()

            # MACD line
            macd_line = ema_fast - ema_slow

            # Signal line
            signal_line = macd_line.ewm(span=signal_period, adjust=False).mean()

            # Histogram
            histogram = macd_line - signal_line

            return (
                float(macd_line.iloc[-1]),
                float(signal_line.iloc[-1]),
                float(histogram.iloc[-1])
            )
        except Exception as e:
            logger.error(f"Error calculating MACD: {e}")
            return None

    def calculate_bollinger_bands(
        self,
        period: int = 20,
        std_dev: float = 2.0
    ) -> Optional[Tuple[float, float, float]]:
        """
        Calculate Bollinger Bands.

        Args:
            period: Moving average period (default: 20)
            std_dev: Number of standard deviations (default: 2.0)

        Returns:
            Tuple of (Upper band, Middle band, Lower band) or None if insufficient data
        """
        if len(self.df) < period:
            return None

        try:
            # Middle band (SMA)
            middle_band = self.df['close'].rolling(window=period).mean()

            # Standard deviation
            std = self.df['close'].rolling(window=period).std()

            # Upper and lower bands
            upper_band = middle_band + (std * std_dev)
            lower_band = middle_band - (std * std_dev)

            return (
                float(upper_band.iloc[-1]),
                float(middle_band.iloc[-1]),
                float(lower_band.iloc[-1])
            )
        except Exception as e:
            logger.error(f"Error calculating Bollinger Bands: {e}")
            return None

    def calculate_vwap(self) -> Optional[float]:
        """
        Calculate Volume Weighted Average Price (VWAP).

        Returns:
            VWAP value or None if insufficient data
        """
        if len(self.df) < 1 or 'volume' not in self.df.columns:
            return None

        try:
            # Typical price
            typical_price = (self.df['high'] + self.df['low'] + self.df['close']) / 3

            # VWAP calculation
            vwap = (typical_price * self.df['volume']).cumsum() / self.df['volume'].cumsum()

            return float(vwap.iloc[-1])
        except Exception as e:
            logger.error(f"Error calculating VWAP: {e}")
            return None

    def calculate_all_indicators(self) -> Dict[str, Optional[float]]:
        """
        Calculate all technical indicators.

        Returns:
            Dictionary of indicator names and values
        """
        indicators = {
            'rsi_14': self.calculate_rsi(14),
            'sma_20': self.calculate_sma(20),
            'sma_50': self.calculate_sma(50),
            'sma_200': self.calculate_sma(200),
            'ema_20': self.calculate_ema(20),
            'ema_50': self.calculate_ema(50),
            'vwap': self.calculate_vwap(),
        }

        # MACD
        macd_result = self.calculate_macd()
        if macd_result:
            indicators['macd'] = macd_result[0]
            indicators['macd_signal'] = macd_result[1]
            indicators['macd_histogram'] = macd_result[2]
        else:
            indicators['macd'] = None
            indicators['macd_signal'] = None
            indicators['macd_histogram'] = None

        # Bollinger Bands
        bb_result = self.calculate_bollinger_bands()
        if bb_result:
            indicators['bollinger_upper'] = bb_result[0]
            indicators['bollinger_middle'] = bb_result[1]
            indicators['bollinger_lower'] = bb_result[2]
        else:
            indicators['bollinger_upper'] = None
            indicators['bollinger_middle'] = None
            indicators['bollinger_lower'] = None

        return indicators

    def detect_support_resistance(self) -> Tuple[Optional[float], Optional[float]]:
        """
        Detect support and resistance levels using local minima and maxima.

        Returns:
            Tuple of (support_level, resistance_level)
        """
        if len(self.df) < 20:
            return None, None

        try:
            # Get recent price data (last 30 days)
            recent_prices = self.df['close'].tail(30)
            current_price = float(recent_prices.iloc[-1])

            # Find local minima (support) and maxima (resistance)
            window = 5
            local_max = recent_prices.rolling(window=window, center=True).max()
            local_min = recent_prices.rolling(window=window, center=True).min()

            # Resistance: nearest local maximum above current price
            resistance_candidates = local_max[local_max > current_price]
            resistance = float(resistance_candidates.min()) if len(resistance_candidates) > 0 else current_price * 1.1

            # Support: nearest local minimum below current price
            support_candidates = local_min[local_min < current_price]
            support = float(support_candidates.max()) if len(support_candidates) > 0 else current_price * 0.9

            return support, resistance

        except Exception as e:
            logger.error(f"Error detecting support/resistance: {e}")
            return None, None

    def calculate_volatility(self, period: int = 30) -> Optional[float]:
        """
        Calculate price volatility (standard deviation of returns).

        Args:
            period: Period for volatility calculation

        Returns:
            Volatility score (0-100) or None
        """
        if len(self.df) < period:
            return None

        try:
            # Calculate daily returns
            returns = self.df['close'].pct_change()

            # Calculate standard deviation
            volatility = returns.tail(period).std()

            # Normalize to 0-100 scale (multiply by 100 for percentage, cap at 100)
            volatility_score = min(volatility * 100 * 10, 100)  # Scale factor of 10

            return float(volatility_score)

        except Exception as e:
            logger.error(f"Error calculating volatility: {e}")
            return None
