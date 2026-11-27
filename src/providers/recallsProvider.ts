import { RecallEntry, SourceAuditEntry } from '../types/domain';

interface NhtsaRecallRow {
  NHTSACampaignNumber?: string;
  ReportReceivedDate?: string;
  Component?: string;
  Summary?: string;
  Remedy?: string;
}

interface NhtsaModelOption {
  model?: string;
}

function normalizeRecallDate(raw?: string): string | null {
  if (!raw) return null;
  const parts = raw.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return raw;
}

async function fetchRecallsForModel(
  make: string,
  modelCandidate: string,
  year: number
): Promise<NhtsaRecallRow[]> {
  const url = `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodeURIComponent(
    make
  )}&model=${encodeURIComponent(modelCandidate)}&modelYear=${encodeURIComponent(String(year))}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6500) });
  if (!res.ok) return [];
  const json = (await res.json()) as { results?: NhtsaRecallRow[] };
  return Array.isArray(json.results) ? json.results : [];
}

async function resolveBestNhtsaRecallModel(
  make: string,
  model: string,
  trim: string | null | undefined,
  year: number
): Promise<string | null> {
  const url = `https://api.nhtsa.gov/products/vehicle/models?modelYear=${encodeURIComponent(
    String(year)
  )}&make=${encodeURIComponent(make)}&issueType=r`;

  const res = await fetch(url, { signal: AbortSignal.timeout(5500) });
  if (!res.ok) return null;
  const json = (await res.json()) as { results?: NhtsaModelOption[] };
  const options = Array.from(
    new Set(
      (json.results ?? [])
        .map((r) => r.model?.trim())
        .filter((m): m is string => Boolean(m))
    )
  );
  if (options.length === 0) return null;

  const fullAdText = `${model} ${trim ?? ''}`.toUpperCase();
  const adWords = fullAdText
    .split(/[^A-Z0-9]+/)
    .filter((w) => w.length >= 2 && !['THE', 'AND', 'CAR', 'FOR'].includes(w));

  const distinctSublines = ['COUNTRYMAN', 'CLUBMAN', 'PACEMAN', 'CABRIO', 'CONVERTIBLE', 'ALLROAD', 'AVANT', 'TOURING', 'CROSS'];

  let bestModel: string | null = null;
  let bestScore = 0;

  for (const opt of options) {
    const optUpper = opt.toUpperCase();
    const optWords = optUpper.split(/[^A-Z0-9]+/).filter(Boolean);
    let score = 0;

    if (optUpper === model.trim().toUpperCase()) {
      score += 50;
    }

    for (const w of adWords) {
      if (optWords.includes(w)) {
        score += w.length >= 4 ? 18 : 8;
      } else if (w.length >= 4 && optUpper.includes(w)) {
        score += 10;
      }
    }

    // Penalize distinct body sublines present in option when absent in listing (e.g. avoid matching CLUBMAN to a 3p Hatch)
    for (const sub of distinctSublines) {
      if (optUpper.includes(sub) && !fullAdText.includes(sub)) {
        score -= 30;
      }
    }

    // Prefer Cooper S over base Cooper when JCW / GP performance trim is listed
    if (
      (fullAdText.includes('WORKS') || fullAdText.includes('JCW') || fullAdText.includes('GP')) &&
      optUpper === 'COOPER S'
    ) {
      score += 12;
    }

    if (score > bestScore) {
      bestScore = score;
      bestModel = opt;
    }
  }

  return bestScore >= 10 ? bestModel : null;
}

export async function queryFreeSafetyRecalls(
  make: string | null,
  model: string | null,
  year: number | null,
  trim?: string | null
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

  const cleanMake = make.trim();
  // Strip trailing Roman numerals or parenthetical generation codes e.g. "Golf VIII (CD)" -> "Golf"
  const fullCleanModel = model
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(?:I|II|III|IV|V|VI|VII|VIII|IX)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const firstWordModel = fullCleanModel.split(/[\s/]+/)[0] ?? fullCleanModel;

  const candidates = Array.from(new Set([fullCleanModel, firstWordModel].filter((c) => c.length >= 2)));

  try {
    let rows: NhtsaRecallRow[] = [];
    let matchedModelLabel = fullCleanModel;

    for (const cand of candidates) {
      rows = await fetchRecallsForModel(cleanMake, cand, year);
      if (rows.length > 0) {
        matchedModelLabel = cand;
        break;
      }
    }

    // Multi-word / badge resolver via NHTSA Recall Models catalog (e.g. "MINI John Cooper Works" -> "COOPER S")
    if (rows.length === 0) {
      const resolved = await resolveBestNhtsaRecallModel(cleanMake, fullCleanModel, trim, year);
      if (resolved && !candidates.some((c) => c.toUpperCase() === resolved.toUpperCase())) {
        rows = await fetchRecallsForModel(cleanMake, resolved, year);
        if (rows.length > 0) {
          matchedModelLabel = resolved;
        }
      }
    }

    const items: RecallEntry[] = rows.slice(0, 8).map((r, i) => ({
      id: r.NHTSACampaignNumber ?? `RECALL-${i + 1}`,
      date: normalizeRecallDate(r.ReportReceivedDate),
      component: r.Component ?? 'Safety System',
      summary: r.Summary ?? 'Manufacturer safety campaign notice.',
      remedy: r.Remedy ?? null,
      source: `NHTSA Recalls API (${cleanMake} ${matchedModelLabel})`,
    }));

    return {
      items,
      audit: {
        id: 'nhtsa-recalls',
        name: 'Safety Recalls API (NHTSA / Global Platform)',
        method: 'API-OPEN',
        status: items.length > 0 ? 'matched' : 'queried_no_match',
        detail:
          items.length > 0
            ? `Found ${items.length} campaign notice(s) matching ${cleanMake} ${matchedModelLabel} (${year}).`
            : `0 recall notices matched ${cleanMake} ${fullCleanModel} (${year}).`,
      },
    };
  } catch {
    return {
      items: [],
      audit: {
        id: 'nhtsa-recalls',
        name: 'Safety Recalls API',
        method: 'API-OPEN',
        status: 'error',
        detail: 'Safety recall API request timed out.',
      },
    };
  }
}
