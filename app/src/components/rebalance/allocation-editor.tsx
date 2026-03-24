import { useState, useEffect } from "react"
import { Equal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { RebalanceAction, AllocationUpdate } from "@/lib/api"

interface AllocationEditorProps {
  actions: RebalanceAction[]
  holdingIds: Map<string, string> // symbol -> holdingId
  onSave: (allocations: AllocationUpdate[]) => Promise<boolean>
  saving: boolean
}

export function AllocationEditor({ actions, holdingIds, onSave, saving }: AllocationEditorProps) {
  const [targets, setTargets] = useState<Map<string, string>>(new Map())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initial = new Map<string, string>()
    actions.forEach((a) => {
      initial.set(a.symbol, String(a.target_allocation))
    })
    setTargets(initial)
  }, [actions])

  const setTarget = (symbol: string, value: string) => {
    setTargets((prev) => {
      const next = new Map(prev)
      next.set(symbol, value)
      return next
    })
    setError(null)
  }

  const equalWeight = () => {
    const weight = (100 / actions.length).toFixed(2)
    const newTargets = new Map<string, string>()
    actions.forEach((a) => newTargets.set(a.symbol, weight))
    setTargets(newTargets)
    setError(null)
  }

  const totalTarget = Array.from(targets.values()).reduce(
    (sum, v) => sum + (parseFloat(v) || 0),
    0
  )

  const handleSave = async () => {
    const total = Math.round(totalTarget * 100) / 100
    if (Math.abs(total - 100) > 0.5) {
      setError(`Target allocations must sum to 100%. Current total: ${total.toFixed(2)}%`)
      return
    }

    const allocations: AllocationUpdate[] = []
    for (const [symbol, value] of targets) {
      const holdingId = holdingIds.get(symbol)
      if (!holdingId) continue
      const parsed = parseFloat(value)
      if (isNaN(parsed) || parsed < 0) {
        setError(`Invalid allocation for ${symbol}`)
        return
      }
      allocations.push({ holding_id: holdingId, target_allocation: parsed })
    }

    await onSave(allocations)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Target Allocations</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={equalWeight}>
            <Equal className="mr-2 h-4 w-4" />
            Equal Weight
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save & Rebalance"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Symbol</TableHead>
            <TableHead className="text-right">Current %</TableHead>
            <TableHead className="text-right">Target %</TableHead>
            <TableHead className="text-right">Difference</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {actions.map((a) => {
            const target = parseFloat(targets.get(a.symbol) || "0")
            const diff = target - a.current_allocation
            return (
              <TableRow key={a.symbol}>
                <TableCell className="font-medium">{a.symbol}</TableCell>
                <TableCell className="text-right">{a.current_allocation.toFixed(2)}%</TableCell>
                <TableCell className="text-right w-28">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={targets.get(a.symbol) || ""}
                    onChange={(e) => setTarget(a.symbol, e.target.value)}
                    className="h-8 text-right"
                    disabled={saving}
                  />
                </TableCell>
                <TableCell
                  className={`text-right ${
                    diff > 0.5 ? "text-green-600" : diff < -0.5 ? "text-red-600" : "text-muted-foreground"
                  }`}
                >
                  {diff > 0 ? "+" : ""}{diff.toFixed(2)}%
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <div className="flex justify-end text-sm">
        <span className={Math.abs(totalTarget - 100) > 0.5 ? "text-destructive font-medium" : "text-muted-foreground"}>
          Total: {totalTarget.toFixed(2)}%
        </span>
      </div>
    </div>
  )
}
