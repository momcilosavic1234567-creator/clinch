export const CONTACT_EMAIL = "momcilosavic1234567@gmail.com";
export const CONTACT_NAME = "Momčilo Savić";

export function mailtoHref(subject: string): string {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
