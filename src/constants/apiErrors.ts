export const API_ERRORS = {
  UNAUTHORIZED: "UNAUTHORIZED"
} as const;

export type ApiError= (typeof API_ERRORS)[keyof typeof API_ERRORS];
