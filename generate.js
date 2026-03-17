const fs = require('fs');
const path = require('path');

// ── CONFIG ────────────────────────────────────────────────
const DOMAIN = 'dlcrhv.com';
const TWILIO_NUMBER = '+15714448780';
const JARVIS_SMS_ENDPOINT = 'https://dlcr.replit.app/api/sms/send'; // your server

const CITIES = [
  { name: 'Warrenton',  state: 'Virginia', county: 'Fauquier', zip: '20186', lat: 38.7212, lng: -77.7969 },
  { name: 'Haymarket',  state: 'Virginia', county: 'Prince William', zip: '20169', lat: 38.8118, lng: -77.6369 },
  { name: 'Gainesville',state: 'Virginia', county: 'Prince William', zip: '20155', lat: 38.7937, lng: -77.6163 },
  { name: 'Manassas',   state: 'Virginia', county: 'Prince William', zip: '20110', lat: 38.7509, lng: -77.4753 },
  { name: 'Bristow',    state: 'Virginia', county: 'Prince William', zip: '20136', lat: 38.7218, lng: -77.5508 },
  { name: 'Catlett',    state: 'Virginia', county: 'Fauquier',       zip: '20119', lat: 38.6323, lng: -77.6461 },
  { name: 'Bull Run',   state: 'Virginia', county: 'Prince William', zip: '20136', lat: 38.7540, lng: -77.5219 },
];

const PAGES = [
  {
    type: 'sell',
    slug: 'sell-my-home',
    slugEs: 'vender-mi-casa',
    titleEn: city => `Sell My Home in ${city.name}, ${city.state} | Fast Cash Offers`,
    titleEs: city => `Vender Mi Casa en ${city.name}, ${city.state} | Ofertas Rápidas`,
    h1En: city => `Sell Your Home in ${city.name}, VA`,
    h1Es: city => `Vende Tu Casa en ${city.name}, VA`,
    descEn: city => `Get a free cash offer for your home in ${city.name}, Virginia. No repairs, no fees, close in 7 days. DLCR Real Estate & Loans — serving ${city.county} County.`,
    descEs: city => `Recibe una oferta en efectivo por tu casa en ${city.name}, Virginia. Sin reparaciones, sin comisiones, cierre en 7 días. DLCR Real Estate & Loans — sirviendo el Condado de ${city.county}.`,
  },
  {
    type: 'homevalue',
    slug: 'home-value',
    slugEs: 'valor-de-mi-casa',
    titleEn: city => `What Is My Home Worth in ${city.name}, VA? | Free Home Value`,
    titleEs: city => `¿Cuánto Vale Mi Casa en ${city.name}, VA? | Valor Gratis`,
    h1En: city => `Free Home Value in ${city.name}, VA`,
    h1Es: city => `Valor Gratuito de Tu Casa en ${city.name}, VA`,
    descEn: city => `Find out your home's value in ${city.name}, Virginia instantly. Get a free market analysis from DLCR Real Estate & Loans — trusted in ${city.county} County.`,
    descEs: city => `Descubre el valor de tu propiedad en ${city.name}, Virginia al instante. Análisis de mercado gratuito de DLCR Real Estate & Loans — de confianza en el Condado de ${city.county}.`,
  }
];

