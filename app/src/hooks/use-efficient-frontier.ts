import { useState, useCallback } from "react"
import { efficientFrontierApi, type EfficientFrontierResponse } from "@/lib/api"

export function useEfficientFrontier(portfolioId: string | null) {
  const [data, setData] = useState<EfficientFrontierResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFrontier = useCallback(async () => {
    if (!portfolioId) return
    setLoading(true)
    setError(null)
    try {
      const result = await efficientFrontierApi.get(portfolioId)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to compute efficient frontier")
    } finally {
      setLoading(false)
    }
  }, [portfolioId])

  return { data, loading, error, fetchFrontier }
}
