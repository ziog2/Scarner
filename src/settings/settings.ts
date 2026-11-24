import { ExtensionSettings } from '../types/domain';

const SETTINGS_KEY = 'scarner_settings_v1';

export const DEFAULT_SETTINGS: ExtensionSettings = {
  enableOcrOnLoad: true,
  enableTelemetry: true,
  telemetryRelayUrl: '',
  githubTelemetryRepo: 'ziog2/Scarner',
  githubTelemetryToken: '',
  ukDvlaApiKey: '',
  ukDvsaApiKey: '',
  ukDvsaClientId: '',
  ukDvsaClientSecret: '',
  ukDvsaTokenUrl: '',
  ukDvsaScope: '',
  norwayVegvesenApiKey: '',
  czechRsvApiKey: '',
};

export async function getExtensionSettings(): Promise<ExtensionSettings> {
  const stored = await chrome.storage.local.get([SETTINGS_KEY]);
  const raw = (stored[SETTINGS_KEY] ?? {}) as Partial<ExtensionSettings>;
  return { ...DEFAULT_SETTINGS, ...raw };
}

export async function saveExtensionSettings(
  partial: Partial<ExtensionSettings>
): Promise<ExtensionSettings> {
  const current = await getExtensionSettings();
  const updated: ExtensionSettings = { ...current, ...partial };
  await chrome.storage.local.set({ [SETTINGS_KEY]: updated });
  return updated;
}
