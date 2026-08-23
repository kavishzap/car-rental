"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getContracts, deleteContract } from "@/lib/services/contracts"
import { getCustomers } from "@/lib/services/customers"
import type { Contract, Customer } from "@/lib/types"
import { ContractsTable } from "@/components/contracts/contracts-table"
import { ContractDialog } from "@/components/contracts/contract-dialog"
import { useToast } from "@/hooks/use-toast"

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingContract, setEditingContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const loadContracts = useCallback(async () => {
    try {
      setLoading(true)
      const [data, customersList] = await Promise.all([
        getContracts(),
        getCustomers(),
      ])
      setContracts(data)
      setCustomers(customersList)
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

  const filteredContracts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return contracts

    const customerNameById = new Map(
      customers.map((c) => [c.id, `${c.firstName} ${c.lastName}`.toLowerCase()])
    )

    return contracts.filter((c) => {
      const customerName = customerNameById.get(c.customerId) ?? ""
      return (
        c.contractNumber?.toLowerCase().includes(q) ||
        customerName.includes(q)
      )
    })
  }, [contracts, customers, searchQuery])

  const customerNamesById = useMemo(
    () =>
      new Map(
        customers.map((c) => [c.id, `${c.firstName} ${c.lastName}`.trim()])
      ),
    [customers]
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

  const handleContractSaved = (saved: Contract) => {
    setContracts((prev) => {
      const idx = prev.findIndex((c) => c.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...prev[idx], ...saved }
        return next
      }
      return [saved, ...prev]
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Contracts"
        showSearch
        searchPlaceholder="Search by contract # or customer..."
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
        customerNamesById={customerNamesById}
        onEdit={handleEditContract}
        onDelete={handleDeleteContract}
        onRefresh={loadContracts}
      />

      <ContractDialog
        open={isDialogOpen}
        contract={editingContract}
        onClose={handleDialogClose}
        onSaved={handleContractSaved}
      />

      {/* Optional tiny loading hint */}
      {loading && <div className="text-sm text-muted-foreground px-4">Loading…</div>}
    </div>
  )
}