// ── TEMPLATE ──────────────────────────────────────────────
function buildPage({ city, page, lang }) {
  const isEs = lang === 'es';
  const title    = isEs ? page.titleEs(city)  : page.titleEn(city);
  const h1       = isEs ? page.h1Es(city)     : page.h1En(city);
  const desc     = isEs ? page.descEs(city)   : page.descEn(city);
  const altLang  = isEs ? 'en' : 'es';
  const altSlug  = isEs ? page.slug           : page.slugEs;
  const citySlug = city.name.toLowerCase().replace(/\s+/g, '-');
  const canonicalUrl = isEs
    ? `https://${DOMAIN}/es/${page.slugEs}-en-${citySlug}/`
    : `https://${DOMAIN}/${page.slug}-in-${citySlug}/`;
  const altUrl = isEs
    ? `https://${DOMAIN}/${page.slug}-in-${citySlug}/`
    : `https://${DOMAIN}/es/${page.slugEs}-en-${citySlug}/`;

  const isSell = page.type === 'sell';

  const content = isEs ? buildContentEs(city, isSell) : buildContentEn(city, isSell);
  const form    = isEs ? buildFormEs(city, page) : buildFormEn(city, page);

  return `<!DOCTYPE html>
<html lang="${lang}" prefix="og: http://ogp.me/ns#">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="alternate" hreflang="${altLang}" href="${altUrl}">
  <link rel="alternate" hreflang="${lang}" href="${canonicalUrl}">
  <link rel="alternate" hreflang="x-default" href="https://${DOMAIN}/${page.slug}-in-${citySlug}/">

  <!-- Open Graph -->
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:type" content="website">
  <meta property="og:image" content="https://${DOMAIN}/img/og-${citySlug}.jpg">
  <meta property="og:locale" content="${isEs ? 'es_US' : 'en_US'}">

  <!-- Schema.org -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": "DLCR Real Estate & Loans",
    "url": "https://${DOMAIN}",
    "telephone": "${TWILIO_NUMBER}",
    "areaServed": {
      "@type": "City",
      "name": "${city.name}",
      "addressRegion": "${city.state}",
      "postalCode": "${city.zip}"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": ${city.lat},
      "longitude": ${city.lng}
    },
    "sameAs": ["https://dlcr.replit.app"]
  }
  </script>

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">

  <style>
    :root {
      --navy:   #0a1628;
      --gold:   #c8922a;
      --gold2:  #e8b84b;
      --cream:  #faf6ef;
      --white:  #ffffff;
      --gray:   #6b7280;
      --light:  #f3ede3;
      --red:    #c0392b;
      --shadow: 0 4px 32px rgba(10,22,40,0.13);
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'DM Sans', sans-serif;
      background: var(--cream);
      color: var(--navy);
      line-height: 1.6;
    }

    /* ── NAV ── */
    nav {
      background: var(--navy);
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky; top: 0; z-index: 100;
      box-shadow: 0 2px 20px rgba(0,0,0,0.3);
    }
    .logo {
      font-family: 'Playfair Display', serif;
      color: var(--gold);
      font-size: 1.5rem;
      font-weight: 900;
      letter-spacing: -0.5px;
      text-decoration: none;
    }
    .logo span { color: var(--white); font-weight: 300; }
    nav a.lang-switch {
      color: var(--gold2);
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      border: 1px solid var(--gold);
      padding: 6px 14px;
      border-radius: 4px;
      transition: all 0.2s;
    }
    nav a.lang-switch:hover { background: var(--gold); color: var(--navy); }

    /* ── HERO ── */
    .hero {
      background: linear-gradient(135deg, var(--navy) 0%, #1a2e50 60%, #0d1f3c 100%);
      padding: 72px 24px 80px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .hero::before {
      content: '';
      position: absolute; inset: 0;
      background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8922a' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    }
    .hero-badge {
      display: inline-block;
      background: var(--gold);
      color: var(--navy);
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      padding: 5px 16px;
      border-radius: 2px;
      margin-bottom: 20px;
    }
    .hero h1 {
      font-family: 'Playfair Display', serif;
      font-size: clamp(2rem, 5vw, 3.2rem);
      color: var(--white);
      line-height: 1.15;
      max-width: 700px;
      margin: 0 auto 20px;
    }
    .hero h1 em {
      color: var(--gold2);
      font-style: normal;
    }
    .hero p.sub {
      color: #a8b8cc;
      font-size: 1.05rem;
      max-width: 520px;
      margin: 0 auto 36px;
      font-weight: 300;
    }
    .hero-cta {
      display: inline-block;
      background: var(--gold);
      color: var(--navy);
      padding: 16px 40px;
      font-weight: 700;
      font-size: 1rem;
      border-radius: 4px;
      text-decoration: none;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 20px rgba(200,146,42,0.4);
    }
    .hero-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(200,146,42,0.5); }

    /* ── TRUST BAR ── */
    .trust-bar {
      background: var(--white);
      border-bottom: 1px solid #e8dece;
      padding: 18px 24px;
      display: flex;
      justify-content: center;
      gap: 48px;
      flex-wrap: wrap;
    }
    .trust-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.88rem;
      font-weight: 500;
      color: var(--navy);
    }
    .trust-icon { font-size: 1.2rem; }

    /* ── MAIN LAYOUT ── */
    .main { max-width: 1100px; margin: 0 auto; padding: 64px 24px; display: grid; grid-template-columns: 1fr 420px; gap: 64px; align-items: start; }
    @media(max-width: 860px){ .main { grid-template-columns: 1fr; } }

    /* ── CONTENT ── */
    .content h2 {
      font-family: 'Playfair Display', serif;
      font-size: 1.8rem;
      color: var(--navy);
      margin-bottom: 16px;
      line-height: 1.2;
    }
    .content h3 {
      font-size: 1rem;
      font-weight: 600;
      color: var(--gold);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 32px 0 12px;
    }
    .content p {
      color: #3a4a5c;
      font-size: 0.97rem;
      margin-bottom: 16px;
    }
    .steps {
      list-style: none;
      margin: 20px 0;
    }
    .steps li {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
      align-items: flex-start;
    }
    .step-num {
      background: var(--gold);
      color: var(--navy);
      width: 32px; height: 32px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.85rem;
      flex-shrink: 0;
    }
    .step-text strong { display: block; font-size: 0.95rem; margin-bottom: 2px; }
    .step-text span { color: var(--gray); font-size: 0.88rem; }

    /* ── FORM ── */
    .form-card {
      background: var(--white);
      border-radius: 8px;
      box-shadow: var(--shadow);
      padding: 36px 32px;
      position: sticky; top: 80px;
      border-top: 4px solid var(--gold);
    }
    .form-card h3 {
      font-family: 'Playfair Display', serif;
      font-size: 1.4rem;
      color: var(--navy);
      margin-bottom: 6px;
    }
    .form-card .sub { font-size: 0.85rem; color: var(--gray); margin-bottom: 24px; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; font-size: 0.8rem; font-weight: 600; color: var(--navy); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
    .form-group input, .form-group select {
      width: 100%;
      padding: 12px 14px;
      border: 1.5px solid #d4c9b8;
      border-radius: 4px;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.95rem;
      color: var(--navy);
      background: var(--cream);
      transition: border-color 0.2s;
      outline: none;
    }
    .form-group input:focus, .form-group select:focus { border-color: var(--gold); }
    .btn-submit {
      width: 100%;
      background: var(--gold);
      color: var(--navy);
      border: none;
      padding: 15px;
      font-family: 'DM Sans', sans-serif;
      font-size: 1rem;
      font-weight: 700;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
      margin-top: 8px;
    }
    .btn-submit:hover { background: var(--gold2); transform: translateY(-1px); }
    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    .form-note { font-size: 0.75rem; color: var(--gray); text-align: center; margin-top: 10px; }
    .success-msg {
      display: none;
      background: #d4edda;
      color: #155724;
      border-radius: 6px;
      padding: 16px;
      text-align: center;
      font-weight: 500;
      margin-top: 12px;
    }
    .error-msg {
      display: none;
      background: #f8d7da;
      color: var(--red);
      border-radius: 6px;
      padding: 12px;
      font-size: 0.85rem;
      margin-top: 8px;
    }

    /* ── FAQ ── */
    .faq { max-width: 780px; margin: 0 auto; padding: 0 24px 72px; }
    .faq h2 { font-family: 'Playfair Display', serif; font-size: 1.7rem; margin-bottom: 28px; color: var(--navy); }
    .faq-item { border-bottom: 1px solid #e0d4c4; padding: 20px 0; cursor: pointer; }
    .faq-q { font-weight: 600; display: flex; justify-content: space-between; align-items: center; color: var(--navy); }
    .faq-q span { color: var(--gold); font-size: 1.2rem; transition: transform 0.3s; }
    .faq-a { font-size: 0.92rem; color: #4a5568; margin-top: 12px; display: none; line-height: 1.7; }
    .faq-item.open .faq-a { display: block; }
    .faq-item.open .faq-q span { transform: rotate(45deg); }

    /* ── FOOTER ── */
    footer {
      background: var(--navy);
      color: #8090a4;
      text-align: center;
      padding: 32px 24px;
      font-size: 0.82rem;
    }
    footer a { color: var(--gold2); text-decoration: none; }
    footer .phone { font-size: 1.1rem; color: var(--gold); font-weight: 600; letter-spacing: 1px; margin-bottom: 8px; }

    /* ── ANIMATIONS ── */
    @keyframes fadeUp { from { opacity:0; transform: translateY(24px); } to { opacity:1; transform: none; } }
    .hero h1, .hero p.sub, .hero-cta { animation: fadeUp 0.7s ease both; }
    .hero p.sub { animation-delay: 0.15s; }
    .hero-cta { animation-delay: 0.3s; }
  </style>
</head>
<body>

<!-- NAV -->
<nav>
  <a href="https://${DOMAIN}" class="logo">DLCR<span>hv</span></a>
  <a href="${altUrl}" class="lang-switch">${isEs ? '🇺🇸 English' : '🇲🇽 Español'}</a>
</nav>

<!-- HERO -->
<section class="hero">
  <div class="hero-badge">${city.name}, ${city.state} · ${city.county} County</div>
  <h1>${h1.replace(city.name, `<em>${city.name}</em>`)}</h1>
  <p class="sub">${desc}</p>
  <a href="#form" class="hero-cta">${isEs ? '🏡 Obtener Mi Oferta Gratis' : '🏡 Get My Free Offer'}</a>
</section>

<!-- TRUST BAR -->
<div class="trust-bar">
  <div class="trust-item"><span class="trust-icon">⚡</span>${isEs ? 'Respuesta en 24h' : '24h Response'}</div>
  <div class="trust-item"><span class="trust-icon">💰</span>${isEs ? 'Sin Comisiones' : 'No Commissions'}</div>
  <div class="trust-item"><span class="trust-icon">🏠</span>${isEs ? 'Sin Reparaciones' : 'As-Is Sales'}</div>
  <div class="trust-item"><span class="trust-icon">📍</span>${isEs ? 'Locales en Virginia' : 'Local VA Experts'}</div>
</div>

<!-- MAIN -->
<div class="main">
  ${content}
  <div id="form">
    ${form}
  </div>
</div>

<!-- FAQ -->
<section class="faq">
  ${buildFAQ(city, isSell, isEs)}
</section>

<!-- FOOTER -->
<footer>
  <div class="phone"><a href="tel:${TWILIO_NUMBER}">${TWILIO_NUMBER}</a></div>
  <p>DLCR Real Estate & Loans · ${city.name}, ${city.state} · <a href="https://${DOMAIN}">dlcrhv.com</a></p>
  <p style="margin-top:8px;">© ${new Date().getFullYear()} DLCR. ${isEs ? 'Todos los derechos reservados.' : 'All rights reserved.'}</p>
</footer>

<script>
  // FAQ accordion
  document.querySelectorAll('.faq-item').forEach(item => {
    item.querySelector('.faq-q').addEventListener('click', () => {
      item.classList.toggle('open');
    });
  });

  // Smooth scroll to form
  document.querySelectorAll('a[href="#form"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      document.getElementById('form').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Form submit → Jarvis via SMS
  document.getElementById('dlcr-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn   = this.querySelector('.btn-submit');
    const succ  = document.getElementById('success-msg');
    const err   = document.getElementById('error-msg');
    btn.disabled = true;
    btn.textContent = '${isEs ? 'Enviando...' : 'Sending...'}';

    const data = Object.fromEntries(new FormData(this));
    const smsBody = [
      '🏡 NEW LEAD — ${page.type.toUpperCase()} — ${city.name}, VA',
      'Name: ' + data.name,
      'Phone: ' + data.phone,
      'Email: ' + (data.email || 'N/A'),
      'Address: ' + (data.address || 'N/A'),
      ${isSell ? "'Timeline: ' + (data.timeline || 'N/A')," : "'Est. Value: ' + (data.value || 'N/A'),"}
      'Lang: ${lang.toUpperCase()}',
      'Source: dlcrhv.com/${citySlug}'
    ].join('\\n');

    try {
      const res = await fetch('${JARVIS_SMS_ENDPOINT}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: '${TWILIO_NUMBER}', body: smsBody })
      });

      if (res.ok) {
        succ.style.display = 'block';
        this.style.display = 'none';
      } else {
        throw new Error('Server error');
      }
    } catch(ex) {
      err.style.display = 'block';
      err.textContent = '${isEs ? 'Error al enviar. Llámanos: ' : 'Send error. Call us: '}${TWILIO_NUMBER}';
      btn.disabled = false;
      btn.textContent = '${isEs ? 'Reintentar' : 'Try Again'}';
    }
  });
</script>
</body>
</html>`;
}

