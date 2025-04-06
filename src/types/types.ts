// src/types.ts

// Type for a single stock holding
export interface Stock {
  id: number; // Using number based on Date.now() in mock
  ticker: string;
  name: string;
  shares: number;
  price: number;
  allocation: number; // Target allocation percentage
  created_at?: string; // Optional, as it's added later
}

// Type for the data structure returned by useDatabase hook
export interface StockData extends Stock {} // Alias for clarity if needed later

// Type for a stock recommendation
export interface Recommendation {
  ticker: string;
  name: string;
  reason: string;
}

// Type for the user object in the session
export interface User {
  id: string;
  email: string;
  name?: string; // Optional based on mock
}

// Type for the authentication session
export interface Session {
  user: User;
  token: string;
}

// Type for the state when adding a new stock
export interface NewStockState {
  ticker: string;
  name: string;
  shares: string; // Keep as string for form input
  price: string; // Keep as string for form input
  allocation: string; // Keep as string for form input
}

// Return type for the useAuth hook
export interface UseAuthReturn {
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    name: string
  ) => Promise<{
    user: User | null;
    session: Session | null;
    error: string | null;
  }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{
    user: User | null;
    session: Session | null;
    error: string | null;
  }>;
  signOut: () => Promise<{ error: string | null }>;
}

// Return type for the useDatabase hook
export interface UseDatabaseReturn {
  data: StockData[];
  loading: boolean;
  insert: (
    item: Omit<Stock, "id" | "created_at"> & { created_at?: string }
  ) => Promise<{ data: any; error: string | null }>; // Allow flexible input matching mock
  remove: (id: number) => Promise<{ error: string | null }>;
}
