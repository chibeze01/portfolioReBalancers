import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { formatCurrency } from "@/lib/utils"
import { holdingsApi, type HoldingDetail } from "@/lib/api"
import { Loader2, ArrowLeft } from "lucide-react"

export function HoldingDetailPage() {
  const { holdingId } = useParams<{ holdingId: string }>()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<HoldingDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!holdingId) return

    const fetchDetail = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await holdingsApi.getDetail(holdingId)
        setDetail(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load holding details")
      } finally {
        setLoading(false)
      }
    }

    fetchDetail()
  }, [holdingId])

  const isProfitable = detail ? Number(detail.unrealized_pnl) >= 0 : false

  // Format chart data
  const chartData = detail?.price_history.map((point) => ({
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    price: Number(point.price),
  })) || []

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-6">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        </div>
      </div>
    )
  }

  if (!detail) return null

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Portfolio
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{detail.symbol}</h1>
              <p className="text-muted-foreground">{detail.metadata.name}</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Current Price</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(Number(detail.current_price))}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Value</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(Number(detail.total_value))}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Unrealized P&L</CardDescription>
              <CardTitle className={`text-2xl ${isProfitable ? "text-chart-1" : "text-destructive"}`}>
                {isProfitable ? "+" : ""}{formatCurrency(Number(detail.unrealized_pnl))}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Return</CardDescription>
              <CardTitle className={`text-2xl ${isProfitable ? "text-chart-1" : "text-destructive"}`}>
                {isProfitable ? "+" : ""}{Number(detail.pnl_percent).toFixed(2)}%
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Price Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Price Chart</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                {payload[0].payload.date}
                              </span>
                              <span className="font-bold">
                                {formatCurrency(payload[0].value as number)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  fill="url(#colorPrice)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Holdings Info & Stock Metadata */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Holding Information */}
          <Card>
            <CardHeader>
              <CardTitle>Your Position</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shares</span>
                <span className="font-medium">{Number(detail.quantity).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Purchase Price</span>
                <span className="font-medium">{formatCurrency(Number(detail.average_cost))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Purchase Date</span>
                <span className="font-medium">
                  {detail.purchase_date ? new Date(detail.purchase_date).toLocaleDateString() : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cost Basis</span>
                <span className="font-medium">
                  {formatCurrency(Number(detail.average_cost) * Number(detail.quantity))}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Stock Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Stock Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {detail.metadata.sector && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sector</span>
                  <span className="font-medium">{detail.metadata.sector}</span>
                </div>
              )}
              {detail.metadata.industry && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Industry</span>
                  <span className="font-medium">{detail.metadata.industry}</span>
                </div>
              )}
              {detail.metadata.market_cap && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Market Cap</span>
                  <span className="font-medium">
                    ${(Number(detail.metadata.market_cap) / 1e9).toFixed(2)}B
                  </span>
                </div>
              )}
              {detail.metadata.pe_ratio && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">P/E Ratio</span>
                  <span className="font-medium">{Number(detail.metadata.pe_ratio).toFixed(2)}</span>
                </div>
              )}
              {detail.metadata.dividend_yield && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Div. Yield</span>
                  <span className="font-medium">
                    {(Number(detail.metadata.dividend_yield) * 100).toFixed(2)}%
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
