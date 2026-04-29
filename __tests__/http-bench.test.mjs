import { describe, expect, it } from "vitest";
import {
  formatSummary,
  percentile,
  summarizeResults,
} from "../scripts/performance/http-bench.mjs";

describe("HTTP benchmark statistics", () => {
  it("calculates p95 from sorted latency samples", () => {
    expect(percentile([100, 20, 40, 80, 60], 95)).toBe(100);
    expect(percentile([100, 20, 40, 80, 60], 50)).toBe(60);
    expect(percentile([], 95)).toBe(0);
  });

  it("summarizes latency and failed responses", () => {
    const summary = summarizeResults([
      { durationMs: 10, ok: true },
      { durationMs: 30, ok: false },
      { durationMs: 20, ok: true },
    ]);

    expect(summary).toEqual({
      count: 3,
      successCount: 2,
      successRate: 2 / 3,
      avgMs: 20,
      minMs: 10,
      maxMs: 30,
      p95Ms: 30,
    });
  });

  it("formats the command-line summary", () => {
    expect(
      formatSummary("session", {
        count: 2,
        successCount: 2,
        successRate: 1,
        avgMs: 12.345,
        minMs: 10,
        maxMs: 15,
        p95Ms: 15,
      }),
    ).toContain("session");
    expect(
      formatSummary("session", {
        count: 2,
        successCount: 2,
        successRate: 1,
        avgMs: 12.345,
        minMs: 10,
        maxMs: 15,
        p95Ms: 15,
      }),
    ).toContain("success=100.0%");
  });
});
