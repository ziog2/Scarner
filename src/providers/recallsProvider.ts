import { RecallEntry, SourceAuditEntry } from '../types/domain';

interface NhtsaRecallRow {
  NHTSACampaignNumber?: string;
  ReportReceivedDate?: string;
  Component?: string;
  Summary?: string;
  Remedy?: string;
}

function normalizeRecallDate(raw?: string): string | null {
  if (!raw) return null;
  const parts = raw.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return raw;
}

export async function queryFreeSafetyRecalls(
  make: string | null,
  model: string | null,
  year: number | null
): Promise<{ items: RecallEntry[]; audit: SourceAuditEntry }> {
  if (!make || !model || !year) {
    return {
      items: [],
      audit: {
        id: 'nhtsa-recalls',
        name: 'Safety Recalls API (Make / Model / Year)',
        method: 'API-OPEN',
        status: 'queried_no_match',
        detail: 'Requires make, model, and year to query model-level safety recall campaigns.',
      },
    };
  }

  // Strip generation suffixes e.g. "Golf VIII" -> "Golf", "320d" -> "320" or first model word
  const cleanMake = make.trim();
  const cleanModel = model.trim().split(/[\s(/]+/)[0] ?? model.trim();

  const url = `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodeURIComponent(cleanMake)}&model=${encodeURIComponent(cleanModel)}&modelYear=${encodeURIComponent(String(year))}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
    if (!res.ok) {
      return {
        items: [],
        audit: {
          id: 'nhtsa-recalls',
          name: 'NHTSA Safety Recalls API',
          method: 'API-OPEN',
          status: 'queried_no_match',
          detail: `No campaign batch returned for ${cleanMake} ${cleanModel} (${year}).`,
        },
      };
    }

    const json = (await res.json()) as { results?: NhtsaRecallRow[] };
    const rows = Array.isArray(json.results) ? json.results : [];
    const items: RecallEntry[] = rows.slice(0, 8).map((r, i) => ({
      id: r.NHTSACampaignNumber ?? `RECALL-${i + 1}`,
      date: normalizeRecallDate(r.ReportReceivedDate),
      component: r.Component ?? 'Safety System',
      summary: r.Summary ?? 'Manufacturer safety campaign notice.',
      remedy: r.Remedy ?? null,
      source: 'NHTSA Official Recalls API',
    }));

    return {
      items,
      audit: {
        id: 'nhtsa-recalls',
        name: 'NHTSA Safety Recalls API',
        method: 'API-OPEN',
        status: items.length > 0 ? 'matched' : 'queried_no_match',
        detail:
          items.length > 0
            ? `Found ${items.length} campaign notice(s) for ${cleanMake} ${cleanModel} (${year}).`
            : `0 recall notices matched ${cleanMake} ${cleanModel} (${year}).`,
      },
    };
  } catch {
    return {
      items: [],
      audit: {
        id: 'nhtsa-recalls',
        name: 'NHTSA Safety Recalls API',
        method: 'API-OPEN',
        status: 'error',
        detail: 'Safety recall API request timed out.',
      },
    };
  }
}
