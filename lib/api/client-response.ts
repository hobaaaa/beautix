import { API_ERROR_MESSAGES } from "./messages";

type ApiErrorPayload = {
  error?: unknown;
};

export async function readApiErrorMessage(
  response: Response,
  fallbackMessage: string = API_ERROR_MESSAGES.generic,
) {
  try {
    const payload = (await response.json()) as ApiErrorPayload;

    return typeof payload.error === "string" && payload.error.trim() !== ""
      ? payload.error
      : fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

export function getClientErrorMessage(
  error: unknown,
  fallbackMessage: string = API_ERROR_MESSAGES.generic,
) {
  if (error instanceof TypeError) {
    return API_ERROR_MESSAGES.network;
  }

  return error instanceof Error && error.message.trim() !== ""
    ? error.message
    : fallbackMessage;
}
