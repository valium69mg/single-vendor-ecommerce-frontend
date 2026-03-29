export const API_ERRORS = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN"
} as const;

export type ApiError= (typeof API_ERRORS)[keyof typeof API_ERRORS];
