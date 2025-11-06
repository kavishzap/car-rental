import jsPDF from "jspdf"
import type { Contract, Customer, Car } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils/format"

export function generateContractPDF(
  contract: Contract,
  customer: Customer,
  car: Car,
  companyInfo?: {
    name: string
    address: string
    phone: string
    email: string
  },
) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPosition = 20

  // Company Header
  const company = companyInfo || {
    name: "Car Rental Company",
    address: "123 Main Street, City, Country",
    phone: "+1 234 567 8900",
    email: "info@carrental.com",
  }

  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text(company.name, pageWidth / 2, yPosition, { align: "center" })

  yPosition += 8
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(company.address, pageWidth / 2, yPosition, { align: "center" })

  yPosition += 5
  doc.text(`${company.phone} | ${company.email}`, pageWidth / 2, yPosition, { align: "center" })

  // Title
  yPosition += 15
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text("RENTAL CONTRACT", pageWidth / 2, yPosition, { align: "center" })

  // Contract Number and Date
  yPosition += 10
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`Contract #: ${contract.contractNumber}`, 20, yPosition)
  doc.text(`Date: ${formatDate(contract.createdAt)}`, pageWidth - 20, yPosition, { align: "right" })

  // Divider line
  yPosition += 5
  doc.setDrawColor(200, 200, 200)
  doc.line(20, yPosition, pageWidth - 20, yPosition)

  // Customer Information Section
  yPosition += 10
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("CUSTOMER INFORMATION", 20, yPosition)

  yPosition += 8
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`Name: ${customer.firstName} ${customer.lastName}`, 20, yPosition)

  yPosition += 6
  doc.text(`Email: ${customer.email}`, 20, yPosition)

  yPosition += 6
  doc.text(`Phone: ${customer.phone}`, 20, yPosition)

  yPosition += 6
  doc.text(`ID/Passport: ${customer.nicOrPassport}`, 20, yPosition)

  if (customer.address) {
    yPosition += 6
    doc.text(`Address: ${customer.address}`, 20, yPosition)
  }

  // Vehicle Information Section
  yPosition += 12
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("VEHICLE INFORMATION", 20, yPosition)

  yPosition += 8
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`Vehicle: ${car.name}`, 20, yPosition)

  yPosition += 6
  doc.text(`Brand: ${car.brand}`, 20, yPosition)

  yPosition += 6
  doc.text(`Model: ${car.model}`, 20, yPosition)

  yPosition += 6
  doc.text(`Year: ${car.year}`, 20, yPosition)

  yPosition += 6
  doc.text(`Plate Number: ${car.plateNumber}`, 20, yPosition)

  // Rental Period Section
  yPosition += 12
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("RENTAL PERIOD", 20, yPosition)

  yPosition += 8
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`Start Date: ${formatDate(contract.startDate)}`, 20, yPosition)

  yPosition += 6
  doc.text(`End Date: ${formatDate(contract.endDate)}`, 20, yPosition)

  yPosition += 6
  doc.text(`Duration: ${contract.days} day${contract.days > 1 ? "s" : ""}`, 20, yPosition)

  // Pricing Section
  yPosition += 12
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("PRICING DETAILS", 20, yPosition)

  yPosition += 8
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")

  // Create pricing table
  const tableStartY = yPosition
  const col1X = 20
  const col2X = pageWidth - 60

  doc.text(`Daily Rate:`, col1X, yPosition)
  doc.text(formatCurrency(contract.dailyRate), col2X, yPosition, { align: "right" })

  yPosition += 6
  doc.text(`Number of Days:`, col1X, yPosition)
  doc.text(`${contract.days}`, col2X, yPosition, { align: "right" })

  yPosition += 6
  doc.text(`Subtotal:`, col1X, yPosition)
  doc.text(formatCurrency(contract.subtotal), col2X, yPosition, { align: "right" })

  if (contract.discount && contract.discount > 0) {
    yPosition += 6
    doc.text(`Discount:`, col1X, yPosition)
    doc.text(`-${formatCurrency(contract.discount)}`, col2X, yPosition, { align: "right" })
  }

  if (contract.taxRate && contract.taxRate > 0) {
    const taxAmount = (contract.subtotal - (contract.discount || 0)) * (contract.taxRate / 100)
    yPosition += 6
    doc.text(`Tax (${contract.taxRate}%):`, col1X, yPosition)
    doc.text(formatCurrency(taxAmount), col2X, yPosition, { align: "right" })
  }

  // Total line
  yPosition += 8
  doc.setDrawColor(0, 0, 0)
  doc.line(col1X, yPosition - 2, pageWidth - 20, yPosition - 2)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text(`TOTAL AMOUNT:`, col1X, yPosition + 4)
  doc.text(formatCurrency(contract.total), col2X, yPosition + 4, { align: "right" })

  // Status
  yPosition += 14
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`Status: ${contract.status.toUpperCase()}`, 20, yPosition)

  // Notes Section (if any)
  if (contract.notes) {
    yPosition += 10
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("NOTES", 20, yPosition)

    yPosition += 8
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    const splitNotes = doc.splitTextToSize(contract.notes, pageWidth - 40)
    doc.text(splitNotes, 20, yPosition)
    yPosition += splitNotes.length * 5
  }

  // Terms and Conditions
  yPosition += 15
  if (yPosition > pageHeight - 60) {
    doc.addPage()
    yPosition = 20
  }

  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("TERMS AND CONDITIONS", 20, yPosition)

  yPosition += 8
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  const terms = [
    "1. The renter must present a valid driver's license and identification.",
    "2. The vehicle must be returned in the same condition as received.",
    "3. Any damage to the vehicle will be charged to the renter.",
    "4. Late returns may incur additional charges.",
    "5. The renter is responsible for all traffic violations during the rental period.",
  ]

  terms.forEach((term) => {
    const splitTerm = doc.splitTextToSize(term, pageWidth - 40)
    doc.text(splitTerm, 20, yPosition)
    yPosition += splitTerm.length * 4 + 2
  })

  // Signature Section
  yPosition += 15
  if (yPosition > pageHeight - 40) {
    doc.addPage()
    yPosition = 20
  }

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")

  const signatureY = yPosition + 15
  doc.line(20, signatureY, 80, signatureY)
  doc.line(pageWidth - 80, signatureY, pageWidth - 20, signatureY)

  doc.text("Customer Signature", 20, signatureY + 5)
  doc.text("Company Representative", pageWidth - 80, signatureY + 5)

  doc.text(`Date: __________`, 20, signatureY + 12)
  doc.text(`Date: __________`, pageWidth - 80, signatureY + 12)

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(128, 128, 128)
  doc.text(`Generated on ${formatDate(new Date().toISOString())}`, pageWidth / 2, pageHeight - 10, { align: "center" })

  return doc
}

export function downloadContractPDF(
  contract: Contract,
  customer: Customer,
  car: Car,
  companyInfo?: {
    name: string
    address: string
    phone: string
    email: string
  },
) {
  const doc = generateContractPDF(contract, customer, car, companyInfo)
  doc.save(`Contract_${contract.contractNumber}.pdf`)
}
