import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { usePortfolio } from "@/hooks/use-portfolio"
import { AuthScreen } from "@/components/auth/auth-screen"
import { Dashboard } from "@/components/dashboard/dashboard"
import { HoldingDetailPage } from "@/components/holdings/holding-detail-page"
import { RebalancePage } from "@/components/rebalance/rebalance-page"

function App() {
  const auth = useAuth()
  const portfolio = usePortfolio(auth.session?.user?.id)

  // Loading state
  if (auth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Not authenticated
  if (!auth.session) {
    return (
      <AuthScreen
        onLogin={auth.signIn}
        onSignUp={auth.signUp}
        isLoading={auth.loading}
      />
    )
  }

  // Authenticated - show routes
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Dashboard
              stocks={portfolio.stocks}
              historicalData={portfolio.historicalData}
              totalValue={portfolio.totalValue}
              totalPnl={portfolio.totalPnl}
              loading={portfolio.loading}
              error={portfolio.error}
              userEmail={auth.session.user.email}
              onLogout={auth.signOut}
              onAddStock={portfolio.addStock}
              onRemoveStock={portfolio.removeStock}
              onRefresh={portfolio.refresh}
              portfolios={portfolio.portfolios}
              activePortfolioId={portfolio.activePortfolioId}
              onSelectPortfolio={portfolio.setActivePortfolioId}
              onCreatePortfolio={portfolio.createPortfolio}
              onUpdatePortfolio={portfolio.updatePortfolio}
              onDeletePortfolio={portfolio.deletePortfolio}
            />
          }
        />
        <Route path="/holdings/:holdingId" element={<HoldingDetailPage />} />
        <Route
          path="/rebalance"
          element={
            <RebalancePage
              portfolioId={portfolio.activePortfolioId}
              stocks={portfolio.stocks}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
