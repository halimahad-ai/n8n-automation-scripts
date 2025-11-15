// Configuration
const API_BASE_URL = 'http://localhost:8000/api/v1';

// State
let allCryptos = [];
let allSignals = [];
let currentSort = 'rank';
let searchQuery = '';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadDashboard();
});

// Event Listeners
function initializeEventListeners() {
    document.getElementById('refreshBtn').addEventListener('click', loadDashboard);
    document.getElementById('fetchBtn').addEventListener('click', fetchLatestData);
    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        filterAndDisplayCryptos();
    });
    document.getElementById('sortSelect').addEventListener('change', (e) => {
        currentSort = e.target.value;
        filterAndDisplayCryptos();
    });

    // Modal close
    document.querySelector('.close').addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('detailModal');
        if (e.target === modal) {
            closeModal();
        }
    });
}

// API Calls
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        showError(`Failed to ${endpoint}: ${error.message}`);
        return null;
    }
}

async function fetchLatestData() {
    showLoading('Fetching latest data from CoinGecko...');
    const result = await apiCall('/data/fetch', { method: 'POST' });
    if (result) {
        showSuccess(`Successfully updated ${result.coins_updated} cryptocurrencies`);
        setTimeout(loadDashboard, 2000);
    }
}

async function loadDashboard() {
    showLoading('Loading dashboard...');

    // Load all data in parallel
    const [cryptos, dashboard, signals] = await Promise.all([
        apiCall('/cryptocurrencies?limit=100'),
        apiCall('/dashboard'),
        loadRecentSignals()
    ]);

    if (cryptos) {
        allCryptos = cryptos;
        filterAndDisplayCryptos();
    }

    if (dashboard) {
        displayDashboardStats(dashboard);
        displayTopMovers(dashboard.top_gainers, 'gainersContainer');
        displayTopMovers(dashboard.top_losers, 'losersContainer');
        displaySignals(dashboard.recent_signals);
    }

    hideLoading();
}

async function loadRecentSignals() {
    // Get signals for top 20 cryptos
    const signals = [];
    for (let i = 0; i < Math.min(allCryptos.length, 20); i++) {
        const cryptoSignals = await apiCall(`/cryptocurrencies/${allCryptos[i].id}/signals?limit=1`);
        if (cryptoSignals && cryptoSignals.length > 0) {
            signals.push(...cryptoSignals);
        }
    }
    return signals;
}

async function loadCryptoDetails(cryptoId) {
    showLoading('Loading details...');

    const [crypto, priceHistory, signals, metrics] = await Promise.all([
        apiCall(`/cryptocurrencies/${cryptoId}`),
        apiCall(`/cryptocurrencies/${cryptoId}/price-history?days=30`),
        apiCall(`/cryptocurrencies/${cryptoId}/signals?limit=5`),
        apiCall(`/cryptocurrencies/${cryptoId}/metrics`)
    ]);

    hideLoading();

    if (crypto) {
        displayCryptoModal(crypto, priceHistory, signals, metrics);
    }
}

async function generateSignal(cryptoId) {
    showLoading('Generating trading signal...');

    const signal = await apiCall(`/cryptocurrencies/${cryptoId}/generate-signal`, {
        method: 'POST',
        body: JSON.stringify({ timeframe: 'short' })
    });

    hideLoading();

    if (signal) {
        showSuccess('Signal generated successfully!');
        loadCryptoDetails(cryptoId);
    }
}

// Display Functions
function displayDashboardStats(dashboard) {
    const totalTracked = allCryptos.length;
    const activeSignals = dashboard.recent_signals.filter(s => s.is_active).length;
    const buySignals = dashboard.recent_signals.filter(s => s.signal_type === 'BUY').length;
    const sellSignals = dashboard.recent_signals.filter(s => s.signal_type === 'SELL').length;

    document.getElementById('totalTracked').textContent = totalTracked;
    document.getElementById('activeSignals').textContent = activeSignals;
    document.getElementById('buySignals').textContent = buySignals;
    document.getElementById('sellSignals').textContent = sellSignals;
}

function displayTopMovers(movers, containerId) {
    const container = document.getElementById(containerId);

    if (!movers || movers.length === 0) {
        container.innerHTML = '<div class="loading">No data available</div>';
        return;
    }

    container.innerHTML = movers.map(item => {
        const crypto = item.cryptocurrency;
        const price = item.latest_price;
        const change = price.price_change_percentage_24h || 0;
        const isPositive = change >= 0;

        return `
            <div class="crypto-card ${isPositive ? 'positive' : 'negative'}" onclick="loadCryptoDetails('${crypto.id}')">
                <div class="crypto-header">
                    ${crypto.image_url ? `<img src="${crypto.image_url}" alt="${crypto.name}" class="crypto-icon">` : ''}
                    <div class="crypto-info">
                        <h3>${crypto.name}</h3>
                        <div class="crypto-symbol">${crypto.symbol}</div>
                    </div>
                </div>
                <div class="crypto-price">$${formatPrice(price.price_usd)}</div>
                <div class="crypto-change ${isPositive ? 'positive' : 'negative'}">
                    ${isPositive ? '↑' : '↓'} ${Math.abs(change).toFixed(2)}%
                </div>
            </div>
        `;
    }).join('');
}

function filterAndDisplayCryptos() {
    let filtered = allCryptos.filter(crypto =>
        crypto.name.toLowerCase().includes(searchQuery) ||
        crypto.symbol.toLowerCase().includes(searchQuery)
    );

    // Sort
    filtered = sortCryptos(filtered, currentSort);

    displayCryptoList(filtered);
}

