# Remove password rules on sign-up

## What changes
- Take the "Use at least 10 characters. Known compromised passwords are blocked." message off the Create account page.
- Remove the 10-character minimum from the password box on sign-up and sign-in.
- Turn off the compromised-password check, so people can pick any password they like, including common ones.
- One limit stays: the sign-in system needs at least 6 characters, and I can't turn that off. Shorter passwords show a plain error message.

## Technical details
- `src/components/aurum/auth-form.tsx`: delete the signup hint line and the `minLength={10}` attribute.
- Sign-in settings: set `password_hibp_enabled: false`. Leave sign-ups on, email auto-confirm as it is now, and anonymous users off.
