import React, { useMemo, useState, useEffect } from "react";

/* =======================
   BUSINESS CONFIG
======================= */
const BUSINESS = {
  name: "Healthy Habit",
  whatsappOwner: "9000925013", // 10 digits, no +91
  serviceCity: "Hyderabad",
  allowedPincodes: [], // e.g. ["500001","500002"]; keep [] to allow all
};

/* =======================
   FSSAI CONFIG
======================= */
const FSSAI = {
  number: "23625028002142",
};

/* =======================
   IMAGES
======================= */
const IMG_URL = {
  // favicon-ish logo (you can change later if you want)
  logo: "/images/bowl1.jpg",

  // hero image on the right
  hero: "/images/monthly-fruit-box-hero.png",

  // FSSAI + logo poster
  fssaiPoster: "/images/healthy-habit-fssai-poster.png",

  // bowls / cards
  bowl1: "/images/colorful-fruit-box-poster.png",
  bowl2: "/images/monthly-fruit-box-hero.png",
  bowl3: "/images/colorful-fruit-box-poster.png",

  // camera roll gallery
  cam1: "/images/colorful-fruit-box-poster.png",
  cam2: "/images/monthly-fruit-box-hero.png",
  cam3: "/images/colorful-fruit-box-poster.png",
  cam4: "/images/monthly-fruit-box-hero.png",
};

/* =======================
   PRODUCTS / PRICING
======================= */
const PRODUCTS = [
  {
    sku: "BASIC",
    name: "Signature Fruit Monthly Bowl",
    desc: "Seasonal fruits, premium pomegranate, pineapple & mixed fruit mix.",
    price: 2249,
    image: IMG_URL.bowl1,
    badges: ["Best Seller", "Vegan"],
  },
  {
    sku: "PROTEIN",
    name: "Protein+ Bowl Monthly",
    desc: "Fruit medley with boiled eggs & almonds for extra protein.",
    price: 2299,
    image: IMG_URL.bowl2,
    badges: ["High Protein"],
  },
  {
    sku: "KIDS",
    name: "Kids Mini Bowl Monthly",
    desc: "Kid-friendly cuts, bite-size pieces, zero added sugar.",
    price: 1189,
    image: IMG_URL.bowl3,
    badges: ["Kids Favorite"],
  },
];

/* =======================
   RAZORPAY LOADER + PUBLIC KEY
======================= */
const loadRzp = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = resolve;
    s.onerror = () => reject(new Error("Failed to load Razorpay script"));
    document.body.appendChild(s);
  });

async function getPublicKey() {
  const inlineKey = import.meta.env?.VITE_RAZORPAY_KEY_ID;
  if (inlineKey) return inlineKey;
  const r = await fetch("/api/public-key");
  const { key } = await r.json();
  if (!key) throw new Error("Public key missing");
  return key;
}

/* =======================
   HELPERS
======================= */
const isTenDigitPhone = (p) => /^[6-9]\d{9}$/.test(String(p || "").trim());
const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || "").trim());
const onlyDigits = (s) => String(s || "").replace(/\D/g, "");

function buildWaLink(phone, text) {
  const n = onlyDigits(phone);
  const dest = n.length === 10 ? `91${n}` : n;
  return `https://wa.me/${dest}?text=${encodeURIComponent(text)}`;
}

/* =======================
   FSSAI BADGE COMPONENT
======================= */
function FssaiBadge() {
  return (
    <div className="w-full rounded-2xl border border-emerald-200 bg-white/90 shadow-sm p-3 sm:p-4 flex items-center gap-3">
      <img
        src={IMG_URL.fssaiPoster}
        alt="FSSAI Licensed – Healthy Habit"
        className="h-10 w-auto sm:h-12 rounded-xl object-contain bg-white"
        loading="lazy"
      />
      <div className="flex-1">
        <p className="text-xs sm:text-sm font-semibold text-emerald-800 leading-tight">
          Licensed with FSSAI (Food Safety and Standards Authority of India)
        </p>
        <p className="text-[11px] sm:text-xs text-slate-600 leading-tight">
          Licence No:{" "}
          <span className="font-medium tracking-wide">{FSSAI.number}</span>
        </p>
      </div>
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-emerald-600 shrink-0">
        <path
          fill="currentColor"
          d="M12 2l7 3v6c0 5-3.5 9.5-7 11c-3.5-1.5-7-6-7-11V5l7-3z"
        />
        <path
          fill="#ffffff"
          d="M10.5 13.2l-2-2 1.1-1.1 0.9 0.9 3.9-3.9 1.1 1.1z"
        />
      </svg>
    </div>
  );
}

