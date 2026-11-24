import { VerificationReport } from '../types/domain';

function csvCell(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export function generateCsvContent(report: VerificationReport): string {
  const rows: string[][] = [];

  rows.push(['SCARNER VEHICLE VERIFICATION REPORT']);
  rows.push(['Report ID', report.reportId]);
  rows.push(['Generated At', report.generatedAt]);
  rows.push(['Listing URL', report.listing.url]);
  rows.push(['Listing Title', report.listing.title]);
  rows.push(['Asking Price (EUR)', report.listing.priceEur ? String(report.listing.priceEur) : 'N/A']);
  rows.push(['Detected Plate', report.identifiers.plate ?? 'None', `Method: ${report.identifiers.plateMethod}`]);
  rows.push(['Detected VIN', report.identifiers.vin ?? 'None', `Method: ${report.identifiers.vinMethod}`]);
  rows.push(['Consistent Fields (Green)', String(report.summary.consistentCount)]);
  rows.push(['Attention Items (Orange)', String(report.summary.attentionCount)]);
  rows.push(['Summary Assessment', report.summary.headlineConditional]);
  rows.push([]);

  rows.push([
    'SECTION: FIELD COMPARISONS',
    'Listing Value',
    'External Database Value',
    'Highlight Status',
    'Data Source',
    'Conditional Assessment',
  ]);

  for (const c of report.comparisons) {
    const statusLabel =
      c.status === 'consistent'
        ? 'GREEN - Consistent'
        : c.status === 'attention'
        ? 'ORANGE - Potential Attention'
        : 'NEUTRAL - Unverified';
    rows.push([c.label, c.listingValue, c.databaseValue, statusLabel, c.source, c.conditionalNote]);
  }
  rows.push([]);

  if (report.external.inspections.length > 0) {
    rows.push(['SECTION: RECORDED INSPECTIONS', 'Result', 'Valid Until', 'Mileage (km)', 'Defects', 'Source']);
    for (const ins of report.external.inspections) {
      rows.push([
        ins.date,
        ins.result,
        ins.expiryDate ?? '',
        ins.mileageKm ? String(ins.mileageKm) : 'Not published',
        (ins.defects ?? []).join('; '),
        ins.source,
      ]);
    }
    rows.push([]);
  }

  if (report.external.recalls.length > 0) {
    rows.push(['SECTION: SAFETY RECALL CAMPAIGNS', 'Date', 'Component', 'Summary', 'Source']);
    for (const r of report.external.recalls) {
      rows.push([r.id, r.date ?? '', r.component, r.summary, r.source]);
    }
    rows.push([]);
  }

  rows.push(['SECTION: FREE OFFICIAL VERIFICATION PORTALS', 'Authority', 'Lookup Key', 'URL']);
  for (const p of report.external.portals) {
    rows.push([`${p.country} - ${p.title}`, p.authority, p.lookupBy, p.url]);
  }

  const body = rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
  return `\uFEFF${body}`;
}

export function buildReportFilename(report: VerificationReport, ext: 'csv' | 'pdf'): string {
  const slug = [
    report.listing.make,
    report.listing.model,
    report.identifiers.plate ?? report.identifiers.vin?.slice(-6) ?? report.listing.listingId.slice(0, 8),
  ]
    .filter(Boolean)
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-');
  return `scarner-report-${slug || 'vehicle'}.${ext}`;
}

export function downloadCsvReport(report: VerificationReport): void {
  const csv = generateCsvContent(report);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = buildReportFilename(report, 'csv');
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
