// Cloudflare Pages Function: POST /api/create-order
export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json(); // { amount, currency, receipt, notes }

    // Validate amount
    const amount = Number(body.amount);
    if (!amount || amount < 100) {
      return new Response(JSON.stringify({ error: "Amount must be in paise (>=100)." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Prepare payload for Razorpay
    const payload = {
      amount,                                 // amount in paise
      currency: body.currency || "INR",
      receipt: body.receipt || `rcpt_${Date.now()}`,
      notes: body.notes || {}
    };

    // Authenticate Razorpay request
    const auth = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);

    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid request", detail: String(err) }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
}
