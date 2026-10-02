# Bradyn Supabase setup

Bradyn uses Supabase Auth plus the tables and row-level security policies in
`migrations/001_portal_schema.sql`. The app intentionally contains no service-role
key and has no public sign-up screen.

## Apply the schema

1. Open the Supabase project’s **SQL Editor**.
2. Paste and run the complete contents of `migrations/001_portal_schema.sql`.
3. In **Authentication → Users**, create or invite each client and admin account.
   Auth-user creation automatically creates a client-role profile. Client profiles
   are linked to a client record by matching email.
4. Create the first administrator in **Authentication → Users**, then promote
   that account from the SQL Editor:

   ```sql
   update public.profiles
   set role = 'admin'
   where lower(email) = lower('the-admin-email@example.com');
   ```

   Replace the example email with the administrator account’s email. Do not put
   an admin role in a client-side sign-up form.
5. Create client records from the admin portal. The app links an already-created
   Supabase Auth account with the same email. If you create the client record
   first, the Auth-user trigger links the account when it is created later.

## Existing temporary device data

The previous app stored fictional sample records only in local AsyncStorage.
Bradyn no longer reads or writes that store. The SQL migration does not import
those sample records; start by adding real client/project data after applying it.