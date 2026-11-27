import { getExtensionSettings, saveExtensionSettings } from '../settings/settings';

async function initPopup(): Promise<void> {
  const settings = await getExtensionSettings();
  const chkOcr = document.getElementById('chk-ocr') as HTMLInputElement | null;
  const chkTel = document.getElementById('chk-telemetry') as HTMLInputElement | null;
  const msgEl = document.getElementById('sync-msg');

  if (chkOcr) {
    chkOcr.checked = settings.enableOcrOnLoad;
    chkOcr.addEventListener('change', () => {
      void saveExtensionSettings({ enableOcrOnLoad: chkOcr.checked });
    });
  }

  if (chkTel) {
    chkTel.checked = settings.enableTelemetry;
    chkTel.addEventListener('change', () => {
      void saveExtensionSettings({ enableTelemetry: chkTel.checked });
    });
  }

  await refreshStats();

  document.getElementById('btn-sync')?.addEventListener('click', async () => {
    if (msgEl) msgEl.textContent = 'Syncing queued events to GitHub…';
    const res = await chrome.runtime.sendMessage({ type: 'FLUSH_TELEMETRY' });
    if (msgEl) msgEl.textContent = res?.detail ?? 'Sync attempt completed.';
    await refreshStats();
  });

  document.getElementById('btn-options')?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

async function refreshStats(): Promise<void> {
  const res = await chrome.runtime.sendMessage({ type: 'GET_TELEMETRY_SUMMARY' });
  if (!res?.ok || !res.summary) return;
  const s = res.summary;
  const setTxt = (id: string, v: number) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(v);
  };
  setTxt('st-analyzed', s.listingsAnalyzed);
  setTxt('st-ocr', s.ocrPlatesFound);
  setTxt('st-exports', s.exportsCount);
  setTxt('st-pending', s.pendingSyncCount);
}

void initPopup();