function sortCryptos(cryptos, sortType) {
    switch (sortType) {
        case 'rank':
            return cryptos.sort((a, b) => (a.market_cap_rank || 999) - (b.market_cap_rank || 999));
        case 'price_asc':
            return cryptos.sort((a, b) => a.current_price - b.current_price);
        case 'price_desc':
            return cryptos.sort((a, b) => b.current_price - a.current_price);
        default:
            return cryptos;
    }
}

function displayCryptoList(cryptos) {
    const container = document.getElementById('cryptoList');

    if (cryptos.length === 0) {
        container.innerHTML = '<div class="loading">No cryptocurrencies found</div>';
        return;
    }

    container.innerHTML = cryptos.map(crypto => `
        <div class="crypto-item" onclick="loadCryptoDetails('${crypto.id}')">
            <div class="crypto-rank">#${crypto.market_cap_rank || '-'}</div>
            <div class="crypto-name-section">
                ${crypto.image_url ? `<img src="${crypto.image_url}" alt="${crypto.name}" class="crypto-icon">` : ''}
                <div>
                    <h3>${crypto.name}</h3>
                    <div class="crypto-symbol">${crypto.symbol}</div>
                </div>
            </div>
        </div>
    `).join('');
}

function displaySignals(signals) {
    const container = document.getElementById('signalsContainer');

    if (!signals || signals.length === 0) {
        container.innerHTML = '<div class="loading">No signals available</div>';
        return;
    }

    container.innerHTML = signals.slice(0, 12).map(signal => `
        <div class="signal-card ${signal.signal_type}">
            <div class="signal-header">
                <div class="signal-type ${signal.signal_type}">${signal.signal_type}</div>
                <div class="signal-strength">${signal.strength_score.toFixed(0)}</div>
            </div>
            <div class="signal-crypto">${signal.crypto_id}</div>
            <div class="signal-reason">${signal.reason}</div>
            <div class="signal-meta">
                <span>Confidence: ${signal.confidence_level.toFixed(0)}%</span>
                <span>Risk: ${signal.risk_assessment}</span>
                <span>${signal.timeframe}</span>
            </div>
        </div>
    `).join('');
}

function displayCryptoModal(crypto, priceHistory, signals, metrics) {
    const latestPrice = priceHistory && priceHistory.length > 0 ? priceHistory[priceHistory.length - 1] : null;
    const latestSignal = signals && signals.length > 0 ? signals[0] : null;

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h2>${crypto.name} (${crypto.symbol})</h2>
        <div class="crypto-details-grid">
            ${latestPrice ? `
                <div class="detail-section">
                    <h3>Current Price</h3>
                    <div class="detail-value">$${formatPrice(latestPrice.price_usd)}</div>
                    ${latestPrice.price_change_percentage_24h ? `
                        <div class="crypto-change ${latestPrice.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}">
                            ${latestPrice.price_change_percentage_24h >= 0 ? '↑' : '↓'}
                            ${Math.abs(latestPrice.price_change_percentage_24h).toFixed(2)}% (24h)
                        </div>
                    ` : ''}
                </div>
            ` : ''}

            ${metrics ? `
                <div class="detail-section">
                    <h3>Technical Indicators</h3>
                    ${metrics.rsi_14 ? `<p>RSI (14): ${metrics.rsi_14.toFixed(2)}</p>` : ''}
                    ${metrics.macd ? `<p>MACD: ${metrics.macd.toFixed(2)}</p>` : ''}
                    ${metrics.sma_20 ? `<p>SMA (20): $${formatPrice(metrics.sma_20)}</p>` : ''}
                    ${metrics.sma_50 ? `<p>SMA (50): $${formatPrice(metrics.sma_50)}</p>` : ''}
                </div>
            ` : ''}

            ${latestSignal ? `
                <div class="detail-section">
                    <h3>Latest Signal</h3>
                    <div class="signal-type ${latestSignal.signal_type}">${latestSignal.signal_type}</div>
                    <p>Strength: ${latestSignal.strength_score.toFixed(0)}/100</p>
                    <p>Confidence: ${latestSignal.confidence_level.toFixed(0)}%</p>
                    <p>Risk: ${latestSignal.risk_assessment}</p>
                    <p class="signal-reason">${latestSignal.reason}</p>
                </div>
            ` : ''}
        </div>

        <div style="margin-top: 20px;">
            <button class="btn btn-primary" onclick="generateSignal('${crypto.id}')">
                Generate New Signal
            </button>
        </div>

        ${priceHistory && priceHistory.length > 0 ? `
            <div class="chart-container">
                <canvas id="priceChart"></canvas>
            </div>
        ` : ''}
    `;

    // Draw price chart
    if (priceHistory && priceHistory.length > 0) {
        setTimeout(() => drawPriceChart(priceHistory), 100);
    }

    document.getElementById('detailModal').style.display = 'block';
}

function drawPriceChart(priceHistory) {
    const ctx = document.getElementById('priceChart');
    if (!ctx) return;

    const labels = priceHistory.map(p => new Date(p.timestamp).toLocaleDateString());
    const prices = priceHistory.map(p => p.price_usd);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Price (USD)',
                data: prices,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// Utility Functions
function formatPrice(price) {
    if (price >= 1) {
        return price.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    } else {
        return price.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 8
        });
    }
}

function closeModal() {
    document.getElementById('detailModal').style.display = 'none';
}

function showLoading(message = 'Loading...') {
    // Simple loading implementation
    console.log(message);
}

function hideLoading() {
    console.log('Loading complete');
}

function showError(message) {
    alert('Error: ' + message);
}

function showSuccess(message) {
    alert('Success: ' + message);
}
