// src/lib/utils/pdf-generator.ts
import { jsPDF } from "jspdf";
import type { Contract } from "@/lib/types";
import { resolveCustomerNicOrPassport } from "@/lib/utils/customer-nic";

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
  city?: string | null;
  country?: string | null;
  nicOrPassport?: string | null;
  license?: string | null;
  flightNumber?: string | null;
};

type Car = {
  name: string;
  registrationNumber?: string | null;
  plateNumber?: string | null;
  brand?: string | null;
  model?: string | null;
};

type ContractPhoto = {
  imageBase64: string;
  caption?: string;
};

type BuildContractHtmlArgs = {
  contract: Contract;
  customer: Customer;
  car: Car;
  company: CompanyDetails;
  images?: ContractPhoto[];
};

const normalizeImageDataUrl = (raw?: string | null): string | undefined => {
  const value = (raw ?? "").trim();
  if (!value) return undefined;
  if (value.startsWith("data:")) return value;
  const cleaned = value.startsWith(":") ? value.slice(1) : value;
  const mime = cleaned.startsWith("/9j/") ? "image/jpeg" : "image/png";
  return `data:${mime};base64,${cleaned}`;
};

function getPdfImageType(dataUrl: string): "JPEG" | "PNG" {
  const value = dataUrl.slice(0, 32).toLowerCase();
  if (value.includes("image/png")) return "PNG";
  return "JPEG";
}

function fitContain(
  srcW: number,
  srcH: number,
  boxW: number,
  boxH: number
): { width: number; height: number } {
  const ratio = Math.min(boxW / srcW, boxH / srcH);
  return {
    width: Math.max(1, srcW * ratio),
    height: Math.max(1, srcH * ratio),
  };
}

