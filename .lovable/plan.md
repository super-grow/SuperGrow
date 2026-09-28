# Admin login with username "admin"

## What changes
- The admin sign-in page asks for **Username** and **Password** instead of email.
- One administrator account is created with username `admin` and password `meow`. Entering those details on the admin sign-in page opens the admin panel.
- Regular customer sign-in stays separate. Customers can't use the admin page, and the `admin` username can't be used on the customer sign-in page.
- The admin panel stays the same: see users and their balances, update balances, and select and delete several users at once.

## Technical details
- Map the username `admin` on the server to a fixed internal admin account email, for example `admin@supergrow.internal`. The form never asks for an email.
- Create that account once through the server with the password `meow`. The sign-in system stores the password hashed, and it is not saved in the code. Then give the account the administrator role in the user roles table.
- Lower the minimum password length in the sign-in settings so a 4-character password is accepted.
- The admin sign-in sends the mapped email and the password to normal sign-in. Before opening the admin panel, the server checks the administrator role.
- Recommendation: switch to a stronger password later from the admin profile. A short password is easy to guess.
