import { UNKNOWN_PROFILE, type BusinessProfile } from "../business";
import type { Finding, PageSnapshot } from "../types";
import {
  ACCESSIBILITY_PAGE_CHECKS,
  runAccessibilityChecks,
} from "./accessibility";
import { CONVERSION_PAGE_CHECKS, runConversionChecks } from "./conversion";
import {
  PERFORMANCE_PAGE_CHECKS,
  runPerformanceChecks,
} from "./performance";
import { runSecurityChecks, SECURITY_PAGE_CHECKS } from "./security";
import { runSeoChecks, SEO_PAGE_CHECKS } from "./seo";
import { runSiteChecks, SITE_CHECKS } from "./site";

export const PAGE_CHECKS =
  SEO_PAGE_CHECKS +
  ACCESSIBILITY_PAGE_CHECKS +
  PERFORMANCE_PAGE_CHECKS +
  SECURITY_PAGE_CHECKS +
  CONVERSION_PAGE_CHECKS;

export { SITE_CHECKS };

const HOMEPAGE_ONLY_CHECKS = 2;

export function runPageChecks(
  page: PageSnapshot,
  profile: BusinessProfile = UNKNOWN_PROFILE,
): Finding[] {
  return [
    ...runSeoChecks(page),
    ...runAccessibilityChecks(page),
    ...runPerformanceChecks(page),
    ...runSecurityChecks(page),
    ...runConversionChecks(page, profile),
  ];
}

export function checksRunFor(pageCount: number): number {
  if (pageCount <= 0) return 0;
  return (
    pageCount * PAGE_CHECKS -
    (pageCount - 1) * HOMEPAGE_ONLY_CHECKS +
    SITE_CHECKS
  );
}

export { runSiteChecks };
