# Prowire Electric Website

Production website for Prowire Electric, built with plain HTML, CSS, and JavaScript and hosted on Vercel.

## Project Structure

- `index.html` - home page
- `about.html` - company and process page
- `work.html` - services page
- `contact.html` - contact form and Squamish map embed
- `admin.html` - protected admin sign-in page, routed as `/admin` on Vercel
- `styles.css` - shared visual system and responsive layout
- `app.js` - mobile navigation, page reveals, contact-form delivery, and chat behavior
- `admin.js` - Google sign-in and admin session UI
- `api/admin/*` - Vercel serverless admin auth endpoints
- `vercel.json` - clean URL and admin route configuration
- `robots.txt` and `sitemap.xml` - search-engine discovery files for `www.prowireelectric.ca`
- `assets/logo.png` - Prowire Electric logo used in the header
- `assets/hero-kitchen.avif` - hero/admin background image
- `assets/project-*.jpg` - full-resolution client project photos
- `assets/project-*-720.webp` - responsive, bandwidth-friendly project-photo variants

## Design System

The core brand colors are defined at the top of `styles.css`:

```css
--logo-black: #000;
--logo-red: #ed1c24;
--logo-white: #fff;
```

Linen and almond tones support the primary black, red, and white palette.

Roboto is loaded through Google Fonts in each HTML file with `display=swap`; `styles.css` falls back to Helvetica and Arial if the font request is unavailable. The home hero title also loads a lighter Orbitron weight as a close web-font match for the angular logo style.

The home hero and admin background use `assets/hero-kitchen.avif`. Project and service photography uses the named `assets/project-*.jpg` files referenced in the page markup.

## Contact Forms

The homepage and contact-page forms deliver estimate requests to `info@prowiregroup.com` through FormSubmit's AJAX endpoint. FormSubmit requires a one-time recipient activation for `info@prowiregroup.com` before regular delivery begins and retains submissions for 30 days as a delivery fallback.

Failed delivery displays the public phone number and email address as fallback contact methods.

## Search and Business Listings

Public pages include canonical URLs and social metadata for `https://www.prowireelectric.ca`. The homepage also includes `Electrician` structured data with the service areas and core services.

Launch checklist:

- Verify `https://www.prowireelectric.ca` in Google Search Console and Bing Webmaster Tools.
- Submit `https://www.prowireelectric.ca/sitemap.xml`.
- Update the Google Business Profile, BBB profile, and other listings from the previous Wix URL to `https://www.prowireelectric.ca`.
- Add confirmed social-profile URLs to the footer and structured data when available.

The full Google Business Profile address is intentionally limited to the homepage's `LocalBusiness` structured data and is not displayed in the page content or public footers:

```txt
2596 Portree Way
Squamish, BC V8B 0T6
Canada
```

## Domain Configuration

The Vercel project uses `www.prowireelectric.ca` as the production host and redirects the apex domain to it. Website routing depends on these Wix DNS records:

```txt
Type: A
Host name: blank (@)
Value: 216.198.79.1

Type: CNAME
Host name: www
Value: b6d37cd182c43eee.vercel-dns-017.com
```

Existing MX and email-verification TXT records support business email and must remain intact. DNS changes may take up to 48 hours to propagate.

## Admin Access

The production admin route is `/admin`; the local static-file route is `/admin.html`.

Admin mode is deliberately false on page load. `admin.js` only flips its in-memory `isAdmin` flag after `/api/admin/session` confirms a valid signed HttpOnly cookie. The cookie is created only after Google sign-in succeeds and the verified Google email is in the whitelist.

The admin authentication service depends on these Vercel environment variables:

```txt
GOOGLE_CLIENT_ID=<Google OAuth web client ID>
ADMIN_EMAILS=<comma-separated authorized email addresses>
ADMIN_COOKIE_SECRET=<random secret of at least 32 characters>
```

Google OAuth configuration:

- A Google OAuth Web Client ID is required.
- The production domain must appear in Authorized JavaScript origins.
- `http://localhost:3000` may be included as an authorized origin for local testing.
- `ADMIN_EMAILS` has no default value and contains the explicit access list.
