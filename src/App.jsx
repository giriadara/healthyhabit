import React, { useMemo, useState, useEffect } from "react";

const IMG_URL = {
  logo: "/images/bowl1.jpg",
  hero: "/images/hero.jpg",
  bowl1: "/images/bowl1.jpg",
  bowl2: "/images/bowl2.png",
  bowl3: "/images/bowl3.png",
  process1: "/images/hero.jpg",
  process2: "/images/bowl2.png",
  process3: "/images/bowl3.png",
};

const PRODUCTS = [
  { sku: "BASIC",   name: "Signature Fruit Monthly Bowl", desc: "Seasonal fruits, premium pomegranate, pineapple & melon mix.", price: 2249, image: IMG_URL.bowl1, badges: ["Best Seller","Vegan"] },
  { sku: "PROTEIN", name: "Protein+ Bowl Monthly",         desc: "Fruit medley with boiled eggs & almonds for extra protein.",  price: 2299, image: IMG_URL.bowl2, badges: ["High Protein"] },
  { sku: "KIDS",    name: "Kids Mini Bowl Monthly",        desc: "Kid-friendly cuts, bite-size pieces, zero added sugar.",       price: 1189, image: IMG_URL.bowl3, badges: ["Kids Favorite"] },
];

// -------- helpers --------
const loadRzp = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = resolve;
    s.onerror = () => reject(new Error("Failed to load Razorpay script"));
    document.body.appendChild(s);
  });

// Get public key at runtime (avoids build-time env issues)
async function getPublicKey() {
  // if available via Vite (local dev), use it; else fetch from function
  const inlineKey = import.meta.env?.VITE_RAZORPAY_KEY_ID;
  if (inlineKey) return inlineKey;

  const r = await fetch("/api/public-key");
  const { key } = await r.json();
  if (!key) throw new Error("Public key missing");
  return key;
}

// Unified payment
async function payOnline({ name, phone, email, amountInRupees, lineItem, qty, extraNotes }) {
  try {
    await loadRzp();
    const key = await getPublicKey();

    const amountPaise = Math.round(Number(amountInRupees) * 100);
    if (!amountPaise || amountPaise < 100) {
      alert("Amount must be at least ₹1.");
      return;
    }

    const res = await fetch("/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt: `HH_${Date.now()}`,
        notes: { name, phone, email, lineItem, qty, extraNotes }
      })
    });

    const reply = await res.json(); // {status, data}
    console.log("create-order:", reply);

    // Razorpay success returns 200 and data has an 'id'
    if (res.status !== 200 || !reply?.data?.id) {
      const reason = reply?.data?.error?.description || reply?.error || "Unknown error from gateway.";
      alert("Payment init failed. " + reason);
      console.error("Order creation failed:", reply);
      return;
    }

    const order = reply.data;

    const rzp = new window.Razorpay({
      key,
      amount: order.amount,
      currency: order.currency,
      name: "Healthy Habit",
      description: lineItem || "Fruit Bowl Order",
      order_id: order.id,
      prefill: { name: name || "", email: email || "", contact: phone || "" },
      notes: { lineItem, qty, extraNotes },
      theme: { color: "#059669" },
      handler: (response) => {
        alert("Payment successful! ID: " + response.razorpay_payment_id);
      },
      modal: { ondismiss: () => console.log("Checkout closed") }
    });

    rzp.open();
  } catch (err) {
    alert("Could not start payment. Please try WhatsApp booking.");
    console.error("payOnline error:", err);
  }
}

