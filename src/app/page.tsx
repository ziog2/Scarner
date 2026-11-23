import { PlateSearchCard } from '@/components/PlateSearchCard';
import { SiteHeader } from '@/components/SiteHeader';

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div>
              <p className="hero-eyebrow">Alternativa gratuita e open-source</p>
              <h1 className="hero-title">
                Controlla la storia di auto e moto dalla targa, gratis.
              </h1>
              <p className="hero-subtitle">
                Scarner nasce per offrire un report strutturato, chiaro e gratuito come alternativa
                ai costosi servizi a pagamento: analisi formato targa e anno di immatricolazione,
                chilometraggio e revisioni, mappa danni, stato RCA e collegamenti diretti alle
                banche dati ufficiali italiane.
              </p>

              <ul className="hero-points">
                <li>
                  <span className="hero-point-dot" aria-hidden="true">
                    ✓
                  </span>
                  <span>
                    <strong>Auto, moto e 50cc</strong> con riconoscimento automatico del formato
                    targa italiano
                  </span>
                </li>
                <li>
                  <span className="hero-point-dot" aria-hidden="true">
                    ✓
                  </span>
                  <span>
                    <strong>Rilevazione km scalati</strong> con grafico cronologico e revisioni
                  </span>
                </li>
                <li>
                  <span className="hero-point-dot" aria-hidden="true">
                    ✓
                  </span>
                  <span>
                    <strong>Mappa danni auto e moto</strong>, specifiche tecniche, CO₂ e bollo
                  </span>
                </li>
                <li>
                  <span className="hero-point-dot" aria-hidden="true">
                    ✓
                  </span>
                  <span>
                    <strong>Esportazione PDF One-Pager</strong> e accesso rapido ai portali MIT /
                    Polizia / ACI
                  </span>
                </li>
              </ul>
            </div>

            <PlateSearchCard />
          </div>
        </section>

        <section className="section-block" id="come-funziona">
          <div className="container">
            <h2 className="section-heading">Roadmap del progetto: dalla targa alla foto</h2>
            <p className="section-lead">
              Scarner è sviluppato in modo modulare per essere utile fin dal primo giorno e facile
              da estendere con fonti dati open-data e riconoscimento ottico delle targhe.
            </p>

            <div className="feature-grid">
              <article className="feature-card">
                <div className="feature-step">FASE 1 · ATTIVA</div>
                <h3>Inserimento manuale Auto e Moto</h3>
                <p>
                  Validazione reale delle targhe italiane (auto, motocicli e ciclomotori), stima
                  dell’anno dalla sequenza alfanumerica e report completo stampabile in PDF.
                </p>
              </article>

              <article className="feature-card">
                <div className="feature-step">FASE 2 · IN ARRIVO</div>
                <h3>Scansione da Foto o Screenshot</h3>
                <p>
                  Carica una foto o incolla lo screenshot di un annuncio: la pipeline OCR/ALPR
                  estrae la targa automaticamente correggendo ambiguità tra lettere e cifre.
                </p>
              </article>

              <article className="feature-card">
                <div className="feature-step">ARCHITETTURA APERTA</div>
                <h3>Provider modulari e trasparenti</h3>
                <p>
                  Ogni sezione mostra l’origine del dato. Oltre ai connettori API estensibili,
                  Scarner integra collegamenti diretti alle verifiche ufficiali gratuite di MIT,
                  Ministero dell’Interno e ACI.
                </p>
              </article>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container site-footer-inner">
          <div>
            <strong>Scarner</strong> — Progetto open-source per report veicoli gratuiti.
          </div>
          <div>Nessun abbonamento · Nessun paywall · Dati trasparenti</div>
        </div>
      </footer>
    </>
  );
}
