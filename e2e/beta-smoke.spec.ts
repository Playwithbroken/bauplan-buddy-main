import { expect, test } from "@playwright/test";

const coreRoutes = [
  { path: "/#/dashboard", title: "Dashboard" },
  { path: "/#/projects", title: "Projekte" },
  { path: "/#/quotes", title: "Angebote" },
  { path: "/#/invoices", title: "Rechnungen" },
  { path: "/#/calendar", title: "Kalender" },
  { path: "/#/customers", title: "Kunden" },
  { path: "/#/documents", title: "Dokumente" },
  { path: "/#/settings", title: "Einstellungen" },
];

const entityFlows = [
  {
    path: "/#/projects",
    placeholder: "Projektname eingeben",
    title: "E2E Beta Projekt",
    status: "Pausiert",
  },
  {
    path: "/#/quotes",
    placeholder: "Angebotstitel eingeben",
    title: "E2E Beta Angebot",
    status: "Gesendet",
  },
  {
    path: "/#/invoices",
    placeholder: "Rechnungstitel eingeben",
    title: "E2E Beta Rechnung",
    status: "Exportiert",
  },
  {
    path: "/#/calendar",
    placeholder: "Termin eingeben",
    title: "E2E Beta Termin",
    status: "Erledigt",
  },
  {
    path: "/#/customers",
    placeholder: "Kundenname eingeben",
    title: "E2E Beta Kunde",
    status: "Interessent",
  },
  {
    path: "/#/documents",
    placeholder: "Dokumentname eingeben",
    title: "E2E Beta Dokument.pdf",
    status: "Geprüft",
  },
];

