import { describe, expect, it } from "vitest";
import { resolveSiteUrl } from "@/lib/site-url";

describe("resolveSiteUrl", () => {
  it("uses APP_URL when valid", () => {
    expect(resolveSiteUrl({ APP_URL: "https://shop.example.com/" })).toBe("https://shop.example.com");
  });

  it("adds https to a bare host", () => {
    expect(resolveSiteUrl({ APP_URL: "shop.example.com" })).toBe("https://shop.example.com");
  });

  it("falls back to the Vercel production domain when APP_URL is empty or malformed", () => {
    expect(resolveSiteUrl({ APP_URL: "", VERCEL_PROJECT_PRODUCTION_URL: "boldkings.vercel.app" })).toBe("https://boldkings.vercel.app");
    expect(resolveSiteUrl({ APP_URL: "http://", VERCEL_URL: "preview-abc.vercel.app" })).toBe("https://preview-abc.vercel.app");
  });

  it("defaults to localhost", () => {
    expect(resolveSiteUrl({})).toBe("http://localhost:3000");
  });
});
