import Link from 'next/link';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SiteHeader } from '@/components/SiteHeader';
import { VehicleReportView } from '@/components/VehicleReportView';
import { generateVehicleReport } from '@/lib/providers/registry';
import { VehicleType } from '@/types/report';

interface ReportPageProps {
  params: Promise<{ plate: string }>;
  searchParams: Promise<{ type?: string }>;
}

const VALID_TYPES: VehicleType[] = ['car', 'motorcycle', 'moped'];

export async function generateMetadata({ params }: ReportPageProps): Promise<Metadata> {
  const { plate } = await params;
  const decoded = decodeURIComponent(plate).toUpperCase();
  return {
    title: `Report for ${decoded} — Scarner`,
    description: `Free vehicle history report for plate ${decoded}: mileage history, inspections, damage records, specifications, and official free checks.`,
  };
}

async function ReportContent({ params, searchParams }: ReportPageProps) {
  const { plate } = await params;
  const query = await searchParams;
  const decodedPlate = decodeURIComponent(plate);
  const requestedType = VALID_TYPES.includes(query.type as VehicleType)
    ? (query.type as VehicleType)
    : undefined;

  const outcome = await generateVehicleReport(decodedPlate, requestedType);

  if (!outcome.ok) {
    return (
      <div className="container report-shell">
        <section className="report-hero-card" style={{ maxWidth: 640, margin: '24px auto' }}>
          <span className="status-pill danger">Invalid plate</span>
          <h1 className="report-vehicle-title" style={{ marginTop: 12 }}>
            Unable to generate a report for “{decodedPlate}”
          </h1>
          <p className="report-vehicle-sub" style={{ marginBottom: 20 }}>
            {outcome.error}
          </p>
          <Link href="/" className="btn-primary" style={{ maxWidth: 260 }}>
            ← Back to plate lookup
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
              <section className="report-hero-card" style={{ maxWidth: 640, margin: '24px auto' }}>
                <span className="status-pill info">Analyzing</span>
                <h1 className="report-vehicle-title" style={{ marginTop: 12 }}>
                  Generating vehicle report…
                </h1>
                <p className="report-vehicle-sub">
                  Validating license plate format and assembling report sections.
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
