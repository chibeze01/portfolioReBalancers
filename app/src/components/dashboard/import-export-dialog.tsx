import { useState, useRef } from "react"
import { Download, Upload, FileUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { importExportApi, type ImportResult } from "@/lib/api"

interface ImportExportDialogProps {
  portfolioId: string | null
  onImportComplete: () => void
}

export function ImportExportDialog({ portfolioId, onImportComplete }: ImportExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    if (!portfolioId) return
    setLoading(true)
    setError(null)
    try {
      const blob = await importExportApi.exportCsv(portfolioId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `portfolio_${portfolioId}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed")
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!portfolioId || !selectedFile) return
    setLoading(true)
    setError(null)
    setImportResult(null)
    try {
      const result = await importExportApi.importCsv(portfolioId, selectedFile)
      setImportResult(result)
      if (result.imported > 0) {
        onImportComplete()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed")
    } finally {
      setLoading(false)
    }
  }

  const resetState = () => {
    setSelectedFile(null)
    setImportResult(null)
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetState() }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileUp className="mr-2 h-4 w-4" />
          Import/Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import / Export</DialogTitle>
          <DialogDescription>
            Import holdings from a CSV file or export your current portfolio.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        <Tabs defaultValue="export" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Download your holdings as a CSV file with columns: symbol, quantity, average_cost, target_allocation, purchase_date.
            </p>
            <Button onClick={handleExport} disabled={loading || !portfolioId} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              {loading ? "Downloading..." : "Download CSV"}
            </Button>
          </TabsContent>

          <TabsContent value="import" className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Upload a CSV file with columns: symbol, quantity, average_cost (or purchase_price). Optional: target_allocation, purchase_date.
            </p>

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  setSelectedFile(e.target.files?.[0] || null)
                  setImportResult(null)
                }}
              />
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                <Upload className="mr-2 h-4 w-4" />
                {selectedFile ? selectedFile.name : "Choose CSV file"}
              </Button>
            </div>

            {importResult && (
              <div className="rounded-md border p-3 space-y-2">
                <p className="text-sm font-medium text-green-600">
                  Successfully imported {importResult.imported} holding{importResult.imported !== 1 ? "s" : ""}.
                </p>
                {importResult.errors.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-destructive">
                      {importResult.errors.length} error{importResult.errors.length !== 1 ? "s" : ""}:
                    </p>
                    <ul className="text-xs text-destructive space-y-1 mt-1 max-h-32 overflow-y-auto">
                      {importResult.errors.map((e, i) => (
                        <li key={i}>Row {e.row}: {e.reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                onClick={handleImport}
                disabled={loading || !selectedFile || !portfolioId}
                className="w-full"
              >
                {loading ? "Importing..." : "Import"}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
