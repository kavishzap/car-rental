"use client"

import { useEffect, useState, useCallback } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getContracts, deleteContract } from "@/lib/services/contracts"
import type { Contract } from "@/lib/types"
import { ContractsTable } from "@/components/contracts/contracts-table"
import { ContractDialog } from "@/components/contracts/contract-dialog"
import { useToast } from "@/hooks/use-toast"

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingContract, setEditingContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const loadContracts = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getContracts() // ⬅️ await the async service
      setContracts(data)
    } catch (err: any) {
      toast({
        title: "Failed to load contracts",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadContracts()
  }, [loadContracts])

  const handleSearch = (query: string) => setSearchQuery(query)

  const filteredContracts = contracts.filter((c) =>
    c.contractNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddContract = () => {
    setEditingContract(null)
    setIsDialogOpen(true)
  }

  const handleEditContract = (contract: Contract) => {
    setEditingContract(contract)
    setIsDialogOpen(true)
  }

  const handleDeleteContract = async (contract: Contract) => {
    try {
      await deleteContract(contract.id) // ⬅️ await deletion
      toast({
        title: "Contract deleted",
        description: `Contract ${contract.contractNumber} has been removed from the system.`,
      })
      await loadContracts()
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDialogClose = async (shouldRefresh?: boolean) => {
    setIsDialogOpen(false)
    setEditingContract(null)
    if (shouldRefresh) {
      await loadContracts()
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Contracts"
        showSearch
        onSearch={handleSearch}
        actions={
          <Button onClick={handleAddContract}>
            <Plus className="mr-2 h-4 w-4" />
            New Contract
          </Button>
        }
      />

      <ContractsTable
        contracts={filteredContracts}
        onEdit={handleEditContract}
        onDelete={handleDeleteContract}
      />

      <ContractDialog
        open={isDialogOpen}
        contract={editingContract}
        onClose={handleDialogClose}
      />

      {/* Optional tiny loading hint */}
      {loading && <div className="text-sm text-muted-foreground px-4">Loading…</div>}
    </div>
  )
}
