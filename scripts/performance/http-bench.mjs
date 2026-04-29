const DEFAULT_BASE_URL = "http://localhost:3000";
const DEFAULT_ITERATIONS = 20;

export function percentile(values, percentileRank) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.ceil((percentileRank / 100) * sorted.length) - 1;
  return sorted[Math.min(Math.max(index, 0), sorted.length - 1)];
}

export function summarizeResults(results) {
  const durations = results.map((result) => result.durationMs);
  const successCount = results.filter((result) => result.ok).length;
  const total = results.length;
  const sum = durations.reduce((current, duration) => current + duration, 0);

  return {
    count: total,
    successCount,
    successRate: total === 0 ? 0 : successCount / total,
    avgMs: total === 0 ? 0 : sum / total,
    minMs: durations.length === 0 ? 0 : Math.min(...durations),
    maxMs: durations.length === 0 ? 0 : Math.max(...durations),
    p95Ms: percentile(durations, 95),
  };
}

export function formatSummary(name, summary) {
  const successRate = `${(summary.successRate * 100).toFixed(1)}%`;

  return [
    name.padEnd(18),
    `count=${String(summary.count).padStart(3)}`,
    `success=${successRate.padStart(6)}`,
    `avg=${summary.avgMs.toFixed(1).padStart(6)}ms`,
    `p95=${summary.p95Ms.toFixed(1).padStart(6)}ms`,
    `min=${summary.minMs.toFixed(1).padStart(6)}ms`,
    `max=${summary.maxMs.toFixed(1).padStart(6)}ms`,
  ].join("  ");
}

function buildEndpoints({ cookie, userID }) {
  const endpoints = [
    { name: "login-page", path: "/" },
    { name: "session", path: "/api/auth/session" },
  ];

  if (userID) {
    endpoints.push({
      name: "public-profile",
      path: `/api/users/${encodeURIComponent(userID)}`,
    });
  }

  if (cookie) {
    endpoints.push({
      name: "current-user",
      path: "/api/users/me",
      headers: { cookie },
    });
    endpoints.push({
      name: "profile-page",
      path: "/profile",
      headers: { cookie },
    });
  }

  return endpoints;
}

async function requestOnce(baseUrl, endpoint) {
  const startedAt = performance.now();
  const response = await fetch(new URL(endpoint.path, baseUrl), {
    headers: endpoint.headers,
    redirect: "manual",
  });
  const durationMs = performance.now() - startedAt;

  return {
    durationMs,
    ok: response.status >= 200 && response.status < 400,
    status: response.status,
  };
}

export async function benchmarkEndpoint({ baseUrl, endpoint, iterations }) {
  const results = [];

  for (let index = 0; index < iterations; index += 1) {
    try {
      results.push(await requestOnce(baseUrl, endpoint));
    } catch {
      results.push({
        durationMs: 0,
        ok: false,
        status: 0,
      });
    }
  }

  return summarizeResults(results);
}

async function main() {
  const baseUrl = process.env.BASE_URL ?? DEFAULT_BASE_URL;
  const iterations = Number(process.env.PERF_ITERATIONS ?? DEFAULT_ITERATIONS);
  const cookie = process.env.PERF_COOKIE;
  const userID = process.env.PERF_USER_ID;
  const endpoints = buildEndpoints({ cookie, userID });

  if (!Number.isInteger(iterations) || iterations < 1) {
    throw new Error("PERF_ITERATIONS must be a positive integer.");
  }

  console.log(`HTTP benchmark target: ${baseUrl}`);
  console.log(`Iterations per endpoint: ${iterations}`);

  if (!userID) {
    console.log(
      "Skipping public profile check. Set PERF_USER_ID to enable it.",
    );
  }

  if (!cookie) {
    console.log(
      "Skipping authenticated checks. Set PERF_COOKIE to enable them.",
    );
  }

  console.log("");

  for (const endpoint of endpoints) {
    const summary = await benchmarkEndpoint({ baseUrl, endpoint, iterations });
    console.log(formatSummary(endpoint.name, summary));
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
