// src/App.tsx
import React, { useState, useCallback, useMemo } from "react";
import { useAuth } from "./hooks/useAuth";
import { useDatabase } from "./hooks/useDatabase";
import AuthScreen from "./components/auth/AuthScreen";
import LoadingSpinner from "./components/ui/LoadingSpinner";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import PortfolioView from "./components/portfolio/PortfolioView";
import AddStockForm from "./components/portfolio/AddStockForm";
import PortfolioImportExport from "./components/portfolio/PortfolioImportExport";
import Recommendations from "./components/recommendations/Recommendations";
import type { Recommendation, NewStockState, StockData } from "./types/types";
import "./App.css"; // Import your CSS styles

function App() {
  // Auth state using custom hook
  const auth = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  // Database using custom hook - userId is now dependency
  const db = useDatabase(auth.session?.user?.id);

  // UI state for recommendations and form interaction
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isRebalancing, setIsRebalancing] = useState<boolean>(false);
  // State specifically for prepopulating the AddStockForm from recommendations
  const [stockToAddFromRec, setStockToAddFromRec] = useState<
    Partial<NewStockState>
  >({});

  // Auth Handlers
  const handleSignUp = useCallback(
    async (email: string, password: string, name: string) => {
      setAuthError(null);
      const { error } = await auth.signUp(email, password, name);
      if (error) {
        setAuthError(error); // Set error state to display in AuthForm
      }
      // No need to handle success navigation here, useEffect below handles session change
    },
    [auth]
  );

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      setAuthError(null);
      const { error } = await auth.signIn(email, password);
      if (error) {
        setAuthError(error); // Set error state to display in AuthForm
      }
    },
    [auth]
  );

  const handleLogout = useCallback(async () => {
    setRecommendations([]); // Clear recommendations on logout
    setIsRebalancing(false);
    await auth.signOut();
  }, [auth]);

  // Portfolio Handlers
  const handleAddStock = useCallback(
    async (newStockData: NewStockState) => {
      const shares = parseInt(newStockData.shares, 10);
      const price = parseFloat(newStockData.price);
      const allocation = parseInt(newStockData.allocation, 10);

      // Simple validation for parsed numbers
      if (
        isNaN(shares) ||
        isNaN(price) ||
        isNaN(allocation) ||
        shares < 0 ||
        price < 0 ||
        allocation < 0 ||
        allocation > 100
      ) {
        alert("Invalid number format for Shares, Price, or Allocation.");
        return;
      }

      await db.insert({
        ticker: newStockData.ticker.toUpperCase(),
        name: newStockData.name || newStockData.ticker.toUpperCase(), // Default name to ticker if empty
        shares: shares,
        price: price,
        allocation: allocation,
        // created_at will be added by the hook
      });
      // Form clearing is handled within AddStockForm component
      setStockToAddFromRec({}); // Clear any recommendation prefill
    },
    [db]
  );

  const handleRemoveStock = useCallback(
    async (id: number) => {
      await db.remove(id);
    },
    [db]
  );

  // Handle importing data from CSV file
  const handleImportPortfolio = useCallback(
    (importedStocks: StockData[]) => {
      // First, check if we should replace or append to the existing portfolio
      if (db.data.length > 0) {
        const shouldReplace = window.confirm(
          "Would you like to replace your existing portfolio with the imported data? Click 'OK' to replace, or 'Cancel' to add to your current portfolio."
        );

        if (shouldReplace) {
          // Remove existing stocks first
          Promise.all(db.data.map((stock) => db.remove(stock.id))).then(() => {
            // Then add new ones
            importedStocks.forEach((stock) => {
              db.insert(stock);
            });
          });
        } else {
          // Just add the new stocks
          importedStocks.forEach((stock) => {
            db.insert(stock);
          });
        }
      } else {
        // No existing portfolio, just add the imported stocks
        importedStocks.forEach((stock) => {
          db.insert(stock);
        });
      }
    },
    [db]
  );

  // Rebalance Simulation
  const rebalancePortfolio = useCallback(() => {
    if (db.data.length === 0) return; // Guard against rebalancing empty portfolio

    setIsRebalancing(true);
    setRecommendations([]); // Clear old recommendations

    // Simulate AI-powered search and recommendation
    setTimeout(() => {
      const currentTickers = db.data.map((stock) => stock.ticker);
      const potentialRecommendations: Recommendation[] = [
        {
          ticker: "TSLA",
          name: "Tesla, Inc.",
          reason: "Strong momentum in EV market, potential growth opportunity.",
        },
        {
          ticker: "VOO",
          name: "Vanguard S&P 500 ETF",
          reason:
            "Provides broader market exposure to balance tech-heavy portfolio.",
        },
        {
          ticker: "BRK.B",
          name: "Berkshire Hathaway Inc.",
          reason: "Value stock to diversify away from tech concentration.",
        },
        {
          ticker: "JPM",
          name: "JPMorgan Chase & Co.",
          reason: "Financial sector exposure could balance your tech holdings.",
        },
        {
          ticker: "JNJ",
          name: "Johnson & Johnson",
          reason:
            "Healthcare sector could provide defensive stability to your portfolio.",
        },
      ];

      const filteredRecommendations = potentialRecommendations
        .filter((rec) => !currentTickers.includes(rec.ticker))
        .slice(0, 3); // Limit to 3 recommendations

      setRecommendations(filteredRecommendations);
      setIsRebalancing(false);
    }, 2000);
  }, [db.data]);

  // Handler for clicking 'Add' on a recommendation
  const handleAddRecommendationClick = useCallback(
    (ticker: string, name: string) => {
      // Set state to prefill the AddStockForm
      // We don't need a full state object here, just update AddStockForm directly via props/context later
      // Or simpler for now: Update AddStockForm's internal state via a key prop change or a direct ref (less ideal)
      // Easiest for this structure: just tell the user to fill the rest.
      alert(
        `Adding ${ticker} (${name}). Please fill in Shares, Price, and Allocation in the form below.`
      );
      // Focus the ticker input or scroll to the form might be good UX additions here
    },
    []
  );

  // Calculate total value memoized
  const totalValue = useMemo(() => {
    return db.data.reduce((sum, stock) => sum + stock.shares * stock.price, 0);
  }, [db.data]);

  // --- Render Logic ---

  // Loading State
  if (auth.loading || (auth.session && db.loading)) {
    // Check db loading only if authenticated
    return (
      <LoadingSpinner
        message={auth.loading ? "Authenticating..." : "Loading portfolio..."}
      />
    );
  }

  // Authentication Screen
  if (!auth.session) {
    return (
      <AuthScreen
        onLogin={handleLogin}
        onSignUp={handleSignUp}
        isLoading={auth.loading} // Use auth loading specifically for auth actions
        error={authError} // Pass the auth error state down
      />
    );
  }

  // Main Application (Authenticated)
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header userEmail={auth.session.user.email} onLogout={handleLogout} />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Portfolio Display */}
        <PortfolioView
          stocks={db.data}
          totalValue={totalValue}
          onRemoveStock={handleRemoveStock}
        />

        {/* Import/Export Component */}
        <PortfolioImportExport
          stocks={db.data}
          onImportData={handleImportPortfolio}
        />

        {/* Action Forms / Recommendations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <AddStockForm onAddStock={handleAddStock} />
          <Recommendations
            recommendations={recommendations}
            onRebalance={rebalancePortfolio}
            isRebalancing={isRebalancing}
            onAddRecommendationClick={handleAddRecommendationClick}
            hasStocks={db.data.length > 0}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
