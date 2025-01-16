# Goal
Demonstrator a vulnerability of login token leakage (a small example of sensitive info leakage)

# Context
There is no easy rule to tell what is sensitive and what is not. Because it's a multi-dimension problem:
- PII (personal identifierable information) is usually sensitive in web app context
    - only owner is supposed to read/write/admin their own PII
- User's app data is harder:
    - social network app usually is encouraging users to interact with each other as much as possible
    - financial app usually supports no interaction among users, except for transfer maybe
    - everything else is in the middle grey area, it really depends on the context
- login info is usually the most sensitive data
    - because with it, attacker can control victim's account and do whatever on his/her behave

# plan
1. Create an new feature that makes sense in this app, which allows user to share invoices
2. in order for user A to access invoices created by user B, we will do the following:
    2.1 user A will click on "share" button on an invoice page
    2.2 front end pop up a list of users of this app
    2.3 for server to populate the list of the users, it enumerate all info of all users from the database and send the info to frontend
    2.4 user A check a checkbox in front of user B's username, and click next
    2.5 server add user B's username into access list of this invoice
    2.6 user B can now access the invoice
3. the leakage happens in 2.3
    3.1 user A can observe the response and realize the json of user B's info includes a token
    3.2 user A can then login to invoicer with user B's token and use invoicer as user B


