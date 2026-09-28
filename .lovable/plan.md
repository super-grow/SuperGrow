# Overview cleanup, faster navigation, long-lasting sign-in

## 1. Overview page: chart first
- Remove everything above the TradingView chart on the Overview page: the "Account workspace / Overview" heading, the "keep trading to grow your portfolio" line, and the four stat cards (balance, orders, pending, account).
- Remove the chart's own header bar ("Advanced market chart / BTC/USD · 30 minute interval / LIVE") so the chart is the first thing on the page.
- Everything below the chart stays (Market watch list + Allocation ticket).
- Note: the available balance also shows in the Allocation ticket's estimated amount; if you want the balance visible elsewhere, tell me.

## 2. Remove overlay on the chart
- Hide TradingView's in-chart symbol legend/top toolbar overlay (pair names drawn over the chart) by turning off the legend and top toolbar options and symbol switching in the widget.

## 3. Faster, smoother navigation
- Preload pages when a user hovers/touches a link (`defaultPreload: "intent"`) and cache preloaded data briefly instead of refetching every time.
- The signed-in area currently asks the server "who is this user?" on every page change; switch it to read the saved session instantly on the device, so moving between Overview, Trades and Profile is immediate.
- Give account data a short cache time so pages show instantly and refresh in the background.

## 4. Stay signed in
- Sessions are already saved on the device and renewed automatically; the page-change check above is what could bounce users out when a network check fails. Reading the saved session locally keeps people signed in after closing and reopening the site, until they press Sign out.
- The session length on the sign-in system will be set to never time out (no inactivity or maximum-age limit), if that setting is available.

## Technical details
- `account-overview.tsx`: drop header + Stat grid; `trading-view-chart.tsx`: remove header div, set `hide_legend: true`, `hide_top_toolbar: true`, `allow_symbol_change: false`.
- `router.tsx`: `defaultPreload: "intent"`, `defaultPreloadStaleTime: 30_000`, QueryClient `staleTime: 30_000`.
- `_authenticated/route.tsx`: use `supabase.auth.getSession()` instead of `getUser()` (server functions still verify the token, so data stays protected).
