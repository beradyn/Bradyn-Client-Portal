# Bradyn setup in Lovable Cloud

Bradyn uses the Supabase-compatible authentication and database provided by
Lovable Cloud. The app intentionally contains no service-role key and has no
public sign-up screen.

## Apply the database migration

1. Open the Lovable project’s **Cloud** area and its SQL editor/scripts tool.
2. Run the complete file `artifacts/bradyn/supabase/migrations/001_portal_schema.sql`.
   The migration creates the portal tables, profile triggers, and row-level
   security policies. It does not add sample clients or projects.
3. In Lovable Cloud’s authentication settings, disable public sign-ups.
4. Create or invite each client and admin account in the Cloud authentication
   area.
   Auth-user creation automatically creates a client-role profile. Client profiles
   are linked to a client record by matching email.
5. Create the first administrator account, then promote it using the SQL editor:

   ```sql
   update public.profiles
   set role = 'admin'
   where lower(email) = lower('the-admin-email@example.com');
   ```

   Replace the example email with the administrator account’s email. Do not put
   an admin role in a client-side sign-up form.
6. Create client records from the admin portal. The app links an already-created
   Supabase Auth account with the same email. If you create the client record
   first, the Auth-user trigger links the account when it is created later.

## Existing temporary device data

The previous app stored fictional sample records only in local AsyncStorage.
Bradyn no longer reads or writes that store. The SQL migration does not import
those sample records; start by adding real client/project data after applying it.