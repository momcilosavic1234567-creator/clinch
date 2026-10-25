export const CONTACT_EMAIL = "momcilosavic1234567@gmail.com";

export function mailtoHref(subject: string): string {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
