import { TrendingUp, TrendingDown, DollarSign, PieChart, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { PortfolioStock } from "@/hooks/use-portfolio"

interface SummaryCardsProps {
  stocks: PortfolioStock[]
  totalValue: number
  totalPnl: number
}

export function SummaryCards({ stocks, totalValue, totalPnl }: SummaryCardsProps) {
  const pnlPercent = totalValue > 0 ? (totalPnl / (totalValue - totalPnl)) * 100 : 0
  const isPositive = totalPnl >= 0

  const topPerformer = stocks.reduce((best, stock) => 
    !best || stock.priceChange > best.priceChange ? stock : best
  , null as PortfolioStock | null)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Portfolio Value */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
          <p className="text-xs text-muted-foreground">
            {stocks.length} holdings in portfolio
          </p>
        </CardContent>
      </Card>

      {/* Unrealized P&L */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Unrealized P&L</CardTitle>
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-chart-1" />
          ) : (
            <TrendingDown className="h-4 w-4 text-destructive" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${isPositive ? "text-chart-1" : "text-destructive"}`}>
            {isPositive ? "+" : ""}{formatCurrency(totalPnl)}
          </div>
          <p className="text-xs text-muted-foreground">
            {isPositive ? "+" : ""}{pnlPercent.toFixed(2)}% overall return
          </p>
        </CardContent>
      </Card>

      {/* Top Performer */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {topPerformer ? (
            <>
              <div className="text-2xl font-bold">{topPerformer.symbol}</div>
              <p className="text-xs text-chart-1">
                +{topPerformer.priceChange.toFixed(2)}% gain
              </p>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold">—</div>
              <p className="text-xs text-muted-foreground">No holdings yet</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Holdings Count */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Diversification</CardTitle>
          <PieChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stocks.length}</div>
          <p className="text-xs text-muted-foreground">
            {stocks.length >= 5 ? "Well diversified" : "Consider adding more"}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
