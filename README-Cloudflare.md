# Healthy Habit – Cloudflare Pages + Functions (Razorpay)

## Deploy (Connect Git)
1. Push this folder to GitHub/GitLab/Bitbucket.
2. Cloudflare Dashboard → Pages → Create project → Connect to Git → choose repo.
3. Build command: `npm run build`
4. Build output: `dist`
5. Environment variables:
   - VITE_RAZORPAY_KEY_ID = your_public_key (client)
   - RAZORPAY_KEY_ID = your_public_key (server)
   - RAZORPAY_KEY_SECRET = your_secret_key (server)
6. Deploy.

## Deploy (Wrangler CLI)
npm install
npm run build
npx wrangler pages dev dist
npx wrangler pages deploy dist --project-name healthy-habit

## Functions
- File: `functions/api/create-order.js` → `POST /api/create-order`
