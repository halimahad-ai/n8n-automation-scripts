"""Tests for technical indicators."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

import pytest
from datetime import datetime, timedelta
from analysis.technical_indicators import TechnicalAnalyzer


@pytest.fixture
def sample_price_data():
    """Generate sample price data for testing."""
    base_price = 100.0
    data = []

    for i in range(100):
        timestamp = datetime.utcnow() - timedelta(days=100-i)
        price = base_price + (i % 10) - 5  # Oscillating price
        data.append({
            'timestamp': timestamp,
            'price_usd': price,
            'volume_24h': 1000000 + (i * 10000)
        })

    return data


def test_rsi_calculation(sample_price_data):
    """Test RSI calculation."""
    analyzer = TechnicalAnalyzer(sample_price_data)
    rsi = analyzer.calculate_rsi(period=14)

    assert rsi is not None
    assert 0 <= rsi <= 100


def test_sma_calculation(sample_price_data):
    """Test SMA calculation."""
    analyzer = TechnicalAnalyzer(sample_price_data)
    sma = analyzer.calculate_sma(period=20)

    assert sma is not None
    assert sma > 0


def test_ema_calculation(sample_price_data):
    """Test EMA calculation."""
    analyzer = TechnicalAnalyzer(sample_price_data)
    ema = analyzer.calculate_ema(period=20)

    assert ema is not None
    assert ema > 0


def test_macd_calculation(sample_price_data):
    """Test MACD calculation."""
    analyzer = TechnicalAnalyzer(sample_price_data)
    macd_result = analyzer.calculate_macd()

    assert macd_result is not None
    assert len(macd_result) == 3
    macd_line, signal_line, histogram = macd_result
    assert all(x is not None for x in macd_result)


def test_bollinger_bands(sample_price_data):
    """Test Bollinger Bands calculation."""
    analyzer = TechnicalAnalyzer(sample_price_data)
    bb_result = analyzer.calculate_bollinger_bands()

    assert bb_result is not None
    assert len(bb_result) == 3
    upper, middle, lower = bb_result
    assert upper > middle > lower


def test_all_indicators(sample_price_data):
    """Test calculating all indicators at once."""
    analyzer = TechnicalAnalyzer(sample_price_data)
    indicators = analyzer.calculate_all_indicators()

    assert isinstance(indicators, dict)
    assert 'rsi_14' in indicators
    assert 'sma_20' in indicators
    assert 'macd' in indicators


def test_support_resistance_detection(sample_price_data):
    """Test support and resistance detection."""
    analyzer = TechnicalAnalyzer(sample_price_data)
    support, resistance = analyzer.detect_support_resistance()

    assert support is not None
    assert resistance is not None
    assert resistance > support


def test_volatility_calculation(sample_price_data):
    """Test volatility calculation."""
    analyzer = TechnicalAnalyzer(sample_price_data)
    volatility = analyzer.calculate_volatility()

    assert volatility is not None
    assert 0 <= volatility <= 100


def test_insufficient_data():
    """Test behavior with insufficient data."""
    short_data = [
        {'timestamp': datetime.utcnow(), 'price_usd': 100, 'volume_24h': 1000}
        for _ in range(5)
    ]

    analyzer = TechnicalAnalyzer(short_data)
    rsi = analyzer.calculate_rsi(period=14)

    # Should return None with insufficient data
    assert rsi is None
