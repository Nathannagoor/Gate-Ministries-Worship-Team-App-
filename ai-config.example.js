// Copy this file to ai-config.js and set it to your deployed Cloudflare
// Worker URL (see cloudflare-worker/README section in the main README).
//
// This is not secret - it's just the address of your own small proxy
// server; the real secret (your Anthropic API key) lives only inside that
// Worker, never in the browser or in this repo.
//
// Leave AI_WORKER_URL empty ('') to skip AI clean-up entirely - voice
// recording still works without it, you just won't see the
// "Clean up with Claude" button.
export const AI_WORKER_URL = '';