// ── CONTENT BLOCKS ────────────────────────────────────────
function buildContentEn(city, isSell) {
  if (isSell) return `
<div class="content">
  <h2>Sell Your Home in ${city.name} — Fast, Simple, Stress-Free</h2>
  <p>Whether you're relocating, facing foreclosure, going through a divorce, or simply ready to move on — DLCR Real Estate & Loans makes selling your ${city.name} home effortless.</p>
  <h3>How It Works</h3>
  <ul class="steps">
    <li><span class="step-num">1</span><div class="step-text"><strong>Submit Your Info</strong><span>Fill out the form and our team gets notified instantly.</span></div></li>
    <li><span class="step-num">2</span><div class="step-text"><strong>Get Your Offer</strong><span>We analyze your property and send a fair cash offer within 24 hours.</span></div></li>
    <li><span class="step-num">3</span><div class="step-text"><strong>Close On Your Timeline</strong><span>Pick your closing date. We handle all the paperwork.</span></div></li>
  </ul>
  <h3>Why ${city.name} Homeowners Choose DLCR</h3>
  <p>We've helped dozens of families in ${city.county} County sell without the hassle of listings, showings, or waiting months for a buyer. Our local knowledge of ${city.name}, ${city.state} means you get a fair, data-backed offer every time.</p>
  <p>Zero agent fees. Zero repairs required. Just a smooth, honest transaction.</p>
</div>`;
  else return `
<div class="content">
  <h2>What Is Your ${city.name} Home Worth in ${new Date().getFullYear()}?</h2>
  <p>The real estate market in ${city.name}, ${city.state} is constantly changing. Get an accurate, free home value report from DLCR — your local ${city.county} County experts.</p>
  <h3>How We Calculate Your Value</h3>
  <ul class="steps">
    <li><span class="step-num">1</span><div class="step-text"><strong>Share Your Address</strong><span>Tell us about your property in ${city.name}.</span></div></li>
    <li><span class="step-num">2</span><div class="step-text"><strong>We Analyze the Market</strong><span>Comparable sales, local trends, and condition adjustments.</span></div></li>
    <li><span class="step-num">3</span><div class="step-text"><strong>Receive Your Report</strong><span>Get a detailed home value report within 24 hours — no obligation.</span></div></li>
  </ul>
  <h3>Why Accurate Valuation Matters in ${city.name}</h3>
  <p>Knowing your home's true value helps you make smarter decisions — whether you're selling, refinancing, or simply tracking your equity in ${city.county} County's competitive market.</p>
  <p>Our DLCR agents have deep roots in ${city.name} and surrounding areas, giving you local insight no automated tool can match.</p>
</div>`;
}

