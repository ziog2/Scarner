import { ExtensionSettings, TelemetryEvent } from '../types/domain';

const STORAGE_EVENTS_KEY = 'scarner_telemetry_events';
const STORAGE_PENDING_KEY = 'scarner_telemetry_pending';
const MAX_LOCAL_EVENTS = 250;

export async function hashIdentifier8(raw: string | null): Promise<string | null> {
  if (!raw) return null;
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!clean) return null;
  const bytes = new TextEncoder().encode(`scarner-v1:${clean}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .slice(0, 4)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function recordTelemetryEvent(
  event: TelemetryEvent,
  settings: ExtensionSettings
): Promise<void> {
  if (!settings.enableTelemetry) return;

  const stored = await chrome.storage.local.get([STORAGE_EVENTS_KEY, STORAGE_PENDING_KEY]);
  const allEvents: TelemetryEvent[] = Array.isArray(stored[STORAGE_EVENTS_KEY])
    ? stored[STORAGE_EVENTS_KEY]
    : [];
  const pendingEvents: TelemetryEvent[] = Array.isArray(stored[STORAGE_PENDING_KEY])
    ? stored[STORAGE_PENDING_KEY]
    : [];

  allEvents.push(event);
  if (allEvents.length > MAX_LOCAL_EVENTS) {
    allEvents.splice(0, allEvents.length - MAX_LOCAL_EVENTS);
  }
  pendingEvents.push(event);

  await chrome.storage.local.set({
    [STORAGE_EVENTS_KEY]: allEvents,
    [STORAGE_PENDING_KEY]: pendingEvents,
  });

  // Flush automatically when 5+ events are queued or on export events
  if (pendingEvents.length >= 5 || event.eventType.startsWith('export_')) {
    await flushTelemetryToGitHub(settings);
  }
}

export async function flushTelemetryToGitHub(
  settings: ExtensionSettings
): Promise<{ sent: number; ok: boolean; detail: string }> {
  const stored = await chrome.storage.local.get([STORAGE_PENDING_KEY]);
  const pending: TelemetryEvent[] = Array.isArray(stored[STORAGE_PENDING_KEY])
    ? stored[STORAGE_PENDING_KEY]
    : [];

  if (pending.length === 0) {
    return { sent: 0, ok: true, detail: 'No pending telemetry events to sync.' };
  }

  const batch = pending.slice(0, 25);

  // Mode A: Public Serverless Relay URL (e.g., Cloudflare Worker forwarding to GitHub repository_dispatch)
  if (settings.telemetryRelayUrl?.trim()) {
    try {
      const res = await fetch(settings.telemetryRelayUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batch }),
        signal: AbortSignal.timeout(7000),
      });
      if (res.ok) {
        await chrome.storage.local.set({ [STORAGE_PENDING_KEY]: pending.slice(batch.length) });
        return { sent: batch.length, ok: true, detail: `Synced ${batch.length} event(s) via GitHub relay.` };
      }
      return { sent: 0, ok: false, detail: `Relay returned HTTP ${res.status}.` };
    } catch {
      return { sent: 0, ok: false, detail: 'Unable to reach telemetry relay URL.' };
    }
  }

  // Mode B: Direct GitHub Repository Dispatch (when personal fine-grained token is configured in Options)
  if (settings.githubTelemetryToken?.trim() && settings.githubTelemetryRepo?.trim()) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${settings.githubTelemetryRepo.trim()}/dispatches`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${settings.githubTelemetryToken.trim()}`,
            'Content-Type': 'application/json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
          body: JSON.stringify({
            event_type: 'scarner_telemetry',
            client_payload: { events: batch },
          }),
          signal: AbortSignal.timeout(8000),
        }
      );
      if (res.status === 204 || res.ok) {
        await chrome.storage.local.set({ [STORAGE_PENDING_KEY]: pending.slice(batch.length) });
        return {
          sent: batch.length,
          ok: true,
          detail: `Dispatched ${batch.length} event(s) to GitHub (${settings.githubTelemetryRepo}).`,
        };
      }
      return { sent: 0, ok: false, detail: `GitHub API returned HTTP ${res.status}.` };
    } catch {
      return { sent: 0, ok: false, detail: 'GitHub API dispatch request failed.' };
    }
  }

  return {
    sent: 0,
    ok: false,
    detail: 'Events saved locally. Configure a Relay URL or GitHub Token in Options to push to GitHub.',
  };
}

export async function getLocalTelemetrySummary(): Promise<{
  totalEvents: number;
  pendingSyncCount: number;
  listingsAnalyzed: number;
  ocrPlatesFound: number;
  exportsCount: number;
  recentEvents: TelemetryEvent[];
}> {
  const stored = await chrome.storage.local.get([STORAGE_EVENTS_KEY, STORAGE_PENDING_KEY]);
  const all: TelemetryEvent[] = Array.isArray(stored[STORAGE_EVENTS_KEY])
    ? stored[STORAGE_EVENTS_KEY]
    : [];
  const pending: TelemetryEvent[] = Array.isArray(stored[STORAGE_PENDING_KEY])
    ? stored[STORAGE_PENDING_KEY]
    : [];

  return {
    totalEvents: all.length,
    pendingSyncCount: pending.length,
    listingsAnalyzed: all.filter((e) => e.eventType === 'listing_analyzed').length,
    ocrPlatesFound: all.filter(
      (e) => e.eventType === 'ocr_plate_found' || e.detectionMethod === 'photo_ocr'
    ).length,
    exportsCount: all.filter((e) => e.eventType === 'export_pdf' || e.eventType === 'export_csv').length,
    recentEvents: all.slice(-8).reverse(),
  };
}
