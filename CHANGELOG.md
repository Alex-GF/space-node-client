# Changelog

## 0.4.0 - 2026-11-04

- Integrate the subscription-change API, contract event notifications and subscription token types.
- Read multiorganization token claims without interpreting the subject as a user ID.
- Deduplicate events and expose reconnection resynchronization.
- Verify ES256 tokens with SPACE's public JWKS and typed errors.
- Add pricing reads, novation previews, optimistic concurrency and opt-in idempotent retries.
- Expose detailed consumption refunds without removing the boolean API.
- Add group novations, direct usage increments and contract deletion; fix cache forwarding and socket lifecycle.
