import { describe, expect, it } from "vitest";
import { decimalToKobo, formatNaira, koboToDecimalString, koboToInputValue, MAX_KOBO, multiplyKobo, parseNairaToKobo, sumKobo } from "@/lib/money";

describe("parseNairaToKobo", () => {
  it.each([
    ["0", 0],
    ["1", 100],
    ["1250000", 125_000_000],
    ["1,250,000", 125_000_000],
    ["1250.5", 125_050],
    ["1250.05", 125_005],
    [" 99.99 ", 9_999],
  ])("parses %j as %d kobo", (input, expected) => {
    expect(parseNairaToKobo(input)).toBe(expected);
  });

  it.each(["", "abc", "-5", "1.234", "1e5", "₦100", "12.", ".5", "1 000"])("rejects %j", (input) => {
    expect(() => parseNairaToKobo(input)).toThrow(RangeError);
  });

  it("rejects amounts beyond NUMERIC(14,2)", () => {
    expect(() => parseNairaToKobo("1000000000000")).toThrow(RangeError);
    expect(parseNairaToKobo("999999999999.99")).toBe(MAX_KOBO);
  });
});

describe("conversions", () => {
  it("round-trips decimal strings exactly", () => {
    for (const kobo of [0, 1, 99, 100, 125_050, 125_000_000, MAX_KOBO]) {
      expect(decimalToKobo(koboToDecimalString(kobo))).toBe(kobo);
    }
  });

  it("accepts Decimal-like values", () => {
    expect(decimalToKobo({ toFixed: () => "1499.90" })).toBe(149_990);
  });

  it("avoids floating-point drift (0.1 + 0.2)", () => {
    expect(sumKobo([parseNairaToKobo("0.1"), parseNairaToKobo("0.2")])).toBe(30);
  });

  it("multiplies with overflow protection", () => {
    expect(multiplyKobo(52_000_000, 3)).toBe(156_000_000);
    expect(() => multiplyKobo(MAX_KOBO, 2)).toThrow(RangeError);
    expect(() => multiplyKobo(100, 1.5)).toThrow(RangeError);
    expect(() => multiplyKobo(100, -1)).toThrow(RangeError);
  });
});

describe("formatting", () => {
  it("formats whole and fractional naira", () => {
    expect(formatNaira(125_000_000)).toBe("₦1,250,000");
    expect(formatNaira(125_050)).toBe("₦1,250.50");
    expect(formatNaira(0)).toBe("₦0");
  });

  it("produces plain input values", () => {
    expect(koboToInputValue(125_000_000)).toBe("1250000");
    expect(koboToInputValue(125_050)).toBe("1250.50");
    expect(koboToInputValue(null)).toBe("");
  });
});
