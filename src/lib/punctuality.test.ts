import { describe, it, expect } from "vitest";
import { evaluatePunchPunctuality, calculateWorkDurationMinutes } from "./punctuality";

describe("Punctuality Calculation Engine", () => {
  const policy = {
    workStartTime: "08:30:00",
    workEndTime: "17:00:00",
    graceMinutes: 15, // Grace cutoff is exactly 08:45:00
  };

  it("marks clock-in before official start time as PRESENT_ON_TIME", () => {
    const punch = new Date(2026, 9, 29, 8, 15, 0); // 08:15:00
    const result = evaluatePunchPunctuality(punch, policy);
    expect(result.status).toBe("PRESENT_ON_TIME");
    expect(result.minutesLate).toBe(0);
  });

  it("marks clock-in exactly at start time as PRESENT_ON_TIME", () => {
    const punch = new Date(2026, 9, 29, 8, 30, 0); // 08:30:00
    const result = evaluatePunchPunctuality(punch, policy);
    expect(result.status).toBe("PRESENT_ON_TIME");
    expect(result.minutesLate).toBe(0);
  });

  it("marks clock-in within grace period as PRESENT_ON_TIME", () => {
    const punch = new Date(2026, 9, 29, 8, 44, 30); // 08:44:30
    const result = evaluatePunchPunctuality(punch, policy);
    expect(result.status).toBe("PRESENT_ON_TIME");
    expect(result.minutesLate).toBe(0);
  });

  it("marks clock-in at the exact grace boundary (08:45:00) as PRESENT_ON_TIME", () => {
    const punch = new Date(2026, 9, 29, 8, 45, 0); // 08:45:00
    const result = evaluatePunchPunctuality(punch, policy);
    expect(result.status).toBe("PRESENT_ON_TIME");
    expect(result.minutesLate).toBe(0);
  });

  it("marks clock-in past grace cutoff (08:46:00) as PRESENT_LATE and calculates exact late minutes", () => {
    const punch = new Date(2026, 9, 29, 8, 46, 0); // 08:46:00 (16 minutes past 08:30)
    const result = evaluatePunchPunctuality(punch, policy);
    expect(result.status).toBe("PRESENT_LATE");
    expect(result.minutesLate).toBe(16);
  });

  it("accurately calculates substantial tardiness (09:15:00 -> 45 mins late)", () => {
    const punch = new Date(2026, 9, 29, 9, 15, 0); // 09:15:00
    const result = evaluatePunchPunctuality(punch, policy);
    expect(result.status).toBe("PRESENT_LATE");
    expect(result.minutesLate).toBe(45);
  });

  it("calculates work duration between punch in and punch out", () => {
    const inTime = new Date(2026, 9, 29, 8, 30, 0);
    const outTime = new Date(2026, 9, 29, 17, 0, 0);
    const duration = calculateWorkDurationMinutes(inTime, outTime);
    expect(duration).toBe(510); // 8.5 hours = 510 minutes
  });
});
