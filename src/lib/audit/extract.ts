import { load, type CheerioAPI } from "cheerio";
import type { AnyNode } from "domhandler";
import type {
  ExtractedPage,
  FormField,
  LinkInfo,
  PageImage,
  ScriptInfo,
} from "./types";

const CTA_PATTERN =
  /\b(book|call|get|start|request|schedule|contact|quote|buy|shop|order|try|demo|consult|appointment|enquire|inquire|download|apply|subscribe|join)\b/i;

const SOCIAL_PROOF_PATTERN =
  /\b(testimonial|reviews?|trusted by|case stud(?:y|ies)|rated|stars?|google reviews?|yelp)\b/i;

const AMBIGUOUS_LINK_TEXT = new Set(["click here", "here", "read more", "more"]);

const TECH_SIGNATURES: Array<[RegExp, string]> = [
  [/wp-content|wp-includes|wp-json|wordpress/i, "WordPress"],
  [/cdn\.shopify\.com|shopify/i, "Shopify"],
  [/wixstatic|wix\.com|wix-site/i, "Wix"],
  [/static1\.squarespace\.com|squarespace/i, "Squarespace"],
  [/webflow/i, "Webflow"],
  [/\/_next\/static|__next_data__/i, "Next.js"],
  [/\/_nuxt\//i, "Nuxt"],
  [/gatsby/i, "Gatsby"],
  [/framer/i, "Framer"],
  [/googletagmanager\.com\/gtag|gtag\(/i, "Google Analytics 4"],
  [/googletagmanager\.com\/gtm|gtm\.js/i, "Google Tag Manager"],
  [/hs-scripts|hubspot/i, "HubSpot"],
  [/data-reactroot|react-dom|react\.production/i, "React"],
  [/drupal|\/sites\/default\/files/i, "Drupal"],
  [/joomla/i, "Joomla"],
  [/shopify\.theme|myshopify/i, "Shopify"],
];

function collapse(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function resolveHttpUrl(value: string | undefined, base: URL): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, base);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function resolveAnyUrl(value: string | undefined, base: URL): string | null {
  if (!value) return null;
  try {
    return new URL(value, base).toString();
  } catch {
    return null;
  }
}

function metaContent($: CheerioAPI, attribute: "name" | "property", key: string): string {
  const element = $("meta")
    .filter(
      (_, node) =>
        ($(node).attr(attribute) ?? "").toLowerCase() === key.toLowerCase(),
    )
    .first();
  return collapse(element.attr("content") ?? "");
}

function accessibleName($: CheerioAPI, element: AnyNode): string {
  const $element = $(element);
  const ariaLabel = collapse($element.attr("aria-label") ?? "");
  if (ariaLabel) return ariaLabel;

  const labelledBy = $element.attr("aria-labelledby");
  if (labelledBy) {
    const parts = labelledBy
      .split(/\s+/)
      .map((id) =>
        collapse(
          $("[id]")
            .filter((_, node) => $(node).attr("id") === id)
            .text(),
        ),
      )
      .filter(Boolean);
    if (parts.length > 0) return parts.join(" ");
  }

  const imageAlt = collapse(
    $element
      .find("img[alt]")
      .map((_, node) => $(node).attr("alt") ?? "")
      .get()
      .join(" "),
  );
  if (imageAlt) return imageAlt;

  const svgTitle = collapse($element.find("svg title").first().text());
  if (svgTitle) return svgTitle;

  return collapse($element.text());
}

function extractLinks(
  $: CheerioAPI,
  base: URL,
): { internal: LinkInfo[]; external: LinkInfo[]; contactMethods: string[]; ctas: string[]; hasSkipLink: boolean; ambiguousLinks: number } {
  const internal = new Map<string, LinkInfo>();
  const external = new Map<string, LinkInfo>();
  const contactMethods = new Set<string>();
  const ctas = new Set<string>();
  let hasSkipLink = false;
  let ambiguousLinks = 0;

  $("a[href]").each((_, element) => {
    const $element = $(element);
    const rawHref = ($element.attr("href") ?? "").trim();

    const name = accessibleName($, element);
    if (rawHref.startsWith("#") && /skip/i.test(name)) {
      hasSkipLink = true;
    }

    if (!rawHref || rawHref.startsWith("#") || /^javascript:/i.test(rawHref)) {
      return;
    }

    if (rawHref.toLowerCase().startsWith("mailto:")) {
      contactMethods.add(rawHref);
      return;
    }
    if (rawHref.toLowerCase().startsWith("tel:")) {
      contactMethods.add(rawHref);
      return;
    }

    const href = resolveHttpUrl(rawHref, base);
    if (!href) return;

    const inNav = $element.closest("nav, header, [role='navigation']").length > 0;
    const isInternal = new URL(href).origin === base.origin;
    const target = isInternal ? internal : external;
    const previous = target.get(href);
    target.set(href, {
      href,
      text: name,
      inNav: inNav || previous?.inNav === true,
    });

    if (name && AMBIGUOUS_LINK_TEXT.has(name.toLowerCase())) {
      ambiguousLinks += 1;
    }

    if (name && CTA_PATTERN.test(name)) {
      ctas.add(name);
    }

    if (isInternal && /contact|book|appointment|get-in-touch|quote|enquir|inquire/i.test(new URL(href).pathname)) {
      contactMethods.add(href);
    }
  });

  $("button").each((_, element) => {
    const name = accessibleName($, element);
    if (name && CTA_PATTERN.test(name)) ctas.add(name);
  });

  return {
    internal: Array.from(internal.values()).slice(0, 200),
    external: Array.from(external.values()).slice(0, 100),
    contactMethods: Array.from(contactMethods).slice(0, 12),
    ctas: Array.from(ctas).slice(0, 12),
    hasSkipLink,
    ambiguousLinks,
  };
}

function extractImages($: CheerioAPI, base: URL): PageImage[] {
  return $("img")
    .map((_, element) => {
      const $element = $(element);
      const raw = $element.attr("src");
      const src = resolveAnyUrl(raw, base) ?? raw ?? "";
      const altAttribute = $element.attr("alt");
      const width = $element.attr("width");
      const height = $element.attr("height");
      return {
        src,
        alt: altAttribute === undefined ? null : altAttribute.trim(),
        hasDimensions: Boolean(width?.trim() && height?.trim()),
        loading: ($element.attr("loading") ?? "").toLowerCase() || null,
      };
    })
    .get()
    .filter((image) => Boolean(image.src));
}

function extractFormFields($: CheerioAPI): FormField[] {
  const labelledIds = new Set(
    $("label[for]")
      .map((_, element) => $(element).attr("for") ?? "")
      .get(),
  );

  return $("input, select, textarea")
    .map((_, element) => {
      const $element = $(element);
      const tag = element.tagName.toLowerCase() as FormField["tag"];
      const type = (tag === "input" ? $element.attr("type") ?? "text" : tag).toLowerCase();
      if (
        tag === "input" &&
        ["hidden", "submit", "button", "reset", "image"].includes(type)
      ) {
        return null;
      }

      const id = $element.attr("id") ?? "";
      const hasLabel =
        (id !== "" && labelledIds.has(id)) ||
        $element.closest("label").length > 0 ||
        Boolean(($element.attr("aria-label") ?? "").trim()) ||
        Boolean(($element.attr("aria-labelledby") ?? "").trim());

      return {
        tag,
        type,
        name: $element.attr("name") ?? null,
        hasLabel,
      } satisfies FormField;
    })
    .get()
    .filter((field): field is FormField => field !== null);
}

function extractScripts(
  $: CheerioAPI,
  base: URL,
): { scripts: ScriptInfo[]; externalDomains: string[]; hasRenderBlockingScript: boolean } {
  const externalDomains = new Set<string>();
  let hasRenderBlockingScript = false;

  const scripts = $("script[src]")
    .map((_, element) => {
      const $element = $(element);
      const src = resolveHttpUrl($element.attr("src"), base);
      if (!src) return null;

      const inHead = $element.parents("head").length > 0;
      const type = ($element.attr("type") ?? "").toLowerCase();
      const isModule = type === "module";
      const async = $element.attr("async") !== undefined;
      const defer = $element.attr("defer") !== undefined;
      const blocking = inHead && !async && !defer && !isModule;
      if (blocking) hasRenderBlockingScript = true;

      const external = new URL(src).origin !== base.origin;
      if (external) externalDomains.add(new URL(src).hostname);

      return { src, external, blocking } satisfies ScriptInfo;
    })
    .get()
    .filter((script): script is ScriptInfo => script !== null);

  return {
    scripts,
    externalDomains: Array.from(externalDomains),
    hasRenderBlockingScript,
  };
}

function extractWordCount($: CheerioAPI): number {
  const $scope = $("main").length > 0 ? $("main").first() : $("body");
  const $clone = $scope.clone();
  $clone.find("script, style, noscript, svg, template").remove();
  if ($("main").length === 0) {
    $clone.find("nav, header, footer, aside").remove();
  }
  const text = collapse($clone.text());
  if (!text) return 0;
  return text.split(/\s+/).filter((token) => /[A-Za-z0-9]/.test(token)).length;
}

function extractCopyrightYear(text: string): number | null {
  const matches = text.matchAll(
    /(?:©|copyright)[^\d]{0,24}((?:20)\d{2})(?:[^\d]{0,12}((?:20)\d{2}))?/gi,
  );
  let max: number | null = null;
  for (const match of matches) {
    for (const candidate of [match[1], match[2]]) {
      if (!candidate) continue;
      const year = Number(candidate);
      if (year >= 2000 && year <= 2100) {
        max = max === null ? year : Math.max(max, year);
      }
    }
  }
  return max;
}

function extractMixedContent($: CheerioAPI, base: URL): string[] {
  if (base.protocol !== "https:") return [];

  const found = new Set<string>();
  $("img[src], script[src], iframe[src], source[src], video[poster], link[href]").each(
    (_, element) => {
      const $element = $(element);
      const raw =
        $element.attr("src") ?? $element.attr("poster") ?? $element.attr("href");
      if (!raw) return;
      try {
        const url = new URL(raw, base);
        if (url.protocol === "http:") found.add(url.toString());
      } catch {
        // Ignore malformed resource URLs.
      }
    },
  );

  return Array.from(found).slice(0, 10);
}

function extractInsecureFormActions($: CheerioAPI, base: URL): number {
  if (base.protocol !== "https:") return 0;
  let count = 0;
  $("form[action]").each((_, element) => {
    const action = ($(element).attr("action") ?? "").trim();
    if (!action) return;
    try {
      if (new URL(action, base).protocol === "http:") count += 1;
    } catch {
      // Ignore malformed action URLs.
    }
  });
  return count;
}

function extractAssetUrls($: CheerioAPI, base: URL): string[] {
  const assets = new Set<string>();
  $("img[src], script[src], link[href], source[src], source[srcset]").each(
    (_, element) => {
      const $element = $(element);
      const href = $element.attr("href");
      if (href) {
        const rel = ($element.attr("rel") ?? "").toLowerCase();
        if (element.tagName.toLowerCase() === "link" && !rel.includes("stylesheet")) {
          return;
        }
      }
      const srcset = $element.attr("srcset");
      if (srcset) {
        for (const candidate of srcset.split(",")) {
          const url = resolveHttpUrl(candidate.trim().split(/\s+/)[0], base);
          if (url) assets.add(url);
        }
        return;
      }
      const url = resolveHttpUrl($element.attr("src") ?? href, base);
      if (url) assets.add(url);
    },
  );
  return Array.from(assets).slice(0, 80);
}

function detectTech($: CheerioAPI, html: string): string[] {
  const generator = metaContent($, "name", "generator");
  const haystack = `${html}\n${generator}`;
  const found = new Set<string>();
  for (const [pattern, label] of TECH_SIGNATURES) {
    if (pattern.test(haystack)) found.add(label);
  }
  return Array.from(found).sort();
}

export function extractPage(html: string, pageUrl: string): ExtractedPage {
  const $ = load(html);
  const page = new URL(pageUrl);
  const baseHref = $("base[href]").attr("href");
  const base = resolveAnyUrl(baseHref, page) ? new URL(baseHref!, page) : page;

  const { internal, external, contactMethods, ctas, hasSkipLink, ambiguousLinks } =
    extractLinks($, base);

  const headings = $("h1, h2, h3, h4, h5, h6")
    .map((_, element) => Number(element.tagName.toLowerCase().slice(1)))
    .get();

  let hasHeadingSkip = false;
  for (let index = 1; index < headings.length; index += 1) {
    if (headings[index] > headings[index - 1] + 1) {
      hasHeadingSkip = true;
      break;
    }
  }

  const images = extractImages($, base);
  const formFields = extractFormFields($);
  const { scripts, externalDomains, hasRenderBlockingScript } = extractScripts($, base);

  let unnamedLinks = 0;
  $("a[href]").each((_, element) => {
    const href = ($(element).attr("href") ?? "").trim();
    if (!href || href.startsWith("#") || /^javascript:/i.test(href)) return;
    if (!accessibleName($, element)) unnamedLinks += 1;
  });

  let unnamedButtons = 0;
  $("button").each((_, element) => {
    if (!accessibleName($, element)) unnamedButtons += 1;
  });

  let tabindexPositive = 0;
  $("[tabindex]").each((_, element) => {
    const value = Number($(element).attr("tabindex"));
    if (Number.isFinite(value) && value > 0) tabindexPositive += 1;
  });

  const bodyText = collapse($("body").text());
  const canonicalRaw = $("link[rel]")
    .filter((_, node) => ($(node).attr("rel") ?? "").toLowerCase().split(/\s+/).includes("canonical"))
    .first()
    .attr("href");
  const canonicalUrl = resolveHttpUrl(canonicalRaw, base);
  const stylesheets = $("link[rel]")
    .filter((_, node) => ($(node).attr("rel") ?? "").toLowerCase().includes("stylesheet"))
    .length;

  return {
    url: page.toString(),
    path: page.pathname || "/",
    title: collapse($("title").first().text()),
    metaDescription: metaContent($, "name", "description"),
    canonicalUrl,
    robotsMeta: metaContent($, "name", "robots").toLowerCase(),
    hasNoIndex: metaContent($, "name", "robots").toLowerCase().includes("noindex"),
    ogTitle: metaContent($, "property", "og:title"),
    ogDescription: metaContent($, "property", "og:description"),
    ogImage: resolveAnyUrl(metaContent($, "property", "og:image"), base) ?? "",
    lang: ($("html").attr("lang") ?? "").trim() || null,
    h1Count: $("h1").length,
    headingSequence: headings,
    hasHeadingSkip,
    images,
    internalLinks: internal,
    externalLinks: external,
    formFields,
    unnamedLinks,
    unnamedButtons,
    tabindexPositive,
    hasSkipLink,
    hasViewport: $("meta")
      .filter((_, node) => ($(node).attr("name") ?? "").toLowerCase() === "viewport")
      .length > 0,
    ambiguousLinks,
    hasStructuredData: $("script[type='application/ld+json']").length > 0,
    scripts,
    stylesheets,
    hasRenderBlockingScript,
    externalScriptDomains: externalDomains,
    contactMethods,
    ctas,
    socialProof: SOCIAL_PROOF_PATTERN.test(bodyText),
    copyrightYear: extractCopyrightYear(bodyText),
    wordCount: extractWordCount($),
    mixedContent: extractMixedContent($, base),
    insecureFormActions: extractInsecureFormActions($, base),
    lazyImages: images.filter((image) => image.loading === "lazy").length,
    assetUrls: extractAssetUrls($, base),
    techMarkers: detectTech($, html),
  };
}
