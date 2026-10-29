# TheTechTinker Supply storefront

A dependency-free static shop for electronics project parts. The first version uses a catalog and cart in the browser, then hands an order summary to WhatsApp. It does not collect payment or store orders on a server.

## Configure before launch

1. Open `products.js` and set `STORE_CONFIG.whatsappNumber` to the shop's WhatsApp number with country code, digits only (for example, `919876543210`). The placeholder intentionally prevents the order link from opening.
2. Replace the sample product records in `window.PRODUCTS` with the shop's real names, descriptions, categories, image URLs, and options.
3. For each option, set its `price` in rupees and its current `stock`. A zero stock value disables that option. Keep product IDs stable so saved browser carts remain meaningful.
4. To put an option on offer, set `compareAtPrice` to its regular price and `price` to the lower offer price. The catalog shows the saving, the cart totals use the offer price, and the WhatsApp summary includes the regular price and savings. Remove `compareAtPrice` when the offer ends. Leave it out for full-price options. The Offers filter and top announcement update from active product discounts; there are no coupon codes in this first version.
5. Replace the sample brand and shop copy in `index.html` and `products.js` before publishing. The photos are illustrative sample images, not guaranteed product photography.

## Preview

Because the project uses classic scripts and no fetch requests, opening `index.html` directly works for browsing. Cookie-backed cart persistence requires an HTTP or HTTPS origin, so use a local static server for testing, for example:

```powershell
py -m http.server 8000
```

Then visit `http://localhost:8000`.

## Order handoff

The cart subtotal is an estimate based on the product catalog. The WhatsApp message includes item options, quantities, subtotal, customer name, phone, and delivery address. The customer must send the message to submit an order. Confirm availability, delivery charges, and payment in the WhatsApp conversation; this static site does not reserve stock, process payment, or create an order record.

The cart is stored in a JavaScript cookie for 30 days. It is not shared across devices and is not visible to the shop until the customer sends the WhatsApp message. Browsers must allow cookies for the site. Existing carts in `localStorage` are migrated to a cookie on the next visit when cookies are available.

## Manage products

1. Open `admin.html` through the local server (for example, `http://localhost:8001/admin.html`).
2. Select a product to edit it, or use `+` to add one. Add each size or bundle as an option with its price and stock. For an offer, enter a regular price higher than the offer price.
3. Use **Save draft** to keep changes in this browser. Drafts are not visible to shoppers and do not change the published store.
4. Choose **Download catalog**. If a product form is open, it is saved first. The browser downloads a new `products.js` file.
5. Replace the existing `products.js` in your site folder with the downloaded file, then deploy the updated folder to publish. Keep a backup of the old file if you want an easy rollback.

The manager runs entirely in the browser; it has no login or server-side database. Local drafts stay in the browser that created them. `Discard local draft` removes those saved edits and reloads the catalog from the current `products.js` file.

The admin product list includes a category filter that works together with search. Sold-out products have blurred thumbnails and a `SOLD OUT` label; exact stock quantities remain in the product editor so you can update them.

## Learn page

Open `admin-videos.html` from the product manager's **Manage lessons** link to add or edit lessons. Enter a title, description, YouTube iframe snippet or embed URL, mark trending lessons, and select one or more existing products to recommend. Save drafts in this browser, then download `videos.js` and replace the published file. Product suggestions can include saved product drafts, so publish the matching `products.js` catalog too.

Visitors can search lessons at `learn.html`. Trending lessons are listed first; opening a lesson loads `video.html` with its player and linked products. Product option selection and **Add to cart** use the same cookie-backed cart as the storefront. Playback requires a valid YouTube video that allows embedding.

## Hosting

Deploy the files in this folder to any static web host, such as GitHub Pages, Netlify, or Cloudflare Pages. No build step is required. Set the WhatsApp number and replace sample content before the site goes live.