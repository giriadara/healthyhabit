// functions/api/public-key.js
// Returns the public Razorpay Key ID (safe to expose)
export async function onRequestGet({ env }) {
  const key =
    env.VITE_RAZORPAY_KEY_ID ||
    env.RAZORPAY_KEY_ID ||
    "";

  return new Response(JSON.stringify({ key }), {
    status: key ? 200 : 500,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}
