import { jsPDF } from 'jspdf';
import { buildReportFilename } from './csvExporter';
import { VerificationReport } from '../types/domain';

export function generatePdfBlob(report: VerificationReport): Blob {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentW = pageW - margin * 2;
  let y = 16;

  function ensureSpace(neededMm: number) {
    if (y + neededMm > pageH - 16) {
      doc.addPage();
      y = 16;
    }
  }

  // Header Banner
  doc.setFillColor(22, 64, 153);
  doc.roundedRect(margin, y, contentW, 20, 2.5, 2.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('SCARNER — Free Vehicle Verification Report', margin + 5, y + 8.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    `Report ${report.reportId}  |  Generated ${report.generatedAt.slice(0, 19).replace('T', ' ')} UTC  |  100% Free Sources`,
    margin + 5,
    y + 15
  );
  y += 26;

  // Vehicle & Listing Metadata
  doc.setTextColor(18, 23, 34);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(report.listing.title.slice(0, 80), margin, y);
  y += 5.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const priceStr = report.listing.priceEur ? `EUR ${report.listing.priceEur.toLocaleString('en-US')}` : 'N/A';
  const plateStr = report.identifiers.plate
    ? `${report.identifiers.plate} (${report.identifiers.plateMethod.replace('_', ' ')})`
    : 'Not detected';
  const vinStr = report.identifiers.vin
    ? `${report.identifiers.vin} (${report.identifiers.vinMethod.replace('_', ' ')})`
    : 'Not detected';

  doc.text(`Asking Price: ${priceStr}   |   Plate: ${plateStr}   |   VIN: ${vinStr}`, margin, y);
  y += 4.5;
  doc.text(`Listing URL: ${report.listing.url.slice(0, 105)}`, margin, y);
  y += 7;

  // Summary Green / Orange Pills
  const boxW = (contentW - 6) / 3;
  // Green box
  doc.setFillColor(220, 252, 231);
  doc.setDrawColor(134, 239, 172);
  doc.roundedRect(margin, y, boxW, 13, 2, 2, 'FD');
  doc.setTextColor(21, 128, 61);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`${report.summary.consistentCount} Consistent (Green)`, margin + 3, y + 8);

  // Orange box
  doc.setFillColor(255, 237, 213);
  doc.setDrawColor(253, 186, 116);
  doc.roundedRect(margin + boxW + 3, y, boxW, 13, 2, 2, 'FD');
  doc.setTextColor(194, 65, 12);
  doc.text(`${report.summary.attentionCount} Attention (Orange)`, margin + boxW + 6, y + 8);

  // Slate box
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin + (boxW + 3) * 2, y, boxW, 13, 2, 2, 'FD');
  doc.setTextColor(71, 85, 105);
  doc.text(`${report.summary.unverifiedCount} Unverified`, margin + (boxW + 3) * 2 + 3, y + 8);
  y += 18;

  doc.setTextColor(18, 23, 34);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  const headlineLines = doc.splitTextToSize(report.summary.headlineConditional, contentW);
  doc.text(headlineLines, margin, y);
  y += headlineLines.length * 4.5 + 4;

  // Section: Field-by-Field Comparisons
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('Field-by-Field Conditional Comparison (Mileage Tolerance: +/- 7,000 km)', margin, y);
  y += 5;

  for (const c of report.comparisons) {
    const noteLines = doc.splitTextToSize(c.conditionalNote, contentW - 8);
    const cardH = 13 + noteLines.length * 3.8;
    ensureSpace(cardH + 3);

    if (c.status === 'consistent') {
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(134, 239, 172);
    } else if (c.status === 'attention') {
      doc.setFillColor(255, 247, 237);
      doc.setDrawColor(253, 186, 116);
    } else {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
    }

    doc.roundedRect(margin, y, contentW, cardH, 1.8, 1.8, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    if (c.status === 'consistent') doc.setTextColor(21, 128, 61);
    else if (c.status === 'attention') doc.setTextColor(194, 65, 12);
    else doc.setTextColor(71, 85, 105);

    const badgeText =
      c.status === 'consistent'
        ? '[CONSISTENT]'
        : c.status === 'attention'
        ? '[POTENTIAL ATTENTION]'
        : '[UNVERIFIED]';
    doc.text(`${badgeText} ${c.label}`, margin + 3, y + 5);

    doc.setTextColor(18, 23, 34);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.text(
      `Ad: ${c.listingValue.slice(0, 38)}   |   Database: ${c.databaseValue.slice(0, 42)}   |   Source: ${c.source}`,
      margin + 3,
      y + 9.5
    );

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(8);
    doc.text(noteLines, margin + 3, y + 13.8);
    y += cardH + 2.5;
  }

  // Safety Recalls if present
  if (report.external.recalls.length > 0) {
    ensureSpace(16);
    y += 3;
    doc.setTextColor(18, 23, 34);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(`Safety Recall Campaigns (${report.external.recalls.length})`, margin, y);
    y += 5;

    for (const r of report.external.recalls.slice(0, 5)) {
      const sumLines = doc.splitTextToSize(r.summary, contentW - 6);
      const h = 8 + sumLines.length * 3.6;
      ensureSpace(h + 2);
      doc.setFillColor(255, 247, 237);
      doc.setDrawColor(253, 186, 116);
      doc.roundedRect(margin, y, contentW, h, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.2);
      doc.setTextColor(194, 65, 12);
      doc.text(`${r.id} (${r.date ?? 'N/A'}) — ${r.component.slice(0, 65)}`, margin + 3, y + 4.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(7.8);
      doc.text(sumLines, margin + 3, y + 8.5);
      y += h + 2;
    }
  }

  // Disclaimer Footer
  ensureSpace(16);
  y += 4;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const disclaimer = doc.splitTextToSize(
    'Conditional Note: Scarner aggregates open, zero-cost government APIs and algorithmic decoders. All comparisons are indicative and expressed conditionally; differences might stem from clerical listing typos, cross-border imports, or registry update delays. Always verify original vehicle documents and physical condition before purchase.',
    contentW
  );
  doc.text(disclaimer, margin, y);

  return doc.output('blob');
}

export function downloadPdfReport(report: VerificationReport): void {
  const blob = generatePdfBlob(report);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = buildReportFilename(report, 'pdf');
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