function buildContentEs(city, isSell) {
  if (isSell) return `
<div class="content">
  <h2>Vende Tu Casa en ${city.name} — Rápido, Simple y Sin Estrés</h2>
  <p>Ya sea que te estés mudando, enfrentando una ejecución hipotecaria, pasando por un divorcio, o simplemente listo para seguir adelante — DLCR Real Estate & Loans hace que vender tu casa en ${city.name} sea fácil.</p>
  <h3>Cómo Funciona</h3>
  <ul class="steps">
    <li><span class="step-num">1</span><div class="step-text"><strong>Envía Tu Información</strong><span>Llena el formulario y nuestro equipo es notificado al instante.</span></div></li>
    <li><span class="step-num">2</span><div class="step-text"><strong>Recibe Tu Oferta</strong><span>Analizamos tu propiedad y enviamos una oferta justa en 24 horas.</span></div></li>
    <li><span class="step-num">3</span><div class="step-text"><strong>Cierra Cuando Quieras</strong><span>Elige tu fecha de cierre. Nosotros manejamos todo el papeleo.</span></div></li>
  </ul>
  <h3>Por Qué Los Propietarios de ${city.name} Eligen DLCR</h3>
  <p>Hemos ayudado a docenas de familias en el Condado de ${city.county} a vender sin el estrés de listados, visitas o esperar meses por un comprador. Nuestro conocimiento local de ${city.name}, ${city.state} significa que recibes una oferta justa respaldada por datos.</p>
  <p>Cero comisiones. Sin reparaciones. Solo una transacción fluida y honesta.</p>
</div>`;
  else return `
<div class="content">
  <h2>¿Cuánto Vale Tu Casa en ${city.name} en ${new Date().getFullYear()}?</h2>
  <p>El mercado inmobiliario en ${city.name}, ${city.state} cambia constantemente. Obtén un informe de valor de propiedad gratuito y preciso de DLCR — tus expertos locales en el Condado de ${city.county}.</p>
  <h3>Cómo Calculamos Tu Valor</h3>
  <ul class="steps">
    <li><span class="step-num">1</span><div class="step-text"><strong>Comparte Tu Dirección</strong><span>Cuéntanos sobre tu propiedad en ${city.name}.</span></div></li>
    <li><span class="step-num">2</span><div class="step-text"><strong>Analizamos el Mercado</strong><span>Ventas comparables, tendencias locales y ajustes por condición.</span></div></li>
    <li><span class="step-num">3</span><div class="step-text"><strong>Recibe Tu Informe</strong><span>Obtén un informe detallado del valor de tu casa en 24 horas — sin compromiso.</span></div></li>
  </ul>
  <h3>Por Qué Una Valoración Precisa Importa en ${city.name}</h3>
  <p>Conocer el valor real de tu casa te ayuda a tomar decisiones más inteligentes — ya sea que estés vendiendo, refinanciando, o simplemente siguiendo tu capital en el mercado competitivo del Condado de ${city.county}.</p>
  <p>Nuestros agentes de DLCR tienen raíces profundas en ${city.name} y las áreas circundantes, dándote una perspectiva local que ninguna herramienta automatizada puede igualar.</p>
</div>`;
}

