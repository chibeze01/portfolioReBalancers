/**
 * API client for communicating with the FastAPI backend
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const API_PREFIX = "/api/v1";

// Storage key for auth token (must match useAuth.ts)
const TOKEN_KEY = "portfolio_auth_token";

interface ApiError {
  detail: string;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP error ${response.status}`;
    try {
      const errorData: ApiError = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch {
      // Ignore JSON parse errors
    }
    throw new Error(errorMessage);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// Portfolio Types
export interface Portfolio {
  id: string;
  name: string;
  description?: string | null;
}

export interface Holding {
  id: string;
  symbol: string;
  quantity: number;
  average_cost: number;
}

export interface PortfolioDetail extends Portfolio {
  holdings: Holding[];
}

export interface CreatePortfolioRequest {
  name: string;
  description?: string;
}

export interface CreateHoldingRequest {
  symbol: string;
  quantity: number;
  purchase_price: number;
  purchase_date?: string;
}

export interface PnLPosition {
  symbol: string;
  quantity: number;
  average_cost: number;
  price: number;
  unrealized_pnl: number;
}

export interface PnLResponse {
  portfolio_id: string;
  as_of: string;
  total_unrealized_pnl: number;
  positions: PnLPosition[];
}

export interface HistoricalDataPoint {
  date: string;
  value: number;
}

export interface HistoricalResponse {
  portfolio_id: string;
  data: HistoricalDataPoint[];
  start_date: string;
  end_date: string;
  current_value: number;
}

export interface StockMetadata {
  symbol: string;
  name: string;
  sector?: string | null;
  industry?: string | null;
  market_cap?: number | null;
  pe_ratio?: number | null;
  dividend_yield?: number | null;
}

export interface StockPricePoint {
  date: string;
  price: number;
}

export interface HoldingDetail {
  holding_id: string;
  symbol: string;
  quantity: number;
  average_cost: number;
  purchase_date?: string | null;
  current_price: number;
  total_value: number;
  unrealized_pnl: number;
  pnl_percent: number;
  metadata: StockMetadata;
  price_history: StockPricePoint[];
}

export interface Recommendation {
  ticker: string;
  name: string;
  reason: string;
}

export interface RecommendationsResponse {
  recommendations: Recommendation[];
}

// Auth Types
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

// Auth API
export const authApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}${API_PREFIX}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse<AuthResponse>(response);
  },

  async register(
    email: string,
    password: string,
    name?: string,
  ): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}${API_PREFIX}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    return handleResponse<AuthResponse>(response);
  },

  async getMe(): Promise<AuthUser> {
    const response = await fetch(`${API_BASE}${API_PREFIX}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<AuthUser>(response);
  },
};

// Portfolio API
export const portfolioApi = {
  async list(): Promise<Portfolio[]> {
    const response = await fetch(`${API_BASE}${API_PREFIX}/portfolios`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Portfolio[]>(response);
  },

  async get(portfolioId: string): Promise<PortfolioDetail> {
    const response = await fetch(
      `${API_BASE}${API_PREFIX}/portfolios/${portfolioId}`,
      {
        headers: getAuthHeaders(),
      },
    );
    return handleResponse<PortfolioDetail>(response);
  },

  async create(data: CreatePortfolioRequest): Promise<Portfolio> {
    const response = await fetch(`${API_BASE}${API_PREFIX}/portfolios`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Portfolio>(response);
  },

  async update(
    portfolioId: string,
    data: CreatePortfolioRequest,
  ): Promise<Portfolio> {
    const response = await fetch(
      `${API_BASE}${API_PREFIX}/portfolios/${portfolioId}`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      },
    );
    return handleResponse<Portfolio>(response);
  },

  async delete(portfolioId: string): Promise<void> {
    const response = await fetch(
      `${API_BASE}${API_PREFIX}/portfolios/${portfolioId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      },
    );
    await handleResponse<void>(response);
  },
};

// Holdings API
export const holdingsApi = {
  async addOrUpdate(
    portfolioId: string,
    data: CreateHoldingRequest,
  ): Promise<Holding> {
    const response = await fetch(
      `${API_BASE}${API_PREFIX}/portfolios/${portfolioId}/holdings`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      },
    );
    return handleResponse<Holding>(response);
  },

  async getDetail(holdingId: string): Promise<HoldingDetail> {
    const response = await fetch(
      `${API_BASE}${API_PREFIX}/holdings/${holdingId}`,
      {
        headers: getAuthHeaders(),
      },
    );
    return handleResponse<HoldingDetail>(response);
  },

  async delete(holdingId: string): Promise<void> {
    const response = await fetch(
      `${API_BASE}${API_PREFIX}/holdings/${holdingId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      },
    );
    await handleResponse<void>(response);
  },
};

// Analytics API
export const analyticsApi = {
  async getPnL(portfolioId: string): Promise<PnLResponse> {
    const response = await fetch(
      `${API_BASE}${API_PREFIX}/portfolios/${portfolioId}/pnl`,
      {
        headers: getAuthHeaders(),
      },
    );
    return handleResponse<PnLResponse>(response);
  },

  async getHistorical(
    portfolioId: string,
    days: number = 30,
  ): Promise<HistoricalResponse> {
    const response = await fetch(
      `${API_BASE}${API_PREFIX}/portfolios/${portfolioId}/historical?days=${days}`,
      {
        headers: getAuthHeaders(),
      },
    );
    return handleResponse<HistoricalResponse>(response);
  },
};

// Recommendations API
export const recommendationsApi = {
  async getForPortfolio(
    portfolioId: string,
    maxResults: number = 3,
  ): Promise<Recommendation[]> {
    const response = await fetch(
      `${API_BASE}${API_PREFIX}/recommendations/portfolio/${portfolioId}?max_results=${maxResults}`,
      {
        headers: getAuthHeaders(),
      },
    );
    const data = await handleResponse<RecommendationsResponse>(response);
    return data.recommendations;
  },

  async getQuick(
    currentTickers: string[],
    maxResults: number = 3,
  ): Promise<Recommendation[]> {
    const tickersParam = currentTickers.join(",");
    const response = await fetch(
      `${API_BASE}${API_PREFIX}/recommendations/quick?current_tickers=${encodeURIComponent(tickersParam)}&max_results=${maxResults}`,
      {
        headers: getAuthHeaders(),
      },
    );
    const data = await handleResponse<RecommendationsResponse>(response);
    return data.recommendations;
  },
};

// Rebalance Types
export interface RebalanceAction {
  symbol: string;
  current_allocation: number;
  target_allocation: number;
  current_value: number;
  target_value: number;
  delta_value: number;
  delta_shares: number;
  action: string;
  current_price: number;
}

export interface RebalanceResponse {
  portfolio_id: string;
  total_value: number;
  actions: RebalanceAction[];
  as_of: string;
}

export interface AllocationUpdate {
  holding_id: string;
  target_allocation: number;
}

// Rebalance API
export const rebalanceApi = {
  async getRebalance(portfolioId: string): Promise<RebalanceResponse> {
    const response = await fetch(
      `${API_BASE}${API_PREFIX}/portfolios/${portfolioId}/rebalance`,
      { headers: getAuthHeaders() },
    );
    return handleResponse<RebalanceResponse>(response);
  },

  async updateAllocations(
    portfolioId: string,
    allocations: AllocationUpdate[],
  ): Promise<void> {
    const response = await fetch(
      `${API_BASE}${API_PREFIX}/portfolios/${portfolioId}/holdings/allocations`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ allocations }),
      },
    );
    await handleResponse<void>(response);
  },
};

// Import/Export Types
export interface ImportResult {
  imported: number;
  errors: { row: number; reason: string }[];
}

// Import/Export API
export const importExportApi = {
  async exportCsv(portfolioId: string): Promise<Blob> {
    const response = await fetch(
      `${API_BASE}${API_PREFIX}/portfolios/${portfolioId}/export`,
      { headers: getAuthHeaders() },
    );
    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }
    return response.blob();
  },

  async importCsv(portfolioId: string, file: File): Promise<ImportResult> {
    const token = localStorage.getItem(TOKEN_KEY);
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(
      `${API_BASE}${API_PREFIX}/portfolios/${portfolioId}/import`,
      {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      },
    );
    return handleResponse<ImportResult>(response);
  },
};

// Efficient Frontier Types
export interface FrontierPoint {
  expected_return: number;
  volatility: number;
  weights: Record<string, number>;
}

export interface EfficientFrontierResponse {
  portfolio_id: string;
  frontier_points: FrontierPoint[];
  current_portfolio: FrontierPoint;
  target_portfolio: FrontierPoint | null;
  min_variance: FrontierPoint;
  max_sharpe: FrontierPoint;
  symbols: string[];
  risk_free_rate: number;
}

// Efficient Frontier API
export const efficientFrontierApi = {
  async get(
    portfolioId: string,
    points: number = 30,
  ): Promise<EfficientFrontierResponse> {
    const response = await fetch(
      `${API_BASE}${API_PREFIX}/portfolios/${portfolioId}/efficient-frontier?points=${points}`,
      { headers: getAuthHeaders() },
    );
    return handleResponse<EfficientFrontierResponse>(response);
  },
};

// Monte Carlo Simulation Types
export interface SimulatedPortfolio {
  expected_return: number;
  volatility: number;
  sharpe_ratio: number;
}

export interface MonteCarloPortfolioPoint {
  expected_return: number;
  volatility: number;
  sharpe_ratio: number;
  weights: Record<string, number>;
}

export interface MonteCarloResponse {
  portfolio_id: string;
  simulated_portfolios: SimulatedPortfolio[];
  min_variance: MonteCarloPortfolioPoint;
  max_sharpe: MonteCarloPortfolioPoint;
  current_portfolio: MonteCarloPortfolioPoint;
  target_portfolio: MonteCarloPortfolioPoint | null;
  symbols: string[];
  risk_free_rate: number;
  num_samples: number;
}

// Monte Carlo API
export const monteCarloApi = {
  async get(
    portfolioId: string,
    samples: number = 10_000,
  ): Promise<MonteCarloResponse> {
    const response = await fetch(
      `${API_BASE}${API_PREFIX}/portfolios/${portfolioId}/efficient-frontier/simulation?samples=${samples}`,
      { headers: getAuthHeaders() },
    );
    return handleResponse<MonteCarloResponse>(response);
  },
};

// Health check
export const healthApi = {
  async check(): Promise<{ status: string }> {
    const response = await fetch(`${API_BASE}/health`);
    return handleResponse<{ status: string }>(response);
  },
};
