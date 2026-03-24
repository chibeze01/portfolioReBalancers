import { useState, useEffect, useCallback } from "react";
import { portfolioApi, holdingsApi, analyticsApi, type Portfolio, type Holding, type PnLPosition, type CreateHoldingRequest, type HistoricalDataPoint } from "@/lib/api";

export interface PortfolioStock {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  price: number;
  averageCost: number;
  allocation: number;
  priceChange: number;
  unrealized_pnl: number;
}

export function usePortfolio(userId: string | undefined) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [activePortfolioId, setActivePortfolioId] = useState<string | null>(null);
  const [stocks, setStocks] = useState<PortfolioStock[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalValue = stocks.reduce((sum, s) => sum + s.quantity * s.price, 0);
  const totalPnl = stocks.reduce((sum, s) => sum + s.unrealized_pnl, 0);

  const fetchPortfolios = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await portfolioApi.list();
      setPortfolios(data);
      if (data.length > 0 && !activePortfolioId) {
        setActivePortfolioId(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch portfolios");
    } finally {
      setLoading(false);
    }
  }, [userId, activePortfolioId]);

  const fetchHoldings = useCallback(async () => {
    if (!activePortfolioId) return;
    setLoading(true);
    setError(null);
    try {
      const [detail, pnl, historical] = await Promise.all([
        portfolioApi.get(activePortfolioId),
        analyticsApi.getPnL(activePortfolioId).catch(() => ({ positions: [], total_unrealized_pnl: 0 })),
        analyticsApi.getHistorical(activePortfolioId, 30).catch(() => ({ data: [], current_value: 0 })),
      ]);

      const pnlMap = new Map<string, PnLPosition>();
      pnl.positions.forEach((p: PnLPosition) => pnlMap.set(p.symbol, p));

      const totalVal = detail.holdings.reduce((sum: number, h: Holding) => {
        const pos = pnlMap.get(h.symbol);
        const price = pos?.price ?? Number(h.average_cost);
        return sum + Number(h.quantity) * price;
      }, 0);

      const stockData: PortfolioStock[] = detail.holdings.map((h: Holding) => {
        const pos = pnlMap.get(h.symbol);
        const price = pos?.price ?? Number(h.average_cost);
        const value = Number(h.quantity) * price;
        return {
          id: h.id,
          symbol: h.symbol,
          name: h.symbol,
          quantity: Number(h.quantity),
          price,
          averageCost: Number(h.average_cost),
          allocation: totalVal > 0 ? (value / totalVal) * 100 : 0,
          priceChange: price > 0 && Number(h.average_cost) > 0 
            ? ((price - Number(h.average_cost)) / Number(h.average_cost)) * 100 
            : 0,
          unrealized_pnl: pos?.unrealized_pnl ?? 0,
        };
      });

      setStocks(stockData);
      setHistoricalData(historical.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch holdings");
    } finally {
      setLoading(false);
    }
  }, [activePortfolioId]);

  useEffect(() => {
    fetchPortfolios();
  }, [fetchPortfolios]);

  useEffect(() => {
    fetchHoldings();
  }, [fetchHoldings]);

  const createPortfolio = useCallback(async (name: string, description?: string) => {
    try {
      const portfolio = await portfolioApi.create({ name, description });
      setPortfolios((prev) => [...prev, portfolio]);
      setActivePortfolioId(portfolio.id);
      return portfolio;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create portfolio");
      return null;
    }
  }, []);

  const addStock = useCallback(async (data: CreateHoldingRequest) => {
    if (!activePortfolioId) return false;
    try {
      await holdingsApi.addOrUpdate(activePortfolioId, data);
      await fetchHoldings();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add stock");
      return false;
    }
  }, [activePortfolioId, fetchHoldings]);

  const removeStock = useCallback(async (holdingId: string) => {
    try {
      await holdingsApi.delete(holdingId);
      setStocks((prev) => prev.filter((s) => s.id !== holdingId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove stock");
      return false;
    }
  }, []);

  const updatePortfolio = useCallback(async (id: string, name: string, description?: string) => {
    try {
      const updated = await portfolioApi.update(id, { name, description });
      setPortfolios((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update portfolio");
      return false;
    }
  }, []);

  const deletePortfolio = useCallback(async (id: string) => {
    try {
      await portfolioApi.delete(id);
      setPortfolios((prev) => {
        const remaining = prev.filter((p) => p.id !== id);
        if (activePortfolioId === id && remaining.length > 0) {
          setActivePortfolioId(remaining[0].id);
        }
        return remaining;
      });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete portfolio");
      return false;
    }
  }, [activePortfolioId]);

  return {
    portfolios,
    activePortfolioId,
    setActivePortfolioId,
    stocks,
    historicalData,
    totalValue,
    totalPnl,
    loading,
    error,
    createPortfolio,
    addStock,
    removeStock,
    updatePortfolio,
    deletePortfolio,
    refresh: fetchHoldings,
  };
}
