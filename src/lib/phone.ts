/**
 * Nigerian phone number helpers.
 * Display numbers stay exactly as configured (e.g. "07063383383"); links use
 * the international form (+234 with the leading zero removed).
 */

const LOCAL_RE = /^0[789][01]\d{8}$/;
const INTL_RE = /^(?:\+?234)([789][01]\d{8})$/;

/** Strips spaces, dashes, dots and brackets. */
function compact(input: string): string {
  return input.replace(/[\s\-().]/g, "");
}

/** Returns true for valid Nigerian mobile numbers in local (0…) or international (+234…) form. */
export function isNigerianMobile(input: string): boolean {
  const s = compact(input);
  return LOCAL_RE.test(s) || INTL_RE.test(s);
}

/** Normalises a Nigerian mobile number to the 11-digit local form, e.g. "08012345678". */
export function toLocalNigerian(input: string): string | null {
  const s = compact(input);
  if (LOCAL_RE.test(s)) return s;
  const m = INTL_RE.exec(s);
  return m ? `0${m[1]}` : null;
}

/** Converts a local Nigerian number to international digits without "+", e.g. "2347063383383". */
export function toInternationalDigits(input: string): string | null {
  const s = compact(input);
  if (LOCAL_RE.test(s)) return `234${s.slice(1)}`;
  const m = INTL_RE.exec(s);
  return m ? `234${m[1]}` : null;
}

/** tel: link using the international form so it works from any network. */
export function telHref(input: string): string {
  const intl = toInternationalDigits(input);
  return intl ? `tel:+${intl}` : `tel:${compact(input)}`;
}

/** WhatsApp click-to-chat link (https://wa.me/<intl digits>). */
export function whatsappHref(input: string, message?: string): string | null {
  const intl = toInternationalDigits(input);
  if (!intl) return null;
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${intl}${query}`;
}
