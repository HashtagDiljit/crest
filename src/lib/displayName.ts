// Capitalises every word: "diljit singh" -> "Diljit Singh"
export function capitaliseWords(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// Resolves a display name from a stored username + email, guarding against
// the username having been accidentally set to a raw email address.
// Falls back to the auth metadata name (from the JWT) before resorting to
// the email-derived name.
export function resolveDisplayName(
  username: string | null | undefined,
  email: string | null | undefined,
  metadataName?: string | null
): string {
  let raw = (username ?? "").trim();

  // Username accidentally contains an email — strip everything from '@' onward.
  if (raw.includes("@")) {
    raw = raw.split("@")[0].trim();
  }

  if (!raw) {
    raw = (metadataName ?? "").trim();
  }

  if (!raw) {
    raw = (email ?? "").split("@")[0] ?? "there";
  }

  return capitaliseWords(raw);
}
