import { SummaryCards } from "./summary-cards"
import { HoldingsTable } from "./holdings-table"
import { PortfolioChart } from "./portfolio-chart"
import { AddStockDialog } from "./add-stock-dialog"
import { PortfolioSelector } from "./portfolio-selector"
import { RecommendationsPanel } from "./recommendations-panel"
import { ImportExportDialog } from "./import-export-dialog"
import { EfficientFrontierChart } from "./efficient-frontier-chart"
import { Header } from "./header"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { PortfolioStock } from "@/hooks/use-portfolio"
import type { Portfolio, HistoricalDataPoint } from "@/lib/api"

interface DashboardProps {
  stocks: PortfolioStock[]
  historicalData: HistoricalDataPoint[]
  totalValue: number
  totalPnl: number
  loading: boolean
  error: string | null
  userEmail?: string
  onLogout: () => void
  onAddStock: (data: { symbol: string; quantity: number; purchase_price: number }) => Promise<boolean>
  onRemoveStock: (id: string) => void
  onRefresh: () => void
  portfolios: Portfolio[]
  activePortfolioId: string | null
  onSelectPortfolio: (id: string) => void
  onCreatePortfolio: (name: string, description?: string) => Promise<Portfolio | null>
  onUpdatePortfolio: (id: string, name: string, description?: string) => Promise<boolean>
  onDeletePortfolio: (id: string) => Promise<boolean>
}

export function Dashboard({
  stocks,
  historicalData,
  totalValue,
  totalPnl,
  loading,
  error,
  userEmail,
  onLogout,
  onAddStock,
  onRemoveStock,
  onRefresh,
  portfolios,
  activePortfolioId,
  onSelectPortfolio,
  onCreatePortfolio,
  onUpdatePortfolio,
  onDeletePortfolio,
}: DashboardProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header userEmail={userEmail} onLogout={onLogout} />

      <main className="container py-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">
                Track and manage your investment portfolio
              </p>
            </div>
            <PortfolioSelector
              portfolios={portfolios}
              activePortfolioId={activePortfolioId}
              onSelect={onSelectPortfolio}
              onCreate={onCreatePortfolio}
              onUpdate={onUpdatePortfolio}
              onDelete={onDeletePortfolio}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={onRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <ImportExportDialog portfolioId={activePortfolioId} onImportComplete={onRefresh} />
            <AddStockDialog onAdd={onAddStock} />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && stocks.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <SummaryCards stocks={stocks} totalValue={totalValue} totalPnl={totalPnl} />

            {/* Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <PortfolioChart data={historicalData} currentValue={totalValue} loading={loading} />
              {stocks.length >= 2 && (
                <EfficientFrontierChart portfolioId={activePortfolioId} />
              )}
            </div>

            {/* Holdings Table & Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <HoldingsTable
                  stocks={stocks}
                  onRemove={onRemoveStock}
                />
              </div>
              <div>
                <RecommendationsPanel
                  portfolioId={activePortfolioId}
                  currentTickers={stocks.map((s) => s.symbol)}
                />
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © 2024 Portfolio Balancer. Built with AI-powered insights.
          </p>
        </div>
      </footer>
    </div>
  )
}
