import { useState, useCallback } from "react"
import { monteCarloApi, type MonteCarloResponse } from "@/lib/api"

export function useMonteCarloFrontier(portfolioId: string | null) {
  const [data, setData] = useState<MonteCarloResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSimulation = useCallback(async () => {
    if (!portfolioId) return
    setLoading(true)
    setError(null)
    try {
      const result = await monteCarloApi.get(portfolioId)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run Monte Carlo simulation")
    } finally {
      setLoading(false)
    }
  }, [portfolioId])

  return { data, loading, error, fetchSimulation }
}
