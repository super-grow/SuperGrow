# Clean up the Overview layout

## Changes
- Remove the entire **Market watch / Live USD reference prices** section and all BTC, ETH, SOL, and XRP rows from the Overview page.
- Keep the TradingView chart as the first item in the Overview content, with no extra empty block or spacing above it.
- Keep the allocation controls below the chart, using the chart’s default BTC/USD market price, and resize/reposition the section so it aligns cleanly without the removed table.
- Remove leftover unused Overview code from the deleted headings, stat cards, and market list.
- Check the signed-in Overview at phone and desktop sizes to confirm the chart, spacing, and allocation controls do not overlap or leave unintended gaps.

## Technical details
- Update only the Overview presentation and its now-unused imports/helpers.
- Preserve order submission, balance calculations, TradingView settings, navigation, and the other account pages.
