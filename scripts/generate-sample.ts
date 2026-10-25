import { promises as fs } from "node:fs";
import path from "node:path";
import { composeAudit } from "../src/lib/audit/compose";
import { extractPage } from "../src/lib/audit/extract";
import type { PageSnapshot, SiteContext } from "../src/lib/audit/types";
import { SAMPLE_PAGES } from "./sample-pages";

const BASE = "https://northwinddental.example";
const CREATED_AT = new Date("2026-10-25T09:12:00.000Z");

async function main() {
  const startedAt = performance.now() - 9_640;

  const pages: PageSnapshot[] = SAMPLE_PAGES.map((page) => ({
    url: page.url,
    path: page.path,
    status: 200,
    finalUrl: page.url,
    headers: page.headers,
    bodyBytes: Buffer.byteLength(page.html),
    ttfbMs: page.ttfbMs,
    assetBytes: page.assetBytes,
    assetCount: page.assetCount,
    extracted: extractPage(page.html, page.url),
  }));

  const context: SiteContext = {
    inputUrl: BASE,
    startUrl: `${BASE}/`,
    origin: BASE,
    host: "northwinddental.example",
    pagesCrawled: pages.length,
    brokenLinks: [
      {
        url: `${BASE}/patient-forms`,
        status: 404,
        foundOn: ["/", "/services"],
      },
      {
        url: `${BASE}/team/dr-lee`,
        status: 404,
        foundOn: ["/about"],
      },
    ],
    linkChecks: 9,
    homepageAssetBytes: 6_400_000,
    homepageAssetCount: 19,
  };

  const audit = composeAudit({
    pages,
    context,
    brand: {
      agencyName: "Northlight Studio",
      senderName: "Mina Kovac",
      email: "mina@northlight.example",
      website: "https://northlight.example",
      bookingUrl: "https://northlight.example/call",
      accent: "#FF5C35",
    },
    robots: "respected",
    tech: Array.from(
      new Set(pages.flatMap((page) => page.extracted.techMarkers)),
    ).sort(),
    pagesLimit: 8,
    startedAt,
    createdAt: CREATED_AT,
  });

  audit.id = "sample";

  const output = path.join(process.cwd(), "src", "data", "sample-audit.json");
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, `${JSON.stringify(audit, null, 2)}\n`, "utf8");

  console.log(
    `Sample dossier written to ${path.relative(process.cwd(), output)}`,
  );
  console.log(
    `Score ${audit.score} (${audit.grade}) · ${audit.issues.length} issues · ${audit.pages.length} pages`,
  );
  console.log(
    `Top issues:\n${audit.topIssues
      .map((issue) => `  - [${issue.severity}] ${issue.title}`)
      .join("\n")}`,
  );
  console.log(
    `Categories: ${audit.categories
      .map((category) => `${category.key} ${category.score}`)
      .join(" · ")}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
