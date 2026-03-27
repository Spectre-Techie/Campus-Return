const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;
const TAG_LIKE_CHARS = /[<>]/g;

export function sanitizePlainText(input: string): string {
  return input
    .replace(CONTROL_CHARS, " ")
    .replace(TAG_LIKE_CHARS, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeList(values: string[]): string[] {
  return values
    .map((value) => sanitizePlainText(value))
    .filter((value) => value.length > 0);
}
