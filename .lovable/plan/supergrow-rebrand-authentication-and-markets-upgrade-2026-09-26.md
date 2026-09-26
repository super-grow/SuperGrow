# Supergrow rebrand, authentication, and markets upgrade

## What will change

- Rename Aurelium to **Supergrow** across navigation, page copy, metadata, account screens, legal pages, and footer content.
- Replace the current identity with a more distinctive crypto-investment logo and redesign the visual system with a richer black, graphite, mint, and signal-green palette.
- Rewrite the homepage around disciplined portfolio access, live market visibility, account security, and transparent order records; add layered motion, depth, market visualizations, and refined interactions without sacrificing accessibility.
- Remove Google from account creation so signup uses email and password only. Keep login restricted to registered accounts.
- Keep sessions persistent across browser restarts using the existing secure account session mechanism, while retaining explicit sign-out and normal security expiry/revocation behavior.
- Keep password recovery email-verified: users enter their email, follow the protected recovery link, then choose a new password. This prevents anyone who knows an email address from taking over the account.
- Improve the admin area with secure server-verified admin roles, user selection, bulk account actions, and balance controls. Passwords remain one-way protected and cannot be displayed or recovered.
- Replace the unavailable price source with a reliable public market adapter, preserve honest unavailable states, and refresh prices frequently.
- Add the provided TradingView advanced chart to the signed-in dashboard above the percentage-based investment controls, including proper TradingView attribution.

## Security boundaries

- No hardcoded `admin` / `meow` backdoor. Admin access will continue to require a real registered account with an admin role checked by the server.
- No plaintext password storage or display. Admins may trigger secure password-reset workflows, but cannot read passwords.
- No unverified password changes from email alone, no unlimited weak-password policy, and no truly perpetual sessions. These would enable account theft. Normal secure persistence will be preserved.
- Existing real-money execution remains provider-gated; the interface will not claim an order executed when no regulated execution provider is connected.

## Technical details

- Reuse the existing protected account route and authenticated server functions; extend admin operations with validated, auditable server-side actions.
- Load TradingView only in the browser within the signed-in area, with responsive dimensions and cleanup.
- Update semantic design tokens rather than hardcoding colors in page components.
- Verify metadata on every content page, compile status, public pages, signup/login/recovery, signed-in chart rendering, account persistence, and admin authorization behavior.
