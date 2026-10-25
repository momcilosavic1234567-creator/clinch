import { describe, expect, it } from "vitest";
import { extractPage } from "@/lib/audit/extract";

const RICH_HTML = `<!doctype html>
<html lang="en">
<head>
  <title>  Northwind Dental — Family Dentist in Portland  </title>
  <meta name="description" content="Gentle family dentistry in North Portland.">
  <link rel="canonical" href="/">
  <meta name="robots" content="index,follow">
  <meta property="og:title" content="Northwind Dental">
  <meta property="og:description" content="Dentistry that feels human.">
  <meta property="og:image" content="/og.jpg">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="generator" content="WordPress 6.5">
  <link rel="stylesheet" href="/style.css">
  <script src="https://www.googletagmanager.com/gtag/js"></script>
  <script src="/wp-content/theme.js"></script>
  <script src="/deferred.js" defer></script>
  <script src="/module.js" type="module"></script>
  <script type="application/ld+json">{"@context":"https://schema.org"}</script>
</head>
<body>
  <header>
    <nav>
      <a href="/">Home</a>
      <a href="/services">Services</a>
      <a href="#main">Skip to content</a>
    </nav>
  </header>
  <main id="main">
    <h1>Dentistry that feels human</h1>
    <h3>Why choose us</h3>
    <p>${"Comfortable care for the whole family. ".repeat(40)}</p>
    <img src="/hero.jpg" width="1200" height="800">
    <img src="https://cdn.example.com/team.jpg" alt="Our team">
    <img src="/icon.svg">
    <a href="/contact">Book an appointment</a>
    <a href="/blog">Read more</a>
    <a href="https://facebook.com/northwind">Facebook</a>
    <a href="mailto:hello@northwind.com">Email us</a>
    <a href="tel:+15551234567">Call us</a>
    <a href="/icon-target"><svg viewBox="0 0 10 10"></svg></a>
    <form action="https://forms.example.com/appointment">
      <input type="email" name="email">
      <label for="phone">Phone</label>
      <input id="phone" name="phone">
      <input type="hidden" name="source">
      <select name="service"><option>Cleaning</option></select>
    </form>
    <button><svg viewBox="0 0 10 10"></svg></button>
    <div tabindex="2">Focusable card</div>
    <img src="http://insecure.example.com/pixel.png">
    <p>© 2023 Northwind Dental. Rated 4.9 by 200+ patients.</p>
  </main>
  <footer><a href="/privacy">Privacy</a></footer>
</body>
</html>`;

