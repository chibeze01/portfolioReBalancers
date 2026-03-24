import { useState } from "react"
import { ChevronDown, Plus, Pencil, Trash2, FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Portfolio } from "@/lib/api"

interface PortfolioSelectorProps {
  portfolios: Portfolio[]
  activePortfolioId: string | null
  onSelect: (id: string) => void
  onCreate: (name: string, description?: string) => Promise<Portfolio | null>
  onUpdate: (id: string, name: string, description?: string) => Promise<boolean>
  onDelete: (id: string) => Promise<boolean>
}

export function PortfolioSelector({
  portfolios,
  activePortfolioId,
  onSelect,
  onCreate,
  onUpdate,
  onDelete,
}: PortfolioSelectorProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activePortfolio = portfolios.find((p) => p.id === activePortfolioId)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("Name is required")
      return
    }
    setLoading(true)
    setError(null)
    const result = await onCreate(name.trim(), description.trim() || undefined)
    setLoading(false)
    if (result) {
      setName("")
      setDescription("")
      setCreateOpen(false)
    } else {
      setError("Failed to create portfolio")
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPortfolio || !name.trim()) {
      setError("Name is required")
      return
    }
    setLoading(true)
    setError(null)
    const success = await onUpdate(editingPortfolio.id, name.trim(), description.trim() || undefined)
    setLoading(false)
    if (success) {
      setEditOpen(false)
      setEditingPortfolio(null)
    } else {
      setError("Failed to update portfolio")
    }
  }

  const handleDelete = async () => {
    if (!editingPortfolio) return
    setLoading(true)
    const success = await onDelete(editingPortfolio.id)
    setLoading(false)
    if (success) {
      setDeleteOpen(false)
      setEditingPortfolio(null)
    }
  }

  const openEdit = (p: Portfolio) => {
    setEditingPortfolio(p)
    setName(p.name)
    setDescription(p.description || "")
    setError(null)
    setEditOpen(true)
    setDropdownOpen(false)
  }

  const openDelete = (p: Portfolio) => {
    setEditingPortfolio(p)
    setDeleteOpen(true)
    setDropdownOpen(false)
  }

  return (
    <div className="relative">
      {/* Trigger */}
      <Button
        variant="outline"
        className="gap-2 min-w-[180px] justify-between"
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        <div className="flex items-center gap-2 truncate">
          <FolderOpen className="h-4 w-4 shrink-0" />
          <span className="truncate">{activePortfolio?.name || "Select Portfolio"}</span>
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {/* Dropdown */}
      {dropdownOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-50 min-w-[240px] rounded-md border bg-popover p-1 shadow-md">
            {portfolios.map((p) => (
              <div
                key={p.id}
                className={`flex items-center justify-between rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent ${
                  p.id === activePortfolioId ? "bg-accent" : ""
                }`}
              >
                <span
                  className="flex-1 truncate"
                  onClick={() => {
                    onSelect(p.id)
                    setDropdownOpen(false)
                  }}
                >
                  {p.name}
                </span>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    className="p-1 rounded hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation()
                      openEdit(p)
                    }}
                  >
                    <Pencil className="h-3 w-3 text-muted-foreground" />
                  </button>
                  {portfolios.length > 1 && (
                    <button
                      className="p-1 rounded hover:bg-muted"
                      onClick={(e) => {
                        e.stopPropagation()
                        openDelete(p)
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div className="border-t mt-1 pt-1">
              <button
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
                onClick={() => {
                  setName("")
                  setDescription("")
                  setError(null)
                  setCreateOpen(true)
                  setDropdownOpen(false)
                }}
              >
                <Plus className="h-4 w-4" />
                New Portfolio
              </button>
            </div>
          </div>
        </>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Create Portfolio</DialogTitle>
              <DialogDescription>Create a new investment portfolio to track your holdings.</DialogDescription>
            </DialogHeader>
            {error && (
              <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="portfolio-name" className="text-right">Name</Label>
                <Input
                  id="portfolio-name"
                  placeholder="My Portfolio"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="col-span-3"
                  disabled={loading}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="portfolio-desc" className="text-right">Description</Label>
                <Input
                  id="portfolio-desc"
                  placeholder="Optional description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="col-span-3"
                  disabled={loading}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle>Edit Portfolio</DialogTitle>
              <DialogDescription>Update your portfolio details.</DialogDescription>
            </DialogHeader>
            {error && (
              <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">Name</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="col-span-3"
                  disabled={loading}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-desc" className="text-right">Description</Label>
                <Input
                  id="edit-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="col-span-3"
                  disabled={loading}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Portfolio</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{editingPortfolio?.name}"? This will also delete all holdings in this portfolio. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
