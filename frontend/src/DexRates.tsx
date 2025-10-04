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
  const [sortBy, setSortBy] = useState<'symbol' | 'spread' | 'binance' | 'bybit' | 'hyperliquid' | 'lighter' | 'aster' | 'grvt' | 'backpack'>('symbol');
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

  // Helper function to calculate spread for a symbol using only enabled exchanges
  const calculateSpread = (symbol: string): number | null => {
    const symbolRates = groupedRates[symbol];
    const validRates = symbolRates
      .filter(r => enabledExchanges.has(r.exchange) && r.rate !== null && r.rate !== undefined)
      .map(r => r.rate) as number[];

    return validRates.length >= 2 ? Math.max(...validRates) - Math.min(...validRates) : null;
  };

  // Sort symbols
  const sortedSymbols = [...filteredSymbols].sort((a, b) => {
    if (sortBy === 'symbol') {
      return sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
    } else if (sortBy === 'spread') {
      // Sort by spread - only include enabled exchanges
      const spreadA = calculateSpread(a) ?? 0;
      const spreadB = calculateSpread(b) ?? 0;

      return sortOrder === 'asc' ? spreadA - spreadB : spreadB - spreadA;
    } else {
      // Sort by specific exchange rate
      const rateA = groupedRates[a].find(r => r.exchange === sortBy)?.rate;
      const rateB = groupedRates[b].find(r => r.exchange === sortBy)?.rate;

      // Put null/undefined values at the end
      if ((rateA === null || rateA === undefined) && (rateB === null || rateB === undefined)) return 0;
      if (rateA === null || rateA === undefined) return sortOrder === 'asc' ? 1 : -1;
      if (rateB === null || rateB === undefined) return sortOrder === 'asc' ? -1 : 1;

      return sortOrder === 'asc' ? rateA - rateB : rateB - rateA;
    }
  });

  const formatRate = (rate: number | null | undefined): string => {
    if (rate === null || rate === undefined || isNaN(rate)) return 'N/A';
    const percentage = rate * 100;
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(4)}%`;
  };

  const getRateColor = (rate: number | null | undefined): string => {
    if (rate === null || rate === undefined || isNaN(rate)) return 'var(--muted-foreground)';
    return rate >= 0 ? 'var(--success)' : 'var(--destructive)';
  };

  const handleSort = (newSortBy: 'symbol' | 'spread' | 'binance' | 'bybit' | 'hyperliquid' | 'lighter' | 'aster' | 'grvt' | 'backpack') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder(newSortBy === 'symbol' ? 'asc' : 'desc'); // Default desc for numeric columns
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
                {enabledExchanges.has('binance') && (
                  <th onClick={() => handleSort('binance')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Binance {sortBy === 'binance' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                )}
                {enabledExchanges.has('bybit') && (
                  <th onClick={() => handleSort('bybit')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Bybit {sortBy === 'bybit' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                )}
                {enabledExchanges.has('hyperliquid') && (
                  <th onClick={() => handleSort('hyperliquid')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Hyperliquid {sortBy === 'hyperliquid' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                )}
                {enabledExchanges.has('lighter') && (
                  <th onClick={() => handleSort('lighter')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Lighter {sortBy === 'lighter' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                )}
                {enabledExchanges.has('aster') && (
                  <th onClick={() => handleSort('aster')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    ASTER {sortBy === 'aster' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                )}
                {enabledExchanges.has('grvt') && (
                  <th onClick={() => handleSort('grvt')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    GRVT {sortBy === 'grvt' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                )}
                {enabledExchanges.has('backpack') && (
                  <th onClick={() => handleSort('backpack')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    BP {sortBy === 'backpack' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                )}
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

                // Calculate spread from enabled exchanges only
                const enabledRates = [
                  enabledExchanges.has('binance') ? ratesByExchange.binance : null,
                  enabledExchanges.has('bybit') ? ratesByExchange.bybit : null,
                  enabledExchanges.has('hyperliquid') ? ratesByExchange.hyperliquid : null,
                  enabledExchanges.has('lighter') ? ratesByExchange.lighter : null,
                  enabledExchanges.has('aster') ? ratesByExchange.aster : null,
                  enabledExchanges.has('grvt') ? ratesByExchange.grvt : null,
                  enabledExchanges.has('backpack') ? ratesByExchange.backpack : null
                ].filter(r => r !== null && r !== undefined) as number[];

                const spread = enabledRates.length >= 2 ? Math.max(...enabledRates) - Math.min(...enabledRates) : null;

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
