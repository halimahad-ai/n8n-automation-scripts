"""Tests for signal generator."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock
from analysis.signal_generator import SignalGenerator
from models.database import PriceHistory


@pytest.fixture
def mock_db():
    """Create a mock database session."""
    return Mock()


@pytest.fixture
def sample_price_history():
    """Generate sample price history."""
    data = []
    base_price = 50000.0

    for i in range(90):
        timestamp = datetime.utcnow() - timedelta(days=90-i)
        # Create an upward trend
        price = base_price + (i * 100) + (i % 10) * 50

        price_entry = PriceHistory(
            id=i,
            crypto_id='bitcoin',
            timestamp=timestamp,
            price_usd=price,
            volume_24h=1000000000 + (i * 1000000)
        )
        data.append(price_entry)

    return data


def test_signal_generator_initialization(mock_db):
    """Test signal generator initialization."""
    generator = SignalGenerator(mock_db)
    assert generator.db == mock_db


def test_rsi_scoring():
    """Test RSI scoring logic."""
    generator = SignalGenerator(Mock())

    # Oversold condition (RSI = 25)
    score = generator._score_rsi(25)
    assert score < 0  # Should indicate buy

    # Overbought condition (RSI = 75)
    score = generator._score_rsi(75)
    assert score > 0  # Should indicate sell

    # Neutral (RSI = 50)
    score = generator._score_rsi(50)
    assert abs(score) < 20  # Should be relatively neutral


def test_signal_type_determination():
    """Test signal type determination."""
    generator = SignalGenerator(Mock())

    # Strong buy signal
    signal_type, confidence = generator._determine_signal_type(-60)
    assert signal_type == "BUY"
    assert confidence > 50

    # Strong sell signal
    signal_type, confidence = generator._determine_signal_type(60)
    assert signal_type == "SELL"
    assert confidence > 50

    # Hold signal
    signal_type, confidence = generator._determine_signal_type(10)
    assert signal_type == "HOLD"


def test_risk_assessment():
    """Test risk assessment."""
    generator = SignalGenerator(Mock())

    assert generator._assess_risk(20) == "low"
    assert generator._assess_risk(45) == "medium"
    assert generator._assess_risk(75) == "high"
    assert generator._assess_risk(None) == "medium"


def test_generate_signals(mock_db, sample_price_history):
    """Test signal generation."""
    generator = SignalGenerator(mock_db)

    signal = generator.generate_signals(
        'bitcoin',
        sample_price_history,
        timeframe='short'
    )

    assert signal is not None
    assert signal.crypto_id == 'bitcoin'
    assert signal.signal_type in ['BUY', 'SELL', 'HOLD']
    assert 0 <= signal.strength_score <= 100 or -100 <= signal.strength_score <= 0
    assert 0 <= signal.confidence_level <= 100
    assert signal.timeframe == 'short'
    assert signal.risk_assessment in ['low', 'medium', 'high']
    assert signal.reason is not None


def test_generate_signals_insufficient_data(mock_db):
    """Test signal generation with insufficient data."""
    generator = SignalGenerator(mock_db)

    # Only 10 days of data
    short_history = [
        PriceHistory(
            id=i,
            crypto_id='bitcoin',
            timestamp=datetime.utcnow() - timedelta(days=10-i),
            price_usd=50000 + i * 100,
            volume_24h=1000000000
        )
        for i in range(10)
    ]

    signal = generator.generate_signals('bitcoin', short_history)

    # Should return None with insufficient data
    assert signal is None


def test_moving_average_scoring():
    """Test moving average scoring."""
    generator = SignalGenerator(Mock())

    # Bullish scenario
    score = generator._score_moving_averages(
        current_price=110,
        sma_20=100,
        sma_50=90,
        ema_20=95
    )
    assert score < 0  # Bullish = negative score (buy)

    # Bearish scenario
    score = generator._score_moving_averages(
        current_price=90,
        sma_20=100,
        sma_50=110,
        ema_20=105
    )
    assert score > 0  # Bearish = positive score (sell)
