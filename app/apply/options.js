// Shared lists. Kept out of actions.js because a "use server" file may only export async functions.
export const APPLY_ROLES = [
  "Registered nurse (RN)",
  "Licensed practical nurse (LPN)",
  "Licensed nursing assistant (LNA)",
  "Dietary aide",
  "Housekeeping",
  "Activities aide",
  "Other",
];

export const EXPERIENCE = ["Less than 1 year", "1 to 2 years", "3 to 5 years", "6 to 10 years", "More than 10 years"];

export const ID_TYPES = [
  "Driver's license or state ID",
  "U.S. passport",
  "Social Security card",
  "Birth certificate",
  "Permanent resident card",
  "Work permit (employment authorization)",
];

export const STATES = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"];
export const SETTINGS = ["Long-term care", "Hospital", "Home health or clinic"];

export const AVAILABILITY = ["Days", "Evenings", "Nights", "Weekends", "Any shift"];


export const REFERENCE_RELATIONSHIPS = [
  "Direct supervisor",
  "Charge nurse or unit manager",
  "Director of nursing or administrator",
  "Clinical instructor or preceptor",
  "Peer in the same role",
  "Peer in a different role",
  "Physician or other provider I worked with",
];
