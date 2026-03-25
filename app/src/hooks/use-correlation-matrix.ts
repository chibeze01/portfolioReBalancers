import { useState, useCallback } from "react"
import { correlationMatrixApi, type CorrelationMatrixResponse } from "@/lib/api"

export function useCorrelationMatrix(portfolioId: string | null) {
  const [data, setData] = useState<CorrelationMatrixResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMatrix = useCallback(async () => {
    if (!portfolioId) return
    setLoading(true)
    setError(null)
    try {
      const result = await correlationMatrixApi.get(portfolioId)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load correlation matrix")
    } finally {
      setLoading(false)
    }
  }, [portfolioId])

  return { data, loading, error, fetchMatrix }
}
