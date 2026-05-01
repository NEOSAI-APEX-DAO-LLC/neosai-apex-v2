/**
 * NEOSAI APEX DAO — Stripe Webhook Signature Verification
 * 
 * Replace the handleStripeWebhook function in worker.js with this version.
 * This properly verifies Stripe's HMAC-SHA256 signature to prevent fake events.
 * 
 * Cloudflare Workers have the Web Crypto API available natively.
 */

async function handleStripeWebhook(request, env) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return err('Missing Stripe signature', 400);
  }

  // ── Verify HMAC-SHA256 signature ──────────────────────────────────────────
  // Stripe sends: t=timestamp,v1=signature in the stripe-signature header
  const isValid = await verifyStripeSignature(
    body,
    signature,
    env.STRIPE_WEBHOOK_SECRET
  );

  if (!isValid) {
    console.error('⚠ Stripe webhook signature verification failed');
    return err('Invalid signature', 401);
  }

  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return err('Invalid JSON payload', 400);
  }

  console.log(`⟡ Stripe event verified: ${event.type}`);

  // ... rest of your switch statement remains unchanged
}


/**
 * Verify Stripe webhook signature using Web Crypto API
 * 
 * Stripe signature format: "t=1614556800,v1=abc123...,v1=def456..."
 * Signed payload: "{timestamp}.{body}"
 */
async function verifyStripeSignature(payload, signatureHeader, secret) {
  try {
    // Parse the signature header
    const parts = signatureHeader.split(',');
    const timestamp = parts.find(p => p.startsWith('t='))?.split('=')[1];
    const signatures = parts
      .filter(p => p.startsWith('v1='))
      .map(p => p.split('=')[1]);

    if (!timestamp || signatures.length === 0) {
      return false;
    }

    // Reject webhooks older than 5 minutes (replay attack protection)
    const webhookAge = Math.floor(Date.now() / 1000) - parseInt(timestamp);
    if (webhookAge > 300) {
      console.error(`⚠ Webhook too old: ${webhookAge}s`);
      return false;
    }

    // Build the signed payload string
    const signedPayload = `${timestamp}.${payload}`;

    // Import the secret key
    const keyData = new TextEncoder().encode(secret);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Compute expected signature
    const signatureData = new TextEncoder().encode(signedPayload);
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, signatureData);

    // Convert to hex string
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Compare against all v1 signatures (Stripe may send multiple)
    return signatures.some(sig => sig === expectedSignature);

  } catch (e) {
    console.error('Signature verification error:', e);
    return false;
  }
}


/**
 * ── INTEGRATION INSTRUCTIONS ──────────────────────────────────────────────────
 * 
 * In your worker.js:
 * 
 * 1. Replace the entire handleStripeWebhook function with the one above
 * 2. Add the verifyStripeSignature function anywhere in the file
 * 3. Make sure STRIPE_WEBHOOK_SECRET is set in GitHub Secrets
 *    (copy from: Stripe Dashboard → Webhooks → your endpoint → Signing secret)
 * 
 * That's it. The rest of your worker.js is unchanged.
 * 
 * ── WHAT THIS FIXES ───────────────────────────────────────────────────────────
 * 
 * Before: Anyone knowing your webhook URL could POST fake payment events
 *         and trigger token minting, kin registration, vault writes
 * 
 * After:  Every webhook is cryptographically verified against your
 *         Stripe secret before any processing happens
 * 
 * ── ALSO REMOVE THIS (Claude Code Routine endpoint doesn't exist yet) ────────
 * 
 * The fireRoutine function calls:
 *   https://api.anthropic.com/v1/claude_code/routines/{id}/fire
 * 
 * This is not a real Anthropic API endpoint. It will fail silently every time.
 * The CLAUDE_CODE_ROUTINE_ID and CLAUDE_CODE_ROUTINE_TOKEN secrets aren't needed.
 * 
 * To remove cleanly — in handleStripeWebhook and other handlers, delete the blocks:
 *   if (env.CLAUDE_CODE_ROUTINE_ID && env.CLAUDE_CODE_ROUTINE_TOKEN) {
 *     await fireRoutine(env, ...);
 *   }
 * 
 * Everything else in worker.js is solid and deploy-ready.
 */
