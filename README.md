# jesuslovesyou.dk — animated homepage

An independent static website inspired by the supplied psychedelic Jesus, open-tomb and heavenly DJ images. The generated artwork is original; the animation moves the surrounding colour, light, atmosphere and glowing particles. Faces stay recognizable. Scrolling dissolves between three scenes. Reduced motion starts the animation paused.

## Publish with Cloudflare Pages

1. In Cloudflare, open **Workers & Pages → Create application → Pages → Connect to Git**.
2. Select **mautaw-ctrl/duo-climb-control-room** and the **jesuslovesyou-website** branch.
3. Framework preset: **None**. Build command: leave empty. Build output directory: **/**. Root directory: leave empty.
4. Deploy. Cloudflare supplies the actual `*.pages.dev` URL after deployment.

This branch contains only this website. It does not change the `main` branch or the existing desktop and tracker application.

For direct upload, download `jesuslovesyou-upload.zip` from this branch and upload it using **Pages → Upload assets**. `index.html` and the assets are at the ZIP root.

## Connect the domain

Wait for **jesuslovesyou.dk** to become **Active** in Cloudflare, then open the Pages project **Custom domains → Set up a custom domain** and enter `jesuslovesyou.dk`. Complete the DNS change through that wizard. The current apex CNAME points to Railway; switching it to Pages changes which service receives requests at the domain root.

The navigation targets `/englesang` and `/teknologi` on the requested domain. Those services need path routing configured separately before the links work at these URLs. This static homepage does not configure that routing. Preserve the existing applications' asset and API URLs when setting it up. The existing Railway application URL remains available.

## Files and development

Serve `index.html`, `styles.css`, `experience.js` and `universe-atlas.png` together. No dependencies, installation, build command or secret is needed for this homepage.

For local development: `python -m http.server 8862 --bind 127.0.0.1` from this directory. Use a local HTTP server for WebGL texture loading. The generated artwork's original file is preserved outside the project.

## Validation

`validation.json` records the browser checks performed on this draft. Local rendering and interaction checks do not verify the production domain or destination services.
