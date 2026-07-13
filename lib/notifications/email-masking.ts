export function maskEmail(value: string | null | undefined) {
  if (!value) return null;

  const [localPart, domain] = value.trim().split("@");

  if (!localPart || !domain || localPart.length < 2) {
    return null;
  }

  const first = localPart[0];
  const last = localPart[localPart.length - 1];

  return `${first}***${last}@${domain}`;
}