// -------- UI (same as yours other than the Pay button onClick) --------
export default function HealthyHabitSite() {
  useEffect(() => {
    document.title = "Healthy Habit – Monthly Fruit Box & Fresh Fruit Bowls";
    const meta = document.createElement("meta");
    meta.name = "description";
    meta.content = "Book fresh, beautifully curated fruit bowls delivered daily or on subscription. Healthy Habit – Fresh • Healthy • Convenient.";
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  const [variant, setVariant] = useState(PRODUCTS[0].sku);
  const [qty, setQty] = useState(1);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const selectedProduct = useMemo(() => PRODUCTS.find(p => p.sku === variant), [variant]);
  const total = useMemo(() => qty * selectedProduct.price, [qty, selectedProduct]);

  const whatsappLink = useMemo(() => {
    const msg = `Hi Healthy Habit!%0A%0AI'd like to book a Fruit Bowl order:%0A%0A` +
      `Name: ${encodeURIComponent(name || "")} %0A` +
      `Variant: ${encodeURIComponent(selectedProduct.name)} %0A` +
      `Quantity: ${encodeURIComponent(qty)} %0A` +
      `Preferred delivery: ${encodeURIComponent(date)} at ${encodeURIComponent(time)} %0A` +
      `Address: ${encodeURIComponent(address || "pickup")} %0A` +
      (notes ? `Notes: ${encodeURIComponent(notes)} %0A` : "") +
      `%0A(Website enquiry)`;
    return `https://wa.me/9000925013?text=${msg}`;
  }, [name, selectedProduct, qty, date, time, address, notes]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-orange-50 text-slate-800">
      {/* … your header / hero / menu / pricing … unchanged … */}

      <section id="book" className="bg-emerald-50/60 border-t border-emerald-100">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold text-emerald-800">Book your fruit bowl</h2>
          <p className="text-slate-600 mt-1">We’ll confirm on WhatsApp within minutes.</p>

          <div className="mt-6 rounded-3xl bg-white shadow p-6 grid md:grid-cols-2 gap-5">
            {/* form left column */}
            {/* … your existing inputs … */}

            <div className="space-y-4">
              {/* address + notes + total … */}
              <div className="grid sm:grid-cols-3 gap-3">
                <a href={whatsappLink} target="_blank" rel="noreferrer" className="text-center px-4 py-3 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700">WhatsApp</a>
                <a
                  href={`mailto:orders@healthyhabit.example?subject=Fruit%20Bowl%20Booking&body=${encodeURIComponent(
                    `Name: ${name}\nVariant: ${selectedProduct.name}\nQty: ${qty}\nDate: ${date} ${time}\nAddress: ${address}\nNotes: ${notes}`
                  )}`}
                  className="text-center px-4 py-3 rounded-2xl border border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                >
                  Email
                </a>
                <button
                  onClick={() =>
                    payOnline({
                      name,
                      phone: "", email: "",
                      amountInRupees: total,
                      lineItem: `${selectedProduct.name}`,
                      qty,
                      extraNotes: notes
                    })
                  }
                  className="px-4 py-3 rounded-2xl bg-black text-white"
                >
                  Pay Online
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="why-us" className="bg-white/60 border-y border-emerald-100">
        <div className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-3 gap-8">
          {[
            { t: "Squeaky clean", d: "RO-washed, food-grade gloves, sealed boxes." },
            { t: "Always fresh", d: "We prep close to delivery time to keep it crisp." },
            { t: "Flexible plans", d: "Book once, schedule daily, or choose monthly box." },
          ].map((f) => (
            <div key={f.t} className="rounded-3xl bg-white p-6 shadow">
              <p className="text-2xl">🥝</p>
              <h3 className="mt-2 text-xl font-semibold text-emerald-800">{f.t}</h3>
              <p className="text-slate-600 text-sm">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-emerald-800">Simple pricing</h2>
        <p className="text-slate-600 mt-1">Bulk/office/party orders available on request.</p>
        <div className="mt-6 grid md:grid-cols-3 gap-6">
          {[...PRODUCTS].map((p, i) => (
            <div key={p.sku} className={`rounded-3xl p-6 shadow bg-white ${i === 1 ? "ring-2 ring-emerald-500" : ""}`}>
              <h3 className="text-xl font-semibold text-emerald-800">{p.name}</h3>
              <p className="text-sm text-slate-600">{p.desc}</p>
              <p className="mt-4 text-3xl font-extrabold">
                ₹{p.price}<span className="text-sm font-medium text-slate-500"> / bowl</span>
              </p>
              <ul className="mt-4 text-sm text-slate-700 space-y-2 list-disc list-inside">
                <li>Zero added sugar</li>
                <li>Food-grade packaging</li>
                <li>Same-day delivery window</li>
              </ul>
              <button
                onClick={() => { setVariant(p.sku); setOpen(true); }}
                className="mt-5 w-full px-4 py-3 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Book {p.name}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section id="book" className="bg-emerald-50/60 border-t border-emerald-100">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold text-emerald-800">Book your fruit bowl</h2>
          <p className="text-slate-600 mt-1">We’ll confirm on WhatsApp within minutes.</p>

          <div className="mt-6 rounded-3xl bg-white shadow p-6 grid md:grid-cols-2 gap-5">
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium">Your name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., Priya"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium">Choose a bowl</span>
                <select
                  value={variant}
                  onChange={(e) => setVariant(e.target.value)}
                  className="mt-1 w-full border rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                >
                  {PRODUCTS.map((p) => (
                    <option value={p.sku} key={p.sku}>
                      {p.name} — ₹{p.price}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium">Quantity</span>
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                  className="mt-1 w-full border rounded-xl px-3 py-2"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium">Delivery date</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 w-full border rounded-xl px-3 py-2"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium">Preferred time</span>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="mt-1 w-full border rounded-xl px-3 py-2"
                />
              </label>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium">Delivery address (or write “pickup”)</span>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={4}
                  className="mt-1 w-full border rounded-xl px-3 py-2"
                  placeholder="Flat / Street / Landmark"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium">Notes</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="mt-1 w-full border rounded-xl px-3 py-2"
                  placeholder="Allergies, no pineapple, extra pomegranate, etc."
                />
              </label>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-emerald-800">Total</p>
                  <p className="text-xl font-bold">₹{total}</p>
                </div>
                <p className="text-xs text-slate-500 mt-1">Taxes included. Cash/UPI on delivery available.</p>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-center px-4 py-3 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  WhatsApp
                </a>
                <a
                  href={`mailto:orders@healthyhabit.example?subject=Fruit%20Bowl%20Booking&body=${encodeURIComponent(
                    `Name: ${name}\nVariant: ${selectedProduct.name}\nQty: ${qty}\nDate: ${date} ${time}\nAddress: ${address}\nNotes: ${notes}`
                  )}`}
                  className="text-center px-4 py-3 rounded-2xl border border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                >
                  Email
                </a>
                <button
                  onClick={() =>
                    payOnline({
                      name,
                      phone: "", // add phone/email inputs later if needed
                      email: "",
                      amountInRupees: total,
                      lineItem: `${selectedProduct.name}`,
                      qty,
                      extraNotes: notes,
                    })
                  }
                  className="px-4 py-3 rounded-2xl bg-black text-white"
                >
                  Pay Online
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-emerald-800">How it works</h2>
        <div className="mt-6 grid md:grid-cols-3 gap-6">
          {[
            { img: IMG_URL.process1, t: "We wash", d: "RO water • food-grade disinfectant" },
            { img: IMG_URL.process2, t: "We cut", d: "Gloves • stainless knives • airtight" },
            { img: IMG_URL.process3, t: "We deliver", d: "Chilled box • tracked delivery" },
          ].map((s) => (
            <div key={s.t} className="rounded-3xl bg-white p-5 shadow">
              <img src={s.img} alt={s.t} className="rounded-2xl h-48 w-full object-cover" />
              <h3 className="mt-3 text-lg font-semibold text-emerald-800">{s.t}</h3>
              <p className="text-sm text-slate-600">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="bg-white/60 border-y border-emerald-100">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold text-emerald-800">Frequently asked questions</h2>
          <div className="mt-6 grid md:grid-cols-2 gap-6">
            {[
              { q: "Do you add sugar or preservatives?", a: "Never. Only fresh fruit. We may include lemon or mint on request." },
              { q: "How do subscriptions work?", a: "Choose your bowl and delivery window. We prep fresh daily and you can pause anytime via WhatsApp." },
              { q: "What areas do you deliver to?", a: "We currently serve core city limits. For bulk/office orders, we can extend coverage." },
              { q: "Can I customize my bowl?", a: "Yes! Mention allergies or dislikes in notes. We’ll confirm substitutions when possible." },
            ].map((f) => (
              <details key={f.q} className="rounded-2xl bg-white shadow p-5">
                <summary className="font-semibold cursor-pointer text-emerald-800">{f.q}</summary>
                <p className="text-sm text-slate-600 mt-2">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src={IMG_URL.logo} alt="Healthy Habit" className="h-10 w-10 rounded-full shadow" />
            <div>
              <p className="font-semibold text-emerald-700">Healthy Habit</p>
              <p className="text-xs text-slate-500">Fresh • Healthy • Convenient</p>
            </div>
          </div>
          <div className="text-sm text-slate-600">
            <p>
              Order / WhatsApp:{" "}
              <a className="text-emerald-700 font-semibold" href="https://wa.me/9000925013" target="_blank" rel="noreferrer">
                9000925013
              </a>
            </p>
            <p className="mt-1">Email: orders@healthyhabit.example</p>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-6">© {new Date().getFullYear()} Healthy Habit. All rights reserved.</p>
      </footer>
    </div>
  );
}
