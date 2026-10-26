# Nova Grill — BERADYN test restaurant

Cloudflare Worker for the Nova Grill demo website at https://nova.beradyn.com.

- **Client ID:** `2bc4e4f6-2771-4717-b8cb-4978aeba0f15`
- **Project ID:** `c72e8962-4aa7-4067-9585-7bf63fe29b48`
- **Website Studio ID:** `8245bc80-f105-4c3b-963b-e3b7f2a8a877`
- **Cloudflare script:** `beradyn-nova-grill`
- **Cloudflare custom domain:** `nova.beradyn.com`
- **Supabase public feed:** `/functions/v1/beradyn-website-content?website_id=8245bc80-f105-4c3b-963b-e3b7f2a8a877`

This concept demo was created solely to test BERADYN Website Studio's menu publishing. The menu and prices are illustrative. It is not associated with any public restaurant named Nova Grill. The example uses free-use stock food photography from Unsplash and has no checkout, actual address, phone number, or reservations.

## Live content

Browser loads GET `/api/content` on this Cloudflare Worker. Worker fetches BERADYN's existing public, read-only Supabase Edge Function. The function only returns published data for activated websites, never drafts, internal credentials, or unapproved media. The visitor page checks for changes every 15 seconds while visible.

The existing Client Portal UI is unchanged. Authorized users can change menu items and prices in **Projects → Website Studio**, then publish. Updates flow to this site without rebuilding.

## Deployment

`worker.mjs` has been uploaded to Cloudflare as the Worker named `beradyn-nova-grill` and associated with the custom domain. Treat this file as the deployment source of record. Future changes to the Worker require deployment to Cloudflare; menu changes do not.

## Smoke test

1. Visit `https://nova.beradyn.com/health` and expect JSON with `status: ok`.
2. Visit `https://nova.beradyn.com/api/content` and check published menu items; expected seeded rows: 8 sample menu items across 3 categories.
3. Log in as an authorized Nova Grill account, edit a test item's price, save draft and click Publish changes. Verify the changed price on the site within a refresh cycle.
4. Test that a non-Nova Grill client cannot edit Nova Grill content.

**Safety:** Do not copy private Supabase service keys into Worker or the repository, and do not disable the existing public endpoint's verification checks.