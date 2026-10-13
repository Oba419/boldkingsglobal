/**
 * Money handling.
 *
 * Strategy: the database stores naira in NUMERIC(14,2) columns. Everywhere in
 * application code amounts are represented as integer **kobo** (1 naira = 100
 * kobo) so arithmetic is exact. Conversion happens only at the data-access
 * boundary (decimalToKobo / koboToDecimalString).
 */

export type Kobo = number;

/** Maximum supported amount: ₦999,999,999,999.99 — matches NUMERIC(14,2). */
export const MAX_KOBO = 99_999_999_999_999;

function assertKobo(value: number): Kobo {
  if (!Number.isSafeInteger(value) || value < 0 || value > MAX_KOBO) {
    throw new RangeError(`Invalid kobo amount: ${value}`);
  }
  return value;
}

/** Parses a naira amount string such as "1250000", "1,250,000.50" into kobo. */
export function parseNairaToKobo(input: string): Kobo {
  const s = input.trim().replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) {
    throw new RangeError(`Invalid naira amount: "${input}"`);
  }
  const [whole, frac = ""] = s.split(".");
  return assertKobo(Number(whole) * 100 + Number(frac.padEnd(2, "0")));
}

/** Converts a Prisma Decimal (or any value with toFixed / a numeric string) to kobo. */
export function decimalToKobo(value: { toFixed(dp: number): string } | string): Kobo {
  const str = typeof value === "string" ? value : value.toFixed(2);
  return parseNairaToKobo(str);
}

/** Converts kobo to a fixed two-decimal naira string suitable for a Decimal column. */
export function koboToDecimalString(kobo: Kobo): string {
  assertKobo(kobo);
  const whole = Math.floor(kobo / 100);
  const frac = kobo % 100;
  return `${whole}.${frac.toString().padStart(2, "0")}`;
}

/** Multiplies a unit price by a quantity, guarding against overflow. */
export function multiplyKobo(unit: Kobo, quantity: number): Kobo {
  if (!Number.isSafeInteger(quantity) || quantity < 0) {
    throw new RangeError(`Invalid quantity: ${quantity}`);
  }
  return assertKobo(unit * quantity);
}

export function sumKobo(values: Kobo[]): Kobo {
  return assertKobo(values.reduce((acc, v) => acc + v, 0));
}

const wholeFormatter = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0, minimumFractionDigits: 0 });
const fractionFormatter = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 2, minimumFractionDigits: 2 });

/**
 * Formats kobo as naira, e.g. 125000000 → "₦1,250,000" and 125050 → "₦1,250.50".
 * Uses an explicit "₦" prefix so output is identical across runtimes and locales.
 */
export function formatNaira(kobo: Kobo): string {
  const negative = kobo < 0;
  const abs = Math.abs(kobo);
  const naira = abs / 100;
  const body = abs % 100 === 0 ? wholeFormatter.format(naira) : fractionFormatter.format(naira);
  return `${negative ? "-" : ""}₦${body}`;
}

/** Plain naira number string for form inputs (no symbol, no separators). */
export function koboToInputValue(kobo: Kobo | null | undefined): string {
  if (kobo == null) return "";
  return kobo % 100 === 0 ? String(kobo / 100) : koboToDecimalString(kobo);
}
