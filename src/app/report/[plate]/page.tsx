import Link from 'next/link';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SiteHeader } from '@/components/SiteHeader';
import { VehicleReportView } from '@/components/VehicleReportView';
import { EUROPEAN_COUNTRIES } from '@/lib/providers/europeanPortals';
import { generateEuropeanReport } from '@/lib/providers/registry';
import { EuropeanCountryCode, LookupKind } from '@/types/report';

interface ReportPageProps {
  params: Promise<{ plate: string }>;
  searchParams: Promise<{ country?: string; kind?: string }>;
}

const VALID_COUNTRIES = new Set<EuropeanCountryCode>([
  'EU',
  ...EUROPEAN_COUNTRIES.map((c) => c.code),
]);

export async function generateMetadata({ params }: ReportPageProps): Promise<Metadata> {
  const { plate } = await params;
  const decoded = decodeURIComponent(plate).toUpperCase();
  return {
    title: `Live Report for ${decoded} — Scarner`,
    description: `Free real-data European vehicle report for ${decoded} powered by open government registries and official verification portals.`,
  };
}

async function ReportContent({ params, searchParams }: ReportPageProps) {
  const { plate } = await params;
  const query = await searchParams;
  const decodedQuery = decodeURIComponent(plate);

  const rawCountry = (query.country ?? '').toUpperCase() as EuropeanCountryCode;
  const country = VALID_COUNTRIES.has(rawCountry) ? rawCountry : undefined;
  const kind: LookupKind | undefined =
    query.kind === 'plate' || query.kind === 'vin' ? query.kind : undefined;

  const outcome = await generateEuropeanReport({
    query: decodedQuery,
    country,
    kind,
  });

  if (!outcome.ok) {
    return (
      <div className="container report-shell">
        <section className="report-hero-card" style={{ maxWidth: 680, margin: '24px auto' }}>
          <span className="status-pill danger">Lookup not found / invalid</span>
          <h1 className="report-vehicle-title" style={{ marginTop: 12 }}>
            No live record for “{decodedQuery}”
          </h1>
          <p className="report-vehicle-sub" style={{ marginBottom: 20 }}>
            {outcome.error}
          </p>
          <Link href="/" className="btn-primary" style={{ maxWidth: 260 }}>
            ← Back to European lookup
          </Link>
        </section>
      </div>
    );
  }

  return <VehicleReportView report={outcome.report} />;
}

export default function ReportPage({ params, searchParams }: ReportPageProps) {
  return (
    <>
      <SiteHeader />
      <main>
        <Suspense
          fallback={
            <div className="container report-shell">
              <section className="report-hero-card" style={{ maxWidth: 680, margin: '24px auto' }}>
                <span className="status-pill info">Querying Live APIs</span>
                <h1 className="report-vehicle-title" style={{ marginTop: 12 }}>
                  Fetching real European vehicle records…
                </h1>
                <p className="report-vehicle-sub">
                  Contacting open government registries (RDW, NHTSA vPIC/Recalls, and configured national APIs).
                </p>
              </section>
            </div>
          }
        >
          <ReportContent params={params} searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}