function buildFormEn(city, page) {
  const isSell = page.type === 'sell';
  return `
<div class="form-card">
  <h3>${isSell ? '🏡 Get Your Free Cash Offer' : '📊 Get Your Free Home Value'}</h3>
  <p class="sub">A local DLCR agent in ${city.name} will contact you within 24 hours.</p>
  <form id="dlcr-form">
    <div class="form-group">
      <label>Full Name *</label>
      <input type="text" name="name" placeholder="Your name" required>
    </div>
    <div class="form-group">
      <label>Phone *</label>
      <input type="tel" name="phone" placeholder="+1 (555) 000-0000" required>
    </div>
    <div class="form-group">
      <label>Email</label>
      <input type="email" name="email" placeholder="your@email.com">
    </div>
    <div class="form-group">
      <label>Property Address in ${city.name}</label>
      <input type="text" name="address" placeholder="123 Main St, ${city.name}, VA">
    </div>
    ${isSell
      ? `<div class="form-group">
      <label>When Do You Want to Sell?</label>
      <select name="timeline">
        <option value="">Select...</option>
        <option value="ASAP">As soon as possible</option>
        <option value="1-3mo">1–3 months</option>
        <option value="3-6mo">3–6 months</option>
        <option value="exploring">Just exploring</option>
      </select>
    </div>`
      : `<div class="form-group">
      <label>Estimated Home Value</label>
      <select name="value">
        <option value="">Select range...</option>
        <option>$200k – $350k</option>
        <option>$350k – $500k</option>
        <option>$500k – $750k</option>
        <option>$750k+</option>
      </select>
    </div>`}
    <button type="submit" class="btn-submit">${isSell ? '🚀 Get My Cash Offer' : '📊 Get My Home Value'}</button>
    <p class="form-note">🔒 100% free · No obligation · No spam</p>
  </form>
  <div id="success-msg" class="success-msg">✅ We received your request! A DLCR agent will call you within 24 hours. Check your phone for a confirmation text.</div>
  <div id="error-msg" class="error-msg"></div>
</div>`;
}

