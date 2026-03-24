import { useEffect } from "react"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, TrendingUp } from "lucide-react"
import { useEfficientFrontier } from "@/hooks/use-efficient-frontier"

interface EfficientFrontierChartProps {
  portfolioId: string | null
}

interface TooltipPayload {
  payload?: {
    volatility?: number
    expected_return?: number
    weights?: Record<string, number>
  }
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload || payload.length === 0) return null
  const data = payload[0]?.payload
  if (!data) return null

  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm">
      <p className="text-sm font-medium">
        Return: {data.expected_return?.toFixed(2)}% | Risk: {data.volatility?.toFixed(2)}%
      </p>
      {data.weights && (
        <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
          {Object.entries(data.weights)
            .filter(([, w]) => w > 0.5)
            .sort(([, a], [, b]) => b - a)
            .map(([symbol, weight]) => (
              <div key={symbol}>
                {symbol}: {weight.toFixed(1)}%
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

export function EfficientFrontierChart({ portfolioId }: EfficientFrontierChartProps) {
  const { data, loading, error, fetchFrontier } = useEfficientFrontier(portfolioId)

  useEffect(() => {
    fetchFrontier()
  }, [fetchFrontier])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Efficient Frontier
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={fetchFrontier} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {loading && !data ? (
          <div className="flex items-center justify-center h-[350px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[350px]">
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : !data ? (
          <div className="flex items-center justify-center h-[350px]">
            <p className="text-sm text-muted-foreground">
              Add at least 2 holdings to see the efficient frontier.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                type="number"
                dataKey="volatility"
                name="Risk (Volatility)"
                unit="%"
                tick={{ fontSize: 12 }}
                label={{ value: "Risk (Volatility %)", position: "bottom", offset: 0, fontSize: 12 }}
              />
              <YAxis
                type="number"
                dataKey="expected_return"
                name="Expected Return"
                unit="%"
                tick={{ fontSize: 12 }}
                label={{ value: "Return %", angle: -90, position: "insideLeft", fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" />

              {/* Frontier curve */}
              <Scatter
                name="Efficient Frontier"
                data={data.frontier_points}
                fill="hsl(var(--chart-1))"
                line={{ stroke: "hsl(var(--chart-1))", strokeWidth: 2 }}
                lineType="monotone"
                r={2}
              />

              {/* Current portfolio */}
              <ReferenceDot
                x={data.current_portfolio.volatility}
                y={data.current_portfolio.expected_return}
                r={8}
                fill="hsl(var(--chart-2))"
                stroke="hsl(var(--chart-2))"
                label={{ value: "You", position: "top", fontSize: 11, fill: "hsl(var(--chart-2))" }}
              />

              {/* Target portfolio */}
              {data.target_portfolio && (
                <ReferenceDot
                  x={data.target_portfolio.volatility}
                  y={data.target_portfolio.expected_return}
                  r={7}
                  fill="hsl(var(--chart-3))"
                  stroke="hsl(var(--chart-3))"
                  label={{ value: "Target", position: "top", fontSize: 11, fill: "hsl(var(--chart-3))" }}
                />
              )}

              {/* Min variance */}
              <ReferenceDot
                x={data.min_variance.volatility}
                y={data.min_variance.expected_return}
                r={6}
                fill="hsl(var(--chart-4))"
                stroke="hsl(var(--chart-4))"
                shape="diamond"
                label={{ value: "Min Risk", position: "bottom", fontSize: 10, fill: "hsl(var(--chart-4))" }}
              />

              {/* Max Sharpe */}
              <ReferenceDot
                x={data.max_sharpe.volatility}
                y={data.max_sharpe.expected_return}
                r={7}
                fill="hsl(var(--chart-5))"
                stroke="hsl(var(--chart-5))"
                shape="star"
                label={{ value: "Optimal", position: "top", fontSize: 10, fill: "hsl(var(--chart-5))" }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
