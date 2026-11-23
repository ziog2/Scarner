import { NextRequest, NextResponse } from 'next/server';
import { EUROPEAN_COUNTRIES } from '@/lib/providers/europeanPortals';
import { generateEuropeanReport } from '@/lib/providers/registry';
import { EuropeanCountryCode, LookupKind } from '@/types/report';

const VALID_COUNTRIES = new Set<EuropeanCountryCode>([
  'EU',
  ...EUROPEAN_COUNTRIES.map((c) => c.code),
]);

export async function GET(request: NextRequest) {
  const query =
    request.nextUrl.searchParams.get('query') ??
    request.nextUrl.searchParams.get('plate') ??
    request.nextUrl.searchParams.get('vin') ??
    '';
  const rawCountry = (request.nextUrl.searchParams.get('country') ?? '').toUpperCase() as EuropeanCountryCode;
  const rawKind = request.nextUrl.searchParams.get('kind') as LookupKind | null;

  const country = VALID_COUNTRIES.has(rawCountry) ? rawCountry : undefined;
  const kind = rawKind === 'plate' || rawKind === 'vin' ? rawKind : undefined;

  const outcome = await generateEuropeanReport({ query, country, kind });

  if (!outcome.ok) {
    return NextResponse.json({ error: outcome.error }, { status: 400 });
  }

  return NextResponse.json(outcome.report, { status: 200 });
}
