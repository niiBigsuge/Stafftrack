export interface PunctualityPolicy {
  workStartTime: string; // e.g. "08:30:00"
  workEndTime: string;   // e.g. "17:00:00"
  graceMinutes: number;  // e.g. 15
}

export interface PunctualityResult {
  status: "PRESENT_ON_TIME" | "PRESENT_LATE";
  minutesLate: number;
}

/**
 * Evaluates punch time against company attendance policy.
 * @param clockInDate The exact timestamp when the employee clocked in.
 * @param policy Organization policy parameters.
 */
export function evaluatePunchPunctuality(
  clockInDate: Date,
  policy: PunctualityPolicy
): PunctualityResult {
  const hours = clockInDate.getHours();
  const minutes = clockInDate.getMinutes();
  const seconds = clockInDate.getSeconds();
  const clockInSeconds = hours * 3600 + minutes * 60 + seconds;

  const [policyH, policyM, policyS = 0] = policy.workStartTime.split(":").map(Number);
  const startSeconds = policyH * 3600 + policyM * 60 + policyS;
  const graceCutoffSeconds = startSeconds + policy.graceMinutes * 60;

  if (clockInSeconds <= graceCutoffSeconds) {
    return {
      status: "PRESENT_ON_TIME",
      minutesLate: 0,
    };
  }

  const secondsLate = clockInSeconds - startSeconds;
  const minutesLate = Math.round(secondsLate / 60);

  return {
    status: "PRESENT_LATE",
    minutesLate,
  };
}

/**
 * Calculates total worked duration between punch in and punch out.
 */
export function calculateWorkDurationMinutes(
  clockInDate: Date,
  clockOutDate: Date
): number {
  const diffMs = clockOutDate.getTime() - clockInDate.getTime();
  if (diffMs <= 0) return 0;
  return Math.round(diffMs / (1000 * 60));
}
