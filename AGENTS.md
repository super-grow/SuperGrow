<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting published git history.
<!-- LOVABLE:END -->

- Keep all private account and administrative operations behind authenticated server functions; this prevents client-side privilege bypass.
- Derive balances from the immutable ledger and create orders through the atomic database function; this preserves financial auditability.
- Treat public market data as reference pricing behind a server adapter; this keeps provider integration replaceable and honest.
- Keep authentication email/password-only; preserve hashed credentials, verified recovery, and persistent but revocable sessions for account safety.
- Keep administrator entry separate from customer navigation and verify the administrator role on the server; this prevents ordinary accounts from entering administrative operations.
