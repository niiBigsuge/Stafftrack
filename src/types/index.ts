export type Role = "SUPER_ADMIN" | "HR_ADMIN" | "MANAGER" | "STAFF" | "EXECUTIVE";

export type AttendanceStatus =
  | "PRESENT_ON_TIME"
  | "PRESENT_LATE"
  | "ABSENT"
  | "ON_LEAVE"
  | "HALF_DAY";

export type RequestType =
  | "LATE_EXCUSE"
  | "MISSING_CLOCK_IN"
  | "MISSING_CLOCK_OUT";

export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";
