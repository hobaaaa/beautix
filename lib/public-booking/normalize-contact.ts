export function normalizePublicBookingPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 10 && digits.startsWith("5")) {
    return `+90${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("05")) {
    return `+90${digits.slice(1)}`;
  }

  if (digits.length === 12 && digits.startsWith("90")) {
    return `+${digits}`;
  }

  return value.trim();
}
