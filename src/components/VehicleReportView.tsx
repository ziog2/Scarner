'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MileageChart } from '@/components/MileageChart';
import { CheckSeverity, VehicleReport } from '@/types/report';

interface VehicleReportViewProps {
  report: VehicleReport;
}

const SEVERITY_LABELS: Record<CheckSeverity, string> = {
  ok: 'Verified',
  warning: 'Caution',
  danger: 'Alert',
  info: 'Info',
  unavailable: 'Portal Only',
};

function formatCurrency(amount: number): string {
  return `€${amount.toLocaleString('en-US')}`;
}

export function VehicleReportView({ report }: VehicleReportViewProps) {
  const [copiedKey, setCopiedKey] = useState<'query' | 'link' | null>(null);

  async function copyText(text: string, key: 'query' | 'link') {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Clipboard unavailable
    }
  }

  const titleParts = [report.specs.make, report.specs.model].filter(Boolean);
  const headingTitle =
    titleParts.length > 0
      ? `${titleParts.join(' ')}${report.specs.modelYear ? ` (${report.specs.modelYear})` : ''}`
      : `${report.query.countryName} ${report.query.kind === 'vin' ? 'VIN' : 'Plate'} ${report.query.formatted}`;

  const specRows: [string, string | null][] = [
    ['Make', report.specs.make],
    ['Model', report.specs.model],
    ['Variant / Category', report.specs.variant ?? report.query.categoryLabel],
    ['Body Style', report.specs.bodyStyle],
    ['Model Year', report.specs.modelYear ? String(report.specs.modelYear) : null],
    ['First Registration', report.specs.firstRegistrationDate],
    ['Manufacturing Country', report.specs.manufacturingCountry],
    ['VIN', report.specs.vin],
    ['Fuel Type', report.specs.fuel],
    ['Engine Displacement', report.specs.engineDisplacementCc ? `${report.specs.engineDisplacementCc} cc` : null],
    ['Cylinders', report.specs.cylinders ? String(report.specs.cylinders) : null],
    [
      'Power Output',
      report.specs.powerKw || report.specs.powerHp
        ? `${report.specs.powerKw ?? '—'} kW / ${report.specs.powerHp ?? '—'} HP`
        : null,
    ],
    ['Emissions Standard', report.specs.euroClass],
    ['CO₂ Emissions', report.specs.co2GramsPerKm ? `${report.specs.co2GramsPerKm} g/km` : null],
    ['Color', report.specs.color],
    ['Curb Weight', report.specs.curbWeightKg ? `${report.specs.curbWeightKg} kg` : null],
    ['Catalog Price (New)', report.specs.catalogPriceEur ? formatCurrency(report.specs.catalogPriceEur) : null],
    ['Seats', report.specs.seats ? String(report.specs.seats) : null],
  ];

  const populatedSpecs = specRows.filter(([, val]) => Boolean(val));

  return (
    <div className="container report-shell">
      {/* Live Data Coverage Notice */}
      <div className="report-banner" role="note">
        <div>
          <strong>
            {report.coverageMode === 'live_api'
              ? 'Live Open Government Data'
              : report.coverageMode === 'partial_live'
              ? 'Live Open VIN & Recall Data'
              : 'No Keyless Open API in This Country (Zero Fake Data)'}
            :{' '}
          </strong>
          {report.coverageNotice}
        </div>
      </div>

      {/* Report Hero */}
      <section className="report-hero-card" id="overview">
        <div className="report-hero-top">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span className="report-plate-badge">
                <span className="report-plate-band">
                  {report.query.kind === 'vin' ? 'VIN' : report.query.country}
                </span>
                <span className="report-plate-value">{report.query.formatted}</span>
              </span>
              <span className="status-pill info">{report.query.countryName}</span>
              <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                {report.reportId}
              </span>
            </div>

            <h1 className="report-vehicle-title">{headingTitle}</h1>
            <p className="report-vehicle-sub">
              {report.query.categoryLabel}
              {report.query.seriesOrWmi ? ` · ${report.query.kind === 'vin' ? 'WMI' : 'Series'} ${report.query.seriesOrWmi}` : ''}
              {report.query.estimatedPeriod ? ` · ${report.query.estimatedPeriod}` : ''}
            </p>
          </div>

          <div className="trust-gauge">
            <div className="trust-gauge-meta">
              <span className="trust-gauge-label">Data Provenance</span>
              <span className="trust-gauge-verdict">
                {report.coverageMode === 'live_api'
                  ? '100% Live Government API'
                  : report.coverageMode === 'partial_live'
                  ? 'Live VIN / Recall API + EU Portals'
                  : 'Real Validation + Free Official Portals'}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                Zero simulated or estimated mileage
              </span>
            </div>
          </div>
        </div>

        <div className="report-actions">
          <Link href="/" className="btn-secondary">
            ← New lookup
          </Link>
          <button
            id="btn-copy-query"
            type="button"
            className="btn-secondary"
            onClick={() => copyText(report.query.normalized, 'query')}
          >
            {copiedKey === 'query'
              ? '✓ Copied'
              : `Copy ${report.query.kind === 'vin' ? 'VIN' : 'plate'} (${report.query.normalized})`}
          </button>
          <button
            id="btn-copy-link"
            type="button"
            className="btn-secondary"
            onClick={() => copyText(window.location.href, 'link')}
          >
            {copiedKey === 'link' ? '✓ Link copied' : 'Share report'}
          </button>
          <button
            id="btn-print-pdf"
            type="button"
            className="btn-secondary"
            onClick={() => window.print()}
          >
            Print / Save PDF
          </button>
        </div>
      </section>

      {/* Sticky Nav */}
      <nav className="report-nav" aria-label="Report sections">
        <div className="report-nav-list">
          <a href="#overview" className="report-nav-link">Overview</a>
          <a href="#specs" className="report-nav-link">Verified Specs</a>
          <a href="#mileage" className="report-nav-link">Odometer &amp; Inspections</a>
          <a href="#recalls" className="report-nav-link">Safety Recalls</a>
          <a href="#ownership" className="report-nav-link">Registry &amp; Ownership</a>
          <a href="#official-checks" className="report-nav-link">Free Official Portals</a>
          <a href="#sources" className="report-nav-link">API Audit Trail</a>
        </div>
      </nav>

      {/* 6 Quick Checks */}
      <div className="quick-checks-grid">
        {report.quickChecks.map((check) => (
          <div key={check.id} className="quick-check-card">
            <div className="quick-check-head">
              <span className="quick-check-label">{check.label}</span>
              <span className={`status-pill ${check.status}`}>{SEVERITY_LABELS[check.status]}</span>
            </div>
            <div className="quick-check-value">{check.value}</div>
            <div className="quick-check-detail">{check.detail}</div>
          </div>
        ))}
      </div>

      {/* 1. Verified Technical Specifications */}
      <section className="report-section" id="specs">
        <div className="report-section-head">
          <div>
            <h2 className="report-section-title">Verified Technical Specifications</h2>
            <p className="report-section-desc">
              Only real values returned by official open registries or ISO 3779 decoding are shown below.
            </p>
          </div>
          <span className={`status-pill ${populatedSpecs.length > 2 ? 'ok' : 'unavailable'}`}>
            {populatedSpecs.length} verified field(s)
          </span>
        </div>

        {populatedSpecs.length > 0 ? (
          <div className="specs-grid">
            {populatedSpecs.map(([label, value]) => (
              <div key={label} className="spec-cell">
                <div className="spec-key">{label}</div>
                <div className="spec-val">{value}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="info-panel">
            <h3>No open technical API available for this country</h3>
            <p>
              Enter the vehicle&apos;s 17-character VIN in Scarner for live factory decoding, or open
              the official free {report.query.countryName} portals below.
            </p>
          </div>
        )}
      </section>

      {/* 2. Odometer & Inspections */}
      <section className="report-section" id="mileage">
        <div className="report-section-head">
          <div>
            <h2 className="report-section-title">Odometer History &amp; Periodic Inspections</h2>
            <p className="report-section-desc">{report.mileage.summary}</p>
          </div>
          <span
            className={`status-pill ${
              report.mileage.hasRollback
                ? 'danger'
                : report.mileage.available || report.inspections.available
                ? 'ok'
                : 'unavailable'
            }`}
          >
            {report.mileage.hasRollback
              ? `Rollback (-${report.mileage.rollbackDeltaKm.toLocaleString('en-US')} km)`
              : report.mileage.available
              ? `${report.mileage.readings.length} real readings`
              : report.inspections.available
              ? `${report.inspections.records.length} inspection record(s)`
              : 'Not in free open API'}
          </span>
        </div>

        {report.mileage.available && <MileageChart readings={report.mileage.readings} />}

        {report.inspections.nextDueDate && (
          <div className="metrics-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div className="metric-box">
              <div className="metric-label">Next Inspection Due / Expiry</div>
              <div className="metric-value mono">{report.inspections.nextDueDate}</div>
            </div>
            <div className="metric-box">
              <div className="metric-label">Recorded Inspections</div>
              <div className="metric-value mono">{report.inspections.records.length}</div>
            </div>
          </div>
        )}

        {report.inspections.records.length > 0 ? (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Result / Type</th>
                  <th>Valid Until</th>
                  <th>Mileage</th>
                  <th>Defects / Notes</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {report.inspections.records.map((rec, idx) => (
                  <tr key={`${rec.date}-${idx}`}>
                    <td className="mono">{rec.date}</td>
                    <td style={{ fontWeight: 600 }}>{rec.result}</td>
                    <td className="mono">{rec.expiryDate ?? '—'}</td>
                    <td className="mono">
                      {typeof rec.km === 'number' ? `${rec.km.toLocaleString('en-US')} km` : 'Not published'}
                    </td>
                    <td>
                      {rec.notes && rec.notes.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.8rem' }}>
                          {rec.notes.map((n, i) => (
                            <li key={i}>{n}</li>
                          ))}
                        </ul>
                      ) : (
                        <span style={{ color: 'var(--ink-muted)' }}>None recorded</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)' }}>{rec.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="info-panel">
            <h3>{report.inspections.available ? 'No historical inspection rows yet' : 'Check official portal for real mileage & inspections'}</h3>
            <p>{report.inspections.summary}</p>
          </div>
        )}
      </section>

      {/* 3. Safety Recalls */}
      <section className="report-section" id="recalls">
        <div className="report-section-head">
          <div>
            <h2 className="report-section-title">Safety Recalls</h2>
            <p className="report-section-desc">{report.recalls.summary}</p>
          </div>
          <span
            className={`status-pill ${
              report.flags.openRecallFlag === true
                ? 'danger'
                : report.recalls.items.length > 0
                ? 'warning'
                : report.recalls.available
                ? 'ok'
                : 'unavailable'
            }`}
          >
            {report.recalls.items.length > 0
              ? `${report.recalls.items.length} alert(s)`
              : report.recalls.available
              ? 'None matched'
              : 'Check EU Safety Gate'}
          </span>
        </div>

        {report.recalls.items.length > 0 ? (
          <div className="damage-event-list">
            {report.recalls.items.map((item) => (
              <article key={item.id} className="damage-event-card">
                <div className="damage-event-head">
                  <span className="mono" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    {item.id}{item.date ? ` · ${item.date}` : ''}
                  </span>
                  <span className={`status-pill ${item.status === 'Open flag' ? 'danger' : 'warning'}`}>
                    {item.status}
                  </span>
                </div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{item.component}</div>
                <p style={{ margin: '0 0 6px', fontSize: '0.88rem', color: 'var(--ink-primary)' }}>
                  {item.summary}
                </p>
                {item.remedy && (
                  <p style={{ margin: '0 0 6px', fontSize: '0.83rem', color: 'var(--ink-secondary)' }}>
                    <strong>Remedy:</strong> {item.remedy}
                  </p>
                )}
                <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>Source: {item.source}</div>
              </article>
            ))}
          </div>
        ) : (
          <div className="info-panel">
            <h3>No open recalls matched</h3>
            <p>
              For full European recall coverage, cross-check the vehicle make &amp; model on the
              official European Commission Safety Gate portal below.
            </p>
          </div>
        )}
      </section>

      {/* 4. Registry Flags & Ownership History */}
      <section className="report-section" id="ownership">
        <div className="report-section-head">
          <div>
            <h2 className="report-section-title">Registry Status &amp; Ownership Events</h2>
            <p className="report-section-desc">{report.ownership.summary}</p>
          </div>
        </div>

        {report.ownership.events.length > 0 ? (
          <div className="timeline-list">
            {report.ownership.events.map((ev, idx) => (
              <div key={`${ev.date}-${idx}`} className="timeline-item">
                <span className="timeline-dot ok" aria-hidden="true" />
                <div className="timeline-meta">
                  <span className="mono" style={{ fontWeight: 700, color: 'var(--ink-primary)' }}>
                    {ev.date}
                  </span>
                  <span>· {ev.source}</span>
                </div>
                <div style={{ fontWeight: 600 }}>{ev.description}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="info-panel">
            <h3>Ownership history not exposed by open API</h3>
            <p>{report.flags.notes[0] ?? report.ownership.summary}</p>
          </div>
        )}
      </section>

      {/* 5. Official Free European Verification Portals */}
      <section className="report-section" id="official-checks">
        <div className="report-section-head">
          <div>
            <h2 className="report-section-title">Free Official Government Verification Portals</h2>
            <p className="report-section-desc">
              Copy <strong className="mono">{report.query.normalized}</strong> in 1 click and verify
              official government records directly for free (no intermediaries or paywalls).
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary no-print"
            onClick={() => copyText(report.query.normalized, 'query')}
          >
            {copiedKey === 'query' ? '✓ Copied' : `Copy ${report.query.normalized}`}
          </button>
        </div>

        <div className="official-grid">
          {report.officialPortals.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="official-card"
            >
              <div>
                <div className="official-authority">
                  {link.country} · {link.authority}
                </div>
                <h3>{link.title}</h3>
                <p>{link.description}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                  Input: {link.lookupBy} · {link.accessNote}
                </span>
                <span className="official-link-cta">Open free portal →</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* 6. Live API Audit Trail */}
      <section className="report-section" id="sources">
        <div className="report-section-head">
          <div>
            <h2 className="report-section-title">Live Data Source Audit Trail</h2>
            <p className="report-section-desc">
              Exact providers queried to generate this report.
            </p>
          </div>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Provider</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {report.sources.map((src) => (
                <tr key={src.providerId}>
                  <td style={{ fontWeight: 700 }}>{src.label}</td>
                  <td>
                    <span
                      className={`status-pill ${
                        src.status === 'success'
                          ? 'ok'
                          : src.status === 'error'
                          ? 'danger'
                          : 'unavailable'
                      }`}
                    >
                      {src.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--ink-secondary)' }}>{src.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
