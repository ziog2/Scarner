import { SafetyRecall } from '@/types/report';

interface NhtsaRecallRow {
  NHTSACampaignNumber?: string;
  ReportReceivedDate?: string;
  Component?: string;
  Summary?: string;
  Remedy?: string;
}

function normalizeDate(raw?: string): string | null {
  if (!raw) return null;
  const parts = raw.split('/');
  if (parts.length === 3) {
    // DD/MM/YYYY -> YYYY-MM-DD
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return raw;
}

export async function fetchNhtsaRecalls(
  make: string | null,
  model: string | null,
  modelYear: number | null
): Promise<{ ok: boolean; items: SafetyRecall[]; detail: string }> {
  if (!make || !model || !modelYear) {
    return { ok: false, items: [], detail: 'Make, model, and year are required to query recall campaigns.' };
  }

  const cleanMake = make.trim();
  const cleanModel = model.trim().split(/\s+/).slice(0, 2).join(' ');
  const url = `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodeURIComponent(cleanMake)}&model=${encodeURIComponent(cleanModel)}&modelYear=${encodeURIComponent(String(modelYear))}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'Scarner-OpenSource/1.0' },
      signal: AbortSignal.timeout(7000),
      cache: 'no-store',
    });

    if (!res.ok) {
      return { ok: false, items: [], detail: `NHTSA Recalls API returned HTTP ${res.status}.` };
    }

    const data = (await res.json()) as { results?: NhtsaRecallRow[] };
    const rows = Array.isArray(data.results) ? data.results : [];

    const items: SafetyRecall[] = rows.slice(0, 12).map((row, index) => ({
      id: row.NHTSACampaignNumber ?? `NHTSA-${index + 1}`,
      date: normalizeDate(row.ReportReceivedDate),
      component: row.Component ?? 'Safety component',
      summary: row.Summary ?? 'Recall campaign registered.',
      remedy: row.Remedy ?? null,
      status: 'Campaign notice',
      source: 'NHTSA Official Recalls API (Live)',
    }));

    return {
      ok: true,
      items,
      detail:
        items.length > 0
          ? `Found ${items.length} campaign notice(s) for ${cleanMake} ${cleanModel} (${modelYear}).`
          : `No NHTSA recall campaigns matched ${cleanMake} ${cleanModel} (${modelYear}).`,
    };
  } catch {
    return { ok: false, items: [], detail: 'NHTSA Recalls API request timed out or failed.' };
  }
}
