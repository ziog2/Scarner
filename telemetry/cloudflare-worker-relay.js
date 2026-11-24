/**
 * Optional Zero-Cost Cloudflare Worker Relay for Scarner GitHub Telemetry
 *
 * Deploy free on Cloudflare Workers and set secret `GITHUB_DISPATCH_TOKEN`
 * (a fine-grained GitHub PAT scoped ONLY to `ziog2/Scarner` with `Contents: Read & Write`).
 * Paste the Worker URL into Scarner's `telemetryRelayUrl` setting so all extension
 * users can contribute anonymous stats to GitHub without exposing any token in the client.
 */
export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
    }

    try {
      const body = await request.json();
      const events = Array.isArray(body?.events) ? body.events.slice(0, 25) : [];
      if (events.length === 0) {
        return new Response(JSON.stringify({ ok: false, error: 'Empty batch' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const ghRepo = env.GITHUB_REPO || 'ziog2/Scarner';
      const ghRes = await fetch(`https://api.github.com/repos/${ghRepo}/dispatches`, {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${env.GITHUB_DISPATCH_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Scarner-Telemetry-Relay/1.0',
        },
        body: JSON.stringify({
          event_type: 'scarner_telemetry',
          client_payload: { events },
        }),
      });

      return new Response(JSON.stringify({ ok: ghRes.status === 204 }), {
        status: ghRes.status === 204 ? 200 : 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch {
      return new Response(JSON.stringify({ ok: false }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
