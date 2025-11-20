// src/lib/utils/pdf-generator.ts
import { jsPDF } from "jspdf";
import type { Contract } from "@/lib/types";

type CompanyDetails = {
  id: string;
  name: string;
  email: string;
  brn: string;
  whatsapp_num: string;
  tel: string;
  terms: string;
  logo?: string | null; // base64 data URL
};

type Customer = {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
};

type Car = {
  name: string;
  registrationNumber?: string | null;
  plateNumber?: string | null;
  brand?: string | null;
  model?: string | null;
};

type BuildContractHtmlArgs = {
  contract: Contract;
  customer: Customer;
  car: Car;
  company: CompanyDetails;
};

export async function buildContractHtml({
  contract,
  customer,
  car,
  company,
}: BuildContractHtmlArgs) {
  const doc = new jsPDF("p", "pt", "a4");

  // --- Layout constants
  const PAGE_WIDTH = doc.internal.pageSize.getWidth();
  const PAGE_HEIGHT = doc.internal.pageSize.getHeight();
  const MARGIN_LEFT = 40;
  const MARGIN_RIGHT = 40;
  const TOP_MARGIN = 40;
  const BOTTOM_MARGIN = 40;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

  const COLUMN_GUTTER = 40;
  const COLUMN_WIDTH = (CONTENT_WIDTH - COLUMN_GUTTER) / 2;

  let y = TOP_MARGIN;

  const formatMoney = (v: number | null | undefined) =>
    (v ?? 0).toFixed(2) + " MUR";

  const fullCustomerName = `${customer.firstName ?? ""} ${
    customer.lastName ?? ""
  }`.trim();

  const chargesRowsLeft = [
    { label: "Daily rate", value: formatMoney(contract.dailyRate) },
    {
      label: "Days / Subtotal (rental)",
      value: `${contract.days}  Subtotal: ${formatMoney(contract.subtotal)}`,
    },
  ];

  const chargesRowsRight = [
    { label: "SIM", value: formatMoney(contract.simAmount ?? 0) },
    { label: "Delivery", value: formatMoney(contract.deliveryAmount ?? 0) },
    { label: "Siège BB", value: formatMoney(contract.siegeBBAmount ?? 0) },
    {
      label: "Rehausseur",
      value: formatMoney(contract.rehausseurAmount ?? 0),
    },
    {
      label: `Card fee (${contract.cardPaymentPercent ?? 0}%)`,
      value: formatMoney(contract.cardPaymentAmount ?? 0),
    },
    { label: "Tax rate", value: `${contract.taxRate ?? 0}%` },
    { label: "Total", value: formatMoney(contract.total) },
  ];

  const notesSnippet = contract.notes
    ? contract.notes.replace(/\s+/g, " ").slice(0, 80) +
      (contract.notes.replace(/\s+/g, " ").length > 80 ? "…" : "")
    : "-";
  // ---------- COMPANY HEADER ----------
  const headerTopY = y;

  // Logo
  if (company.logo) {
    try {
      const isPng = company.logo.startsWith("data:image/png");
      const imgType = isPng ? "PNG" : "JPEG";
      doc.addImage(company.logo, imgType, MARGIN_LEFT, headerTopY, 80, 80);
    } catch {
      // ignore logo errors
    }
  }

  // COMPANY NAME (bold)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(company.name, MARGIN_LEFT + 100, headerTopY + 20);

  // Switch to normal font for details
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  // Start BELOW the company name (no overlap)
  let infoY = headerTopY + 40;

  // Owner Name
  doc.text("Jaynandrasing Ramchurn", MARGIN_LEFT + 100, infoY);

  // BRN
  infoY += 14;
  doc.text(`BRN: ${company.brn}`, MARGIN_LEFT + 100, infoY);

  // Tel
  infoY += 14;
  doc.text(`Tel: ${company.tel}`, MARGIN_LEFT + 100, infoY);

  // WhatsApp
  infoY += 14;
  doc.text(`WhatsApp: ${company.whatsapp_num}`, MARGIN_LEFT + 100, infoY);

  // Email
  infoY += 14;
  doc.text(`Email: ${company.email}`, MARGIN_LEFT + 100, infoY);

  // contract meta box on the right
  const metaBoxWidth = 180;
  const metaBoxX = PAGE_WIDTH - MARGIN_RIGHT - metaBoxWidth;
  const metaBoxY = headerTopY;
  const metaBoxHeight = 70;

  doc.setDrawColor(200);
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(metaBoxX, metaBoxY, metaBoxWidth, metaBoxHeight, 4, 4, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Contract Info", metaBoxX + 10, metaBoxY + 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `No: ${contract.contractNumber || contract.id}`,
    metaBoxX + 10,
    metaBoxY + 32
  );
  doc.text(
    `Status: ${contract.status.toUpperCase()}`,
    metaBoxX + 10,
    metaBoxY + 46
  );
  doc.text(
    `Created: ${contract.createdAt?.slice(0, 10) ?? "-"}`,
    metaBoxX + 10,
    metaBoxY + 60
  );

  // Figure out the true bottom of the header (logo / info / meta box)
  const logoBottom = headerTopY + 80; // logo height
  const infoBottom = infoY; // last info line
  const metaBottom = metaBoxY + metaBoxHeight;

  const headerBottom = Math.max(logoBottom, infoBottom, metaBottom);

  // separator line under FULL header
  y = headerBottom + 20;
  doc.setLineWidth(0.5);
  doc.setDrawColor(210);
  doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);

  // ---------- TITLE ----------
  y += 24;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  const title = "RENTAL CONTRACT";
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, MARGIN_LEFT + CONTENT_WIDTH / 2 - titleWidth / 2, y);

  // Columns X positions
  const col1X = MARGIN_LEFT;
  const col2X = MARGIN_LEFT + COLUMN_WIDTH + COLUMN_GUTTER;

  // ---------- CUSTOMER + LICENSE / SECOND DRIVER (2 COL) ----------
  y += 24;
  let leftY = y;
  let rightY = y;

  // Left: Customer Details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Customer Details", col1X, leftY);
  leftY += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Name: ${fullCustomerName}`, col1X, leftY);
  leftY += 12;

  if (customer.email) {
    doc.text(`Email: ${customer.email}`, col1X, leftY);
    leftY += 12;
  }

  if (customer.phone) {
    doc.text(`Phone: ${customer.phone}`, col1X, leftY);
    leftY += 12;
  }

  // Right: License + Second Driver
  if (contract.licenseNumber) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`License No: ${contract.licenseNumber}`, col2X, rightY);
    rightY += 14;
  }

  if (contract.secondDriverName || contract.secondDriverLicense) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Second Driver:", col2X, rightY);
    rightY += 14;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    if (contract.secondDriverName) {
      doc.text(`Name: ${contract.secondDriverName}`, col2X, rightY);
      rightY += 12;
    }
    if (contract.secondDriverLicense) {
      doc.text(`License No: ${contract.secondDriverLicense}`, col2X, rightY);
      rightY += 12;
    }
  }

  y = Math.max(leftY, rightY) + 18;

  // ---------- VEHICLE DETAILS (LEFT) ----------
  leftY = y;
  rightY = y;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Vehicle Details", col1X, leftY);
  leftY += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Car: ${car.name}`, col1X, leftY);
  leftY += 12;

  if (car.brand || car.model) {
    const modelLine = `Model: ${car.brand ?? ""} ${car.model ?? ""}`.trim();
    if (modelLine !== "Model:") {
      doc.text(modelLine, col1X, leftY);
      leftY += 12;
    }
  }

  if (car.registrationNumber || car.plateNumber) {
    const regLine = `Reg. / Plate: ${
      car.registrationNumber ?? car.plateNumber ?? ""
    }`.trim();
    if (regLine !== "Reg. / Plate:") {
      doc.text(regLine, col1X, leftY);
      leftY += 12;
    }
  }

  y = Math.max(leftY, rightY) + 18;

  // ---------- RENTAL PERIOD + CHARGES SUMMARY (2 COL) ----------
  leftY = y;
  rightY = y;

  // Left title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Rental Period", col1X, leftY);

  // Right title
  doc.text("Charges Summary", col2X, rightY);

  leftY += 14;
  rightY += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  // Left column: period details
  doc.text(
    `Start: ${contract.startDate?.slice(0, 10) ?? ""} | End: ${
      contract.endDate?.slice(0, 10) ?? ""
    } | Days: ${contract.days}`,
    col1X,
    leftY
  );
  leftY += 12;

  if (contract.pickupTime || contract.deliveryTime) {
    doc.text(
      `Pickup time: ${contract.pickupTime ?? "-"} | Delivery time: ${
        contract.deliveryTime ?? "-"
      }`,
      col1X,
      leftY
    );
    leftY += 12;
  }

  if (contract.fuelAmount != null) {
    doc.text(`Fuel level (bars): ${contract.fuelAmount}`, col1X, leftY);
    leftY += 12;
  }

  if (contract.preAuthorization) {
    doc.text(`Pre-authorization: ${contract.preAuthorization}`, col1X, leftY);
    leftY += 12;
  }

  // Right column: charges
  chargesRowsRight.forEach((row) => {
    doc.text(`${row.label}: ${row.value}`, col2X, rightY);
    rightY += 12;
  });

  // Also show left charges (daily rate + subtotal) under left column
  leftY += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Charges Summary", col1X, leftY);
  leftY += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  chargesRowsLeft.forEach((row) => {
    doc.text(`${row.label}: ${row.value}`, col1X, leftY);
    leftY += 12;
  });

  y = Math.max(leftY, rightY) + 18;

  // ---------- PAYMENT (SINGLE LINE, LIKE SCREENSHOT) ----------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Payment", col1X, y);
  y += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    `Payment mode: ${contract.paymentMode ?? "-"} | Total paid: ${formatMoney(
      contract.total
    )} | Notes: ${notesSnippet}`,
    col1X,
    y
  );

  // ---------- SIGNATURES (ONLY CUSTOMER) ----------
  y += 40;
  if (y > PAGE_HEIGHT - 120) {
    doc.addPage();
    y = TOP_MARGIN + 40;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Customer Signature", col1X, y);

  doc.setLineWidth(0.5);
  doc.setDrawColor(180);
  doc.line(col1X, y + 40, col1X + 220, y + 40);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("(Name & Sign)", col1X, y + 56);

  // ---------- TERMS & CONDITIONS: TWO-COLUMN (NO OVERLAP) ----------
  doc.addPage();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);

  let termsY = TOP_MARGIN;
  doc.text("Rental Terms & Conditions", MARGIN_LEFT, termsY);

  termsY += 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);

  // Split text once
  const termsText = company.terms ?? "";

  // Layout constants
  const TWO_COL = true;

  let colX = MARGIN_LEFT;
  let yPos = termsY;

  // Split text into lines based on column width
  const wrappedLines = doc.splitTextToSize(termsText, COLUMN_WIDTH);

  // Column index: 1 = left, 2 = right
  let col = 1;

  // SAFELY PRINT LINE FUNCTION
  const printLine = (line: string) => {
    // If we are at bottom → switch column OR new page
    if (yPos > PAGE_HEIGHT - BOTTOM_MARGIN) {
      if (col === 1 && TWO_COL) {
        // SWITCH TO RIGHT COLUMN
        col = 2;
        colX = MARGIN_LEFT + COLUMN_WIDTH + COLUMN_GUTTER;
        yPos = TOP_MARGIN;
      } else {
        // NEW PAGE, RESET
        doc.addPage();
        col = 1;
        colX = MARGIN_LEFT;
        yPos = TOP_MARGIN;
      }
    }

    doc.text(line, colX, yPos);
    yPos += 12;
  };

  // PRINT ALL LINES SAFELY
  wrappedLines.forEach(printLine);

  // ---------- SAVE ----------
  const fileName = `Contract-${contract.contractNumber || contract.id}.pdf`;
  doc.save(fileName);
}
