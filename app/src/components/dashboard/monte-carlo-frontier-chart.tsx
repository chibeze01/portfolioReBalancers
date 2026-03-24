import { useEffect, useMemo } from "react"
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
import { Loader2, RefreshCw, BarChart2 } from "lucide-react"
import { useMonteCarloFrontier } from "@/hooks/use-monte-carlo-frontier"
import type { MonteCarloPortfolioPoint } from "@/lib/api"

interface MonteCarloFrontierChartProps {
  portfolioId: string | null
}

/** Map a Sharpe ratio in [min, max] to an hsl colour: red (low) → green (high). */
function sharpeColor(sharpe: number, min: number, max: number): string {
  const range = max - min
  const t = range === 0 ? 0.5 : Math.max(0, Math.min(1, (sharpe - min) / range))
  const hue = Math.round(t * 120) // 0 = red, 120 = green
  return `hsl(${hue}, 70%, 50%)`
}

interface TooltipPayload {
  payload?: {
    volatility?: number
    expected_return?: number
    sharpe_ratio?: number
    weights?: Record<string, number>
    label?: string
  }
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload || payload.length === 0) return null
  const d = payload[0]?.payload
  if (!d) return null

  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm text-sm">
      {d.label && <p className="font-semibold mb-1">{d.label}</p>}
      <p>Return: {d.expected_return?.toFixed(2)}%</p>
      <p>Risk: {d.volatility?.toFixed(2)}%</p>
      <p>Sharpe: {d.sharpe_ratio?.toFixed(3)}</p>
      {d.weights && (
        <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
          {Object.entries(d.weights)
            .filter(([, w]) => w > 0.5)
            .sort(([, a], [, b]) => b - a)
            .map(([sym, w]) => (
              <div key={sym}>
                {sym}: {w.toFixed(1)}%
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

function specialPoint(p: MonteCarloPortfolioPoint, label: string) {
  return { ...p, label }
}

export function MonteCarloFrontierChart({ portfolioId }: MonteCarloFrontierChartProps) {
  const { data, loading, error, fetchSimulation } = useMonteCarloFrontier(portfolioId)

  useEffect(() => {
    fetchSimulation()
  }, [fetchSimulation])

  // Pre-compute per-dot colours from Sharpe ratios
  const { coloredDots, minSharpe, maxSharpe } = useMemo(() => {
    if (!data) return { coloredDots: [], minSharpe: 0, maxSharpe: 1 }
    const sharpes = data.simulated_portfolios.map((p) => p.sharpe_ratio)
    const mn = Math.min(...sharpes)
    const mx = Math.max(...sharpes)
    return {
      coloredDots: data.simulated_portfolios.map((p) => ({
        ...p,
        color: sharpeColor(p.sharpe_ratio, mn, mx),
      })),
      minSharpe: mn,
      maxSharpe: mx,
    }
  }, [data])

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart2 className="h-5 w-5" />
            Monte Carlo Simulation — 10,000 Portfolios
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Each dot is a randomly sampled weight vector. Colour: red = low Sharpe → green = high Sharpe.
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchSimulation} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {loading && !data ? (
          <div className="flex flex-col items-center justify-center h-[450px] gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Running 10,000 simulations…
            </p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[450px]">
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : !data ? (
          <div className="flex items-center justify-center h-[450px]">
            <p className="text-sm text-muted-foreground">
              Add at least 2 holdings to run the simulation.
            </p>
          </div>
        ) : (
          <>
            {/* Colour legend */}
            <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
              <span>Low Sharpe</span>
              <div
                className="h-3 w-32 rounded"
                style={{
                  background: `linear-gradient(to right, hsl(0,70%,50%), hsl(60,70%,50%), hsl(120,70%,50%))`,
                }}
              />
              <span>High Sharpe</span>
              <span className="ml-4">
                Range: {minSharpe.toFixed(2)} – {maxSharpe.toFixed(2)}
              </span>
            </div>

            <ResponsiveContainer width="100%" height={450}>
              <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  type="number"
                  dataKey="volatility"
                  name="Risk (Volatility)"
                  unit="%"
                  tick={{ fontSize: 11 }}
                  label={{ value: "Risk — Volatility (%)", position: "bottom", offset: 10, fontSize: 12 }}
                />
                <YAxis
                  type="number"
                  dataKey="expected_return"
                  name="Expected Return"
                  unit="%"
                  tick={{ fontSize: 11 }}
                  label={{ value: "Return (%)", angle: -90, position: "insideLeft", fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" />

                {/* 10,000 simulated portfolios */}
                <Scatter
                  name="Simulated portfolios"
                  data={coloredDots}
                  shape={(props: any) => {
                    const { cx, cy, payload } = props
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={1}
                        fill={payload.color}
                        opacity={0.7}
                      />
                    )
                  }}
                />

                {/* Current portfolio */}
                <ReferenceDot
                  x={data.current_portfolio.volatility}
                  y={data.current_portfolio.expected_return}
                  r={9}
                  fill="hsl(var(--chart-2))"
                  stroke="white"
                  strokeWidth={1.5}
                  label={{
                    value: "You",
                    position: "top",
                    fontSize: 11,
                    fill: "hsl(var(--chart-2))",
                  }}
                />

                {/* Target portfolio */}
                {data.target_portfolio && (
                  <ReferenceDot
                    x={data.target_portfolio.volatility}
                    y={data.target_portfolio.expected_return}
                    r={8}
                    fill="hsl(var(--chart-3))"
                    stroke="white"
                    strokeWidth={1.5}
                    label={{
                      value: "Target",
                      position: "top",
                      fontSize: 11,
                      fill: "hsl(var(--chart-3))",
                    }}
                  />
                )}

                {/* Min variance */}
                <ReferenceDot
                  x={data.min_variance.volatility}
                  y={data.min_variance.expected_return}
                  r={8}
                  fill="hsl(var(--chart-4))"
                  stroke="white"
                  strokeWidth={1.5}
                  label={{
                    value: "Min Risk",
                    position: "insideBottomLeft",
                    fontSize: 10,
                    fill: "hsl(var(--chart-4))",
                  }}
                />

                {/* Max Sharpe */}
                <ReferenceDot
                  x={data.max_sharpe.volatility}
                  y={data.max_sharpe.expected_return}
                  r={9}
                  fill="hsl(var(--chart-5))"
                  stroke="white"
                  strokeWidth={1.5}
                  label={{
                    value: "Best Sharpe",
                    position: "top",
                    fontSize: 10,
                    fill: "hsl(var(--chart-5))",
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>

            <p className="text-xs text-muted-foreground text-right mt-1">
              {data.num_samples.toLocaleString()} portfolios sampled · risk-free rate {(data.risk_free_rate * 100).toFixed(1)}%
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
