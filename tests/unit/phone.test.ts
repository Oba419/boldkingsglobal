import { describe, expect, it } from "vitest";
import { isNigerianMobile, telHref, toInternationalDigits, toLocalNigerian, whatsappHref } from "@/lib/phone";

describe("Nigerian phone numbers", () => {
  it.each(["07063383383", "09024192157", "08012345678", "+2347063383383", "2347063383383", "0706 338 3383", "0706-338-3383"])("accepts %j", (n) => {
    expect(isNigerianMobile(n)).toBe(true);
  });

  it.each(["", "0706338338", "070633833831", "06063383383", "07263383383", "+447063383383", "abc"])("rejects %j", (n) => {
    expect(isNigerianMobile(n)).toBe(false);
  });

  it("normalises to local and international forms", () => {
    expect(toLocalNigerian("+234 706 338 3383")).toBe("07063383383");
    expect(toInternationalDigits("07063383383")).toBe("2347063383383");
    expect(toLocalNigerian("12345")).toBeNull();
  });

  it("builds tel: and WhatsApp links", () => {
    expect(telHref("07063383383")).toBe("tel:+2347063383383");
    expect(whatsappHref("07063383383", "Hi there")).toBe("https://wa.me/2347063383383?text=Hi%20there");
    expect(whatsappHref("not a number")).toBeNull();
  });
});
