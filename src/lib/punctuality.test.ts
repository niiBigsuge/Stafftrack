import { describe, it, expect } from "vitest";
import { evaluatePunchPunctuality, calculateWorkDurationMinutes } from "./punctuality";

describe("Strict GMT Punctuality Calculation Engine (StaffTrack v2)", () => {
  const policy = {
    workStartTime: "08:30:00",
    workEndTime: "17:00:00",
    graceMinutes: 5, // Cutoff is exactly 08:35:00
  };

  it("marks clock-in well before official start time (07:45:00 GMT) as PRESENT_ON_TIME with 0 minutes late", () => {
    const punch = new Date("2026-11-16T07:45:00.000Z");
    const result = evaluatePunchPunctuality(punch, policy);
    expect(result.status).toBe("PRESENT_ON_TIME");
    expect(result.minutesLate).toBe(0);
  });

  it("marks clock-in exactly at start time (08:30:00 GMT) as PRESENT_ON_TIME with 0 minutes late", () => {
    const punch = new Date("2026-11-16T08:30:00.000Z");
    const result = evaluatePunchPunctuality(punch, policy);
    expect(result.status).toBe("PRESENT_ON_TIME");
    expect(result.minutesLate).toBe(0);
  });

  it("marks clock-in during grace period (08:33:20 GMT) as PRESENT_ON_TIME with 0 minutes late", () => {
    const punch = new Date("2026-11-16T08:33:20.000Z");
    const result = evaluatePunchPunctuality(punch, policy);
    expect(result.status).toBe("PRESENT_ON_TIME");
    expect(result.minutesLate).toBe(0);
  });

  it("marks clock-in at the exact grace boundary (08:35:00 GMT) as PRESENT_ON_TIME with 0 minutes late", () => {
    const punch = new Date("2026-11-16T08:35:00.000Z");
    const result = evaluatePunchPunctuality(punch, policy);
    expect(result.status).toBe("PRESENT_ON_TIME");
    expect(result.minutesLate).toBe(0);
  });

  it("marks clock-in at 08:35:59 GMT (sub-minute boundary) as PRESENT_ON_TIME with 0 minutes late", () => {
    const punch = new Date("2026-11-16T08:35:59.000Z");
    const result = evaluatePunchPunctuality(punch, policy);
    expect(result.status).toBe("PRESENT_ON_TIME");
    expect(result.minutesLate).toBe(0);
  });

  it("marks clock-in at 08:36:00 GMT as PRESENT_LATE with exactly 1 minute late (Option B floor rounding)", () => {
    const punch = new Date("2026-11-16T08:36:00.000Z");
    const result = evaluatePunchPunctuality(punch, policy);
    expect(result.status).toBe("PRESENT_LATE");
    expect(result.minutesLate).toBe(1);
  });

  it("marks clock-in at 08:50:00 GMT as PRESENT_LATE with exactly 15 minutes late", () => {
    const punch = new Date("2026-11-16T08:50:00.000Z");
    const result = evaluatePunchPunctuality(punch, policy);
    expect(result.status).toBe("PRESENT_LATE");
    expect(result.minutesLate).toBe(15);
  });

  it("marks clock-in at 09:10:30 GMT as PRESENT_LATE with 35 minutes late (floor rounding down from 35.5)", () => {
    const punch = new Date("2026-11-16T09:10:30.000Z");
    const result = evaluatePunchPunctuality(punch, policy);
    expect(result.status).toBe("PRESENT_LATE");
    expect(result.minutesLate).toBe(35);
  });

  it("calculates total work duration in minutes between punch in and punch out correctly", () => {
    const inTime = new Date("2026-11-16T08:30:00.000Z");
    const outTime = new Date("2026-11-16T17:00:00.000Z");
    const duration = calculateWorkDurationMinutes(inTime, outTime);
    expect(duration).toBe(510); // 8.5 hours = 510 minutes
  });
});
