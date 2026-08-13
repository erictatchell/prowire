# Prowire Electric Website

Lightweight static site for Prowire Electric. It uses plain HTML, CSS, and JavaScript so copy, layout, and images are easy to edit without a framework build step.

## Files

- `index.html` - home page
- `about.html` - company and process page
- `work.html` - services page
- `contact.html` - contact form and Squamish map embed
- `admin.html` - protected admin sign-in page, routed as `/admin` on Vercel
- `styles.css` - shared visual system and responsive layout
- `app.js` - mobile nav, fade-in reveals, cosmetic form and chat behavior
- `admin.js` - Google sign-in and admin session UI
- `api/admin/*` - Vercel serverless admin auth endpoints
- `api/contact.js` - Vercel contact-form email endpoint
- `vercel.json` - clean URL and admin route configuration
- `robots.txt` and `sitemap.xml` - search-engine discovery files for `www.prowireelectric.ca`
- `assets/logo.png` - Prowire Electric logo used in the header
- `assets/hero-kitchen.avif` - hero/admin background image
- `assets/project-*.jpg` - full-resolution client project photos
- `assets/project-*-720.webp` - responsive, bandwidth-friendly project-photo variants

## Editing Notes

The visual system now follows the supplied logo first. The core brand colors are defined at the top of `styles.css`:

```css
--logo-black: #000;
--logo-red: #ed1c24;
--logo-white: #fff;
```

The linen and almond tones are supporting page colors used to keep the site from feeling too stark.

Roboto is loaded through Google Fonts in each HTML file with `display=swap`; `styles.css` falls back to Helvetica and Arial if the font request is unavailable. The home hero title also loads a lighter Orbitron weight as a close web-font match for the angular logo style.

The home hero/admin background comes from `assets/hero-kitchen.avif`. Supporting project and service photography uses the named `assets/project-*.jpg` files referenced in the HTML and `styles.css`.

The contact forms submit to `/api/contact`, which sends estimate requests through Resend. Verify `prowireelectric.ca` with Resend and set these Vercel environment variables before enabling production delivery:

```txt
RESEND_API_KEY=re_...
CONTACT_TO_EMAIL=prowireelectric.ltd@gmail.com
CONTACT_FROM_EMAIL=Prowire Website <website@prowireelectric.ca>
```

If the email provider is not configured, the form displays the public phone number and `prowireelectric.ltd@gmail.com` as fallback contact methods.

## Search Setup

Public pages include canonical URLs and social metadata for `https://www.prowireelectric.ca`. The homepage also includes `Electrician` structured data with the service areas and core services.

After deployment:

- Verify `https://www.prowireelectric.ca` in Google Search Console and Bing Webmaster Tools.
- Submit `https://www.prowireelectric.ca/sitemap.xml`.
- Update the Google Business Profile, BBB profile, and other listings from the previous Wix URL to `https://www.prowireelectric.ca`.
- Add confirmed social-profile URLs to the footer and structured data rather than using placeholder links.

The full Google Business Profile address is intentionally limited to the homepage's `LocalBusiness` structured data and is not displayed in the page content or public footers:

```txt
2596 Portree Way
Squamish, BC V8B 0T6
Canada
```

## Wix Domain Connection

The Vercel project is configured to use `www.prowireelectric.ca` as the production host and redirect the apex domain to it. In Wix, open **Domains**, choose `prowireelectric.ca`, open **Domain Actions**, and select **Manage DNS Records**. Replace only the conflicting website records with:

```txt
Type: A
Host name: leave blank (Wix uses a blank host for @)
Value: 216.198.79.1

Type: CNAME
Host name: www
Value: b6d37cd182c43eee.vercel-dns-017.com
```

Keep existing MX and email-verification TXT records. Save the changes, then return to **Vercel > Project > Settings > Domains** and click **Refresh** beside both domain entries. DNS updates may take time to propagate.

## Admin Access

The admin route is available at `/admin` on Vercel. Locally, use `/admin.html` unless you are running through `vercel dev`.

Admin mode is deliberately false on page load. `admin.js` only flips its in-memory `isAdmin` flag after `/api/admin/session` confirms a valid signed HttpOnly cookie. The cookie is created only after Google sign-in succeeds and the verified Google email is in the whitelist.

Set these Vercel environment variables before using the admin route:

```txt
GOOGLE_CLIENT_ID=your-google-oauth-web-client-id.apps.googleusercontent.com
ADMIN_EMAILS=first@example.com,second@example.com
ADMIN_COOKIE_SECRET=a-long-random-secret-at-least-32-characters
```

Google OAuth setup notes:

- Create a Google OAuth Web Client ID.
- Add the production domain to Authorized JavaScript origins.
- Add `http://localhost:3000` if testing with `vercel dev`.
- Keep `ADMIN_EMAILS` explicit; there is no default admin email.
