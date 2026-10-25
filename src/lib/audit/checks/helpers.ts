import type { Finding, PageSnapshot } from "../types";

type PageFindingInput = Omit<Finding, "pagePath">;

export function pageFinding(page: PageSnapshot, input: PageFindingInput): Finding {
  return { ...input, pagePath: page.path };
}

type SiteFindingInput = Omit<Finding, "pagePath">;

export function siteFinding(input: SiteFindingInput): Finding {
  return input;
}

export function humanList(values: string[], max = 3): string {
  if (values.length === 0) return "";
  const shown = values.slice(0, max);
  const suffix = values.length > max ? ` and ${values.length - max} more` : "";
  return `${shown.join(", ")}${suffix}`;
}

export function plural(count: number, singular: string, pluralForm?: string): string {
  return count === 1 ? singular : (pluralForm ?? `${singular}s`);
}
