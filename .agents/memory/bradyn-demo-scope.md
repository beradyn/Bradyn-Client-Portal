---
name: Bradyn access and data
description: Durable authentication and data-access decisions for the Bradyn Expo portal.
---

Bradyn uses Lovable Cloud's Supabase-compatible Auth and RLS-protected tables for real client and admin portal data. The user has no direct PostgreSQL connection string; schema changes must be run through Lovable Cloud's SQL tools or supplied as SQL for the user to execute. Do not request a direct DB URI.

Public sign-up is disabled; an administrator creates or invites each account. The authenticated profile determines the role and linked client record. Users cannot choose or elevate their own role. Admin promotion must happen through trusted SQL, never the client app.

Do not seed fictional records or include temporary login credentials. Use only the public client key in the mobile app; never place a service-role key in client code.

**Why:** the user selected administrator-managed access for both roles and explicitly said the project uses Lovable Cloud without a direct PostgreSQL connection string.

**How to apply:** keep portal data changes behind RLS, link client accounts by profile, provision or promote users through trusted administration, and provide migrations through Lovable Cloud's SQL workflow.