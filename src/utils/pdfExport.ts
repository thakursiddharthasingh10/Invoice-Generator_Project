import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice } from '../types/invoice';
import { calculateInvoiceSummary, calculateItemAmounts } from './invoiceCalculations';
import { formatCurrency, getCurrencyConfig } from './currencyFormatter';

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').substring(0, 30);
}

export function exportInvoiceToPdf(invoice: Invoice): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);
  const currencyConfig = getCurrencyConfig(invoice.currency);
  const summary = calculateInvoiceSummary(invoice);

  // Top Primary Blue Accent Bar
  doc.setFillColor(37, 99, 235); // #2563EB
  doc.rect(0, 0, pageWidth, 6, 'F');

  let currentY = 16;

  // Header Section
  // Left: Business Name & Logo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(20, 33, 61); // #14213D
  
  const businessName = invoice.business.name || 'Your Business Name';
  doc.text(businessName, margin, currentY);

  // Right: INVOICE title
  doc.setFontSize(22);
  doc.setTextColor(37, 99, 235); // #2563EB
  doc.text('INVOICE', pageWidth - margin, currentY, { align: 'right' });

  currentY += 6;

  // Status Badge under INVOICE
  const status = invoice.status.toUpperCase();
  let statusBg = [239, 246, 255]; // light blue
  let statusText = [37, 99, 235];
  if (status === 'PAID') {
    statusBg = [220, 252, 231];
    statusText = [22, 101, 52];
  } else if (status === 'OVERDUE') {
    statusBg = [254, 226, 226];
    statusText = [185, 28, 28];
  } else if (status === 'PENDING') {
    statusBg = [254, 243, 199];
    statusText = [180, 83, 9];
  }

  const badgeWidth = 26;
  const badgeHeight = 6;
  doc.setFillColor(statusBg[0], statusBg[1], statusBg[2]);
  doc.roundedRect(pageWidth - margin - badgeWidth, currentY - 4, badgeWidth, badgeHeight, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(statusText[0], statusText[1], statusText[2]);
  doc.text(status, pageWidth - margin - (badgeWidth / 2), currentY, { align: 'center' });

  // Business Sub-details (left)
  currentY += 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);

  if (invoice.business.ownerName) {
    doc.text(`Contact: ${invoice.business.ownerName}`, margin, currentY);
    currentY += 4;
  }
  if (invoice.business.email) {
    doc.text(`Email: ${invoice.business.email}`, margin, currentY);
    currentY += 4;
  }
  if (invoice.business.phone) {
    doc.text(`Phone: ${invoice.business.phone}`, margin, currentY);
    currentY += 4;
  }
  if (invoice.business.gstin) {
    doc.text(`GSTIN/Tax ID: ${invoice.business.gstin}`, margin, currentY);
    currentY += 4;
  }
  if (invoice.business.address) {
    const splitAddr = doc.splitTextToSize(invoice.business.address, 85);
    doc.text(splitAddr, margin, currentY);
    currentY += splitAddr.length * 4;
  }

  // Invoice Details Table (Right side aligned)
  const metaY = 28;
  const metaX = pageWidth - margin - 70;
  
  doc.setFontSize(8.5);
  const metaRows = [
    ['Invoice Number:', invoice.invoiceNumber || 'INV-001'],
    ['Invoice Date:', invoice.issueDate || '—'],
    ['Due Date:', invoice.dueDate || '—'],
    ['Payment Terms:', invoice.paymentTerms || 'Due on Receipt'],
  ];
  if (invoice.poNumber) {
    metaRows.push(['PO Number:', invoice.poNumber]);
  }

  metaRows.forEach((row, i) => {
    const y = metaY + (i * 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(row[0], metaX, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(20, 33, 61);
    doc.text(row[1], pageWidth - margin, y, { align: 'right' });
  });

  // Divider Line
  currentY = Math.max(currentY + 4, metaY + (metaRows.length * 4.5) + 6);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 6;

  // Bill To / Client Section Card
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, currentY, contentWidth, 26, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, 26, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(37, 99, 235);
  doc.text('BILLED TO', margin + 6, currentY + 6);

  doc.setFontSize(10);
  doc.setTextColor(20, 33, 61);
  const clientName = invoice.client.name || 'Client Business Name';
  doc.text(clientName, margin + 6, currentY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);

  let clientSub = '';
  if (invoice.client.contactPerson) clientSub += `Attn: ${invoice.client.contactPerson}  |  `;
  if (invoice.client.email) clientSub += `${invoice.client.email}  |  `;
  if (invoice.client.phone) clientSub += `${invoice.client.phone}`;
  if (clientSub) {
    doc.text(clientSub, margin + 6, currentY + 16);
  }

  let clientAddr = invoice.client.address || '';
  if (invoice.client.gstin) {
    clientAddr += (clientAddr ? '  •  ' : '') + `GSTIN: ${invoice.client.gstin}`;
  }
  if (clientAddr) {
    doc.text(clientAddr, margin + 6, currentY + 21);
  }

  currentY += 32;

  // Line Items Table with autoTable
  const tableHead = [['#', 'Item & Description', 'Qty', 'Unit Price', 'Tax %', 'Total']];
  
  const tableBody = (invoice.items || []).map((item, index) => {
    const calc = calculateItemAmounts(item);
    const itemDesc = item.description ? `\n${item.description}` : '';
    return [
      (index + 1).toString(),
      `${item.name || 'Unnamed Item'}${itemDesc}`,
      calc.quantity.toString(),
      `${currencyConfig.symbol}${calc.unitPrice.toFixed(2)}`,
      `${calc.taxRate}%`,
      `${currencyConfig.symbol}${calc.lineTotal.toFixed(2)}`,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235], // #2563EB
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [20, 33, 61],
      cellPadding: 3,
      lineColor: [226, 232, 240],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 16, halign: 'right' },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 18, halign: 'right' },
      5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
  });

  // Calculate table bottom
  const finalY = (doc as any).lastAutoTable?.finalY || currentY + 40;
  let summaryY = finalY + 8;

  // Check if we need a page break for the summary and footer
  if (summaryY + 70 > pageHeight) {
    doc.addPage();
    summaryY = 20;
  }

  // Summary box (Right side)
  const summaryWidth = 78;
  const summaryX = pageWidth - margin - summaryWidth;

  const summaryRows: [string, string, boolean?][] = [
    ['Subtotal', `${currencyConfig.symbol}${summary.subtotal.toFixed(2)}`],
  ];

  if (summary.discountAmount > 0) {
    const discLabel = invoice.discountType === 'percentage' ? `Discount (${invoice.discountValue}%)` : 'Discount';
    summaryRows.push([discLabel, `-${currencyConfig.symbol}${summary.discountAmount.toFixed(2)}`]);
  }

  if (invoice.taxMode === 'cgst_sgst' && summary.totalTax > 0) {
    summaryRows.push(['CGST (9%)', `${currencyConfig.symbol}${summary.cgstAmount.toFixed(2)}`]);
    summaryRows.push(['SGST (9%)', `${currencyConfig.symbol}${summary.sgstAmount.toFixed(2)}`]);
  } else if (invoice.taxMode === 'igst' && summary.totalTax > 0) {
    summaryRows.push(['IGST (18%)', `${currencyConfig.symbol}${summary.igstAmount.toFixed(2)}`]);
  } else if (summary.totalTax > 0) {
    summaryRows.push(['Total Tax', `${currencyConfig.symbol}${summary.totalTax.toFixed(2)}`]);
  }

  summaryRows.push(['Grand Total', `${currencyConfig.symbol}${summary.grandTotal.toFixed(2)}`, true]);

  if (summary.amountPaid > 0) {
    summaryRows.push(['Amount Paid', `${currencyConfig.symbol}${summary.amountPaid.toFixed(2)}`]);
    summaryRows.push(['Balance Due', `${currencyConfig.symbol}${summary.amountDue.toFixed(2)}`, true]);
  }

  let currSumY = summaryY;
  summaryRows.forEach(([label, value, isBold]) => {
    if (label === 'Grand Total' || label === 'Balance Due') {
      doc.setFillColor(239, 246, 255);
      doc.rect(summaryX - 2, currSumY - 3.5, summaryWidth + 2, 6, 'F');
    }

    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(isBold ? 9.5 : 8.5);
    doc.setTextColor(isBold ? 37 : 71, isBold ? 99 : 85, isBold ? 235 : 105);
    doc.text(label, summaryX, currSumY);

    doc.setTextColor(isBold ? 20 : 51, isBold ? 33 : 65, isBold ? 61 : 85);
    doc.text(value, pageWidth - margin, currSumY, { align: 'right' });

    currSumY += 5.5;
  });

  // Left side: Bank details & Notes
  let notesY = summaryY;
  const notesWidth = contentWidth - summaryWidth - 10;

  if (invoice.paymentDetails && (invoice.paymentDetails.bankName || invoice.paymentDetails.upiId)) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(20, 33, 61);
    doc.text('Payment Details:', margin, notesY);
    notesY += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);

    if (invoice.paymentDetails.bankName) {
      doc.text(`Bank: ${invoice.paymentDetails.bankName}`, margin, notesY);
      notesY += 4;
    }
    if (invoice.paymentDetails.accountHolder) {
      doc.text(`A/C Holder: ${invoice.paymentDetails.accountHolder}`, margin, notesY);
      notesY += 4;
    }
    if (invoice.paymentDetails.accountNumber) {
      doc.text(`A/C Number: ${invoice.paymentDetails.accountNumber}`, margin, notesY);
      notesY += 4;
    }
    if (invoice.paymentDetails.ifscOrSwift) {
      doc.text(`IFSC / SWIFT: ${invoice.paymentDetails.ifscOrSwift}`, margin, notesY);
      notesY += 4;
    }
    if (invoice.paymentDetails.upiId) {
      doc.text(`UPI ID: ${invoice.paymentDetails.upiId}`, margin, notesY);
      notesY += 4;
    }
    notesY += 2;
  }

  if (invoice.paymentDetails?.notes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(20, 33, 61);
    doc.text('Notes / Instructions:', margin, notesY);
    notesY += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const splitNotes = doc.splitTextToSize(invoice.paymentDetails.notes, notesWidth);
    doc.text(splitNotes, margin, notesY);
    notesY += splitNotes.length * 4;
  }

  if (invoice.termsAndConditions) {
    notesY += 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(20, 33, 61);
    doc.text('Terms & Conditions:', margin, notesY);
    notesY += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const splitTerms = doc.splitTextToSize(invoice.termsAndConditions, notesWidth);
    doc.text(splitTerms, margin, notesY);
  }

  // Footer on all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Invoice_Generator • Professional Invoice Document', margin, pageHeight - 7);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  }

  // Generate clean filename
  const cleanInv = sanitizeFileName(invoice.invoiceNumber || 'INV');
  const cleanClient = sanitizeFileName(invoice.client.name || 'Client');
  const filename = `Invoice_${cleanInv}_${cleanClient}.pdf`;

  doc.save(filename);
}

export function printInvoice(): void {
  window.print();
}
