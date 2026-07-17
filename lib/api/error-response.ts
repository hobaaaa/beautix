import { NextResponse } from "next/server";
export { API_ERROR_MESSAGES } from "./messages";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "SERVER_ERROR";

export type ApiErrorResponse = {
  success: false;
  error: string;
  code?: ApiErrorCode;
};

export function apiError(
  error: string,
  status: number,
  code?: ApiErrorCode,
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(code ? { code } : {}),
    },
    { status },
  );
}
