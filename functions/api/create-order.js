// Cloudflare Pages Function: POST /api/create-order
export async function onRequestPost({ request, env }) {
  try {
    // 1) Validate env
    const kid = env.RAZORPAY_KEY_ID;
    const ksec = env.RAZORPAY_KEY_SECRET;
    if (!kid || !ksec) {
      return new Response(
        JSON.stringify({ error: "Missing Razorpay keys on server." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2) Read body
    const { amount, currency = "INR", receipt, notes } = await request.json();
    const amt = Number(amount);
    if (!amt || amt < 100) {
      return new Response(
        JSON.stringify({ error: "Amount must be in paise (>=100)" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3) Call Razorpay Orders API
    const payload = {
      amount: Math.round(amt),
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes || {},
    };

    const auth = btoa(`${kid}:${ksec}`);
    const rp = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await rp.json();
    // Pass Razorpay’s response back to the browser
    return new Response(JSON.stringify(data), {
      status: rp.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Invalid request", detail: String(err) }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Optional: make GET return a helpful message instead of 404
export async function onRequestGet() {
  return new Response(
    "Use POST /api/create-order with JSON {amount,currency,receipt,notes}",
    { status: 405 }
  );
}
