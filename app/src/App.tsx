// src/App.tsx
import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Search, Plus } from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { useDatabase } from "./hooks/useDatabase";
import AuthScreen from "./components/auth/AuthScreen";
import { LoadingSpinner, Modal } from "./components/ui";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import PortfolioView from "./components/portfolio/PortfolioView";
import AddStockForm from "./components/portfolio/AddStockForm";
import RebalancePortfolio from "./components/portfolio/RebalancePortfolio";
import Recommendations from "./components/recommendations/Recommendations";
import type {
  Recommendation,
  NewStockState,
  RebalanceArtifact,
  RebalanceItem,
} from "./types/types";
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

  // Search functionality
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal state
  const [showAddStockModal, setShowAddStockModal] = useState<boolean>(false);

  // Rebalance artifact state
  const [rebalanceArtifact, setRebalanceArtifact] =
    useState<RebalanceArtifact | null>(null);
  const [showRebalanceArtifact, setShowRebalanceArtifact] =
    useState<boolean>(false);

  // Extract recommendation generation logic to a separate function
  const generateRecommendations = useCallback(() => {
    if (db.data.length === 0) return;

    // Don't set isRebalancing flag here as we want this to happen quietly in the background

    // Generate recommendations
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
  }, [db.data]);

  // Auto-generate recommendations when portfolio data is loaded
  useEffect(() => {
    if (db.data.length > 0 && recommendations.length === 0 && !isRebalancing) {
      generateRecommendations();
    }
  }, [db.data, recommendations.length, isRebalancing, generateRecommendations]);

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
    setRebalanceArtifact(null);
    setShowRebalanceArtifact(false);
    await auth.signOut();
  }, [auth]);

  // Portfolio Handlers
  const handleAddStock = useCallback(
    async (newStockData: NewStockState) => {
      // Check if this is a cancel action (all fields empty)
      if (
        !newStockData.ticker &&
        !newStockData.shares &&
        !newStockData.price &&
        !newStockData.allocation
      ) {
        setStockToAddFromRec({}); // Clear any recommendation prefill
        setShowAddStockModal(false); // Close modal
        return;
      }

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
        priceChange: Math.random() * 10 - 5, // Random price change for demo purposes (-5% to +5%)
        // created_at will be added by the hook
      });
      // Form clearing is handled within AddStockForm component
      setStockToAddFromRec({}); // Clear any recommendation prefill
      setShowAddStockModal(false); // Close modal after adding
    },
    [db]
  );

  const handleRemoveStock = useCallback(
    async (id: number) => {
      await db.remove(id);
    },
    [db]
  );

  // Handle opening the add stock modal
  const handleAddStockClick = useCallback(() => {
    console.log("Opening add stock modal"); // Add log for debugging
    setShowAddStockModal(true);
  }, []);

  // Search handler
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  // Calculate total value memoized
  const totalValue = useMemo(() => {
    return db.data.reduce((sum, stock) => sum + stock.shares * stock.price, 0);
  }, [db.data]);

  // Filtered stocks based on search query
  const filteredStocks = useMemo(() => {
    if (!searchQuery.trim()) return db.data;

    const lowerQuery = searchQuery.toLowerCase();
    return db.data.filter(
      (stock) =>
        stock.ticker.toLowerCase().includes(lowerQuery) ||
        stock.name.toLowerCase().includes(lowerQuery)
    );
  }, [db.data, searchQuery]);

  // Rebalance Simulation
  const rebalancePortfolio = useCallback(() => {
    if (db.data.length === 0) return; // Guard against rebalancing empty portfolio

    setIsRebalancing(true);
    setRecommendations([]); // Clear old recommendations

    // Simulate AI-powered search and recommendation
    setTimeout(() => {
      // Generate rebalance artifact
      const rebalanceItems: RebalanceItem[] = db.data.map((stock) => ({
        ticker: stock.ticker,
        name: stock.name,
        currentAllocation: Math.round(
          ((stock.shares * stock.price) / totalValue) * 100
        ),
        targetAllocation: stock.allocation,
        newAllocation: Math.round(stock.allocation * 0.9 + Math.random() * 5), // Simulated new allocation
        action: "Adjust",
      }));

      const newArtifact: RebalanceArtifact = {
        id: Date.now(),
        createdAt: new Date().toISOString(),
        portfolioValue: totalValue,
        riskRatio: 0.75 + Math.random() * 0.1, // Random risk ratio for demo
        items: rebalanceItems,
      };

      setRebalanceArtifact(newArtifact);
      setShowRebalanceArtifact(true);

      // Use the extracted function to generate recommendations
      generateRecommendations();
      setIsRebalancing(false);
    }, 2000);
  }, [db.data, totalValue, generateRecommendations]);

  // Handler for clicking 'Add' on a recommendation
  const handleAddRecommendationClick = useCallback(
    (ticker: string, name: string) => {
      // Set state to prefill the AddStockForm
      setStockToAddFromRec({ ticker, name });
      setShowAddStockModal(true); // Open the modal
    },
    []
  );

  // Apply rebalance to portfolio
  const handleApplyRebalance = useCallback(() => {
    if (!rebalanceArtifact) return;

    // Here you would implement the actual rebalance application logic
    // For now, just show an alert
    alert("Rebalanced portfolio has been applied!");
    setShowRebalanceArtifact(false);
  }, [rebalanceArtifact]);

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
    <>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header userEmail={auth.session.user.email} onLogout={handleLogout} />

        <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Search Bar */}
          <div className="mb-6 flex justify-between items-center">
            <div className="relative w-full max-w-lg">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="Search your portfolio..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          {/* Portfolio Display */}
          <PortfolioView
            stocks={filteredStocks}
            totalValue={totalValue}
            onRemoveStock={handleRemoveStock}
            onAddStockClick={handleAddStockClick}
            onRebalance={rebalancePortfolio}
          />

          {/* Rebalance & Recommendations Section - 75/25 layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
            {/* Left section - Rebalance Portfolio (75% width) */}
            <div className="lg:col-span-2">
              <RebalancePortfolio
                onRebalance={rebalancePortfolio}
                isRebalancing={isRebalancing}
                hasStocks={db.data.length > 0}
                rebalanceArtifact={rebalanceArtifact}
                showRebalanceArtifact={showRebalanceArtifact}
                onApplyRebalance={handleApplyRebalance}
              />
            </div>

            {/* Right section - AI Recommendations (25% width) */}
            <div className="lg:col-span-1">
              <Recommendations
                recommendations={recommendations}
                onRebalance={rebalancePortfolio}
                isRebalancing={isRebalancing}
                onAddRecommendationClick={handleAddRecommendationClick}
                hasStocks={db.data.length > 0}
              />
            </div>
          </div>
        </main>

        <Footer />
      </div>

      {/* Add Stock Modal using the reusable Modal component */}
      <Modal
        isOpen={showAddStockModal}
        onClose={() => setShowAddStockModal(false)}
        title="Add New Stock"
        showFooter={false}
        size="lg"
        closeOnClickOutside={true}
      >
        <div className="flex items-start mb-4">
          <div className="w-full">
            <AddStockForm
              onAddStock={handleAddStock}
              onClose={() => setShowAddStockModal(false)}
              initialValues={stockToAddFromRec}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}

export default App;
