// functions/api/create-order.js
// Cloudflare Pages Function: POST /api/create-order
export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json(); // { amount, currency, receipt, notes }
    const amount = Number(body.amount);

    if (!amount || amount < 100) {
      return json({ ok: false, error: "Amount must be in paise (>=100)." }, 400);
    }

    const payload = {
      amount, // paise (₹299 => 29900)
      currency: body.currency || "INR",
      receipt: body.receipt || `rcpt_${Date.now()}`,
      notes: body.notes || {}
    };

    // Basic auth with your API keys from Cloudflare env
    const auth = "Basic " + btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);

    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": auth
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    // Pass Razorpay error details through to the client for easy debugging
    return json({ status: res.status, data }, res.status);
  } catch (err) {
    return json({ ok: false, error: "Invalid request", detail: String(err) }, 400);
  }
}

// small helper
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
