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
export function resolveDisplayName(username: string | null | undefined, email: string | null | undefined): string {
  let raw = (username ?? "").trim();

  // Username accidentally contains an email — strip everything from '@' onward.
  if (raw.includes("@")) {
    raw = raw.split("@")[0].trim();
  }

  if (!raw) {
    raw = (email ?? "").split("@")[0] ?? "there";
  }

  return capitaliseWords(raw);
}
