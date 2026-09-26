# Premium Crypto Platform

## Scope
- Build a polished dark-first public website with live market pricing and all requested informational, support, and legal pages.
- Add secure email/password authentication, password recovery, protected account pages, and session-aware navigation.
- Add a professional dashboard, markets terminal, percentage-based order ticket, balance display, and concise order history.
- Add an admin area for authorized staff to view account emails, suspend/delete accounts, and post audited balance adjustments.

## Safety and production boundaries
- Passwords will remain hashed and inaccessible to administrators; password resets replace password viewing or editing.
- Balances will use an immutable adjustment ledger with audit history rather than silent direct edits.
- Real-money deposits, custody, and order execution will remain visibly unavailable until licensed providers and permitted jurisdictions are configured; the interface will not fabricate execution or returns.
- Legal and trust copy will be transparent and will avoid unverified licensing, insurance, performance, or security claims.

## Experience
- Create a premium financial-terminal aesthetic with deep charcoal surfaces, restrained cyan and warm market accents, fine borders, animated charts and number transitions, subtle depth, and reduced-motion support.
- Use responsive navigation, keyboard-accessible controls, useful loading/empty/error states, and clean mobile layouts.
- Provide distinct metadata for every public page.

## Technical details
- Enable Lovable Cloud for authentication, data, and protected server operations.
- Store roles separately and enforce authorization server-side for all admin and private data actions.
- Validate forms on both client and server; protect user records and ledger data with row-level access rules.
- Fetch public price data through a server-side market adapter with cached fallback/error states.
- Structure the execution layer behind a provider adapter so a regulated custody/execution provider can be connected without redesigning the product.

## Routes
- Public: `/`, `/markets`, `/security`, `/how-it-works`, `/about`, `/faq`, `/contact`, `/privacy`, `/terms`, `/cookies`, `/risk-disclosure`, `/fees`, `/support`.
- Authentication: `/login`, `/signup`, `/forgot-password`, `/reset-password`.
- Protected: `/dashboard`, `/trades`, `/profile`.
- Admin-only: `/admin`.