function buildFormEs(city, page) {
  const isSell = page.type === 'sell';
  return `
<div class="form-card">
  <h3>${isSell ? '🏡 Recibe Tu Oferta Gratis' : '📊 Conoce el Valor de Tu Casa'}</h3>
  <p class="sub">Un agente DLCR en ${city.name} te contactará en 24 horas.</p>
  <form id="dlcr-form">
    <div class="form-group">
      <label>Nombre Completo *</label>
      <input type="text" name="name" placeholder="Tu nombre" required>
    </div>
    <div class="form-group">
      <label>Teléfono *</label>
      <input type="tel" name="phone" placeholder="+1 (555) 000-0000" required>
    </div>
    <div class="form-group">
      <label>Correo Electrónico</label>
      <input type="email" name="email" placeholder="tu@correo.com">
    </div>
    <div class="form-group">
      <label>Dirección de la Propiedad en ${city.name}</label>
      <input type="text" name="address" placeholder="123 Main St, ${city.name}, VA">
    </div>
    ${isSell
      ? `<div class="form-group">
      <label>¿Cuándo Quieres Vender?</label>
      <select name="timeline">
        <option value="">Selecciona...</option>
        <option value="ASAP">Lo antes posible</option>
        <option value="1-3mo">1–3 meses</option>
        <option value="3-6mo">3–6 meses</option>
        <option value="exploring">Solo explorando</option>
      </select>
    </div>`
      : `<div class="form-group">
      <label>Valor Estimado de Tu Casa</label>
      <select name="value">
        <option value="">Selecciona rango...</option>
        <option>$200k – $350k</option>
        <option>$350k – $500k</option>
        <option>$500k – $750k</option>
        <option>$750k+</option>
      </select>
    </div>`}
    <button type="submit" class="btn-submit">${isSell ? '🚀 Quiero Mi Oferta' : '📊 Conocer Mi Valor'}</button>
    <p class="form-note">🔒 100% gratis · Sin compromiso · Sin spam</p>
  </form>
  <div id="success-msg" class="success-msg">✅ ¡Recibimos tu solicitud! Un agente de DLCR te llamará en 24 horas. Revisa tu teléfono para un texto de confirmación.</div>
  <div id="error-msg" class="error-msg"></div>
</div>`;
}

