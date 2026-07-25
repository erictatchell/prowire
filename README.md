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
- `vercel.json` - clean URL and admin route configuration
- `assets/logo.png` - Prowire Electric logo used in the header
- `assets/placeholder.jpg` - temporary image used across the site

## Editing Notes

The visual system now follows the supplied logo first. The core brand colors are defined at the top of `styles.css`:

```css
--logo-black: #000;
--logo-red: #ed1c24;
--logo-white: #fff;
```

The linen and almond tones are supporting page colors used to keep the site from feeling too stark.

Roboto is loaded through Google Fonts in each HTML file with `display=swap`; `styles.css` falls back to Helvetica and Arial if the font request is unavailable. The home hero title also loads a lighter Orbitron weight as a close web-font match for the angular logo style.

Replace `assets/placeholder.jpg` with final project photography when available, or update individual image `src` values inside the HTML files.

The contact forms are cosmetic right now. To connect them later, replace the `submit` handler in `app.js` with a backend endpoint, Formspree, Netlify Forms, or another form service.

The map on `contact.html` currently points to Squamish, BC:

```html
https://www.google.com/maps?q=Squamish%2C%20BC&output=embed
```

Swap that URL when the client confirms the exact location or preferred service-area marker.

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
