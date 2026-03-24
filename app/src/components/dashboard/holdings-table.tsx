import { Trash2, TrendingUp, TrendingDown } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatNumber } from "@/lib/utils"
import type { PortfolioStock } from "@/hooks/use-portfolio"

interface HoldingsTableProps {
  stocks: PortfolioStock[]
  onRemove: (id: string) => void
}

export function HoldingsTable({ stocks, onRemove }: HoldingsTableProps) {
  const navigate = useNavigate()
  if (stocks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Holdings</CardTitle>
          <CardDescription>Your portfolio is empty</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No holdings yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              Add your first stock to start tracking your portfolio performance.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Holdings</CardTitle>
        <CardDescription>
          {stocks.length} {stocks.length === 1 ? "position" : "positions"} in your portfolio
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead className="text-right">Shares</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Avg Cost</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead className="text-right">Allocation</TableHead>
              <TableHead className="text-right">P&L</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stocks.map((stock) => {
              const value = stock.quantity * stock.price
              const isPositive = stock.unrealized_pnl >= 0

              return (
                <TableRow 
                  key={stock.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/holdings/${stock.id}`)}
                >
                  <TableCell className="font-medium">{stock.symbol}</TableCell>
                  <TableCell className="text-right">{formatNumber(stock.quantity, 0)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(stock.price)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(stock.averageCost)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(value)}</TableCell>
                  <TableCell className="text-right">{stock.allocation.toFixed(1)}%</TableCell>
                  <TableCell className="text-right">
                    <div className={`flex items-center justify-end gap-1 ${isPositive ? "text-chart-1" : "text-destructive"}`}>
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span>{isPositive ? "+" : ""}{formatCurrency(stock.unrealized_pnl)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation() // Prevent row click
                        onRemove(stock.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