export async function buildContractHtml({
  contract,
  customer,
  car,
  company,
  images = [],
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

  const formatMoney = (v: number | null | undefined) => {
    const value = Math.round(v ?? 0);
    return value.toString() + " MUR";
  };

  const fullCustomerName = `${customer.firstName ?? ""} ${
    customer.lastName ?? ""
  }`.trim();

  const chargesRowsLeft = [
    { label: "Daily rate", value: formatMoney(contract.dailyRate) },
    {
      label: "Days (rental)",
      value: `${contract.days}`,
    },
  ];

  const chargesRowsRight = [
    { label: "SIM + Internet", value: formatMoney(contract.simAmount ?? 0) },
    { label: "Delivery", value: formatMoney(contract.deliveryAmount ?? 0) },
    {
      label: `Card fee (${contract.cardPaymentPercent ?? 0}%)`,
      value: formatMoney(contract.cardPaymentAmount ?? 0),
    },
    { label: "Total", value: formatMoney(contract.total), isBold: true },
  ];

  const notesText = contract.notes?.trim() ?? "";
  // ---------- COMPANY HEADER ----------
  const headerTopY = y;

  // Logo
  const companyLogo = normalizeImageDataUrl(company.logo);
  if (companyLogo) {
    try {
      const isPng = companyLogo.startsWith("data:image/png");
      const imgType = isPng ? "PNG" : "JPEG";
      doc.addImage(companyLogo, imgType, MARGIN_LEFT, headerTopY, 80, 80);
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

  if (customer.address) {
    doc.text(`Address: ${customer.address}`, col1X, leftY);
    leftY += 12;
  }

  // Right: City, Country, License + Second Driver
  if (customer.city) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`City: ${customer.city}`, col2X, rightY);
    rightY += 14;
  }

  if (customer.country) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Country: ${customer.country}`, col2X, rightY);
    rightY += 14;
  }

  const licenseNo =
    contract.licenseNumber?.trim() || customer.license?.trim() || "";

  if (licenseNo) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`License No: ${licenseNo}`, col2X, rightY);
    rightY += 14;
  }

  const nicOrPassport =
    resolveCustomerNicOrPassport(contract.customerNicOrPassport) ||
    customer.nicOrPassport?.trim() ||
    undefined;

  if (nicOrPassport) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`NIC/Passport: ${nicOrPassport}`, col2X, rightY);
    rightY += 14;
  }

  const flightNumber = customer.flightNumber?.trim();
  if (flightNumber) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Flight No: ${flightNumber}`, col2X, rightY);
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

  // ---------- VEHICLE DETAILS (LEFT) + RENTAL PERIOD (RIGHT) ----------
  leftY = y;
  rightY = y;

  // Left: Vehicle Details
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

  // Right: Rental Period
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Rental Period", col2X, rightY);
  rightY += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    `Start: ${contract.startDate?.slice(0, 10) ?? ""} | End: ${
      contract.endDate?.slice(0, 10) ?? ""
    } | Days: ${contract.days}`,
    col2X,
    rightY
  );
  rightY += 12;

  if (contract.pickupTime || contract.deliveryTime) {
    doc.text(
      `Pick Up Time: ${contract.pickupTime ?? "-"} | Return Time: ${
        contract.deliveryTime ?? "-"
      }`,
      col2X,
      rightY
    );
    rightY += 12;
  }

  doc.text(
    `Pick Up Place: ${contract.pickupPlace?.trim() ? contract.pickupPlace : "-"}`,
    col2X,
    rightY
  );
  rightY += 12;

  doc.text(
    `Return Place: ${contract.deliveryPlace?.trim() ? contract.deliveryPlace : "-"}`,
    col2X,
    rightY
  );
  rightY += 12;

  if (contract.fuelAmount != null) {
    doc.text(`Fuel level (bars): ${contract.fuelAmount}`, col2X, rightY);
    rightY += 12;
  }

  if (contract.preAuthorization) {
    doc.text(`Pre-authorization: ${contract.preAuthorization}`, col2X, rightY);
    rightY += 12;
  }

  y = Math.max(leftY, rightY) + 18;

  // ---------- CHARGES SUMMARY (2 COL) ----------
  leftY = y;
  rightY = y;

  // Right title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Charges Summary", col2X, rightY);

  rightY += 14;

  // Right column: charges
  chargesRowsRight.forEach((row) => {
    if (row.isBold) {
      doc.setFont("helvetica", "bold");
    } else {
      doc.setFont("helvetica", "normal");
    }
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
    )}`,
    col1X,
    y
  );

  // ---------- NOTES ----------
  if (notesText) {
    y += 24;
    if (y > PAGE_HEIGHT - 120) {
      doc.addPage();
      y = TOP_MARGIN + 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Notes", col1X, y);
    y += 14;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const noteLines = doc.splitTextToSize(notesText, CONTENT_WIDTH);
    noteLines.forEach((line: string) => {
      if (y > PAGE_HEIGHT - BOTTOM_MARGIN) {
        doc.addPage();
        y = TOP_MARGIN;
      }
      doc.text(line, col1X, y);
      y += 12;
    });
  }

  // ---------- SIGNATURES (ONLY CUSTOMER) ----------
  y += 28;
  if (y > PAGE_HEIGHT - 120) {
    doc.addPage();
    y = TOP_MARGIN + 40;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Customer Signature", col1X, y);

  doc.setLineWidth(0.5);
  doc.setDrawColor(180);
  const customerSignature = normalizeImageDataUrl(
    contract.clientSignatureBase64
  );
  const signatureY = y + 10;
  if (customerSignature) {
    const isPng = customerSignature.startsWith("data:image/png");
    const imgType = isPng ? "PNG" : "JPEG";
    try {
      doc.addImage(customerSignature, imgType, col1X, signatureY, 180, 80);
    } catch {
      // ignore signature errors
    }
  }
  const signatureLineY = customerSignature ? signatureY + 90 : y + 40;
  doc.line(col1X, signatureLineY, col1X + 220, signatureLineY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("(Name & Sign)", col1X, signatureLineY + 16);

  // ---------- TERMS & CONDITIONS: SINGLE COLUMN (FULL WIDTH) ----------
  doc.addPage();

  // Use very minimal margins for terms section to use maximum page width
  const TERMS_MARGIN_LEFT = 10;
  const TERMS_MARGIN_RIGHT = 10;
  // Use almost the entire page width (PAGE_WIDTH minus minimal margins)
  const TERMS_CONTENT_WIDTH = PAGE_WIDTH - TERMS_MARGIN_LEFT - TERMS_MARGIN_RIGHT;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);

  let termsY = TOP_MARGIN;
  doc.text("Rental Terms & Conditions", TERMS_MARGIN_LEFT, termsY);

  termsY += 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  // Get terms text
  const termsText = company.terms ?? "";

  let yPos = termsY;

  // Split text into lines using the full available width
  // This ensures text wraps at the maximum width possible
  const wrappedLines = doc.splitTextToSize(termsText, TERMS_CONTENT_WIDTH);

  // SAFELY PRINT LINE FUNCTION
  const printLine = (line: string) => {
    // If we are at bottom → new page
    if (yPos > PAGE_HEIGHT - BOTTOM_MARGIN) {
      doc.addPage();
      yPos = TOP_MARGIN;
    }

    // Print each line at the left margin position
    doc.text(line, TERMS_MARGIN_LEFT, yPos);
    yPos += 12;
  };

  // PRINT ALL LINES SAFELY
  wrappedLines.forEach(printLine);

  // ---------- VEHICLE CONDITION PHOTOGRAPHS (LAST PAGE) ----------
  const photos = images
    .map((img) => ({
      dataUrl: normalizeImageDataUrl(img.imageBase64),
      caption: img.caption?.trim() ?? "",
    }))
    .filter((img): img is { dataUrl: string; caption: string } => Boolean(img.dataUrl));

  if (photos.length > 0) {
    doc.addPage();

    const PHOTO_FOOTER_GUARD = 95;
    let photoY = TOP_MARGIN;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("ANNEX — Vehicle Condition Photographs", MARGIN_LEFT, photoY);

    photoY += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90);
    doc.text(
      `Contract No: ${contract.contractNumber || contract.id}    •    ${photos.length} photograph${
        photos.length === 1 ? "" : "s"
      } attached`,
      MARGIN_LEFT,
      photoY
    );

    photoY += 12;
    const disclaimerLines = doc.splitTextToSize(
      "These photographs form part of this rental contract and record the vehicle condition at the time they were attached.",
      CONTENT_WIDTH
    );
    disclaimerLines.forEach((line: string) => {
      doc.text(line, MARGIN_LEFT, photoY);
      photoY += 11;
    });
    doc.setTextColor(0);

    photoY += 6;
    doc.setLineWidth(0.6);
    doc.setDrawColor(200);
    doc.line(MARGIN_LEFT, photoY, PAGE_WIDTH - MARGIN_RIGHT, photoY);
    photoY += 16;

    const cols = photos.length === 1 ? 1 : 2;
    const rows = Math.ceil(photos.length / cols);
    const gutter = 14;
    const availableH = PAGE_HEIGHT - photoY - PHOTO_FOOTER_GUARD;
    const cellW =
      cols === 1
        ? Math.min(CONTENT_WIDTH, 420)
        : (CONTENT_WIDTH - gutter) / 2;
    const cellH = Math.min(
      (availableH - gutter * (rows - 1)) / rows,
      photos.length === 1 ? 480 : 290
    );
    const gridWidth = cols === 1 ? cellW : cellW * 2 + gutter;
    const gridStartX = MARGIN_LEFT + (CONTENT_WIDTH - gridWidth) / 2;

    photos.forEach((photo, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = gridStartX + col * (cellW + gutter);
      const y = photoY + row * (cellH + gutter);

      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(205);
      doc.setLineWidth(0.7);
      doc.roundedRect(x, y, cellW, cellH, 3, 3, "FD");

      const pad = 10;
      const captionSpace = 22;
      const innerX = x + pad;
      const innerY = y + pad;
      const innerW = cellW - pad * 2;
      const innerH = cellH - pad * 2 - captionSpace;

      doc.setFillColor(236, 236, 236);
      doc.rect(innerX, innerY, innerW, innerH, "F");

      try {
        const props = doc.getImageProperties(photo.dataUrl);
        const fitted = fitContain(props.width, props.height, innerW, innerH);
        const imgX = innerX + (innerW - fitted.width) / 2;
        const imgY = innerY + (innerH - fitted.height) / 2;
        doc.addImage(
          photo.dataUrl,
          getPdfImageType(photo.dataUrl),
          imgX,
          imgY,
          fitted.width,
          fitted.height
        );
      } catch {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(130);
        doc.text(
          "Image unavailable",
          innerX + innerW / 2,
          innerY + innerH / 2,
          { align: "center" }
        );
        doc.setTextColor(0);
      }

      const label =
        photo.caption ||
        `Photograph ${String(index + 1).padStart(2, "0")}`;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(70);
      const captionLine = doc.splitTextToSize(label, cellW - 16)[0] as string;
      doc.text(captionLine, x + cellW / 2, y + cellH - 8, { align: "center" });
      doc.setTextColor(0);
    });
  }

  // ---------- ADD FOOTER TO ALL PAGES ----------
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Footer line - positioned higher to ensure visibility
    const footerY = PAGE_HEIGHT - 50;
    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(MARGIN_LEFT, footerY, PAGE_WIDTH - MARGIN_RIGHT, footerY);
    
    // Footer text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    
    const footerText = [
      company.name,
      `Tel: ${company.tel} | WhatsApp: ${company.whatsapp_num}`,
      `Email: ${company.email} | BRN: ${company.brn}`
    ];
    
    let footerYPos = footerY + 12;
    footerText.forEach((line) => {
      doc.text(line, MARGIN_LEFT, footerYPos);
      footerYPos += 10;
    });
  }

  // ---------- SAVE ----------
  const fileName = `Contract-${contract.contractNumber || contract.id}.pdf`;
  doc.save(fileName);
}
