import { getExtensionSettings, saveExtensionSettings } from '../settings/settings';

const FIELD_MAP = {
  'opt-relay': 'telemetryRelayUrl',
  'opt-gh-repo': 'githubTelemetryRepo',
  'opt-gh-token': 'githubTelemetryToken',
  'opt-uk-dvla': 'ukDvlaApiKey',
  'opt-uk-dvsa': 'ukDvsaApiKey',
  'opt-uk-cid': 'ukDvsaClientId',
  'opt-uk-csec': 'ukDvsaClientSecret',
  'opt-uk-turl': 'ukDvsaTokenUrl',
  'opt-uk-scope': 'ukDvsaScope',
  'opt-no': 'norwayVegvesenApiKey',
  'opt-cz': 'czechRsvApiKey',
} as const;

async function initOptions(): Promise<void> {
  const settings = await getExtensionSettings();

  for (const [id, key] of Object.entries(FIELD_MAP)) {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (el) el.value = String(settings[key] ?? '');
  }

  document.getElementById('btn-save')?.addEventListener('click', async () => {
    const patch: Record<string, string> = {};
    for (const [id, key] of Object.entries(FIELD_MAP)) {
      const el = document.getElementById(id) as HTMLInputElement | null;
      if (el) patch[key] = el.value.trim();
    }
    await saveExtensionSettings(patch);
    const status = document.getElementById('save-status');
    if (status) {
      status.textContent = '✓ Settings saved';
      setTimeout(() => {
        status.textContent = '';
      }, 2200);
    }
  });
}

void initOptions();
