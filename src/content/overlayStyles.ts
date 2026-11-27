export const OVERLAY_SHADOW_CSS = `
  :host {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #0f172a;
  }
  * {
    box-sizing: border-box;
  }
  .sc-root {
    position: fixed;
    right: 18px;
    bottom: 18px;
    z-index: 2147483640;
    width: 400px;
    max-width: calc(100vw - 24px);
    max-height: calc(100vh - 36px);
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 14px;
    box-shadow: 0 18px 42px rgba(15, 23, 42, 0.22), 0 4px 12px rgba(15, 23, 42, 0.08);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-size: 13px;
    line-height: 1.45;
  }
  .sc-pill-minimized {
    position: fixed;
    right: 18px;
    bottom: 18px;
    z-index: 2147483640;
    background: #0f172a;
    color: #ffffff;
    border: 1px solid #334155;
    border-radius: 999px;
    padding: 9px 15px;
    display: inline-flex;
    align-items: center;
    gap: 9px;
    cursor: pointer;
    box-shadow: 0 10px 25px rgba(15, 23, 42, 0.28);
    font-size: 12.5px;
    font-weight: 700;
  }
  .sc-header {
    background: #0f172a;
    color: #ffffff;
    padding: 12px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .sc-brand {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 800;
    font-size: 14px;
    letter-spacing: -0.02em;
  }
  .sc-logo {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    background: #1d4ed8;
    color: #ffffff;
    display: grid;
    place-items: center;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    font-weight: 800;
  }
  .sc-icon-btn {
    background: rgba(255, 255, 255, 0.12);
    color: #ffffff;
    border: none;
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 11.5px;
    font-weight: 600;
    cursor: pointer;
  }
  .sc-icon-btn:hover {
    background: rgba(255, 255, 255, 0.22);
  }
  .sc-body {
    padding: 12px 14px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .sc-summary-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }
  .sc-kpi {
    border-radius: 8px;
    padding: 7px 8px;
    text-align: center;
    font-weight: 700;
    font-size: 11.5px;
    border: 1px solid transparent;
  }
  .sc-kpi.green {
    background: #dcfce7;
    border-color: #86efac;
    color: #15803d;
  }
  .sc-kpi.orange {
    background: #ffedd5;
    border-color: #fdba74;
    color: #c2410c;
  }
  .sc-kpi.neutral {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: #475569;
  }
  .sc-id-bar {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 9px;
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .sc-id-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    flex-wrap: wrap;
  }
  .sc-plate-chip {
    display: inline-flex;
    align-items: center;
    border: 1.5px solid #0f172a;
    border-radius: 5px;
    overflow: hidden;
    background: #ffffff;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-weight: 800;
    font-size: 12px;
  }
  .sc-plate-eu {
    background: #1d4ed8;
    color: #ffffff;
    padding: 2px 5px;
    font-size: 10px;
  }
  .sc-plate-num {
    padding: 2px 7px;
    letter-spacing: 0.08em;
    color: #0f172a;
  }
  .sc-method-tag {
    font-size: 10.5px;
    color: #475569;
    font-weight: 600;
  }
  .sc-edit-drawer {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    padding-top: 6px;
    border-top: 1px dashed #cbd5e1;
  }
  .sc-input {
    width: 100%;
    padding: 5px 7px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-size: 11.5px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    text-transform: uppercase;
  }
  .sc-small-btn {
    border: 1px solid #cbd5e1;
    background: #ffffff;
    color: #0f172a;
    border-radius: 6px;
    padding: 5px 8px;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
  }
  .sc-small-btn:hover {
    background: #f1f5f9;
  }
  .sc-small-btn.primary {
    background: #1d4ed8;
    border-color: #1d4ed8;
    color: #ffffff;
  }
  .sc-card-list {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }
  .sc-card {
    border-radius: 9px;
    padding: 8px 10px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
  }
  .sc-card.consistent {
    background: #f0fdf4;
    border-color: #86efac;
  }
  .sc-card.attention {
    background: #fff7ed;
    border-color: #fdba74;
  }
  .sc-card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    margin-bottom: 3px;
  }
  .sc-card-title {
    font-weight: 700;
    font-size: 12px;
  }
  .sc-badge {
    font-size: 10px;
    font-weight: 800;
    padding: 1px 6px;
    border-radius: 999px;
    text-transform: uppercase;
  }
  .sc-badge.consistent {
    background: #dcfce7;
    color: #15803d;
  }
  .sc-badge.attention {
    background: #ffedd5;
    color: #c2410c;
  }
  .sc-badge.unverified {
    background: #e2e8f0;
    color: #475569;
  }
  .sc-vals {
    font-size: 11.5px;
    color: #1e293b;
    margin-bottom: 3px;
  }
  .sc-note {
    font-size: 11px;
    color: #475569;
  }
  .sc-details {
    border: 1px solid #e2e8f0;
    border-radius: 9px;
    padding: 7px 10px;
    background: #ffffff;
  }
  .sc-details summary {
    font-weight: 700;
    font-size: 12px;
    cursor: pointer;
    color: #0f172a;
  }
  .sc-portal-list {
    margin-top: 7px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .sc-portal-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    padding: 6px 8px;
    border-radius: 6px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #1d4ed8;
    text-decoration: none;
    font-size: 11.5px;
    font-weight: 600;
  }
  .sc-portal-link:hover {
    border-color: #1d4ed8;
    background: #eff6ff;
  }
  .sc-footer {
    border-top: 1px solid #e2e8f0;
    background: #f8fafc;
    padding: 9px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .sc-export-group {
    display: flex;
    gap: 6px;
    width: 100%;
  }
  .sc-export-btn {
    flex: 1;
    border: 1px solid #cbd5e1;
    background: #ffffff;
    color: #0f172a;
    border-radius: 7px;
    padding: 7px 10px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    text-align: center;
  }
  .sc-export-btn.pdf {
    background: #0f172a;
    border-color: #0f172a;
    color: #ffffff;
  }
  .sc-export-btn:hover {
    opacity: 0.92;
  }
  .sc-quick-checks {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 9px;
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .sc-quick-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11px;
    font-weight: 800;
    color: #1e3a8a;
  }
  .sc-quick-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  .sc-quick-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 8px;
    border-radius: 6px;
    background: #ffffff;
    border: 1px solid #93c5fd;
    color: #1d4ed8;
    text-decoration: none;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
  }
  .sc-quick-pill:hover {
    background: #1d4ed8;
    border-color: #1d4ed8;
    color: #ffffff;
  }
  .sc-inline-km {
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px dashed #cbd5e1;
    display: flex;
    gap: 5px;
    align-items: center;
  }
  .sc-recall-items {
    margin-top: 5px;
    padding-top: 5px;
    border-top: 1px dashed #fdba74;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 10.5px;
    color: #7c2d12;
  }
  .sc-toast {
    font-size: 10.5px;
    font-weight: 700;
    color: #15803d;
    background: #dcfce7;
    padding: 2px 6px;
    border-radius: 4px;
  }
`;

export const INPAGE_HIGHLIGHT_CSS = `
  .scarner-hl-consistent {
    background-color: #dcfce7 !important;
    outline: 1.5px solid #22c55e !important;
    border-radius: 5px !important;
    padding: 1px 5px !important;
    color: #14532d !important;
  }
  .scarner-hl-attention {
    background-color: #ffedd5 !important;
    outline: 1.5px solid #f97316 !important;
    border-radius: 5px !important;
    padding: 1px 5px !important;
    color: #9a3412 !important;
  }
`;
