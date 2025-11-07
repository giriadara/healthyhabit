// Cloudflare Pages Function: POST /api/create-order
export async function onRequestPost(context) {
  const { request, env } = context;

  const { amount, currency = "INR", receipt = "hh_receipt", notes = {} } =
    await request.json();

  if (!amount || amount < 100) {
    return new Response(JSON.stringify({ error: "Invalid amount (paise)" }), { status: 400 });
  }

  const keyId = env.RAZORPAY_KEY_ID;
  const keySecret = env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return new Response(JSON.stringify({ error: "Razorpay keys not configured" }), { status: 500 });
  }

  const auth = btoa(`${keyId}:${keySecret}`);

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount, currency, receipt, notes }),
  });

  const data = await res.json();
  return new Response(JSON.stringify(data), { status: res.ok ? 200 : res.status });
}
