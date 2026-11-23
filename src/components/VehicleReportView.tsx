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
  ok: 'Regolare',
  warning: 'Attenzione',
  danger: 'Critico',
  info: 'Info',
};

function formatCurrency(amount: number): string {
  return `€${amount.toLocaleString('it-IT')}`;
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
      // Clipboard non disponibile
    }
  }

  return (
    <div className="container report-shell">
      {/* Transparent Data Mode Banner */}
      <div className="report-banner" role="note">
        <div>
          <strong>
            {report.dataMode === 'live'
              ? 'Dati live verificati'
              : report.dataMode === 'demo'
              ? 'Modalità Report Dimostrativo'
              : 'Analisi Targa Reale + Scheda Demo'}
            :{' '}
          </strong>
          {report.dataModeBanner}
        </div>
      </div>

      {/* Report Hero Card */}
      <section className="report-hero-card" id="panoramica">
        <div className="report-hero-top">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span className="report-plate-badge" aria-label={`Targa ${report.plate.formatted}`}>
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
              {report.specs.trim} · {report.specs.fuel} · {report.specs.powerHp} CV ({report.specs.powerKw} kW) ·{' '}
              {report.specs.euroClass} · Telaio <span className="mono">{report.specs.vinMasked}</span>
            </p>
          </div>

          <div className="trust-gauge" aria-label={`Indice di affidabilità ${report.trustScore} su 100`}>
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
              <span className="trust-gauge-label">Indice Scarner / 100</span>
              <span className="trust-gauge-verdict">{report.trustVerdict}</span>
            </div>
          </div>
        </div>

        <div className="report-actions">
          <Link href="/" className="btn-secondary">
            ← Nuova targa
          </Link>
          <button
            id="btn-copy-plate"
            type="button"
            className="btn-secondary"
            onClick={() => copyText(report.plate.normalized, 'plate')}
          >
            {copiedKey === 'plate' ? '✓ Targa copiata' : 'Copia targa'}
          </button>
          <button
            id="btn-copy-link"
            type="button"
            className="btn-secondary"
            onClick={() => copyText(window.location.href, 'link')}
          >
            {copiedKey === 'link' ? '✓ Link copiato' : 'Condividi report'}
          </button>
          <button
            id="btn-print-pdf"
            type="button"
            className="btn-secondary"
            onClick={() => window.print()}
          >
            Stampa / Salva PDF
          </button>
        </div>
      </section>

      {/* Sticky Section Anchor Bar */}
      <nav className="report-nav" aria-label="Sezioni del report">
        <div className="report-nav-list">
          <a href="#panoramica" className="report-nav-link">Panoramica</a>
          <a href="#chilometraggio" className="report-nav-link">Chilometraggio & Revisioni</a>
          <a href="#danni" className="report-nav-link">Danni & Sinistri</a>
          <a href="#furto-rca" className="report-nav-link">Furto, RCA & Legale</a>
          <a href="#specifiche" className="report-nav-link">Specifiche & Bollo</a>
          <a href="#valore" className="report-nav-link">Valore di Mercato</a>
          <a href="#cronologia" className="report-nav-link">Richiami & Cronologia</a>
          <a href="#fonti-ufficiali" className="report-nav-link">Verifica Ufficiale Gratuita</a>
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

      {/* 1. Chilometraggio & Revisioni */}
      <section className="report-section" id="chilometraggio">
        <div className="report-section-head">
          <div>
            <h2 className="report-section-title">Chilometraggio e Revisioni</h2>
            <p className="report-section-desc">{report.mileage.summary}</p>
          </div>
          <span className={`status-pill ${report.mileage.hasRollback ? 'danger' : 'ok'}`}>
            {report.mileage.hasRollback
              ? `Scalatura rilevata (-${report.mileage.rollbackDeltaKm.toLocaleString('it-IT')} km)`
              : 'Andamento lineare'}
          </span>
        </div>

        <div className="metrics-row">
          <div className="metric-box">
            <div className="metric-label">Ultima lettura registrata</div>
            <div className="metric-value mono">
              {report.mileage.latestKm.toLocaleString('it-IT')} km
            </div>
          </div>
          <div className="metric-box">
            <div className="metric-label">Percorrenza media annua</div>
            <div className="metric-value mono">
              ~{report.mileage.averageYearlyKm.toLocaleString('it-IT')} km/anno
            </div>
          </div>
          <div className="metric-box">
            <div className="metric-label">Anomalie contachilometri</div>
            <div className={`metric-value ${report.mileage.hasRollback ? 'danger' : ''}`}>
              {report.mileage.hasRollback
                ? `-${report.mileage.rollbackDeltaKm.toLocaleString('it-IT')} km`
                : 'Nessuna'}
            </div>
          </div>
        </div>

        <MileageChart readings={report.mileage.readings} />

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Chilometri</th>
                <th>Fonte rilevazione</th>
                <th>Stato</th>
              </tr>
            </thead>
            <tbody>
              {report.mileage.readings.map((row, idx) => (
                <tr key={`${row.date}-${idx}`} className={row.anomaly ? 'row-anomaly' : undefined}>
                  <td className="mono">{row.date}</td>
                  <td className="mono" style={{ fontWeight: 700 }}>
                    {row.km.toLocaleString('it-IT')} km
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
                      {row.anomaly ? 'Anomalia' : 'Coerente'}
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
              Storico revisioni ministeriali
            </h3>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Data revisione</th>
                    <th>Esito</th>
                    <th>Km rilevati</th>
                    <th>Area</th>
                    <th>Fonte</th>
                  </tr>
                </thead>
                <tbody>
                  {report.inspections.map((ins, i) => (
                    <tr key={`${ins.date}-${i}`}>
                      <td className="mono">{ins.date}</td>
                      <td>
                        <span
                          className={`status-pill ${
                            ins.result === 'Regolare' ? 'ok' : ins.result === 'Ripetere' ? 'warning' : 'danger'
                          }`}
                        >
                          {ins.result}
                        </span>
                      </td>
                      <td className="mono" style={{ fontWeight: 700 }}>
                        {ins.km.toLocaleString('it-IT')} km
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

      {/* 2. Danni & Sinistri */}
      <section className="report-section" id="danni">
        <div className="report-section-head">
          <div>
            <h2 className="report-section-title">Analisi Danni e Sinistri</h2>
            <p className="report-section-desc">{report.damages.summary}</p>
          </div>
          <span
            className={`status-pill ${
              report.damages.totalRecords === 0
                ? 'ok'
                : report.damages.events.some((e) => e.severity !== 'Lieve')
                ? 'danger'
                : 'warning'
            }`}
          >
            {report.damages.totalRecords === 0
              ? 'Nessun danno registrato'
              : `${report.damages.totalRecords} eventi trovati`}
          </span>
        </div>

        <div className="damage-grid">
          <DamageDiagram vehicleType={report.vehicleType} events={report.damages.events} />

          <div className="damage-event-list">
            {report.damages.events.length === 0 ? (
              <div className="info-panel">
                <h3>Nessun sinistro rilevato</h3>
                <p>
                  Non risultano stime di riparazione o danni strutturali registrati per questo veicolo
                  nel provider corrente. Si raccomanda comunque sempre un controllo visivo di vernice,
                  allineamento lamierati e bulloneria.
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
                          event.severity === 'Lieve' ? 'warning' : 'danger'
                        }`}
                      >
                        Gravità: {event.severity}
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
                    Paese: {event.country} · Fonte: {event.source}
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 3. Furto, RCA & Stato Legale */}
      <section className="report-section" id="furto-rca">
        <div className="report-section-head">
          <div>
            <h2 className="report-section-title">Controllo Furto, Assicurazione RCA e Stato Legale</h2>
            <p className="report-section-desc">
              Stato di circolazione, precedenti utilizzi commerciali e verifica gravami.
            </p>
          </div>
        </div>

        <div className="two-col-grid">
          <div className="info-panel">
            <div className="quick-check-head">
              <h3 style={{ margin: 0 }}>Banca dati veicoli rubati</h3>
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
                  ? 'Non rubato'
                  : report.theft.status === 'flagged'
                  ? 'Segnalato'
                  : 'Verifica diretta'}
              </span>
            </div>
            <p style={{ marginBottom: 10 }}>{report.theft.summary}</p>
            <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
              Fonti: {report.theft.databasesChecked.join(' · ')}
            </div>
          </div>

          <div className="info-panel">
            <div className="quick-check-head">
              <h3 style={{ margin: 0 }}>Copertura assicurativa RCA</h3>
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
                  ? 'Attiva'
                  : report.insurance.covered === false
                  ? 'Non coperta'
                  : 'Verifica diretta'}
              </span>
            </div>
            <p>{report.insurance.summary}</p>
            {report.insurance.validUntil && (
              <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: 8 }}>
                Scadenza stimata: {report.insurance.validUntil}
              </div>
            )}
          </div>

          <div className="info-panel">
            <div className="quick-check-head">
              <h3 style={{ margin: 0 }}>Uso precedente e proprietari</h3>
              <span
                className={`status-pill ${
                  report.legal.previousUse === 'Uso privato'
                    ? 'ok'
                    : report.legal.previousUse === 'Non rilevato'
                    ? 'info'
                    : 'warning'
                }`}
              >
                {report.legal.previousUse}
              </span>
            </div>
            <p>{report.legal.summary}</p>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, marginTop: 8 }}>
              Proprietari stimati: {report.legal.ownersCount}
            </div>
          </div>

          <div className="info-panel">
            <div className="quick-check-head">
              <h3 style={{ margin: 0 }}>Fermi amministrativi</h3>
              <span className={`status-pill ${report.legal.administrativeDetention ? 'danger' : 'ok'}`}>
                {report.legal.administrativeDetention ? 'Presente' : 'Non rilevato'}
              </span>
            </div>
            <p>
              Per avere valore legale certo su ipoteche, pignoramenti e fermi amministrativi prima
              del passaggio di proprietà è consigliata una visura PRA sul portale ACI.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Specifiche Tecniche & Bollo */}
      <section className="report-section" id="specifiche">
        <div className="report-section-head">
          <div>
            <h2 className="report-section-title">Specifiche Tecniche, Emissioni e Bollo</h2>
            <p className="report-section-desc">
              Dati tecnici principali, conformità ambientale e idoneità alla guida per neopatentati.
            </p>
          </div>
        </div>

        <div className="specs-grid">
          <div className="spec-cell">
            <div className="spec-key">Prima immatricolazione (stima serie)</div>
            <div className="spec-val mono">
              {report.specs.firstRegistrationDate} ({report.plate.estimatedRegistrationPeriod})
            </div>
          </div>
          <div className="spec-cell">
            <div className="spec-key">Motorizzazione</div>
            <div className="spec-val">
              {report.specs.engineDisplacementCc} cc · {report.specs.fuel}
            </div>
          </div>
          <div className="spec-cell">
            <div className="spec-key">Potenza</div>
            <div className="spec-val mono">
              {report.specs.powerKw} kW / {report.specs.powerHp} CV
            </div>
          </div>
          <div className="spec-cell">
            <div className="spec-key">Trasmissione</div>
            <div className="spec-val">{report.specs.transmission}</div>
          </div>
          <div className="spec-cell">
            <div className="spec-key">Classe ambientale</div>
            <div className="spec-val">{report.specs.euroClass}</div>
          </div>
          <div className="spec-cell">
            <div className="spec-key">Emissioni CO₂</div>
            <div className="spec-val mono">{report.specs.co2GramsPerKm} g/km</div>
          </div>
          <div className="spec-cell">
            <div className="spec-key">Idoneo neopatentati</div>
            <div className="spec-val">{report.specs.noviceDriverAllowed ? 'Sì' : 'No (verifica limiti)'}</div>
          </div>
          <div className="spec-cell">
            <div className="spec-key">Massa a vuoto</div>
            <div className="spec-val mono">{report.specs.weightKg} kg</div>
          </div>
          <div className="spec-cell">
            <div className="spec-key">Stima bollo annuale</div>
            <div className="spec-val mono">~{formatCurrency(report.specs.estimatedAnnualTaxEur)} / anno</div>
          </div>
        </div>
      </section>

      {/* 5. Valutazione di Mercato */}
      <section className="report-section" id="valore">
        <div className="report-section-head">
          <div>
            <h2 className="report-section-title">Valutazione di Mercato</h2>
            <p className="report-section-desc">{report.marketValue.note}</p>
          </div>
          <div className="mono" style={{ fontSize: '1.35rem', fontWeight: 800 }}>
            {formatCurrency(report.marketValue.adjustedEstimateEur)}
          </div>
        </div>

        <div className="price-range-box">
          <div style={{ fontSize: '0.84rem', color: 'var(--ink-secondary)' }}>
            Posizionamento stimato del veicolo rispetto alla fascia media di mercato:
          </div>

          <div className="price-track" aria-hidden="true">
            <div
              className="price-marker"
              style={{ left: `${markerPercent}%` }}
              title={`Stima rettificata: ${formatCurrency(report.marketValue.adjustedEstimateEur)}`}
            />
          </div>

          <div className="price-labels">
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>Fascia bassa</div>
              <strong className="mono">{formatCurrency(report.marketValue.lowEur)}</strong>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>Media mercato</div>
              <strong className="mono">{formatCurrency(report.marketValue.averageEur)}</strong>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>Fascia alta</div>
              <strong className="mono">{formatCurrency(report.marketValue.highEur)}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Richiami & Cronologia Completa */}
      <section className="report-section" id="cronologia">
        <div className="report-section-head">
          <div>
            <h2 className="report-section-title">Richiami di Sicurezza e Cronologia Veicolo</h2>
            <p className="report-section-desc">
              Sequenza unificata degli eventi noti in ordine cronologico.
            </p>
          </div>
        </div>

        {report.recalls.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '0.98rem', fontWeight: 700 }}>
              Campagne di richiamo costruttore
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
                        recall.status === 'Completato'
                          ? 'ok'
                          : recall.status === 'Da verificare'
                          ? 'warning'
                          : 'danger'
                      }`}
                    >
                      {recall.status}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{recall.title}</div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--ink-secondary)' }}>
                    Componente: {recall.component} · {recall.source}
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
                  <span className="mono">· {item.km.toLocaleString('it-IT')} km</span>
                )}
              </div>
              <div style={{ fontWeight: 700, marginBottom: 3 }}>{item.title}</div>
              <div style={{ fontSize: '0.88rem', color: 'var(--ink-secondary)' }}>{item.detail}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Fonti Ufficiali Gratuite Italiane & Trasparenza */}
      <section className="report-section" id="fonti-ufficiali">
        <div className="report-section-head">
          <div>
            <h2 className="report-section-title">Verifica Ufficiale Gratuita in Tempo Reale</h2>
            <p className="report-section-desc">
              In Italia i portali istituzionali gratuiti richiedono la compilazione diretta con
              CAPTCHA. Copia la targa <strong className="mono">{report.plate.normalized}</strong> con
              un clic e apri i servizi ufficiali qui sotto senza pagare alcun intermediario.
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary no-print"
            onClick={() => copyText(report.plate.normalized, 'plate')}
          >
            {copiedKey === 'plate' ? '✓ Targa copiata' : `Copia ${report.plate.normalized}`}
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
              <span className="official-link-cta">Apri portale ufficiale gratuito →</span>
            </a>
          ))}
        </div>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-muted)', marginBottom: 8 }}>
            Trasparenza provider utilizzati per questo report
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
