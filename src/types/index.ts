export type Role = "STAFF" | "DEPARTMENT_HEAD" | "HR_OFFICER" | "HR_DIRECTOR" | "SYSTEM_ADMIN";

export type AttendanceStatus =
  | "PRESENT_ON_TIME"
  | "PRESENT_LATE"
  | "ABSENT"
  | "ON_LEAVE"
  | "FIELD_DUTY"
  | "HALF_DAY";

export type RequestType =
  | "LATE_EXCUSE"
  | "MISSING_CLOCK_IN"
  | "MISSING_CLOCK_OUT"
  | "LEAVE_NOTICE"
  | "FIELD_ASSIGNMENT";

export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";
