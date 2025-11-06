"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getCustomers, deleteCustomer } from "@/lib/services/customers"
import type { Customer } from "@/lib/types"
import { CustomersTable } from "@/components/customers/customers-table"
import { CustomerDialog } from "@/components/customers/customer-dialog"
import { useToast } from "@/hooks/use-toast"

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    void loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      setIsLoading(true)
      const list = await getCustomers()
      setCustomers(list)
    } catch (err: any) {
      toast({
        title: "Failed to load customers",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (query: string) => setSearchQuery(query)

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase()
    return (
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.nicOrPassport.toLowerCase().includes(q)
    )
  })

  const handleAddCustomer = () => {
    setEditingCustomer(null)
    setIsDialogOpen(true)
  }

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer)
    setIsDialogOpen(true)
  }

  const handleDeleteCustomer = async (customer: Customer) => {
    const ok = confirm(`Are you sure you want to delete ${customer.firstName} ${customer.lastName}?`)
    if (!ok) return
    try {
      await deleteCustomer(customer.id)
      toast({
        title: "Customer deleted",
        description: `${customer.firstName} ${customer.lastName} has been removed from the system.`,
      })
      await loadCustomers()
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
    setEditingCustomer(null)
    if (shouldRefresh) {
      await loadCustomers()
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Customers"
        showSearch
        onSearch={handleSearch}
        actions={
          <Button onClick={handleAddCustomer}>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex h-[200px] items-center justify-center rounded-lg border">
          <p className="text-sm text-muted-foreground">Loading customers…</p>
        </div>
      ) : (
        <CustomersTable customers={filteredCustomers} onEdit={handleEditCustomer} onDelete={handleDeleteCustomer} />
      )}

      <CustomerDialog open={isDialogOpen} customer={editingCustomer} onClose={handleDialogClose} />
    </div>
  )
}
