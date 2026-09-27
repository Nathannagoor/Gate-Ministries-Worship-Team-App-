// Cloudflare Worker: proxies a "clean up this text" request to the
// Anthropic API, keeping the API key server-side (never shipped to the
// browser). Deploy this once per church/team — see ../README.md, section
// "Optional: AI clean-up for arrangement ideas".
//
// Env vars this Worker needs (set with `wrangler secret put` / dashboard):
//   ANTHROPIC_API_KEY  (secret) - your Anthropic API key
//   ALLOWED_ORIGIN     (plain var, optional) - e.g. "https://yourname.github.io"
//                      restricts which site is allowed to call this Worker.
//                      Defaults to "*" (any site) if not set.

const SYSTEM_PROMPT =
  "You clean up short, informal voice-transcribed notes from a church " +
  "worship team about a song arrangement. Fix transcription errors, " +
  "punctuation and grammar, and organize into clear short sentences or " +
  "bullet points if that helps. Keep the original meaning and any musical " +
  "terms (keys, chords, cues, song titles, names) exactly as intended. " +
  "Don't add new ideas or invent details. Return only the cleaned-up " +
  "text, nothing else - no preamble, no quotes around it.";

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405, headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }
    if (!env.ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: 'Worker is not configured (missing ANTHROPIC_API_KEY).' }), {
        status: 500, headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }

    let body;
    try { body = await request.json(); }
    catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body.' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }

    const text = ((body && body.text) || '').toString().trim().slice(0, 4000);
    if (!text) {
      return new Response(JSON.stringify({ error: 'No text provided.' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }

    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 500,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: text }],
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        const msg = (data && data.error && data.error.message) || ('Upstream error (' + resp.status + ')');
        return new Response(JSON.stringify({ error: msg }), {
          status: 502, headers: { ...cors, 'Content-Type': 'application/json' }
        });
      }
      const cleaned = (data.content && data.content[0] && data.content[0].text) || '';
      return new Response(JSON.stringify({ text: cleaned }), {
        headers: { ...cors, 'Content-Type': 'application/json' }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Could not reach the AI service.' }), {
        status: 500, headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }
  }
};
