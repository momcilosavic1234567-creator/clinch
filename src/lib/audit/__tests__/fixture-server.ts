import { createServer, type Server } from "node:http";

const COPY = "Comfortable, clearly explained care for the whole family. ".repeat(
  40,
);

const SECURE_HEADERS = {
  "strict-transport-security": "max-age=31536000; includeSubDomains",
  "content-security-policy": "default-src 'self'; img-src 'self' data:",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
};

function page(options: {
  title: string;
  description: string;
  path: string;
  body: string;
}): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${options.title}</title>
  <meta name="description" content="${options.description}">
  <link rel="canonical" href="${options.path}">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta property="og:title" content="${options.title}">
  <meta property="og:description" content="${options.description}">
  <meta property="og:image" content="/og.jpg">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"Dentist"}</script>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <a href="#main">Skip to content</a>
  <nav><a href="/services">Services</a><a href="/about">About</a><a href="/broken">Patient stories</a><a href="/private">Internal</a></nav>
  <main id="main">
    <h1>${options.title}</h1>
    <p>${COPY}</p>
    ${options.body}
    <a href="mailto:hello@northwind.test">Email us</a>
    <img src="/team.jpg" alt="The Northwind care team" width="800" height="600">
    <p>Rated 4.9 by more than 200 patients.</p>
    <p>© 2026 Northwind Dental</p>
  </main>
</body>
</html>`;
}

const HOME = page({
  title: "Northwind Dental — Family Dentist in Portland",
  description:
    "Gentle family and cosmetic dentistry in North Portland. Same-week appointments, transparent pricing, and a team that explains every step.",
  path: "/",
  body: `<a href="/contact">Book an appointment</a>`,
});

const SERVICES = page({
  title: "Dental Services in North Portland | Northwind Dental",
  description:
    "Cleanings, fillings, crowns, and cosmetic dentistry explained in plain language, with transparent pricing before any treatment begins.",
  path: "/services",
  body: `<a href="/contact">Book a cleaning</a>`,
});

const ABOUT = page({
  title: "Meet the Northwind Dental Team",
  description:
    "A small Portland practice with a simple promise: clear explanations, gentle care, and no surprise invoices for you or your family.",
  path: "/about",
  body: `<a href="/contact">Ask us a question</a>`,
});

const CONTACT = page({
  title: "Book an Appointment | Northwind Dental",
  description:
    "Request a same-week appointment with Northwind Dental. Call, email, or send the short form and the team will confirm within one business day.",
  path: "/contact",
  body: `<form action="/contact" method="post">
    <label>Full name <input type="text" name="name"></label>
    <label>Email <input type="email" name="email"></label>
    <button type="submit">Request appointment</button>
  </form>`,
});

const PRIVATE = page({
  title: "Internal notes | Northwind Dental",
  description:
    "An internal page that should never be crawled by the audit bot because robots.txt disallows this path for everyone.",
  path: "/private",
  body: "<p>Staff only.</p>",
});

const NOT_FOUND = `<!doctype html><html lang="en"><head><title>Page not found | Northwind Dental</title></head><body><h1>Page not found</h1></body></html>`;

const stylesheet = Array.from(
  { length: 120 },
  (_, index) =>
    `.utility-${index}{display:flex;gap:${index % 12}px;padding:${index % 7}px;color:#1a1a1a;}`,
).join("\n");

interface Route {
  status: number;
  type: string;
  body: string;
  headers?: Record<string, string>;
}

function buildRoutes(base: string): Record<string, Route> {
  const html = "text/html; charset=utf-8";
  return {
    "/robots.txt": {
      status: 200,
      type: "text/plain; charset=utf-8",
      body: `User-agent: *\nDisallow: /private\n\nSitemap: ${base}/sitemap.xml\n`,
    },
    "/": {
      status: 200,
      type: html,
      body: HOME,
      headers: SECURE_HEADERS,
    },
    "/services": {
      status: 200,
      type: html,
      body: SERVICES,
      headers: SECURE_HEADERS,
    },
    "/about": {
      status: 200,
      type: html,
      body: ABOUT,
      headers: SECURE_HEADERS,
    },
    "/contact": {
      status: 200,
      type: html,
      body: CONTACT,
      headers: SECURE_HEADERS,
    },
    "/private": {
      status: 200,
      type: html,
      body: PRIVATE,
    },
    "/styles.css": {
      status: 200,
      type: "text/css; charset=utf-8",
      body: stylesheet,
    },
    "/team.jpg": {
      status: 200,
      type: "image/jpeg",
      body: "fixture-image-bytes".repeat(2000),
    },
    "/download.pdf": {
      status: 200,
      type: "application/pdf",
      body: "%PDF-1.4 fixture",
    },
  };
}

export interface FixtureServer {
  base: string;
  close: () => Promise<void>;
}

export async function startFixtureServer(): Promise<FixtureServer> {
  let base = "";

  const server: Server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", base || "http://127.0.0.1");
    const route = buildRoutes(base)[url.pathname];

    if (!route) {
      response.writeHead(404, { "content-type": "text/html; charset=utf-8" });
      response.end(request.method === "HEAD" ? undefined : NOT_FOUND);
      return;
    }

    response.writeHead(route.status, {
      "content-type": route.type,
      "content-length": String(Buffer.byteLength(route.body)),
      ...route.headers,
    });
    response.end(request.method === "HEAD" ? undefined : route.body);
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Fixture server did not expose a TCP port.");
  }

  base = `http://127.0.0.1:${address.port}`;

  return {
    base,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}
