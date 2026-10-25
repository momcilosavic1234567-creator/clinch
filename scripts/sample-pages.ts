const DOMAIN = "https://northwinddental.example";

const NAV = `<header>
  <nav>
    <a href="/">Home</a>
    <a href="/services">Services</a>
    <a href="/about">About</a>
    <a href="/contact">Contact</a>
    <a href="/patient-forms">Patient forms</a>
    <a href="tel:+15035550114">(503) 555-0114</a>
  </nav>
</header>`;

const FOOTER = `<footer>
  <p>Northwind Family Dental, 4821 N Lombard St, Portland, OR 97203</p>
  <p>© 2023 Northwind Family Dental. All rights reserved.</p>
</footer>`;

const BODY_SCRIPTS = Array.from(
  { length: 10 },
  (_, index) =>
    `<script src="https://cdn.example.com/widget-${index + 1}.js" async></script>`,
).join("\n");

export const SAMPLE_PAGES = [
  {
    path: "/",
    url: `${DOMAIN}/`,
    ttfbMs: 3240,
    headers: {
      server: "Apache/2.4.29 (Unix)",
    } as Record<string, string>,
    assetBytes: 6_400_000,
    assetCount: 19,
    html: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Home | Northwind Family Dental | Family, Cosmetic and Emergency Dentist in Portland, Oregon</title>
  <meta name="robots" content="index,follow">
  <script src="https://www.googletagmanager.com/gtag/js?id=G-4KJ2M8Q"></script>
  <script src="https://connect.facebook.net/en_US/fbevents.js"></script>
  <script src="https://static.hotjar.com/c/hotjar-4182233.js"></script>
  <script src="https://cdn.example.com/site-vendor.js"></script>
  <link rel="stylesheet" href="/styles/main.css">
  <link rel="stylesheet" href="/styles/blocks.css">
  <link rel="stylesheet" href="/styles/theme.css">
  <link rel="stylesheet" href="/styles/legacy.css">
  <link rel="stylesheet" href="/styles/print.css">
  <link rel="stylesheet" href="/styles/forms.css">
</head>
<body>
  ${NAV}
  <main>
    <h1>Northwind Family Dental</h1>
    <h1>Dentistry that feels human</h1>
    <img src="http://legacy-cdn.example.com/hero-practice.jpg">
    <p>Northwind Family Dental has cared for families across North Portland since 1998. The practice was built around a simple idea: dentistry should be explained clearly, scheduled around real life, and delivered without judgment. Most patients come to us after putting off a visit for years, and most leave wondering why they waited.</p>
    <p>Our team handles routine cleanings, fillings, crowns, bridges, and dentures, along with cosmetic work such as whitening and veneers. We also keep same-week appointments open for tooth pain, chipped teeth, and other urgent problems. If you are not sure what you need, start with a conversation and we will help you work out the next step.</p>
    <h3>What we do</h3>
    <p>Preventive care is the heart of the practice. A typical visit includes a careful cleaning, a full examination, and a plain-language explanation of anything we find. We show you the images, describe the options, and give you a written estimate before treatment begins, so there are no surprises at the front desk.</p>
    <img src="/images/team.jpg">
    <img src="/images/office.jpg">
    <img src="/images/dental-chair.jpg">
    <img src="/images/reception.jpg">
    <img src="/images/child-smile.jpg" alt="">
    <img src="/images/xray.jpg">
    <img src="/images/logo.png" alt="Northwind Family Dental" width="120" height="40">
    <h2>New patients</h2>
    <p>New patients are welcome, whether you have insurance or not. We are in network with most major plans and offer a straightforward membership for people without coverage. Your first visit includes a cleaning, an exam, and any necessary X-rays, usually in under an hour.</p>
    <p>We know dental offices can feel clinical and rushed. Ours is designed to feel calmer: natural light, a quiet waiting room, and appointments that leave room for questions. Children are welcome, and we are happy to walk families through a first visit before anything begins.</p>
    <div>
      <a href="/services">Learn more</a>
      <a href="/about">Learn more</a>
      <a href="/patient-forms">Learn more</a>
    </div>
    <p><a href="/contact" tabindex="3">Request an appointment</a> or <a href="mailto:hello@northwinddental.example">email the practice</a>. We answer messages on the next business day.</p>
    <h2>Where to find us</h2>
    <p>The practice sits on North Lombard Street, a short walk from the St. Johns Bridge and a few minutes from the University of Portland. Street parking is available on both sides of the building, and the entrance is step-free.</p>
    <p>If you are travelling from further away, the 4 and 44 bus lines stop within two blocks. We are open Monday through Thursday from 8am to 5pm and Friday from 8am to 2pm. Emergency calls are triaged the same day whenever the schedule allows.</p>
  </main>
  ${FOOTER}
  ${BODY_SCRIPTS}
</body>
</html>`,
  },
  {
    path: "/services",
    url: `${DOMAIN}/services`,
    ttfbMs: 1610,
    headers: {} as Record<string, string>,
    assetBytes: null,
    assetCount: 0,
    html: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Dental Services in Portland | Northwind Family Dental</title>
  <meta name="description" content="Preventive, cosmetic, and emergency dentistry for the whole family.">
  <script src="https://cdn.example.com/services.js" async></script>
  <link rel="stylesheet" href="/styles/main.css">
  <link rel="stylesheet" href="/styles/blocks.css">
</head>
<body>
  ${NAV}
  <main>
    <h1>Dental services</h1>
    <p>Every treatment starts with a diagnosis you can understand. We take the time to show you what we see, explain what can wait, and describe what happens next in plain language. When there are two reasonable options, we lay out the trade-offs rather than pushing the most expensive one.</p>
    <img src="/images/cleaning.jpg" alt="A hygienist preparing a treatment room" width="640" height="420">
    <h2>Preventive care</h2>
    <p>Cleanings, exams, sealants, and fluoride treatment keep small problems from becoming expensive ones. Most adults benefit from a visit every six months, though we tailor the schedule to your history. We send reminders by text so the date does not slip.</p>
    <img src="/images/cosmetic.jpg">
    <h2>Cosmetic dentistry</h2>
    <p>Whitening, bonding, and veneers can change how you feel about your smile without changing who you are. We start with the smallest intervention that solves the problem and show you a realistic result before you commit. Not every request needs a full set of veneers.</p>
    <img src="/images/emergency.jpg">
    <h2>Emergency care</h2>
    <p>Tooth pain rarely arrives at a convenient time. We keep same-week appointments for urgent problems, and we triage calls the same day. If you have swelling, bleeding that will not stop, or a knocked-out tooth, call us immediately and describe what happened.</p>
    <p>Ready to book? <a href="/contact">Contact the practice</a> or download the <a href="/patient-forms">new patient forms</a> before your visit.</p>
  </main>
  ${FOOTER}
</body>
</html>`,
  },
  {
    path: "/about",
    url: `${DOMAIN}/about`,
    ttfbMs: 1840,
    headers: {} as Record<string, string>,
    assetBytes: null,
    assetCount: 0,
    html: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>About Northwind Family Dental</title>
  <meta name="description" content="Preventive, cosmetic, and emergency dentistry for the whole family.">
  <meta name="robots" content="noindex,nofollow">
  <link rel="stylesheet" href="/styles/main.css">
</head>
<body>
  ${NAV}
  <main>
    <h2>Meet the team</h2>
    <img src="/images/dr-lee.jpg">
    <p>Dr. Mara Lee opened Northwind in 1998 after a decade in community dentistry. She has a particular interest in anxious patients and in treating entire families across generations, from a child's first check-up to a grandparent's new bridge.</p>
    <img src="/images/team-group.jpg">
    <p>The practice is small on purpose. Dr. Lee works alongside two hygienists and a front-desk team who have been together for years. That continuity means you see familiar faces and nobody has to explain your history from scratch.</p>
    <p><a href="/team/dr-lee">Meet Dr. Lee</a></p>
  </main>
  ${FOOTER}
</body>
</html>`,
  },
  {
    path: "/contact",
    url: `${DOMAIN}/contact`,
    ttfbMs: 2080,
    headers: {} as Record<string, string>,
    assetBytes: null,
    assetCount: 0,
    html: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <script src="https://cdn.example.com/forms.js"></script>
  <link rel="stylesheet" href="/styles/main.css">
  <link rel="stylesheet" href="/styles/forms.css">
</head>
<body>
  ${NAV}
  <main>
    <h1>Contact us</h1>
    <p>Call the practice, email the front desk, or send the form below. We answer every message within one business day, and urgent calls are triaged the same day. If you are in pain, calling is always faster than writing.</p>
    <p>Please include the reason for your visit and a phone number where we can reach you. If you are a new patient, mention that so we can reserve a longer first appointment. Existing patients can request a specific hygienist or time of day.</p>
    <img src="/images/map.jpg">
    <form action="http://northwinddental.example/contact-handler" method="post">
      <input type="text" name="name" placeholder="Full name">
      <input type="email" name="email" placeholder="Email address">
      <textarea name="message" placeholder="How can we help?"></textarea>
      <button type="submit">Send request</button>
    </form>
    <p>Prefer to call? <a href="tel:+15035550114">Call the practice</a> during opening hours. For billing questions, <a href="mailto:billing@northwinddental.example">email billing</a> and include your invoice number.</p>
    <img src="/images/front-desk.jpg" alt="The Northwind front desk">
    <p>Visits are scheduled Monday through Thursday from 8am to 5pm and Friday from 8am to 2pm. The office is closed for lunch between noon and 1pm, and messages sent during lunch are answered the same afternoon.</p>
  </main>
  ${FOOTER}
</body>
</html>`,
  },
];
