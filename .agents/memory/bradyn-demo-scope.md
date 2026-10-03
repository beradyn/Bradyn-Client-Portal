---
name: Bradyn access and data
description: Durable authentication and data-access decisions for the Bradyn Expo portal.
---

Bradyn uses Supabase Auth and RLS-protected Supabase tables for real client and admin portal data. Public sign-up is disabled; an administrator creates or invites each account. The authenticated profile determines the role and linked client record. Users cannot choose or elevate their own role. Admin promotion must happen through a trusted Supabase process, never the client app.

Do not seed fictional records or include temporary login credentials. Use only the Supabase publishable key in the mobile app; never place a service-role key in client code.

**Why:** the user superseded the earlier demo-only boundary and selected administrator-managed Supabase access for both portal roles.

**How to apply:** keep future portal data changes behind the existing RLS policies, link client accounts by their Supabase profile, and provision or promote accounts only through trusted administration.