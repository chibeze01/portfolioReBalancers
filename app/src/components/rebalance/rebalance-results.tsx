import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { RebalanceAction } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"

interface RebalanceResultsProps {
  actions: RebalanceAction[]
  totalValue: number
}

export function RebalanceResults({ actions, totalValue }: RebalanceResultsProps) {
  const buys = actions.filter((a) => a.action === "Buy")
  const sells = actions.filter((a) => a.action === "Sell")
  const holds = actions.filter((a) => a.action === "Hold")
  const totalBuyValue = buys.reduce((s, a) => s + a.delta_value, 0)
  const totalSellValue = sells.reduce((s, a) => s + Math.abs(a.delta_value), 0)

  const actionColor = (action: string) => {
    switch (action) {
      case "Buy": return "text-green-600"
      case "Sell": return "text-red-600"
      default: return "text-muted-foreground"
    }
  }

  const actionBg = (action: string) => {
    switch (action) {
      case "Buy": return "bg-green-500/10"
      case "Sell": return "bg-red-500/10"
      default: return "bg-muted/50"
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Rebalance Recommendations</h3>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(totalValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{buys.length + sells.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-green-600">Buy Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">{formatCurrency(totalBuyValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-red-600">Sell Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-red-600">{formatCurrency(totalSellValue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Trade Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Symbol</TableHead>
            <TableHead>Action</TableHead>
            <TableHead className="text-right">Current %</TableHead>
            <TableHead className="text-right">Target %</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Shares</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {actions.map((a) => (
            <TableRow key={a.symbol} className={actionBg(a.action)}>
              <TableCell className="font-medium">{a.symbol}</TableCell>
              <TableCell>
                <span className={`font-semibold ${actionColor(a.action)}`}>{a.action}</span>
              </TableCell>
              <TableCell className="text-right">{a.current_allocation.toFixed(2)}%</TableCell>
              <TableCell className="text-right">{a.target_allocation.toFixed(2)}%</TableCell>
              <TableCell className="text-right">{formatCurrency(a.current_price)}</TableCell>
              <TableCell className={`text-right ${actionColor(a.action)}`}>
                {a.action === "Hold"
                  ? "—"
                  : `${a.delta_shares > 0 ? "+" : ""}${a.delta_shares.toFixed(2)}`}
              </TableCell>
              <TableCell className={`text-right ${actionColor(a.action)}`}>
                {a.action === "Hold"
                  ? "—"
                  : `${a.delta_value > 0 ? "+" : ""}${formatCurrency(Math.abs(a.delta_value))}`}
              </TableCell>
            </TableRow>
          ))}
          {actions.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                Set target allocations above to see rebalancing recommendations.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {holds.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {holds.length} holding{holds.length > 1 ? "s" : ""} within 1% of target — no action needed.
        </p>
      )}
    </div>
  )
}