describe("extractPage", () => {
  const page = extractPage(RICH_HTML, "https://northwinddental.com/");

  it("extracts and trims head metadata", () => {
    expect(page.title).toBe("Northwind Dental — Family Dentist in Portland");
    expect(page.metaDescription).toBe("Gentle family dentistry in North Portland.");
    expect(page.canonicalUrl).toBe("https://northwinddental.com/");
    expect(page.robotsMeta).toContain("index");
    expect(page.hasNoIndex).toBe(false);
    expect(page.ogTitle).toBe("Northwind Dental");
    expect(page.ogImage).toBe("https://northwinddental.com/og.jpg");
    expect(page.lang).toBe("en");
    expect(page.hasViewport).toBe(true);
    expect(page.hasStructuredData).toBe(true);
  });

  it("models headings and detects skipped levels", () => {
    expect(page.h1Count).toBe(1);
    expect(page.headingSequence).toEqual([1, 3]);
    expect(page.hasHeadingSkip).toBe(true);
  });

  it("measures images, alt coverage, dimensions, and mixed content", () => {
    expect(page.images).toHaveLength(4);
    expect(page.images.filter((image) => image.alt === null)).toHaveLength(3);
    expect(page.images.find((image) => image.src.endsWith("hero.jpg"))?.hasDimensions).toBe(true);
    expect(page.mixedContent).toContain("http://insecure.example.com/pixel.png");
  });

  it("splits internal and external links and records contact paths", () => {
    expect(page.internalLinks.map((link) => link.href)).toContain(
      "https://northwinddental.com/services",
    );
    expect(page.externalLinks.map((link) => link.href)).toContain(
      "https://facebook.com/northwind",
    );
    expect(page.internalLinks.find((link) => link.href.endsWith("/services"))?.inNav).toBe(true);
    expect(page.contactMethods).toEqual(
      expect.arrayContaining(["mailto:hello@northwind.com", "tel:+15551234567"]),
    );
    expect(page.contactMethods.some((value) => value.includes("/contact"))).toBe(true);
  });

  it("finds CTAs and social proof", () => {
    expect(page.ctas.join(" ").toLowerCase()).toContain("book");
    expect(page.socialProof).toBe(true);
  });

  it("audits form labels and accessible names", () => {
    const email = page.formFields.find((field) => field.name === "email");
    const phone = page.formFields.find((field) => field.name === "phone");
    const select = page.formFields.find((field) => field.name === "service");
    expect(email?.hasLabel).toBe(false);
    expect(phone?.hasLabel).toBe(true);
    expect(select?.hasLabel).toBe(false);
    expect(page.formFields).toHaveLength(3);
    expect(page.unnamedLinks).toBe(1);
    expect(page.unnamedButtons).toBe(1);
    expect(page.ambiguousLinks).toBe(1);
    expect(page.tabindexPositive).toBe(1);
    expect(page.hasSkipLink).toBe(true);
  });

  it("inventories scripts, styles, and render blockers", () => {
    expect(page.scripts).toHaveLength(4);
    expect(page.hasRenderBlockingScript).toBe(true);
    expect(page.externalScriptDomains).toContain("www.googletagmanager.com");
    expect(page.stylesheets).toBe(1);
  });

  it("extracts copyright year, word count, and assets", () => {
    expect(page.copyrightYear).toBe(2023);
    expect(page.wordCount).toBeGreaterThan(150);
    expect(page.assetUrls).toEqual(
      expect.arrayContaining(["https://northwinddental.com/hero.jpg"]),
    );
  });

  it("detects common technology markers from markup", () => {
    expect(page.techMarkers).toContain("WordPress");
    expect(page.techMarkers).toContain("Google Analytics 4");
  });
});

describe("extractPage edge cases", () => {
  it("treats an empty alt attribute as present but decorative", () => {
    const page = extractPage("<img src='/a.png' alt=''>", "https://example.com/");
    expect(page.images[0].alt).toBe("");
  });

  it("resolves links against a base element and deduplicates them", () => {
    const page = extractPage(
      "<base href='https://example.com/sub/'><a href='one'>One</a><a href='one#x'>Again</a><a href='two'>Two</a>",
      "https://example.com/",
    );
    expect(page.internalLinks.map((link) => link.href)).toEqual([
      "https://example.com/sub/one",
      "https://example.com/sub/two",
    ]);
  });

  it("ignores empty, javascript, and same-page links", () => {
    const page = extractPage(
      "<a href=''>a</a><a href='javascript:void(0)'>b</a><a href='#top'>c</a>",
      "https://example.com/",
    );
    expect(page.internalLinks).toHaveLength(0);
    expect(page.externalLinks).toHaveLength(0);
  });

  it("excludes navigation and scripts from the main content word count", () => {
    const page = extractPage(
      "<nav>Buy buy buy buy buy</nav><main>One two three four five.</main><script>alert(1)</script>",
      "https://example.com/",
    );
    expect(page.wordCount).toBe(5);
  });

  it("flags insecure form actions on https pages", () => {
    const page = extractPage(
      "<form action='http://insecure.example.com/send'><input aria-label='Email'></form>",
      "https://example.com/",
    );
    expect(page.insecureFormActions).toBe(1);
  });

  it("detects a noindex directive", () => {
    const page = extractPage(
      "<meta name='robots' content='noindex,nofollow'><h1>Hidden</h1>",
      "https://example.com/",
    );
    expect(page.hasNoIndex).toBe(true);
  });
});
