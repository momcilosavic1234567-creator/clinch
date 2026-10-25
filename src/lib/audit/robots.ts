interface RobotsRule {
  type: "allow" | "disallow";
  path: string;
}

interface RobotsGroup {
  agents: string[];
  rules: RobotsRule[];
  crawlDelay: number | null;
  hasDirectives: boolean;
}

export interface RobotsRules {
  isAllowed: (pathAndQuery: string) => boolean;
  crawlDelay: number | null;
  sitemaps: string[];
}

function compileRule(pattern: string): RegExp {
  const anchoredEnd = pattern.endsWith("$");
  const body = anchoredEnd ? pattern.slice(0, -1) : pattern;
  const escaped = body
    .split("*")
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${escaped}${anchoredEnd ? "$" : ""}`);
}

function matchesRule(rule: RobotsRule, pathAndQuery: string): boolean {
  return compileRule(rule.path).test(pathAndQuery);
}

export function parseRobotsTxt(text: string, userAgent: string): RobotsRules {
  const groups: RobotsGroup[] = [];
  const sitemaps: string[] = [];
  let current: RobotsGroup | null = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.split("#")[0]?.trim() ?? "";
    if (!line) continue;

    const separator = line.indexOf(":");
    if (separator === -1) continue;

    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (field === "sitemap") {
      if (value) sitemaps.push(value);
      continue;
    }

    if (field === "user-agent") {
      if (!value) continue;
      if (current && current.hasDirectives) {
        groups.push(current);
        current = null;
      }
      if (!current) {
        current = { agents: [], rules: [], crawlDelay: null, hasDirectives: false };
      }
      current.agents.push(value.toLowerCase());
      continue;
    }

    if (field === "allow" || field === "disallow") {
      if (!current || !value) continue;
      current.hasDirectives = true;
      current.rules.push({ type: field, path: value });
      continue;
    }

    if (field === "crawl-delay") {
      if (!current) continue;
      const parsed = Number(value);
      if (Number.isFinite(parsed) && parsed >= 0) {
        current.crawlDelay = parsed;
        current.hasDirectives = true;
      }
    }
  }

  if (current) groups.push(current);

  const normalizedAgent = userAgent.toLowerCase();
  const specific = groups.filter((group) =>
    group.agents.some(
      (agent) => agent !== "*" && normalizedAgent.includes(agent),
    ),
  );
  const selected =
    specific.length > 0 ? specific : groups.filter((group) => group.agents.includes("*"));

  const rules = selected.flatMap((group) => group.rules);
  const crawlDelay =
    selected.find((group) => group.crawlDelay !== null)?.crawlDelay ?? null;

  return {
    isAllowed(pathAndQuery: string) {
      const path = pathAndQuery || "/";
      let winner: RobotsRule | null = null;

      for (const rule of rules) {
        if (!matchesRule(rule, path)) continue;
        if (!winner) {
          winner = rule;
          continue;
        }
        if (rule.path.length > winner.path.length) {
          winner = rule;
        } else if (
          rule.path.length === winner.path.length &&
          rule.type === "allow"
        ) {
          winner = rule;
        }
      }

      return winner ? winner.type === "allow" : true;
    },
    crawlDelay,
    sitemaps: Array.from(new Set(sitemaps)),
  };
}
