# Separate administrator access

## Build
- Add a dedicated `/admin-login` page for administrator credentials, visually distinct from customer login.
- After sign-in, verify the account has the administrator role before allowing `/admin`; reject ordinary users and clear their attempted admin session.
- Keep `/login` for customer accounts and route administrator navigation through the separate sign-in page.
- Preserve the existing administrator table, audited balance adjustments, account selection, and bulk account removal.

## Security boundary
- Administrator credentials will remain managed by secure authentication and will not be embedded in public website code.
- Passwords remain hashed and unavailable in the administrator panel.

## Verification
- Check customer and administrator entry points, role rejection, route protection, balance controls, bulk selection, and the current build.
