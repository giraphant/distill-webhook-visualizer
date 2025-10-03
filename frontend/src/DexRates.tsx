import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';

interface FundingRate {
  exchange: string;
  symbol: string;
  rate: number | null;
  next_funding_time: string | null;
  mark_price: number | null;
}

interface FundingRatesResponse {
  rates: FundingRate[];
  last_updated: string;
  error: string | null;
}

const DexRates: React.FC = () => {
  const [rates, setRates] = useState<FundingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'symbol' | 'rate' | 'spread'>('symbol');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [enabledExchanges, setEnabledExchanges] = useState<Set<string>>(
    new Set(['binance', 'bybit', 'hyperliquid', 'lighter', 'aster', 'grvt', 'backpack'])
  );

  const fetchRates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dex/funding-rates');
      const data: FundingRatesResponse = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setRates(data.rates);
        setLastUpdated(data.last_updated);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch funding rates');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchRates, 60000);
    return () => clearInterval(interval);
  }, []);

  // Group rates by symbol
  const groupedRates = rates.reduce((acc, rate) => {
    if (!acc[rate.symbol]) {
      acc[rate.symbol] = [];
    }
    acc[rate.symbol].push(rate);
    return acc;
  }, {} as Record<string, FundingRate[]>);

  // Filter by search term and require at least 2 exchanges with data
  const filteredSymbols = Object.keys(groupedRates).filter(symbol => {
    const matchesSearch = symbol.toLowerCase().includes(searchTerm.toLowerCase());
    const symbolRates = groupedRates[symbol];
    const validRates = symbolRates.filter(r => r.rate !== null && r.rate !== undefined);
    const hasMultipleExchanges = validRates.length >= 2;
    return matchesSearch && hasMultipleExchanges;
  });

  // Sort symbols
  const sortedSymbols = [...filteredSymbols].sort((a, b) => {
    if (sortBy === 'symbol') {
      return sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
    } else if (sortBy === 'rate') {
      // Sort by average rate
      const avgA = groupedRates[a].reduce((sum, r) => sum + (r.rate || 0), 0) / groupedRates[a].length;
      const avgB = groupedRates[b].reduce((sum, r) => sum + (r.rate || 0), 0) / groupedRates[b].length;
      return sortOrder === 'asc' ? avgA - avgB : avgB - avgA;
    } else {
      // Sort by spread - only valid if 2+ exchanges have data
      const ratesA = groupedRates[a].map(r => r.rate).filter(r => r !== null && r !== undefined) as number[];
      const ratesB = groupedRates[b].map(r => r.rate).filter(r => r !== null && r !== undefined) as number[];

      // If less than 2 exchanges, spread is not applicable - treat as -Infinity (will be at bottom when desc)
      const spreadA = ratesA.length >= 2 ? Math.max(...ratesA) - Math.min(...ratesA) : -Infinity;
      const spreadB = ratesB.length >= 2 ? Math.max(...ratesB) - Math.min(...ratesB) : -Infinity;

      return sortOrder === 'asc' ? spreadA - spreadB : spreadB - spreadA;
    }
  });

  const formatRate = (rate: number | null): string => {
    if (rate === null) return 'N/A';
    const percentage = rate * 100;
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(4)}%`;
  };

  const getRateColor = (rate: number | null): string => {
    if (rate === null) return 'var(--muted-foreground)';
    return rate >= 0 ? 'var(--success)' : 'var(--destructive)';
  };

  const handleSort = (newSortBy: 'symbol' | 'rate' | 'spread') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder(sortBy === 'symbol' ? 'asc' : 'desc'); // Default desc for rate and spread
    }
  };

  const toggleExchange = (exchange: string) => {
    const newEnabled = new Set(enabledExchanges);
    if (newEnabled.has(exchange)) {
      newEnabled.delete(exchange);
    } else {
      newEnabled.add(exchange);
    }
    setEnabledExchanges(newEnabled);
  };

  return (
    <div className="dex-rates-container">
      <div className="dex-rates-header">
        <div className="header-left">
          <h2>DEX Funding Rates Comparison</h2>
          {lastUpdated && (
            <span className="last-updated">
              Updated: {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>
        <button onClick={fetchRates} className="refresh-btn" disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          Refresh
        </button>
      </div>

      <div className="dex-filters">
        <input
          type="text"
          placeholder="Search symbol..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="exchange-filters">
        <span style={{ marginRight: '12px', fontWeight: 500 }}>Exchanges:</span>
        {['binance', 'bybit', 'hyperliquid', 'lighter', 'aster', 'grvt', 'backpack'].map(exchange => (
          <label key={exchange} className="exchange-checkbox">
            <input
              type="checkbox"
              checked={enabledExchanges.has(exchange)}
              onChange={() => toggleExchange(exchange)}
            />
            <span>{exchange === 'backpack' ? 'BP' : exchange.toUpperCase()}</span>
          </label>
        ))}
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {loading && rates.length === 0 ? (
        <div className="loading-message">Loading funding rates...</div>
      ) : (
        <div className="dex-table-container">
          <table className="dex-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('symbol')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Symbol {sortBy === 'symbol' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                {enabledExchanges.has('binance') && <th>Binance</th>}
                {enabledExchanges.has('bybit') && <th>Bybit</th>}
                {enabledExchanges.has('hyperliquid') && <th>Hyperliquid</th>}
                {enabledExchanges.has('lighter') && <th>Lighter</th>}
                {enabledExchanges.has('aster') && <th>ASTER</th>}
                {enabledExchanges.has('grvt') && <th>GRVT</th>}
                {enabledExchanges.has('backpack') && <th>BP</th>}
                <th onClick={() => handleSort('rate')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Avg Rate {sortBy === 'rate' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('spread')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Spread {sortBy === 'spread' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedSymbols.map(symbol => {
                const symbolRates = groupedRates[symbol];
                const ratesByExchange = symbolRates.reduce((acc, r) => {
                  acc[r.exchange] = r.rate;
                  return acc;
                }, {} as Record<string, number | null>);

                const rates = [
                  ratesByExchange.binance,
                  ratesByExchange.bybit,
                  ratesByExchange.hyperliquid,
                  ratesByExchange.lighter,
                  ratesByExchange.aster,
                  ratesByExchange.grvt,
                  ratesByExchange.backpack
                ].filter(r => r !== null && r !== undefined) as number[];

                const avgRate = rates.length > 0 ? rates.reduce((sum, r) => sum + r, 0) / rates.length : null;
                const spread = rates.length >= 2 ? Math.max(...rates) - Math.min(...rates) : null;

                return (
                  <tr key={symbol}>
                    <td className="symbol-cell"><strong>{symbol}</strong></td>
                    {enabledExchanges.has('binance') && (
                      <td style={{ color: getRateColor(ratesByExchange.binance) }}>
                        {formatRate(ratesByExchange.binance)}
                      </td>
                    )}
                    {enabledExchanges.has('bybit') && (
                      <td style={{ color: getRateColor(ratesByExchange.bybit) }}>
                        {formatRate(ratesByExchange.bybit)}
                      </td>
                    )}
                    {enabledExchanges.has('hyperliquid') && (
                      <td style={{ color: getRateColor(ratesByExchange.hyperliquid) }}>
                        {formatRate(ratesByExchange.hyperliquid)}
                      </td>
                    )}
                    {enabledExchanges.has('lighter') && (
                      <td style={{ color: getRateColor(ratesByExchange.lighter) }}>
                        {formatRate(ratesByExchange.lighter)}
                      </td>
                    )}
                    {enabledExchanges.has('aster') && (
                      <td style={{ color: getRateColor(ratesByExchange.aster) }}>
                        {formatRate(ratesByExchange.aster)}
                      </td>
                    )}
                    {enabledExchanges.has('grvt') && (
                      <td style={{ color: getRateColor(ratesByExchange.grvt) }}>
                        {formatRate(ratesByExchange.grvt)}
                      </td>
                    )}
                    {enabledExchanges.has('backpack') && (
                      <td style={{ color: getRateColor(ratesByExchange.backpack) }}>
                        {formatRate(ratesByExchange.backpack)}
                      </td>
                    )}
                    <td style={{ color: getRateColor(avgRate), fontWeight: 500 }}>
                      {formatRate(avgRate)}
                    </td>
                    <td className="spread-cell">
                      {spread !== null ? `${(spread * 100).toFixed(4)}%` : 'N/A'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="dex-footer">
        Showing {sortedSymbols.length} symbols
      </div>
    </div>
  );
};

export default DexRates;
