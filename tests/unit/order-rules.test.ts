import { describe, expect, it } from "vitest";
import { allowedManualPaymentTransitions, canRecordPayment, canTransitionOrder, ORDER_STATUSES } from "@/lib/order-rules";

describe("order lifecycle", () => {
  it("moves forward one step at a time", () => {
    expect(canTransitionOrder("PENDING", "CONFIRMED")).toBe(true);
    expect(canTransitionOrder("CONFIRMED", "PROCESSING")).toBe(true);
    expect(canTransitionOrder("PROCESSING", "SHIPPED")).toBe(true);
    expect(canTransitionOrder("SHIPPED", "DELIVERED")).toBe(true);
    expect(canTransitionOrder("PENDING", "SHIPPED")).toBe(false);
    expect(canTransitionOrder("DELIVERED", "PENDING")).toBe(false);
  });

  it("allows cancellation only before shipping", () => {
    expect(canTransitionOrder("PENDING", "CANCELLED")).toBe(true);
    expect(canTransitionOrder("PROCESSING", "CANCELLED")).toBe(true);
    expect(canTransitionOrder("SHIPPED", "CANCELLED")).toBe(false);
    expect(canTransitionOrder("DELIVERED", "CANCELLED")).toBe(false);
  });

  it("treats delivered and cancelled as terminal", () => {
    for (const to of ORDER_STATUSES) {
      expect(canTransitionOrder("DELIVERED", to)).toBe(false);
      expect(canTransitionOrder("CANCELLED", to)).toBe(false);
    }
  });
});

describe("manual payment recording", () => {
  it("never lets staff mark an online payment as paid", () => {
    expect(canRecordPayment("PAYSTACK", "PENDING", "PAID", "PENDING")).toBe(false);
    expect(canRecordPayment("PAYSTACK", "FAILED", "PAID", "PENDING")).toBe(false);
  });

  it("lets staff confirm offline payments", () => {
    expect(canRecordPayment("PAY_ON_DELIVERY", "UNPAID", "PAID", "SHIPPED")).toBe(true);
    expect(canRecordPayment("BANK_TRANSFER", "UNPAID", "FAILED", "PENDING")).toBe(true);
    expect(canRecordPayment("BANK_TRANSFER", "FAILED", "PAID", "PENDING")).toBe(true);
  });

  it("blocks offline payment changes on cancelled orders", () => {
    expect(allowedManualPaymentTransitions("BANK_TRANSFER", "UNPAID", "CANCELLED")).toEqual([]);
  });

  it("allows refunds of any paid order, including cancelled and online ones", () => {
    expect(allowedManualPaymentTransitions("PAYSTACK", "PAID", "CANCELLED")).toEqual(["REFUNDED"]);
    expect(allowedManualPaymentTransitions("PAY_ON_DELIVERY", "PAID", "DELIVERED")).toEqual(["REFUNDED"]);
  });

  it("has no transitions out of REFUNDED", () => {
    expect(allowedManualPaymentTransitions("BANK_TRANSFER", "REFUNDED", "DELIVERED")).toEqual([]);
  });
});