function buildFAQ(city, isSell, isEs) {
  const faqs = isSell
    ? (isEs ? [
        ['¿Cuánto tiempo tarda el proceso de venta?', `Podemos cerrar en tan solo 7 días en ${city.name}. El plazo típico es de 14–21 días, pero nos adaptamos a tu cronograma.`],
        ['¿Tengo que hacer reparaciones antes de vender?', `No. Compramos casas en ${city.name} en su estado actual. Sin reparaciones, sin limpieza, sin estrés.`],
        ['¿Hay alguna comisión o tarifa?', `Cero comisiones. Cero tarifas de agente. La oferta que recibas es lo que recibirás en el cierre.`],
        ['¿Sirven para todo el Condado de ${city.county}?', `Sí, cubrimos ${city.name} y todas las comunidades circundantes en el Condado de ${city.county}, Virginia.`],
      ] : [
        ['How fast can you close on my home?', `We can close in as little as 7 days in ${city.name}. Typical timelines are 14–21 days, but we work around your schedule.`],
        ['Do I need to make repairs before selling?', `No. We buy homes in ${city.name} as-is. No repairs, no cleaning, no stress.`],
        ['Are there any commissions or fees?', `Zero commissions. Zero agent fees. The offer you receive is what you get at closing.`],
        ['Do you serve all of ${city.county} County?', `Yes, we cover ${city.name} and all surrounding communities in ${city.county} County, Virginia.`],
      ])
    : (isEs ? [
        ['¿Qué tan preciso es el valor de tu casa?', `Usamos ventas comparables recientes en ${city.name} y datos actuales del Condado de ${city.county} para darte la evaluación más precisa posible.`],
        ['¿Están obligado a vender si solicito un valor?', `Para nada. El informe de valor es 100% gratuito y sin compromiso.`],
        ['¿Cuánto tiempo tarda en recibir mi informe?', `La mayoría de los propietarios en ${city.name} reciben su informe dentro de las 24 horas siguientes.`],
        ['¿Qué pasa con mi información?', `Tu información es privada. Solo la usamos para contactarte con tu informe de valor — nunca la vendemos.`],
      ] : [
        ['How accurate is the home value estimate?', `We use recent comparable sales in ${city.name} and current ${city.county} County data to give you the most accurate assessment possible.`],
        ['Am I obligated to sell if I request a value?', `Absolutely not. The value report is 100% free and no-obligation.`],
        ['How long does it take to get my report?', `Most ${city.name} homeowners receive their report within 24 hours.`],
        ['What happens with my information?', `Your info is private. We only use it to contact you with your value report — we never sell it.`],
      ]);

  const heading = isEs ? 'Preguntas Frecuentes' : 'Frequently Asked Questions';
  return `<h2>${heading}</h2>
${faqs.map(([q,a]) => `
<div class="faq-item">
  <div class="faq-q">${q} <span>+</span></div>
  <div class="faq-a">${a}</div>
</div>`).join('')}`;
}

