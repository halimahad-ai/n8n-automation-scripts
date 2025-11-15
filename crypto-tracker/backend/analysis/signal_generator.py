"""Trading signal generation based on technical indicators."""
import logging
from typing import Dict, List, Tuple, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from models.database import TradingSignal, PriceHistory, MarketMetrics
from analysis.technical_indicators import TechnicalAnalyzer

logger = logging.getLogger(__name__)


class SignalGenerator:
    """Generate trading signals based on technical analysis."""

    # RSI thresholds
    RSI_OVERSOLD = 30
    RSI_OVERBOUGHT = 70

    # Score weights for different indicators
    WEIGHTS = {
        'rsi': 0.25,
        'macd': 0.25,
        'moving_averages': 0.20,
        'bollinger': 0.15,
        'volume': 0.15
    }

    def __init__(self, db: Session):
        """
        Initialize signal generator.

        Args:
            db: Database session
        """
        self.db = db

    def generate_signals(
        self,
        crypto_id: str,
        price_history: List[PriceHistory],
        timeframe: str = "short"
    ) -> Optional[TradingSignal]:
        """
        Generate trading signal for a cryptocurrency.

        Args:
            crypto_id: Cryptocurrency ID
            price_history: List of price history entries
            timeframe: 'short', 'medium', or 'long'

        Returns:
            TradingSignal object or None
        """
        if len(price_history) < 30:
            logger.warning(f"Insufficient price history for {crypto_id}")
            return None

        try:
            # Convert to list of dicts for analyzer
            price_data = [
                {
                    'timestamp': p.timestamp,
                    'price_usd': p.price_usd,
                    'volume_24h': p.volume_24h or 0
                }
                for p in price_history
            ]

            # Initialize technical analyzer
            analyzer = TechnicalAnalyzer(price_data)

            # Calculate all indicators
            indicators = analyzer.calculate_all_indicators()

            # Calculate individual scores
            rsi_score = self._score_rsi(indicators.get('rsi_14'))
            macd_score = self._score_macd(
                indicators.get('macd'),
                indicators.get('macd_signal'),
                indicators.get('macd_histogram')
            )
            ma_score = self._score_moving_averages(
                price_data[-1]['price_usd'],
                indicators.get('sma_20'),
                indicators.get('sma_50'),
                indicators.get('ema_20')
            )
            bb_score = self._score_bollinger_bands(
                price_data[-1]['price_usd'],
                indicators.get('bollinger_upper'),
                indicators.get('bollinger_middle'),
                indicators.get('bollinger_lower')
            )

            # Volume trend score
            volume_score = self._score_volume_trend(price_history)

            # Calculate weighted strength score
            strength_score = (
                rsi_score * self.WEIGHTS['rsi'] +
                macd_score * self.WEIGHTS['macd'] +
                ma_score * self.WEIGHTS['moving_averages'] +
                bb_score * self.WEIGHTS['bollinger'] +
                volume_score * self.WEIGHTS['volume']
            )

            # Determine signal type
            signal_type, confidence = self._determine_signal_type(strength_score)

            # Risk assessment
            volatility = analyzer.calculate_volatility()
            risk_assessment = self._assess_risk(volatility)

            # Support and resistance
            support, resistance = analyzer.detect_support_resistance()

            # Calculate target price and stop loss
            current_price = price_data[-1]['price_usd']
            target_price, stop_loss = self._calculate_targets(
                current_price,
                signal_type,
                support,
                resistance
            )

            # Generate reason
            reason = self._generate_reason(
                signal_type,
                rsi_score,
                macd_score,
                ma_score,
                bb_score,
                volume_score
            )

            # Create trading signal
            signal = TradingSignal(
                crypto_id=crypto_id,
                timestamp=datetime.utcnow(),
                signal_type=signal_type,
                timeframe=timeframe,
                strength_score=round(strength_score, 2),
                confidence_level=round(confidence, 2),
                indicator_scores={
                    'rsi': round(rsi_score, 2),
                    'macd': round(macd_score, 2),
                    'moving_averages': round(ma_score, 2),
                    'bollinger_bands': round(bb_score, 2),
                    'volume': round(volume_score, 2)
                },
                risk_assessment=risk_assessment,
                volatility_score=round(volatility, 2) if volatility else None,
                support_level=support,
                resistance_level=resistance,
                target_price=target_price,
                stop_loss=stop_loss,
                reason=reason,
                is_active=True
            )

            return signal

        except Exception as e:
            logger.error(f"Error generating signal for {crypto_id}: {e}")
            return None

    def _score_rsi(self, rsi: Optional[float]) -> float:
        """
        Score based on RSI value.

        Returns:
            Score from -100 (oversold, buy) to +100 (overbought, sell)
        """
        if rsi is None:
            return 0.0

        if rsi <= self.RSI_OVERSOLD:
            # Oversold - strong buy signal
            return -100 + (rsi / self.RSI_OVERSOLD * 50)
        elif rsi >= self.RSI_OVERBOUGHT:
            # Overbought - strong sell signal
            return 50 + ((rsi - self.RSI_OVERBOUGHT) / (100 - self.RSI_OVERBOUGHT) * 50)
        else:
            # Neutral zone - scale from -50 to +50
            return ((rsi - self.RSI_OVERSOLD) / (self.RSI_OVERBOUGHT - self.RSI_OVERSOLD) - 0.5) * 100

    def _score_macd(
        self,
        macd: Optional[float],
        signal: Optional[float],
        histogram: Optional[float]
    ) -> float:
        """Score based on MACD indicator."""
        if macd is None or signal is None or histogram is None:
            return 0.0

        # Histogram positive = bullish, negative = bearish
        if histogram > 0:
            # Bullish - buy signal
            return -50 - min(abs(histogram) * 10, 50)
        else:
            # Bearish - sell signal
            return 50 + min(abs(histogram) * 10, 50)

    def _score_moving_averages(
        self,
        current_price: float,
        sma_20: Optional[float],
        sma_50: Optional[float],
        ema_20: Optional[float]
    ) -> float:
        """Score based on moving average positions."""
        if not all([sma_20, sma_50, ema_20]):
            return 0.0

        score = 0.0

        # Price above SMA20 is bullish
        if current_price > sma_20:
            score -= 30
        else:
            score += 30

        # SMA20 above SMA50 is bullish (golden cross)
        if sma_20 > sma_50:
            score -= 40
        else:
            score += 40

        # Price above EMA20 is bullish
        if current_price > ema_20:
            score -= 30
        else:
            score += 30

        return score

    def _score_bollinger_bands(
        self,
        current_price: float,
        upper: Optional[float],
        middle: Optional[float],
        lower: Optional[float]
    ) -> float:
        """Score based on Bollinger Bands position."""
        if not all([upper, middle, lower]):
            return 0.0

        # Calculate position within bands
        band_width = upper - lower
        if band_width == 0:
            return 0.0

        position = (current_price - lower) / band_width

        # Near lower band (< 0.2) = oversold = buy signal
        if position < 0.2:
            return -80
        # Near upper band (> 0.8) = overbought = sell signal
        elif position > 0.8:
            return 80
        # In middle range
        else:
            return (position - 0.5) * 100

    def _score_volume_trend(self, price_history: List[PriceHistory]) -> float:
        """Score based on volume trends."""
        if len(price_history) < 10:
            return 0.0

        try:
            # Get recent volumes
            recent_volumes = [p.volume_24h for p in price_history[-10:] if p.volume_24h]

            if len(recent_volumes) < 5:
                return 0.0

            # Calculate volume trend
            recent_avg = sum(recent_volumes[-3:]) / 3
            older_avg = sum(recent_volumes[:3]) / 3

            if older_avg == 0:
                return 0.0

            volume_change = ((recent_avg - older_avg) / older_avg) * 100

            # Increasing volume with price increase = bullish
            price_change = ((price_history[-1].price_usd - price_history[-10].price_usd) /
                           price_history[-10].price_usd) * 100

            if volume_change > 20 and price_change > 0:
                return -50  # Buy signal
            elif volume_change > 20 and price_change < 0:
                return 50  # Sell signal (high volume decline)
            else:
                return volume_change * -0.5  # Gentle weight

        except Exception as e:
            logger.error(f"Error scoring volume trend: {e}")
            return 0.0

    def _determine_signal_type(self, strength_score: float) -> Tuple[str, float]:
        """
        Determine signal type and confidence based on strength score.

        Args:
            strength_score: Combined strength score (-100 to +100)

        Returns:
            Tuple of (signal_type, confidence_level)
        """
        abs_score = abs(strength_score)

        # Determine signal type
        if strength_score < -30:
            signal_type = "BUY"
        elif strength_score > 30:
            signal_type = "SELL"
        else:
            signal_type = "HOLD"

        # Calculate confidence (0-100)
        if signal_type == "HOLD":
            confidence = 100 - abs_score  # More neutral = higher confidence in HOLD
        else:
            confidence = min(abs_score, 100)  # Stronger signal = higher confidence

        return signal_type, confidence

    def _assess_risk(self, volatility: Optional[float]) -> str:
        """Assess risk level based on volatility."""
        if volatility is None:
            return "medium"

        if volatility < 30:
            return "low"
        elif volatility < 60:
            return "medium"
        else:
            return "high"

    def _calculate_targets(
        self,
        current_price: float,
        signal_type: str,
        support: Optional[float],
        resistance: Optional[float]
    ) -> Tuple[Optional[float], Optional[float]]:
        """Calculate target price and stop loss."""
        if signal_type == "BUY":
            target_price = resistance if resistance else current_price * 1.1
            stop_loss = support if support else current_price * 0.95
        elif signal_type == "SELL":
            target_price = support if support else current_price * 0.9
            stop_loss = resistance if resistance else current_price * 1.05
        else:
            target_price = None
            stop_loss = None

        return target_price, stop_loss

    def _generate_reason(
        self,
        signal_type: str,
        rsi_score: float,
        macd_score: float,
        ma_score: float,
        bb_score: float,
        volume_score: float
    ) -> str:
        """Generate human-readable explanation for the signal."""
        reasons = []

        # RSI analysis
        if abs(rsi_score) > 50:
            if rsi_score < 0:
                reasons.append("RSI indicates oversold conditions")
            else:
                reasons.append("RSI indicates overbought conditions")

        # MACD analysis
        if abs(macd_score) > 50:
            if macd_score < 0:
                reasons.append("MACD shows bullish momentum")
            else:
                reasons.append("MACD shows bearish momentum")

        # Moving averages
        if abs(ma_score) > 50:
            if ma_score < 0:
                reasons.append("Price above key moving averages")
            else:
                reasons.append("Price below key moving averages")

        # Bollinger Bands
        if abs(bb_score) > 60:
            if bb_score < 0:
                reasons.append("Price near lower Bollinger Band")
            else:
                reasons.append("Price near upper Bollinger Band")

        if not reasons:
            reasons.append("Mixed signals from technical indicators")

        return "; ".join(reasons) + f". Recommendation: {signal_type}"