/* =======================
   MAIN PAGE
======================= */
export default function HealthyHabitSite() {
  // SEO
  useEffect(() => {
    document.title = `${BUSINESS.name} – Monthly Fruit Box & Fresh Fruit Bowls`;
    const meta = document.createElement("meta");
    meta.name = "description";
    meta.content = `Book fresh, beautifully curated fruit bowls delivered daily or on subscription. ${BUSINESS.name} – Fresh • Healthy • Convenient.`;
    document.head.appendChild(meta);
    return () => document.head.removeChild(meta);
  }, []);

  // form state
  const [variant, setVariant] = useState(PRODUCTS[0].sku);
  const [qty, setQty] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [receipt, setReceipt] = useState(null); // { orderId, paymentId, ... }

  const selectedProduct = useMemo(
    () => PRODUCTS.find((p) => p.sku === variant),
    [variant]
  );
  const total = useMemo(
    () => qty * (selectedProduct ? selectedProduct.price : 0),
    [qty, selectedProduct]
  );

  // enquiry link
  const enquiryLink = useMemo(() => {
    const msg =
      `Hi ${BUSINESS.name}!%0A%0AI'd like to book a Fruit Bowl order:%0A%0A` +
      `Name: ${name}%0APhone: ${phone}%0AEmail: ${email}%0A` +
      `Variant: ${selectedProduct?.name || ""}%0AQuantity: ${qty}%0A` +
      `Preferred delivery: ${date} at ${time}%0A` +
      `City: ${city}%0APincode: ${pincode}%0A` +
      `Address: ${address || "pickup"}%0A` +
      (notes ? `Notes: ${notes}%0A` : "") +
      `%0A(Website enquiry)`;
    return `https://wa.me/${BUSINESS.whatsappOwner}?text=${msg}`;
  }, [name, phone, email, selectedProduct, qty, date, time, city, pincode, address, notes]);

  // validation
  function validate() {
    const e = {};
    if (!name.trim()) e.name = "Name is required";
    if (!isTenDigitPhone(phone))
      e.phone = "Enter a valid 10-digit Indian mobile number";
    if (!isEmail(email)) e.email = "Enter a valid email address";
    if (!date) e.date = "Choose a delivery date";
    if (!time) e.time = "Choose a delivery time";
    if (!qty || qty < 1) e.qty = "Quantity must be at least 1";
    if (!city.trim()) e.city = "City is required";
    if (city.trim().toLowerCase() !== BUSINESS.serviceCity.toLowerCase()) {
      e.city = `We currently serve ${BUSINESS.serviceCity} only`;
    }
    const pin = onlyDigits(pincode);
    if (pin.length !== 6) e.pincode = "Enter a 6-digit pincode";
    if (
      BUSINESS.allowedPincodes.length > 0 &&
      !BUSINESS.allowedPincodes.includes(pin)
    ) {
      e.pincode = `Pincode not in service area for ${BUSINESS.serviceCity}`;
    }
    if (address && address.trim().length < 6)
      e.address = "Add more address details";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // payment
  async function handlePayOnline() {
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      setIsSubmitting(true);
      await loadRzp();
      const key = await getPublicKey();

      const amountPaise = Math.round(Number(total) * 100);
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountPaise,
          currency: "INR",
          receipt: `HH_${Date.now()}`,
          notes: {
            name,
            phone,
            email,
            city,
            pincode,
            address,
            variant: selectedProduct.name,
            qty,
            date,
            time,
            notes,
          },
        }),
      });

      const order = await orderRes.json();
      if (!orderRes.ok || !order?.id) {
        const reason = order?.error?.description || "Could not create order";
        alert("Payment init failed. " + reason);
        setIsSubmitting(false);
        return;
      }

      const rzp = new window.Razorpay({
        key,
        amount: order.amount,
        currency: order.currency,
        name: BUSINESS.name,
        description: `${selectedProduct.name} x ${qty}`,
        order_id: order.id,
        prefill: { name, email, contact: phone },
        notes: {
          city,
          pincode,
          address,
          variant: selectedProduct.name,
          qty,
          date,
          time,
          notes,
        },
        theme: { color: "#059669" },
        handler: (response) => {
          setReceipt({
            orderId: order.id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            amount: amountPaise / 100,
            name,
            phone,
            email,
            city,
            pincode,
            address,
            variant: selectedProduct.name,
            qty,
            date,
            time,
            notes,
          });
          setIsSubmitting(false);
        },
        modal: { ondismiss: () => setIsSubmitting(false) },
      });

      rzp.open();
    } catch (err) {
      console.error(err);
      alert("Could not start payment. Please try WhatsApp booking.");
      setIsSubmitting(false);
    }
  }

  // confirmation links
  const customerConfirmLink = useMemo(() => {
    if (!receipt) return "#";
    const text =
      `Hi ${receipt.name}, your payment was successful!%0A%0A` +
      `Order: ${receipt.orderId}%0A` +
      `Payment: ${receipt.paymentId}%0A` +
      `Item: ${receipt.variant} x ${receipt.qty}%0A` +
      `Delivery: ${receipt.date} at ${receipt.time}%0A` +
      `Address: ${receipt.address || "pickup"}%0A` +
      `Total: ₹${receipt.amount}%0A%0A` +
      `Thank you for choosing ${BUSINESS.name} 🍉`;
    return buildWaLink(receipt.phone, text);
  }, [receipt]);

  const ownerAlertLink = useMemo(() => {
    if (!receipt) return "#";
    const text =
      `New PAID order ✅%0A%0A` +
      `Order: ${receipt.orderId}%0A` +
      `Payment: ${receipt.paymentId}%0A` +
      `Customer: ${receipt.name} (${receipt.phone})%0A` +
      `Email: ${receipt.email}%0A` +
      `City: ${receipt.city}  Pin: ${receipt.pincode}%0A` +
      `Item: ${receipt.variant} x ${receipt.qty}%0A` +
      `Delivery: ${receipt.date} at ${receipt.time}%0A` +
      `Address: ${receipt.address || "pickup"}%0A` +
      `Notes: ${receipt.notes || "-"}%0A` +
      `Total: ₹${receipt.amount}`;
    return `https://wa.me/${BUSINESS.whatsappOwner}?text=${text}`;
  }, [receipt]);

  const Error = ({ id }) =>
    errors[id] ? (
      <p className="text-xs text-red-600 mt-1">{errors[id]}</p>
    ) : null;

  /* ========= RENDER ========= */
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-orange-50 text-slate-800">
      {/* Header */}
      <header className="backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/50 sticky top-0 z-50 border-b border-emerald-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={IMG_URL.logo}
              alt={BUSINESS.name}
              className="h-10 w-10 rounded-full shadow"
            />
            <div className="leading-tight">
              <p className="font-semibold text-emerald-700 text-lg">
                {BUSINESS.name}
              </p>
              <p className="text-xs text-emerald-600">One Box • Many Benefits</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#menu" className="hover:text-emerald-700">
              Menu
            </a>
            <a href="#why-us" className="hover:text-emerald-700">
              Why us
            </a>
            <a href="#pricing" className="hover:text-emerald-700">
              Pricing
            </a>
            <a href="#food-safety" className="hover:text-emerald-700">
              Food safety
            </a>
            <a href="#corporate" className="hover:text-emerald-700">
              Corporate orders
            </a>
            <a href="#faq" className="hover:text-emerald-700">
              FAQ
            </a>
          </nav>
          <div className="flex gap-2">
            <a
              href="#book"
              className="hidden md:inline-block px-4 py-2 rounded-2xl shadow bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Book now
            </a>
            <a
              href={`https://wa.me/${BUSINESS.whatsappOwner}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-2xl border border-emerald-600 text-emerald-700 hover:bg-emerald-50"
            >
              WhatsApp
            </a>
          </div>
        </div>
        {/* City + FSSAI badge bar */}
        <div className="bg-emerald-700/95 text-white">
          <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-4">
            <span className="text-xs sm:text-sm">
              Now serving <b>{BUSINESS.serviceCity}</b>. FSSAI Lic No:{" "}
              <b>{FSSAI.number}</b>
            </span>
            <div className="ml-auto hidden md:block w-[360px]">
              <FssaiBadge />
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        className="max-w-6xl mx-auto px-4 pt-10 pb-8 grid md:grid-cols-2 gap-8 items-center"
        id="home"
      >
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-emerald-800">
            Fresh Fruit Bowls, delivered with love
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Monthly Fruit Box • Daily bowls • Party platters. Zero added sugar,
            hygienic prep, and same-day delivery. Start your{" "}
            <span className="font-semibold">{BUSINESS.name}</span> today.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#book"
              className="px-5 py-3 rounded-2xl bg-emerald-600 text-white shadow hover:bg-emerald-700"
            >
              Book your bowl
            </a>
            <a
              href="#menu"
              className="px-5 py-3 rounded-2xl border border-emerald-600 text-emerald-700 hover:bg-emerald-50"
            >
              View menu
            </a>
          </div>
          <div className="mt-6 max-w-md">
            <FssaiBadge />
          </div>
          <div className="mt-6 flex items-center gap-4 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2">🍊 Seasonal</span>
            <span className="inline-flex items-center gap-2">
              🥗 Clean & hygienic
            </span>
            <span className="inline-flex items-center gap-2">
              🚚 Same-day delivery
            </span>
          </div>
        </div>
        <div className="relative">
          <img
            src={IMG_URL.hero}
            alt="Monthly Fruit Box"
            className="w-full rounded-3xl shadow-xl"
          />
        </div>
      </section>

      {/* Our Bowls / Menu */}
      <section id="menu" className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl font-bold text-emerald-800">Our Bowls</h2>
          <a
            href="#book"
            className="px-4 py-2 rounded-2xl bg-emerald-600 text-white shadow hover:bg-emerald-700"
          >
            Quick order
          </a>
        </div>
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PRODUCTS.map((p) => (
            <article
              key={p.sku}
              className="rounded-3xl bg-white shadow hover:shadow-lg transition p-4 flex flex-col"
            >
              <img
                src={p.image}
                alt={p.name}
                className="rounded-2xl h-52 w-full object-cover"
              />
              <div className="mt-3 flex gap-2 flex-wrap">
                {p.badges.map((b) => (
                  <span
                    key={b}
                    className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-full"
                  >
                    {b}
                  </span>
                ))}
              </div>
              <h3 className="mt-3 text-xl font-semibold text-emerald-800">
                {p.name}
              </h3>
              <p className="text-sm text-slate-600 flex-1">{p.desc}</p>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-lg font-bold">₹{p.price}</p>
                <a
                  href="#book"
                  className="px-4 py-2 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Book
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Why Us */}
      <section
        id="why-us"
        className="bg-white/60 border-y border-emerald-100"
      >
        <div className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-3 gap-8">
          {[
            {
              t: "Squeaky clean",
              d: "RO-washed fruits, food-grade gloves & sanitized prep surfaces.",
            },
            {
              t: "Always fresh",
              d: "We cut close to delivery time so your bowl stays crisp & juicy.",
            },
            {
              t: "Flexible plans",
              d: "Book once, schedule daily, or choose a monthly subscription box.",
            },
          ].map((f) => (
            <div key={f.t} className="rounded-3xl bg-white p-6 shadow">
              <p className="text-2xl">🥝</p>
              <h3 className="mt-2 text-xl font-semibold text-emerald-800">
                {f.t}
              </h3>
              <p className="text-slate-600 text-sm">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-emerald-800">Simple pricing</h2>
        <p className="text-slate-600 mt-1">
          Bulk / office / party orders available on request.
        </p>
        <div className="mt-6 grid md:grid-cols-3 gap-6">
          {[...PRODUCTS].map((p, i) => (
            <div
              key={p.sku}
              className={`rounded-3xl p-6 shadow bg-white ${
                i === 1 ? "ring-2 ring-emerald-500" : ""
              }`}
            >
              <h3 className="text-xl font-semibold text-emerald-800">
                {p.name}
              </h3>
              <p className="text-sm text-slate-600">{p.desc}</p>
              <p className="mt-4 text-3xl font-extrabold">
                ₹{p.price}
                <span className="text-sm font-medium text-slate-500">
                  {" "}
                  / bowl
                </span>
              </p>
              <ul className="mt-4 text-sm text-slate-700 space-y-2 list-disc list-inside">
                <li>Zero added sugar</li>
                <li>Food-grade packaging</li>
                <li>Same-day delivery window</li>
              </ul>
              <a
                href="#book"
                className="mt-5 inline-block w-full text-center px-4 py-3 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Book {p.name}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Food safety + FSSAI section */}
      <section
        id="food-safety"
        className="bg-emerald-50/70 border-y border-emerald-100"
      >
        <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-8 items-center">
          <div>
            <h2 className="text-3xl font-bold text-emerald-800">
              Food safety first, always
            </h2>
            <p className="mt-2 text-sm md:text-base text-slate-700">
              {BUSINESS.name} is licensed with the{" "}
              <strong>Food Safety and Standards Authority of India (FSSAI)</strong>.
              We follow strict guidelines on hygiene, sourcing, storage and
              preparation for every single fruit box.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700 list-disc list-inside">
              <li>RO-washed fruits & sanitized prep surfaces</li>
              <li>Food-grade gloves, knives and sealed containers</li>
              <li>Separate chopping boards for fruits only</li>
              <li>Cold-chain maintained till dispatch for freshness</li>
            </ul>
            <p className="mt-3 text-xs font-semibold text-emerald-800">
              FSSAI Licence No: {FSSAI.number}
            </p>
          </div>
          <div className="flex justify-center">
            <img
              src={IMG_URL.fssaiPoster}
              alt="Healthy Habit FSSAI Licence"
              className="max-h-72 rounded-3xl shadow-lg object-contain bg-white"
            />
          </div>
        </div>
      </section>

      {/* Camera roll / Instagram-style gallery */}
      <section className="bg-white border-b border-emerald-100">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <h2 className="text-2xl font-bold text-emerald-800">
              From our camera roll <span>📸</span>
            </h2>
            <p className="text-xs sm:text-sm text-emerald-700">
              Tag us on Instagram with{" "}
              <span className="font-semibold">#HealthyHabitBowls</span>
            </p>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[IMG_URL.cam1, IMG_URL.cam2, IMG_URL.cam3, IMG_URL.cam4].map(
              (src, i) => (
                <div
                  key={i}
                  className="aspect-[4/5] rounded-3xl bg-emerald-50 overflow-hidden shadow-sm"
                >
                  <img
                    src={src}
                    alt={`Fruit bowl ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Booking */}
      <section
        id="book"
        className="bg-emerald-50/60 border-t border-emerald-100"
      >
        <div className="max-w-3xl mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold text-emerald-800">
            Book your fruit bowl
          </h2>
          <p className="text-slate-600 mt-1">
            We’ll confirm on WhatsApp within minutes.
          </p>

          <div className="mt-6 rounded-3xl bg-white shadow p-6 grid md:grid-cols-2 gap-5">
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium">Your name *</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full border rounded-xl px-3 py-2"
                  placeholder="e.g., Priya"
                />
                <Error id="name" />
              </label>

              <label className="block">
                <span className="text-sm font-medium">Phone (10-digit) *</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(onlyDigits(e.target.value))}
                  className="mt-1 w-full border rounded-xl px-3 py-2"
                  placeholder="98XXXXXXXX"
                  maxLength={10}
                />
                <Error id="phone" />
              </label>

              <label className="block">
                <span className="text-sm font-medium">Email *</span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full border rounded-xl px-3 py-2"
                  placeholder="you@example.com"
                />
                <Error id="email" />
              </label>

              <label className="block">
                <span className="text-sm font-medium">Choose a bowl *</span>
                <select
                  value={variant}
                  onChange={(e) => setVariant(e.target.value)}
                  className="mt-1 w-full border rounded-xl px-3 py-2"
                >
                  {PRODUCTS.map((p) => (
                    <option value={p.sku} key={p.sku}>
                      {p.name} — ₹{p.price}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium">Quantity *</span>
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) =>
                    setQty(Math.max(1, Number(e.target.value) || 1))
                  }
                  className="mt-1 w-full border rounded-xl px-3 py-2"
                />
                <Error id="qty" />
              </label>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm font-medium">City *</span>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-1 w-full border rounded-xl px-3 py-2"
                    placeholder={BUSINESS.serviceCity}
                  />
                  <Error id="city" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Pincode *</span>
                  <input
                    value={pincode}
                    onChange={(e) => setPincode(onlyDigits(e.target.value))}
                    className="mt-1 w-full border rounded-xl px-3 py-2"
                    placeholder="6-digit"
                    maxLength={6}
                  />
                  <Error id="pincode" />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-medium">Delivery date *</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 w-full border rounded-xl px-3 py-2"
                />
                <Error id="date" />
              </label>

              <label className="block">
                <span className="text-sm font-medium">Preferred time *</span>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="mt-1 w-full border rounded-xl px-3 py-2"
                />
                <Error id="time" />
              </label>

              <label className="block">
                <span className="text-sm font-medium">
                  Delivery address (or write “pickup”)
                </span>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="mt-1 w-full border rounded-xl px-3 py-2"
                  placeholder="Flat / Street / Landmark"
                />
                <Error id="address" />
              </label>

              <label className="block">
                <span className="text-sm font-medium">Notes</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="mt-1 w-full border rounded-xl px-3 py-2"
                  placeholder="Allergies, no pineapple, extra pomegranate, etc."
                />
              </label>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-emerald-800">Total</p>
                  <p className="text-xl font-bold">₹{total}</p>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Payments are processed securely. FSSAI Licence No:{" "}
                  {FSSAI.number}
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <a
                  href={enquiryLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-center px-4 py-3 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  WhatsApp
                </a>
                <a
                  href={`mailto:${"orders@healthyhabit.example"}?subject=${encodeURIComponent(
                    "Fruit Bowl Booking"
                  )}&body=${encodeURIComponent(
                    `Name: ${name}\nPhone: ${phone}\nEmail: ${email}\nVariant: ${
                      selectedProduct?.name || ""
                    }\nQty: ${qty}\nDate: ${date} ${time}\nCity: ${city}\nPincode: ${pincode}\nAddress: ${address}\nNotes: ${notes}\nTotal: ₹${total}`
                  )}`}
                  className="text-center px-4 py-3 rounded-2xl border border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                >
                  Email
                </a>
                <button
                  onClick={handlePayOnline}
                  disabled={isSubmitting}
                  className={`px-4 py-3 rounded-2xl text-white ${
                    isSubmitting ? "bg-gray-400" : "bg-black hover:opacity-95"
                  }`}
                >
                  {isSubmitting ? "Processing..." : "Pay Online"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Corporate orders */}
      <section
        id="corporate"
        className="bg-white border-t border-emerald-100"
      >
        <div className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-8 items-start">
          <div>
            <h2 className="text-3xl font-bold text-emerald-800">
              Corporate orders for offices
            </h2>
            <p className="mt-2 text-slate-700 text-sm md:text-base">
              Fuel your team with fresh fruit bowls delivered directly to your
              workplace. Perfect for stand-ups, town halls, wellness days and
              client meetings.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700 list-disc list-inside">
              <li>Customised plans for 20–500 employees</li>
              <li>Daily, weekly or monthly delivery slots</li>
              <li>Invoice & GST billing available</li>
              <li>Dedicated account manager for your office</li>
            </ul>
          </div>
          <div className="rounded-3xl bg-emerald-50/70 border border-emerald-100 p-5 space-y-4">
            <p className="text-sm text-slate-700">
              Share a few details and we’ll respond with a quote & menu options
              for your office within 1 working day.
            </p>
            <p className="text-xs text-slate-600">
              Email us at{" "}
              <a
                href="mailto:orders@healthyhabit.example?subject=Corporate%20fruit%20box%20enquiry"
                className="text-emerald-700 font-semibold"
              >
                orders@healthyhabit.example
              </a>{" "}
              or ping us on WhatsApp.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="mailto:orders@healthyhabit.example?subject=Corporate%20fruit%20box%20enquiry"
                className="px-4 py-2 rounded-2xl bg-emerald-600 text-white text-sm"
              >
                Mail us your requirement
              </a>
              <a
                href={`https://wa.me/${BUSINESS.whatsappOwner}?text=${encodeURIComponent(
                  "Hi, I’d like to enquire about corporate fruit box plans for our office."
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-2xl border border-emerald-600 text-emerald-700 text-sm"
              >
                WhatsApp us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ (simple) */}
      <section
        id="faq"
        className="bg-white/60 border-y border-emerald-100"
      >
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold text-emerald-800">
            Frequently asked questions
          </h2>
          <div className="mt-6 grid md:grid-cols-2 gap-6">
            {[
              {
                q: "Do you add sugar or preservatives?",
                a: "Never. Only fresh fruit. We may include lemon or mint on request.",
              },
              {
                q: "How do subscriptions work?",
                a: "Choose your bowl and delivery window. We prep fresh daily and you can pause anytime via WhatsApp.",
              },
              {
                q: "What areas do you deliver to?",
                a: "We currently serve core Hyderabad city limits. For bulk/office orders, we can extend coverage.",
              },
              {
                q: "Can I customize my bowl?",
                a: "Yes! Mention allergies or dislikes in notes. We’ll confirm substitutions when possible.",
              },
            ].map((f) => (
              <details
                key={f.q}
                className="rounded-2xl bg-white shadow p-5"
              >
                <summary className="font-semibold cursor-pointer text-emerald-800">
                  {f.q}
                </summary>
                <p className="text-sm text-slate-600 mt-2">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Confirmation Modal */}
      {receipt && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-emerald-800">
              Payment successful 🎉
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Here are your order details:
            </p>
            <div className="mt-4 text-sm text-slate-700 space-y-1">
              <p>
                <b>Order:</b> {receipt.orderId}
              </p>
              <p>
                <b>Payment:</b> {receipt.paymentId}
              </p>
              <p>
                <b>Customer:</b> {receipt.name} · {receipt.phone} ·{" "}
                {receipt.email}
              </p>
              <p>
                <b>Item:</b> {receipt.variant} × {receipt.qty} ·{" "}
                <b>Total:</b> ₹{receipt.amount}
              </p>
              <p>
                <b>Delivery:</b> {receipt.date} at {receipt.time}
              </p>
              <p>
                <b>Address:</b> {receipt.address || "pickup"}
              </p>
            </div>

            <div className="mt-5 grid sm:grid-cols-2 gap-3">
              <a
                href={customerConfirmLink}
                target="_blank"
                rel="noreferrer"
                className="text-center px-4 py-3 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
              >
                WhatsApp confirmation to customer
              </a>
              <a
                href={ownerAlertLink}
                target="_blank"
                rel="noreferrer"
                className="text-center px-4 py-3 rounded-2xl border border-emerald-600 text-emerald-700 hover:bg-emerald-50"
              >
                Notify {BUSINESS.name}
              </a>
            </div>

            <div className="mt-4 text-right">
              <button
                onClick={() => setReceipt(null)}
                className="px-4 py-2 text-sm rounded-xl border hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src={IMG_URL.logo}
              alt={BUSINESS.name}
              className="h-10 w-10 rounded-full shadow"
            />
            <div>
              <p className="font-semibold text-emerald-700">
                {BUSINESS.name}
              </p>
              <p className="text-xs text-slate-500">
                Fresh • Healthy • Convenient
              </p>
            </div>
          </div>
          <div className="text-sm text-slate-600">
            <p>
              Order / WhatsApp:{" "}
              <a
                className="text-emerald-700 font-semibold"
                href={`https://wa.me/${BUSINESS.whatsappOwner}`}
                target="_blank"
                rel="noreferrer"
              >
                {BUSINESS.whatsappOwner}
              </a>
            </p>
            <p className="mt-1">Email: yadhi1234@gmail.com</p>
            <p className="mt-1">
              Serving: {BUSINESS.serviceCity}
              {BUSINESS.allowedPincodes.length
                ? ` (${BUSINESS.allowedPincodes.join(", ")})`
                : ""}
            </p>
          </div>
        </div>

        <div className="mt-6 max-w-md">
          <FssaiBadge />
        </div>

        <p className="text-xs text-slate-500 mt-6">
          © {new Date().getFullYear()} {BUSINESS.name}. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
