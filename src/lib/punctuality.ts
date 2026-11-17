export interface PunctualityPolicy {
  workStartTime: string; // e.g. "08:30:00"
  workEndTime: string;   // e.g. "17:00:00"
  graceMinutes: number;  // e.g. 5
  timezone?: string;     // defaults to "GMT"
}

export interface PunctualityResult {
  status: "PRESENT_ON_TIME" | "PRESENT_LATE";
  minutesLate: number;
}

/**
 * Evaluates punch time against company attendance policy in strict GMT (UTC+0).
 *
 * Rules:
 * - Cutoff = workStartTime + graceMinutes.
 * - Sub-minute arrivals at or before grace cutoff (e.g. 08:35:59 with 8:30 start and 5-min grace) count as PRESENT_ON_TIME (0 min late).
 * - Arrivals after cutoff count as PRESENT_LATE.
 * - Minutes late = floor((clockIn - cutoff) / 60 seconds), e.g. 08:36:00 is 1 min late, 08:50:00 is 15 min late.
 *
 * @param clockInDate The exact timestamp when the employee clocked in.
 * @param policy Organization policy parameters.
 */
export function evaluatePunchPunctuality(
  clockInDate: Date,
  policy: PunctualityPolicy
): PunctualityResult {
  // Always evaluate in UTC/GMT to avoid host server timezone skew
  const hours = clockInDate.getUTCHours();
  const minutes = clockInDate.getUTCMinutes();
  const seconds = clockInDate.getUTCSeconds();
  const clockInSeconds = hours * 3600 + minutes * 60 + seconds;

  const [policyH, policyM, policyS = 0] = policy.workStartTime.split(":").map(Number);
  const startSeconds = policyH * 3600 + policyM * 60 + policyS;
  // Cutoff is inclusive of grace minutes through the end of that minute window (59 seconds)
  const graceMinutes = policy.graceMinutes ?? 5;
  const graceCutoffSeconds = startSeconds + graceMinutes * 60;

  // Anything up to and including graceCutoff + 59 seconds (e.g. 08:35:59) is on time
  if (clockInSeconds < graceCutoffSeconds + 60) {
    return {
      status: "PRESENT_ON_TIME",
      minutesLate: 0,
    };
  }

  // Count lateness from the cutoff in whole minutes, rounded down (Option B)
  // e.g., 08:36:00 (clockInSeconds - graceCutoffSeconds = 60s) -> 1 minute late
  const secondsPastCutoff = clockInSeconds - graceCutoffSeconds;
  const minutesLate = Math.floor(secondsPastCutoff / 60);

  return {
    status: "PRESENT_LATE",
    minutesLate: Math.max(1, minutesLate),
  };
}

/**
 * Calculates total worked duration between punch in and punch out in minutes.
 */
export function calculateWorkDurationMinutes(
  clockInDate: Date,
  clockOutDate: Date
): number {
  const diffMs = clockOutDate.getTime() - clockInDate.getTime();
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / (1000 * 60));
}
