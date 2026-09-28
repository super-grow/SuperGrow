# Instant sign-up with no email confirmation

## What changes
- Turn off email confirmation. After someone creates an account, they're signed in right away and go straight to their dashboard. The "Check your email" message never shows.
- They can sign in later with the same email and password.
- Every new account is saved the moment it's created, and it shows in the admin panel with its balance (starting at $0).

## Technical details
- Update the sign-in settings to auto-confirm new emails. Sign-up stays on, anonymous sign-in stays off, and the leaked-password check stays off.
- In the sign-up form, send the user to `/dashboard` as soon as a session comes back. Remove the confirmation message branch.
- Create the account record right after sign-up (call `initialize_my_account`) so it exists before the first dashboard visit. The admin list already pulls every registered user.
- Check: create a test account, confirm it goes to the dashboard, sign out and back in, then confirm the account appears in the admin panel.
