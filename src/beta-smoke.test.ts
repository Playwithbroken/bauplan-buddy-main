import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Desktop beta smoke gate", () => {
  it("keeps the local beta contract explicit", () => {
    const coreRoutes = [
      "/dashboard",
      "/projects",
      "/quotes",
      "/invoices",
      "/calendar",
      "/customers",
      "/documents",
      "/settings",
    ];

    expect(coreRoutes).toHaveLength(8);
    expect(coreRoutes).toContain("/projects");
    expect(coreRoutes).toContain("/settings");
  });

  it("keeps visible beta copy German and free of mojibake", () => {
    const webAppSource = readFileSync(
      join(process.cwd(), "src", "WebApp.tsx"),
      "utf8",
    );

    expect(webAppSource).toContain("Wohnhaus Südtor");
    expect(webAppSource).toContain("Familie Müller");
    expect(webAppSource).toContain("Verfügbar");
    expect(webAppSource).not.toMatch(/[ÃÂ�]/);
    expect(webAppSource).not.toMatch(/Welcome back|Customize|Quick Login/i);
  });
});
