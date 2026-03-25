import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, Grid3X3 } from "lucide-react"
import { useCorrelationMatrix } from "@/hooks/use-correlation-matrix"

interface CorrelationHeatmapProps {
  portfolioId: string | null
}

function getColor(value: number): string {
  // Diverging color scale: blue (-1) → white (0) → red (+1)
  const abs = Math.min(Math.abs(value), 1)
  if (value >= 0) {
    // White to red
    const r = 220
    const g = Math.round(220 - 180 * abs)
    const b = Math.round(220 - 190 * abs)
    return `rgb(${r}, ${g}, ${b})`
  } else {
    // White to blue
    const r = Math.round(220 - 190 * abs)
    const g = Math.round(220 - 140 * abs)
    const b = 220
    return `rgb(${r}, ${g}, ${b})`
  }
}

function getTextColor(value: number): string {
  return Math.abs(value) > 0.7 ? "white" : "inherit"
}

export function CorrelationHeatmap({ portfolioId }: CorrelationHeatmapProps) {
  const { data, loading, error, fetchMatrix } = useCorrelationMatrix(portfolioId)
  const [tooltip, setTooltip] = useState<{ row: string; col: string; corr: number; cov: number; x: number; y: number } | null>(null)

  useEffect(() => {
    fetchMatrix()
  }, [fetchMatrix])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Grid3X3 className="h-5 w-5" />
          Correlation Matrix
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={fetchMatrix} disabled={loading}>
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
              Add at least 2 holdings to see the correlation matrix.
            </p>
          </div>
        ) : (
          <div className="relative">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" style={{ minWidth: `${(data.symbols.length + 1) * 64}px` }}>
                <thead>
                  <tr>
                    <th className="p-1 text-xs font-medium text-muted-foreground" />
                    {data.symbols.map((symbol) => (
                      <th
                        key={symbol}
                        className="p-1 text-xs font-medium text-muted-foreground text-center"
                        style={{ minWidth: "56px" }}
                      >
                        {symbol}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.symbols.map((rowSymbol, i) => (
                    <tr key={rowSymbol}>
                      <td className="p-1 text-xs font-medium text-muted-foreground text-right pr-2 whitespace-nowrap">
                        {rowSymbol}
                      </td>
                      {data.symbols.map((colSymbol, j) => {
                        const corr = data.correlation_matrix[i][j]
                        const cov = data.covariance_matrix[i][j]
                        return (
                          <td
                            key={colSymbol}
                            className="p-0 text-center cursor-default transition-opacity"
                            style={{ minWidth: "56px", height: "40px" }}
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect()
                              setTooltip({ row: rowSymbol, col: colSymbol, corr, cov, x: rect.left + rect.width / 2, y: rect.top })
                            }}
                            onMouseLeave={() => setTooltip(null)}
                          >
                            <div
                              className="flex items-center justify-center h-full rounded-sm mx-0.5 my-0.5"
                              style={{
                                backgroundColor: getColor(corr),
                                color: getTextColor(corr),
                                height: "36px",
                              }}
                            >
                              <span className="text-xs font-mono font-medium">
                                {corr.toFixed(2)}
                              </span>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tooltip */}
            {tooltip && (
              <div
                className="fixed z-50 rounded-lg border bg-background p-3 shadow-md pointer-events-none"
                style={{ left: tooltip.x, top: tooltip.y - 8, transform: "translate(-50%, -100%)" }}
              >
                <p className="text-sm font-medium">
                  {tooltip.row} vs {tooltip.col}
                </p>
                <p className="text-xs text-muted-foreground">
                  Correlation: {tooltip.corr.toFixed(4)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Covariance: {tooltip.cov.toFixed(6)}
                </p>
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="text-xs text-muted-foreground">-1.0</span>
              <div
                className="h-3 rounded-sm"
                style={{
                  width: "200px",
                  background: `linear-gradient(to right, rgb(30, 80, 220), rgb(220, 220, 220), rgb(220, 40, 30))`,
                }}
              />
              <span className="text-xs text-muted-foreground">+1.0</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
