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
    title: `Report targa ${decoded} — Scarner`,
    description: `Report storico gratuito per la targa ${decoded}: chilometraggio, revisioni, danni, specifiche tecniche e controlli ufficiali italiani.`,
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
          <span className="status-pill danger">Targa non valida</span>
          <h1 className="report-vehicle-title" style={{ marginTop: 12 }}>
            Impossibile generare il report per “{decodedPlate}”
          </h1>
          <p className="report-vehicle-sub" style={{ marginBottom: 20 }}>
            {outcome.error}
          </p>
          <Link href="/" className="btn-primary" style={{ maxWidth: 260 }}>
            ← Torna alla ricerca targa
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
                <span className="status-pill info">Analisi in corso</span>
                <h1 className="report-vehicle-title" style={{ marginTop: 12 }}>
                  Generazione del report veicolo…
                </h1>
                <p className="report-vehicle-sub">
                  Validazione targa italiana e raccolta delle sezioni del report.
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
