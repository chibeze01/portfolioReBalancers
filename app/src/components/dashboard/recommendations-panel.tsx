import { useState, useEffect, useCallback } from "react"
import { Lightbulb, RefreshCw, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { recommendationsApi, type Recommendation } from "@/lib/api"

interface RecommendationsPanelProps {
  portfolioId: string | null
  currentTickers: string[]
  onAddStock?: (symbol: string) => void
}

export function RecommendationsPanel({ portfolioId, currentTickers, onAddStock }: RecommendationsPanelProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRecommendations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let recs: Recommendation[]
      if (portfolioId) {
        recs = await recommendationsApi.getForPortfolio(portfolioId, 5)
      } else {
        recs = await recommendationsApi.getQuick(currentTickers, 5)
      }
      setRecommendations(recs)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load recommendations")
    } finally {
      setLoading(false)
    }
  }, [portfolioId, currentTickers])

  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Recommendations
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={fetchRecommendations} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="text-sm text-destructive mb-2">{error}</p>
        )}
        {loading && recommendations.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-md bg-muted animate-pulse" />
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No recommendations available. Add more holdings to get diversification suggestions.
          </p>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div
                key={rec.ticker}
                className="flex items-start justify-between gap-3 rounded-lg border p-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{rec.ticker}</span>
                    <span className="text-xs text-muted-foreground truncate">{rec.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{rec.reason}</p>
                </div>
                {onAddStock && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-8 w-8"
                    onClick={() => onAddStock(rec.ticker)}
                    title="Add to portfolio"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
