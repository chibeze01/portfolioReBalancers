import { useState, useCallback } from "react"
import {
  rebalanceApi,
  type RebalanceResponse,
  type AllocationUpdate,
} from "@/lib/api"

export function useRebalance(portfolioId: string | null) {
  const [rebalanceData, setRebalanceData] = useState<RebalanceResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRebalance = useCallback(async () => {
    if (!portfolioId) return
    setLoading(true)
    setError(null)
    try {
      const data = await rebalanceApi.getRebalance(portfolioId)
      setRebalanceData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch rebalance data")
    } finally {
      setLoading(false)
    }
  }, [portfolioId])

  const saveAllocations = useCallback(
    async (allocations: AllocationUpdate[]) => {
      if (!portfolioId) return false
      setSaving(true)
      setError(null)
      try {
        await rebalanceApi.updateAllocations(portfolioId, allocations)
        // Refresh rebalance data after saving
        const data = await rebalanceApi.getRebalance(portfolioId)
        setRebalanceData(data)
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save allocations")
        return false
      } finally {
        setSaving(false)
      }
    },
    [portfolioId]
  )

  return {
    rebalanceData,
    loading,
    saving,
    error,
    fetchRebalance,
    saveAllocations,
  }
}
