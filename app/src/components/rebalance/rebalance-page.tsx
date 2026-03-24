import { useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { AllocationEditor } from "./allocation-editor"
import { RebalanceResults } from "./rebalance-results"
import { useRebalance } from "@/hooks/use-rebalance"
import type { PortfolioStock } from "@/hooks/use-portfolio"

interface RebalancePageProps {
  portfolioId: string | null
  stocks: PortfolioStock[]
}

export function RebalancePage({ portfolioId, stocks }: RebalancePageProps) {
  const navigate = useNavigate()
  const { rebalanceData, loading, saving, error, fetchRebalance, saveAllocations } = useRebalance(portfolioId)

  useEffect(() => {
    fetchRebalance()
  }, [fetchRebalance])

  // Map symbol -> holdingId for the allocation editor
  const holdingIds = useMemo(() => {
    const map = new Map<string, string>()
    stocks.forEach((s) => map.set(s.symbol, s.id))
    return map
  }, [stocks])

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Rebalance Portfolio</h1>
            <p className="text-muted-foreground">
              Set target allocations and see recommended trades to rebalance your portfolio.
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !rebalanceData || rebalanceData.actions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No holdings found. Add stocks to your portfolio before rebalancing.
              </p>
              <Button className="mt-4" onClick={() => navigate("/")}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Allocation Editor */}
            <Card>
              <CardContent className="pt-6">
                <AllocationEditor
                  actions={rebalanceData.actions}
                  holdingIds={holdingIds}
                  onSave={saveAllocations}
                  saving={saving}
                />
              </CardContent>
            </Card>

            <Separator />

            {/* Rebalance Results */}
            <Card>
              <CardContent className="pt-6">
                <RebalanceResults
                  actions={rebalanceData.actions}
                  totalValue={rebalanceData.total_value}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