test.describe("Desktop beta smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#/login", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      localStorage.removeItem("bauplan_beta_user");
      localStorage.removeItem("bauplan_beta_store");
    });
    await page.goto("/#/login", { waitUntil: "domcontentloaded" });
  });

  test("logs in and opens the dashboard without runtime errors", async ({
    page,
  }) => {
    const runtimeErrors: string[] = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push(message.text());
    });

    await page.getByRole("button", { name: "Anmelden" }).click();

    await expect(page).toHaveURL(/#\/dashboard/);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    expect(runtimeErrors).toEqual([]);
  });

  test("keeps the reduced beta navigation available", async ({ page }) => {
    await page.getByRole("button", { name: "Anmelden" }).click();

    for (const route of coreRoutes) {
      await page.goto(route.path);
      await expect(
        page.getByRole("heading", { level: 1, name: route.title }),
      ).toBeVisible();
    }
  });

  test("persists a locally created project after reload", async ({ page }) => {
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.goto("/#/projects");

    await page
      .getByPlaceholder("Projektname eingeben")
      .fill("E2E Beta Projekt");
    await page.getByRole("button", { name: "Neu anlegen" }).click();
    await expect(page.getByText("E2E Beta Projekt")).toBeVisible();

    await page
      .getByRole("button", { name: "Eintrag E2E Beta Projekt bearbeiten" })
      .click();
    await page
      .getByLabel("Titel für E2E Beta Projekt bearbeiten")
      .fill("E2E Beta Projekt Bearbeitet");
    await page.getByRole("button", { name: "Speichern" }).click();
    await expect(page.getByText("E2E Beta Projekt Bearbeitet")).toBeVisible();

    await page.reload();
    await expect(page.getByText("E2E Beta Projekt Bearbeitet")).toBeVisible();

    await page.getByLabel("Projekte filtern").fill("Bearbeitet");
    await expect(page.getByText("E2E Beta Projekt Bearbeitet")).toBeVisible();
    await page.getByLabel("Projekte filtern").fill("kein treffer");
    await expect(page.getByText("E2E Beta Projekt Bearbeitet")).toBeHidden();
    await expect(page.getByText("Keine passenden Einträge gefunden.")).toBeVisible();
  });

  test("persists local records and status changes for core modules", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Anmelden" }).click();

    for (const flow of entityFlows) {
      await page.goto(flow.path);

      await page.getByPlaceholder(flow.placeholder).fill(flow.title);
      await page.getByRole("button", { name: "Neu anlegen" }).click();
      await expect(page.getByText(flow.title)).toBeVisible();

      const statusSelect = page.getByLabel(`Status für ${flow.title}`);
      await statusSelect.selectOption(flow.status);
      await expect(statusSelect).toHaveValue(flow.status);

      await page.reload();
      await expect(page.getByText(flow.title)).toBeVisible();
      await expect(page.getByLabel(`Status für ${flow.title}`)).toHaveValue(
        flow.status,
      );
    }
  });

  test("deletes a local document entry", async ({ page }) => {
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.goto("/#/documents");

    await page
      .getByPlaceholder("Dokumentname eingeben")
      .fill("E2E Beta Wegwerf-Dokument.pdf");
    await page.getByRole("button", { name: "Neu anlegen" }).click();
    await expect(page.getByText("E2E Beta Wegwerf-Dokument.pdf")).toBeVisible();

    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toContain("E2E Beta Wegwerf-Dokument.pdf");
      await dialog.dismiss();
    });
    await page
      .getByRole("button", {
        name: "Eintrag E2E Beta Wegwerf-Dokument.pdf löschen",
      })
      .click();
    await expect(page.getByText("E2E Beta Wegwerf-Dokument.pdf")).toBeVisible();

    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toContain("E2E Beta Wegwerf-Dokument.pdf");
      await dialog.accept();
    });
    await page
      .getByRole("button", {
        name: "Eintrag E2E Beta Wegwerf-Dokument.pdf löschen",
      })
      .click();
    await expect(page.getByText("E2E Beta Wegwerf-Dokument.pdf")).toBeHidden();

    await page.reload();
    await expect(page.getByText("E2E Beta Wegwerf-Dokument.pdf")).toBeHidden();

    await page
      .getByPlaceholder("Dokumentname eingeben")
      .fill("E2E Beta Zweites Dokument.pdf");
    await page.getByRole("button", { name: "Neu anlegen" }).click();
    await expect(page.getByText("DOK-002")).toBeVisible();
  });

  test("exports local quote and invoice beta records", async ({ page }) => {
    await page.getByRole("button", { name: "Anmelden" }).click();

    await page.goto("/#/quotes");
    await page
      .getByPlaceholder("Angebotstitel eingeben")
      .fill("E2E Export Angebot");
    await page.getByRole("button", { name: "Neu anlegen" }).click();
    const quoteDownloadPromise = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Eintrag E2E Export Angebot exportieren" })
      .click();
    const quoteDownload = await quoteDownloadPromise;
    expect(quoteDownload.suggestedFilename()).toContain("angebot");

    await page.goto("/#/invoices");
    await page
      .getByPlaceholder("Rechnungstitel eingeben")
      .fill("E2E Export Rechnung");
    await page.getByRole("button", { name: "Neu anlegen" }).click();
    const invoiceDownloadPromise = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Eintrag E2E Export Rechnung exportieren" })
      .click();
    const invoiceDownload = await invoiceDownloadPromise;
    expect(invoiceDownload.suggestedFilename()).toContain("rechnung");
  });

  test("exports and restores local beta data from settings", async ({ page }) => {
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.goto("/#/projects");

    await page
      .getByPlaceholder("Projektname eingeben")
      .fill("E2E Backup Projekt");
    await page.getByRole("button", { name: "Neu anlegen" }).click();
    await expect(page.getByText("E2E Backup Projekt")).toBeVisible();

    await page.goto("/#/settings");
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Daten sichern" }).click();
    const download = await downloadPromise;
    const backupPath = await download.path();
    expect(backupPath).toBeTruthy();

    await page.getByRole("button", { name: "Beta-Demodaten zurücksetzen" }).click();
    await page.goto("/#/projects");
    await expect(page.getByText("E2E Backup Projekt")).toBeHidden();

    await page.goto("/#/settings");
    await page
      .getByLabel("Beta-Datensicherung auswählen")
      .setInputFiles(backupPath!);
    await page.waitForURL("**/#/settings");

    await page.goto("/#/projects");
    await expect(page.getByText("E2E Backup Projekt")).toBeVisible();
  });

  test("exports a support report without raw beta records", async ({ page }) => {
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.goto("/#/settings");

    const downloadPromise = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Supportbericht herunterladen" })
      .click();
    const download = await downloadPromise;
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];

    await new Promise<void>((resolve, reject) => {
      stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on("end", resolve);
      stream.on("error", reject);
    });

    const report = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    expect(report.type).toBe("desktop-beta-support-report");
    expect(report.version).toBe("0.0.2-beta.17");
    expect(report.dataCounts.projects).toBeGreaterThanOrEqual(1);
    expect(JSON.stringify(report)).not.toContain("Wohnhaus Südtor");
  });

  test("recovers from malformed local beta storage", async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem("bauplan_beta_user", JSON.stringify({
        email: "admin@bauplan.de",
        name: "Admin Beta",
        role: "Admin",
      }));
      localStorage.setItem("bauplan_beta_store", JSON.stringify({
        projects: "kaputt",
        quotes: [{ title: "Unvollständiges Angebot" }],
        invoices: null,
      }));
    });

    await page.goto("/#/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("Wohnhaus Südtor", { exact: true })).toBeVisible();

    await page.goto("/#/settings");
    const downloadPromise = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Supportbericht herunterladen" })
      .click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain("supportbericht");
  });

  test("fits the mobile viewport without hiding the primary flow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Anmelden" }).click();

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Projekte/ })).toBeVisible();
  });

  test("keeps core layouts usable on desktop and tablet widths", async ({
    page,
  }) => {
    const viewports = [
      { width: 1366, height: 768, label: "Desktop klein" },
      { width: 1920, height: 1080, label: "Desktop groß" },
      { width: 768, height: 1024, label: "Tablet" },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.goto("/#/login", { waitUntil: "domcontentloaded" });
      await page.getByRole("button", { name: "Anmelden" }).click();

      await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
      await page.goto("/#/projects");
      await expect(
        page.getByRole("heading", { level: 1, name: "Projekte" }),
      ).toBeVisible();
      await expect(page.getByLabel("Projektname eingeben")).toBeVisible();
      await expect(page.getByLabel("Projekte filtern")).toBeVisible();
      await page.goto("/#/settings");
      await expect(
        page.getByRole("button", { name: "Daten sichern" }),
        viewport.label,
      ).toBeVisible();

      await page.evaluate(() => {
        localStorage.removeItem("bauplan_beta_user");
      });
    }
  });
});