// ── SITEMAP ───────────────────────────────────────────────
function buildSitemap(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.map(e => `  <url>
    <loc>${e.url}</loc>
    <xhtml:link rel="alternate" hreflang="${e.lang}" href="${e.url}"/>
    <xhtml:link rel="alternate" hreflang="${e.altLang}" href="${e.altUrl}"/>
    <changefreq>monthly</changefreq>
    <priority>${e.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
}

// ── GENERATE ALL ──────────────────────────────────────────
const OUTPUT = path.join(__dirname, 'dist');
if (!fs.existsSync(OUTPUT)) fs.mkdirSync(OUTPUT, { recursive: true });

const sitemapEntries = [];
let totalPages = 0;

for (const city of CITIES) {
  const citySlug = city.name.toLowerCase().replace(/\s+/g, '-');

  for (const page of PAGES) {
    // English
    const enDir = path.join(OUTPUT, `${page.slug}-in-${citySlug}`);
    fs.mkdirSync(enDir, { recursive: true });
    const enHtml = buildPage({ city, page, lang: 'en' });
    fs.writeFileSync(path.join(enDir, 'index.html'), enHtml);
    sitemapEntries.push({
      url: `https://${DOMAIN}/${page.slug}-in-${citySlug}/`,
      altUrl: `https://${DOMAIN}/es/${page.slugEs}-en-${citySlug}/`,
      lang: 'en', altLang: 'es',
      priority: '0.9'
    });

    // Spanish
    const esDir = path.join(OUTPUT, 'es', `${page.slugEs}-en-${citySlug}`);
    fs.mkdirSync(esDir, { recursive: true });
    const esHtml = buildPage({ city, page, lang: 'es' });
    fs.writeFileSync(path.join(esDir, 'index.html'), esHtml);
    sitemapEntries.push({
      url: `https://${DOMAIN}/es/${page.slugEs}-en-${citySlug}/`,
      altUrl: `https://${DOMAIN}/${page.slug}-in-${citySlug}/`,
      lang: 'es', altLang: 'en',
      priority: '0.9'
    });

    totalPages += 2;
  }
}

// Write sitemap
fs.writeFileSync(path.join(OUTPUT, 'sitemap.xml'), buildSitemap(sitemapEntries));

// Write robots.txt
fs.writeFileSync(path.join(OUTPUT, 'robots.txt'),
`User-agent: *
Allow: /
Sitemap: https://${DOMAIN}/sitemap.xml`);

console.log(`✅ Generated ${totalPages} SEO pages`);
console.log(`📁 Output: ${OUTPUT}`);
console.log(`🗺️  Sitemap: ${OUTPUT}/sitemap.xml`);
PAGES.forEach(p => {
  CITIES.forEach(c => {
    const s = c.name.toLowerCase().replace(/\s+/g, '-');
    console.log(`   /${p.slug}-in-${s}/`);
    console.log(`   /es/${p.slugEs}-en-${s}/`);
  });
});
