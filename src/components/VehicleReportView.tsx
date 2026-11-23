'use client';

import Link from 'next/link';
import { useState } from 'react';
import { DamageDiagram } from '@/components/DamageDiagram';
import { MileageChart } from '@/components/MileageChart';
import { CheckSeverity, VehicleReport } from '@/types/report';

interface VehicleReportViewProps {
  report: VehicleReport;
}

const SEVERITY_LABELS: Record<CheckSeverity, string> = {
  ok: 'Clear',
  warning: 'Caution',
  danger: 'Critical',
  info: 'Info',
};

function formatCurrency(amount: number): string {
  return `€${amount.toLocaleString('en-US')}`;
}

function getScoreStroke(score: number): string {
  if (score >= 80) return '#197A4B';
  if (score >= 60) return '#B8720E';
  return '#C62839';
}

export function VehicleReportView({ report }: VehicleReportViewProps) {
  const [copiedKey, setCopiedKey] = useState<'plate' | 'link' | null>(null);

  const circumference = 2 * Math.PI * 28;
  const strokeDashoffset = circumference - (report.trustScore / 100) * circumference;

  const priceSpan = Math.max(1, report.marketValue.highEur - report.marketValue.lowEur);
  const markerPercent = Math.min(
    96,
    Math.max(
      4,
      ((report.marketValue.adjustedEstimateEur - report.marketValue.lowEur) / priceSpan) * 100
    )
  );

  async function copyText(text: string, key: 'plate' | 'link') {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Clipboard unavailable
    }
  }

  return (
    <div className="container report-shell">
      {/* Transparent Data Mode Banner */}
      <div className="report-banner" role="note">
        <div>
          <strong>
            {report.dataMode === 'live'
              ? 'Verified Live Data'
              : report.dataMode === 'demo'
              ? 'Demo Report Mode'
              : 'Live Plate Analysis + Demo Profile'}
            :{' '}
          </strong>
          {report.dataModeBanner}
        </div>
      </div>

      {/* Report Hero Card */}
      <section className="report-hero-card" id="overview">
        <div className="report-hero-top">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span className="report-plate-badge" aria-label={`License plate ${report.plate.formatted}`}>
                <span className="report-plate-band">I</span>
                <span className="report-plate-value">{report.plate.formatted}</span>
              </span>
              <span className="status-pill info">{report.plate.plateCategory}</span>
              <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                ID: {report.reportId}
              </span>
            </div>

            <h1 className="report-vehicle-title">
              {report.specs.make} {report.specs.model} ({report.specs.year})
            </h1>
            <p className="report-vehicle-sub">
              {report.specs.trim} · {report.specs.fuel} · {report.specs.powerHp} HP ({report.specs.powerKw} kW) ·{' '}
              {report.specs.euroClass} · VIN <span className="mono">{report.specs.vinMasked}</span>
            </p>
          </div>

          <div className="trust-gauge" aria-label={`Scarner trust score ${report.trustScore} out of 100`}>
            <svg width="68" height="68" viewBox="0 0 68 68" style={{ flexShrink: 0 }}>
              <circle cx="34" cy="34" r="28" fill="none" stroke="#E2E6EE" strokeWidth="6" />
              <circle
                cx="34"
                cy="34"
                r="28"
                fill="none"
                stroke={getScoreStroke(report.trustScore)}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 34 34)"
              />
              <text
                x="34"
                y="38"
                textAnchor="middle"
                fontSize="16"
                fontWeight="800"
                fill="#151B28"
                fontFamily="var(--font-mono), monospace"
              >
                {report.trustScore}
              </text>
            </svg>
            <div className="trust-gauge-meta">
              <span className="trust-gauge-label">Scarner Score / 100</span>
              <span className="trust-gauge-verdict">{report.trustVerdict}</span>
            </div>
          </div>
        </div>

        <div className="report-actions">
          <Link href="/" className="btn-secondary">
            ← New lookup
          </Link>
          <button
            id="btn-copy-plate"
            type="button"
            className="btn-secondary"
            onClick={() => copyText(report.plate.normalized, 'plate')}
          >
            {copiedKey === 'plate' ? '✓ Plate copied' : 'Copy plate'}
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

      {/* Sticky Section Anchor Bar */}
      <nav className="report-nav" aria-label="Report sections">
        <div className="report-nav-list">
          <a href="#overview" className="report-nav-link">Overview</a>
          <a href="#mileage" className="report-nav-link">Mileage &amp; Inspections</a>
          <a href="#damage" className="report-nav-link">Accidents &amp; Damage</a>
          <a href="#theft-legal" className="report-nav-link">Theft, Insurance &amp; Legal</a>
          <a href="#specs" className="report-nav-link">Specs &amp; Road Tax</a>
          <a href="#valuation" className="report-nav-link">Market Value</a>
          <a href="#timeline" className="report-nav-link">Recalls &amp; Timeline</a>
          <a href="#official-checks" className="report-nav-link">Free Official Checks</a>
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

      {/* 1. Odometer & Inspections */}
      <section className="report-section" id="mileage">
        <div className="report-section-head">
          <div>
            <h2 className="report-section-title">Odometer History &amp; Inspections</h2>
            <p className="report-section-desc">{report.mileage.summary}</p>
          </div>
          <span className={`status-pill ${report.mileage.hasRollback ? 'danger' : 'ok'}`}>
            {report.mileage.hasRollback
              ? `Rollback detected (-${report.mileage.rollbackDeltaKm.toLocaleString('en-US')} km)`
              : 'Linear progression'}
          </span>
        </div>

        <div className="metrics-row">
          <div className="metric-box">
            <div className="metric-label">Latest recorded reading</div>
            <div className="metric-value mono">
              {report.mileage.latestKm.toLocaleString('en-US')} km
            </div>
          </div>
          <div className="metric-box">
            <div className="metric-label">Estimated annual average</div>
            <div className="metric-value mono">
              ~{report.mileage.averageYearlyKm.toLocaleString('en-US')} km/yr
            </div>
          </div>
          <div className="metric-box">
            <div className="metric-label">Odometer anomalies</div>
            <div className={`metric-value ${report.mileage.hasRollback ? 'danger' : ''}`}>
              {report.mileage.hasRollback
                ? `-${report.mileage.rollbackDeltaKm.toLocaleString('en-US')} km`
                : 'None'}
            </div>
          </div>
        </div>

        <MileageChart readings={report.mileage.readings} />

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Mileage</th>
                <th>Source</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {report.mileage.readings.map((row, idx) => (
                <tr key={`${row.date}-${idx}`} className={row.anomaly ? 'row-anomaly' : undefined}>
                  <td className="mono">{row.date}</td>
                  <td className="mono" style={{ fontWeight: 700 }}>
                    {row.km.toLocaleString('en-US')} km
                  </td>
                  <td>
                    {row.source}
                    {row.note && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--status-danger)', marginTop: 2 }}>
                        {row.note}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`status-pill ${row.anomaly ? 'danger' : 'ok'}`}>
                      {row.anomaly ? 'Anomaly' : 'Consistent'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {report.inspections.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: 700 }}>
              Periodic inspection records
            </h3>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Inspection date</th>
                    <th>Result</th>
                    <th>Recorded km</th>
                    <th>Region</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {report.inspections.map((ins, i) => (
                    <tr key={`${ins.date}-${i}`}>
                      <td className="mono">{ins.date}</td>
                      <td>
                        <span
                          className={`status-pill ${
                            ins.result === 'Pass' ? 'ok' : ins.result === 'Retest' ? 'warning' : 'danger'
                          }`}
                        >
                          {ins.result}
                        </span>
                      </td>
                      <td className="mono" style={{ fontWeight: 700 }}>
                        {ins.km.toLocaleString('en-US')} km
                      </td>
                      <td>{ins.centerRegion}</td>
                      <td style={{ color: 'var(--ink-secondary)' }}>{ins.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* 2. Accidents & Damage */}
      <section className="report-section" id="damage">
        <div className="report-section-head">
          <div>
            <h2 className="report-section-title">Accident &amp; Damage Analysis</h2>
            <p className="report-section-desc">{report.damages.summary}</p>
          </div>
          <span
            className={`status-pill ${
              report.damages.totalRecords === 0
                ? 'ok'
                : report.damages.events.some((e) => e.severity !== 'Minor')
                ? 'danger'
                : 'warning'
            }`}
          >
            {report.damages.totalRecords === 0
              ? 'No damage recorded'
              : `${report.damages.totalRecords} records found`}
          </span>
        </div>

        <div className="damage-grid">
          <DamageDiagram vehicleType={report.vehicleType} events={report.damages.events} />

          <div className="damage-event-list">
            {report.damages.events.length === 0 ? (
              <div className="info-panel">
                <h3>No accidents found</h3>
                <p>
                  No repair estimates or structural accident claims were found in the active
                  provider. A physical inspection of paint thickness, panel gaps, and fasteners is
                  always recommended before purchase.
                </p>
              </div>
            ) : (
              report.damages.events.map((event) => (
                <article key={event.id} className="damage-event-card">
                  <div className="damage-event-head">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="mono" style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                        {event.date}
                      </span>
                      <span
                        className={`status-pill ${
                          event.severity === 'Minor' ? 'warning' : 'danger'
                        }`}
                      >
                        Severity: {event.severity}
                      </span>
                    </div>
                    <span className="damage-cost">
                      {formatCurrency(event.estimatedCostMinEur)} – {formatCurrency(event.estimatedCostMaxEur)}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 8px', fontSize: '0.9rem', color: 'var(--ink-primary)' }}>
                    {event.description}
                  </p>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                    Country: {event.country} · Source: {event.source}
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 3. Theft, Insurance & Legal */}
      <section className="report-section" id="theft-legal">
        <div className="report-section-head">
          <div>
            <h2 className="report-section-title">Theft Check, Insurance (RCA) &amp; Legal Status</h2>
            <p className="report-section-desc">
              Circulation status, previous commercial/fleet use, and lien indicators.
            </p>
          </div>
        </div>

        <div className="two-col-grid">
          <div className="info-panel">
            <div className="quick-check-head">
              <h3 style={{ margin: 0 }}>Stolen vehicle registry</h3>
              <span
                className={`status-pill ${
                  report.theft.status === 'clear'
                    ? 'ok'
                    : report.theft.status === 'flagged'
                    ? 'danger'
                    : 'info'
                }`}
              >
                {report.theft.status === 'clear'
                  ? 'Clear'
                  : report.theft.status === 'flagged'
                  ? 'Flagged'
                  : 'Direct check'}
              </span>
            </div>
            <p style={{ marginBottom: 10 }}>{report.theft.summary}</p>
            <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
              Sources: {report.theft.databasesChecked.join(' · ')}
            </div>
          </div>

          <div className="info-panel">
            <div className="quick-check-head">
              <h3 style={{ margin: 0 }}>Compulsory insurance (RCA)</h3>
              <span
                className={`status-pill ${
                  report.insurance.covered === true
                    ? 'ok'
                    : report.insurance.covered === false
                    ? 'danger'
                    : 'info'
                }`}
              >
                {report.insurance.covered === true
                  ? 'Active'
                  : report.insurance.covered === false
                  ? 'Uninsured'
                  : 'Direct check'}
              </span>
            </div>
            <p>{report.insurance.summary}</p>
            {report.insurance.validUntil && (
              <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: 8 }}>
                Estimated expiry: {report.insurance.validUntil}
              </div>
            )}
          </div>

          <div className="info-panel">
            <div className="quick-check-head">
              <h3 style={{ margin: 0 }}>Previous use &amp; ownership</h3>
              <span
                className={`status-pill ${
                  report.legal.previousUse === 'Private use'
                    ? 'ok'
                    : report.legal.previousUse === 'Not detected'
                    ? 'info'
                    : 'warning'
                }`}
              >
                {report.legal.previousUse}
              </span>
            </div>
            <p>{report.legal.summary}</p>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, marginTop: 8 }}>
              Estimated owners: {report.legal.ownersCount}
            </div>
          </div>

          <div className="info-panel">
            <div className="quick-check-head">
              <h3 style={{ margin: 0 }}>Administrative liens</h3>
              <span className={`status-pill ${report.legal.administrativeDetention ? 'danger' : 'ok'}`}>
                {report.legal.administrativeDetention ? 'Detected' : 'None detected'}
              </span>
            </div>
            <p>
              For legally binding verification of liens, seizures, and ownership transfers prior to
              purchase, request an official PRA report through ACI.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Technical Specs & Tax */}
      <section className="report-section" id="specs">
        <div className="report-section-head">
          <div>
            <h2 className="report-section-title">Technical Specs, Emissions &amp; Road Tax</h2>
            <p className="report-section-desc">
              Key powertrain specifications, environmental compliance, and novice driver eligibility.
            </p>
          </div>
        </div>

        <div className="specs-grid">
          <div className="spec-cell">
            <div className="spec-key">First registration (series est.)</div>
            <div className="spec-val mono">
              {report.specs.firstRegistrationDate} ({report.plate.estimatedRegistrationPeriod})
            </div>
          </div>
          <div className="spec-cell">
            <div className="spec-key">Engine &amp; fuel</div>
            <div className="spec-val">
              {report.specs.engineDisplacementCc} cc · {report.specs.fuel}
            </div>
          </div>
          <div className="spec-cell">
            <div className="spec-key">Power output</div>
            <div className="spec-val mono">
              {report.specs.powerKw} kW / {report.specs.powerHp} HP
            </div>
          </div>
          <div className="spec-cell">
            <div className="spec-key">Transmission</div>
            <div className="spec-val">{report.specs.transmission}</div>
          </div>
          <div className="spec-cell">
            <div className="spec-key">Emissions standard</div>
            <div className="spec-val">{report.specs.euroClass}</div>
          </div>
          <div className="spec-cell">
            <div className="spec-key">CO₂ emissions</div>
            <div className="spec-val mono">{report.specs.co2GramsPerKm} g/km</div>
          </div>
          <div className="spec-cell">
            <div className="spec-key">Novice driver eligible</div>
            <div className="spec-val">{report.specs.noviceDriverAllowed ? 'Yes' : 'No (check limits)'}</div>
          </div>
          <div className="spec-cell">
            <div className="spec-key">Curb weight</div>
            <div className="spec-val mono">{report.specs.weightKg} kg</div>
          </div>
          <div className="spec-cell">
            <div className="spec-key">Estimated annual tax</div>
            <div className="spec-val mono">~{formatCurrency(report.specs.estimatedAnnualTaxEur)} / yr</div>
          </div>
        </div>
      </section>

      {/* 5. Market Valuation */}
      <section className="report-section" id="valuation">
        <div className="report-section-head">
          <div>
            <h2 className="report-section-title">Market Valuation</h2>
            <p className="report-section-desc">{report.marketValue.note}</p>
          </div>
          <div className="mono" style={{ fontSize: '1.35rem', fontWeight: 800 }}>
            {formatCurrency(report.marketValue.adjustedEstimateEur)}
          </div>
        </div>

        <div className="price-range-box">
          <div style={{ fontSize: '0.84rem', color: 'var(--ink-secondary)' }}>
            Adjusted vehicle estimate relative to typical market pricing:
          </div>

          <div className="price-track" aria-hidden="true">
            <div
              className="price-marker"
              style={{ left: `${markerPercent}%` }}
              title={`Adjusted estimate: ${formatCurrency(report.marketValue.adjustedEstimateEur)}`}
            />
          </div>

          <div className="price-labels">
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>Low range</div>
              <strong className="mono">{formatCurrency(report.marketValue.lowEur)}</strong>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>Market average</div>
              <strong className="mono">{formatCurrency(report.marketValue.averageEur)}</strong>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>High range</div>
              <strong className="mono">{formatCurrency(report.marketValue.highEur)}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Safety Recalls & Unified Timeline */}
      <section className="report-section" id="timeline">
        <div className="report-section-head">
          <div>
            <h2 className="report-section-title">Safety Recalls &amp; Vehicle Timeline</h2>
            <p className="report-section-desc">
              Unified chronological log of recorded events.
            </p>
          </div>
        </div>

        {report.recalls.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '0.98rem', fontWeight: 700 }}>
              Manufacturer recall campaigns
            </h3>
            <div className="damage-event-list">
              {report.recalls.map((recall) => (
                <div key={recall.id} className="damage-event-card">
                  <div className="damage-event-head">
                    <span className="mono" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      {recall.id} · {recall.date}
                    </span>
                    <span
                      className={`status-pill ${
                        recall.status === 'Completed'
                          ? 'ok'
                          : recall.status === 'Check required'
                          ? 'warning'
                          : 'danger'
                      }`}
                    >
                      {recall.status}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{recall.title}</div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--ink-secondary)' }}>
                    Component: {recall.component} · {recall.source}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="timeline-list">
          {report.timeline.map((item) => (
            <div key={item.id} className="timeline-item">
              <span className={`timeline-dot ${item.severity}`} aria-hidden="true" />
              <div className="timeline-meta">
                <span className="mono" style={{ fontWeight: 700, color: 'var(--ink-primary)' }}>
                  {item.date}
                </span>
                {item.location && <span>· {item.location}</span>}
                {typeof item.km === 'number' && (
                  <span className="mono">· {item.km.toLocaleString('en-US')} km</span>
                )}
              </div>
              <div style={{ fontWeight: 700, marginBottom: 3 }}>{item.title}</div>
              <div style={{ fontSize: '0.88rem', color: 'var(--ink-secondary)' }}>{item.detail}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Free Official Verification Portals & Transparency */}
      <section className="report-section" id="official-checks">
        <div className="report-section-head">
          <div>
            <h2 className="report-section-title">Free Official Real-Time Verification</h2>
            <p className="report-section-desc">
              Official public portals require completing a CAPTCHA directly on the government site.
              Copy plate <strong className="mono">{report.plate.normalized}</strong> in one click
              and open the free official checks below without paying a middleman.
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary no-print"
            onClick={() => copyText(report.plate.normalized, 'plate')}
          >
            {copiedKey === 'plate' ? '✓ Plate copied' : `Copy ${report.plate.normalized}`}
          </button>
        </div>

        <div className="official-grid">
          {report.officialLinks.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="official-card"
            >
              <div>
                <div className="official-authority">{link.authority}</div>
                <h3>{link.title}</h3>
                <p>{link.description}</p>
              </div>
              <span className="official-link-cta">Open free official portal →</span>
            </a>
          ))}
        </div>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-muted)', marginBottom: 8 }}>
            Data source transparency
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.85rem', color: 'var(--ink-secondary)' }}>
            {report.sources.map((src) => (
              <div key={src.providerId}>
                <strong style={{ color: 'var(--ink-primary)' }}>{src.label}</strong> ({src.mode}): {src.note}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
