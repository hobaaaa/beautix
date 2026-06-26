type PerfDetails = Record<string, string | number | boolean | null | undefined>;

function formatDetails(details?: PerfDetails) {
  if (!details) return "";

  const parts = Object.entries(details)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${value}`);

  return parts.length > 0 ? ` ${parts.join(" ")}` : "";
}

export function logServerTiming(
  label: string,
  step: string,
  durationMs: number,
  details?: PerfDetails,
) {
  console.info(
    `[perf][${label}] ${step} ${Math.round(durationMs)}ms${formatDetails(details)}`,
  );
}

export async function measureServerTiming<T>(
  label: string,
  step: string,
  action: () => Promise<T>,
  getDetails?: (result: T) => PerfDetails | undefined,
) {
  const startedAt = Date.now();
  const result = await action();
  logServerTiming(label, step, Date.now() - startedAt, getDetails?.(result));
  return result;
}
