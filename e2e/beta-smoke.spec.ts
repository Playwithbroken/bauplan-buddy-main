import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

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
      localStorage.removeItem("bauplan_offline_user");
      localStorage.removeItem("bauplan_beta_user");
      localStorage.removeItem("bauplan_beta_store");
      localStorage.removeItem("bauplan_beta_print_settings");
    });
    await page.goto("/#/login", { waitUntil: "domcontentloaded" });
    try {
      await expect(
        page.getByRole("button", { name: "Anmelden" }),
      ).toBeVisible({ timeout: 15000 });
    } catch {
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(
        page.getByRole("button", { name: "Anmelden" }),
      ).toBeVisible({ timeout: 15000 });
    }
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

  test("persists local customer and project relationships", async ({ page }) => {
    await page.getByRole("button", { name: "Anmelden" }).click();

    await page.goto("/#/customers");
    await page.getByPlaceholder("Kundenname eingeben").fill("E2E Beziehung Kunde");
    await page.getByRole("button", { name: "Neu anlegen" }).click();
    await expect(page.getByText("E2E Beziehung Kunde")).toBeVisible();

    await page.goto("/#/projects");
    await page
      .getByPlaceholder("Projektname eingeben")
      .fill("E2E Beziehung Projekt");
    await page.getByRole("button", { name: "Neu anlegen" }).click();
    await page
      .getByLabel("Kunde für E2E Beziehung Projekt")
      .selectOption({ label: "E2E Beziehung Kunde" });
    await expect(page.getByText("Kontext: E2E Beziehung Kunde")).toBeVisible();

    await page.goto("/#/quotes");
    await page
      .getByPlaceholder("Angebotstitel eingeben")
      .fill("E2E Beziehung Angebot");
    await page.getByRole("button", { name: "Neu anlegen" }).click();
    await page
      .getByLabel("Kunde für E2E Beziehung Angebot")
      .selectOption({ label: "E2E Beziehung Kunde" });
    await page
      .getByLabel("Projekt für E2E Beziehung Angebot")
      .selectOption({ label: "E2E Beziehung Projekt" });
    await expect(
      page.getByText("Kontext: E2E Beziehung Kunde / E2E Beziehung Projekt"),
    ).toBeVisible();

    await page.reload();
    await expect(
      page.getByText("Kontext: E2E Beziehung Kunde / E2E Beziehung Projekt"),
    ).toBeVisible();
    await expect(page.getByLabel("Kunde für E2E Beziehung Angebot")).toHaveValue(
      "KND-002",
    );
    await expect(page.getByLabel("Projekt für E2E Beziehung Angebot")).toHaveValue(
      "PRJ-002",
    );

    await page.goto("/#/projects");
    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toContain("E2E Beziehung Projekt");
      await dialog.accept();
    });
    await page
      .getByRole("button", { name: "Eintrag E2E Beziehung Projekt löschen" })
      .click();

    await page.goto("/#/quotes");
    await expect(page.getByLabel("Projekt für E2E Beziehung Angebot")).toHaveValue(
      "",
    );
    await expect(page.getByText("Kontext: E2E Beziehung Kunde")).toBeVisible();

    await page.goto("/#/customers");
    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toContain("E2E Beziehung Kunde");
      await dialog.accept();
    });
    await page
      .getByRole("button", { name: "Eintrag E2E Beziehung Kunde löschen" })
      .click();

    await page.goto("/#/quotes");
    await expect(page.getByLabel("Kunde für E2E Beziehung Angebot")).toHaveValue(
      "",
    );
    await expect(page.getByText("Kontext: E2E Beziehung")).toHaveCount(0);
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

  test("imports a local desktop document and keeps its metadata", async ({ page }) => {
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.goto("/#/documents");
    await page.evaluate(() => {
      Object.defineProperty(window, "desktop", {
        configurable: true,
        value: {
          isDesktop: true,
          openFileDialog: async () => ({
            canceled: false,
            filePaths: ["C:\\Users\\Tester\\Desktop\\Beta Import.pdf"],
          }),
          readFile: async () => ({
            ok: true,
            path: "C:\\Users\\Tester\\Desktop\\Beta Import.pdf",
            name: "Beta Import.pdf",
            mimeType: "application/pdf",
            size: 2048,
            dataBase64: "YmV0YQ==",
          }),
          writeFile: async () => ({
            ok: true,
            path: "C:\\Users\\Tester\\Documents\\Bauplan Buddy\\Beta Import.pdf",
            name: "Beta Import.pdf",
            mimeType: "application/pdf",
          }),
          fileExists: async () => ({ ok: true, exists: true }),
          openPath: async () => ({ ok: true }),
        },
      });
    });

    await page.getByRole("button", { name: "Datei importieren" }).click();
    await expect(page.getByText("Beta Import.pdf")).toBeVisible();
    await expect(page.getByText("Importiert").first()).toBeVisible();
    await expect(page.getByText("2 KB")).toBeVisible();

    await page.reload();
    await expect(page.getByText("Beta Import.pdf")).toBeVisible();
    await expect(page.getByRole("button", { name: "Datei Beta Import.pdf öffnen" })).toBeVisible();
  });

  test("exports local quote and invoice beta records", async ({ page }) => {
    await page.getByRole("button", { name: "Anmelden" }).click();

    await page.goto("/#/quotes");
    await page
      .getByPlaceholder("Angebotstitel eingeben")
      .fill("E2E Export Angebot");
    await page.getByRole("button", { name: "Neu anlegen" }).click();
    await page
      .getByLabel("Kunde für E2E Export Angebot")
      .selectOption({ label: "Familie Müller" });
    await page
      .getByLabel("Projekt für E2E Export Angebot")
      .selectOption({ label: "Wohnhaus Südtor" });
    const quoteDownloadPromise = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Eintrag E2E Export Angebot exportieren" })
      .click();
    const quoteDownload = await quoteDownloadPromise;
    expect(quoteDownload.suggestedFilename()).toContain("angebot");
    const quotePath = await quoteDownload.path();
    expect(quotePath).toBeTruthy();
    const quoteExport = JSON.parse(await readFile(quotePath!, "utf8"));
    expect(quoteExport.context).toMatchObject({
      customerTitle: "Familie Müller",
      projectTitle: "Wohnhaus Südtor",
      label: "Familie Müller / Wohnhaus Südtor",
    });

    await page.goto("/#/invoices");
    await page
      .getByPlaceholder("Rechnungstitel eingeben")
      .fill("E2E Export Rechnung");
    await page.getByRole("button", { name: "Neu anlegen" }).click();
    await page
      .getByLabel("Kunde für E2E Export Rechnung")
      .selectOption({ label: "Familie Müller" });
    await page
      .getByLabel("Projekt für E2E Export Rechnung")
      .selectOption({ label: "Wohnhaus Südtor" });
    const invoiceDownloadPromise = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Eintrag E2E Export Rechnung exportieren" })
      .click();
    const invoiceDownload = await invoiceDownloadPromise;
    expect(invoiceDownload.suggestedFilename()).toContain("rechnung");
    const invoicePath = await invoiceDownload.path();
    expect(invoicePath).toBeTruthy();
    const invoiceExport = JSON.parse(await readFile(invoicePath!, "utf8"));
    expect(invoiceExport.context).toMatchObject({
      customerTitle: "Familie Müller",
      projectTitle: "Wohnhaus Südtor",
      label: "Familie Müller / Wohnhaus Südtor",
    });
  });

  test("persists print layout settings and opens a print preview", async ({ page }) => {
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.goto("/#/settings");

    await page
      .getByLabel("Briefkopf für Drucklayout")
      .fill("Bauplan Buddy GmbH\nBeta-Allee 7\n10115 Berlin");
    await page
      .getByLabel("Brieffuß für Drucklayout")
      .fill("Steuernummer folgt\nDanke für Ihr Vertrauen.");
    await page.getByLabel("Ausrichtung für Drucklayout").selectOption("landscape");
    await page.getByLabel("Ränder für Drucklayout").selectOption("compact");
    const printPreview = page.getByRole("region", {
      name: "Drucklayout Vorschau",
    });
    await expect(printPreview.getByText("Bauplan Buddy GmbH")).toBeVisible();
    await expect(printPreview.getByText("Steuernummer folgt")).toBeVisible();
    await expect(printPreview.getByText("A4, Querformat, schmale Ränder")).toBeVisible();

    await page.reload();
    await expect(page.getByLabel("Briefkopf für Drucklayout")).toHaveValue(
      "Bauplan Buddy GmbH\nBeta-Allee 7\n10115 Berlin",
    );
    await expect(page.getByLabel("Brieffuß für Drucklayout")).toHaveValue(
      "Steuernummer folgt\nDanke für Ihr Vertrauen.",
    );
    await expect(page.getByLabel("Ausrichtung für Drucklayout")).toHaveValue(
      "landscape",
    );
    await expect(page.getByLabel("Ränder für Drucklayout")).toHaveValue("compact");

    await page.goto("/#/quotes");
    await page
      .getByPlaceholder("Angebotstitel eingeben")
      .fill("E2E Druck Angebot");
    await page.getByRole("button", { name: "Neu anlegen" }).click();
    await page
      .getByLabel("Kunde für E2E Druck Angebot")
      .selectOption({ label: "Familie Müller" });
    await page
      .getByLabel("Projekt für E2E Druck Angebot")
      .selectOption({ label: "Wohnhaus Südtor" });
    const previewPromise = page.waitForEvent("popup");
    await page
      .getByRole("button", {
        name: "Eintrag E2E Druck Angebot Druckansicht öffnen",
      })
      .click();
    const preview = await previewPromise;
    await expect(preview.getByText("Bauplan Buddy GmbH")).toBeVisible();
    await expect(preview.getByText("E2E Druck Angebot")).toBeVisible();
    await expect(preview.getByText("Familie Müller")).toBeVisible();
    await expect(preview.getByText("Wohnhaus Südtor")).toBeVisible();
    await expect(preview.getByText("A4, Querformat, schmale Ränder")).toBeVisible();
    await expect(preview.getByRole("button", { name: "Drucken" })).toBeVisible();
    await preview.close();
  });

  test("exports and restores local beta data from settings", async ({ page }) => {
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.goto("/#/projects");

    await page
      .getByPlaceholder("Projektname eingeben")
      .fill("E2E Backup Projekt");
    await page.getByRole("button", { name: "Neu anlegen" }).click();
    await expect(page.getByText("E2E Backup Projekt")).toBeVisible();

    await page.goto("/#/documents");
    await page.evaluate(() => {
      Object.defineProperty(window, "desktop", {
        configurable: true,
        value: {
          isDesktop: true,
          openFileDialog: async () => ({
            canceled: false,
            filePaths: ["C:\\Users\\Tester\\Desktop\\Backup Plan.pdf"],
          }),
          readFile: async () => ({
            ok: true,
            path: "C:\\Users\\Tester\\Desktop\\Backup Plan.pdf",
            name: "Backup Plan.pdf",
            mimeType: "application/pdf",
            size: 4096,
            dataBase64: "ZG9rdW1lbnQ=",
          }),
          writeFile: async () => ({
            ok: true,
            path: "C:\\Users\\Tester\\Documents\\Bauplan Buddy\\Backup Plan.pdf",
            name: "Backup Plan.pdf",
            mimeType: "application/pdf",
          }),
        },
      });
    });
    await page.getByRole("button", { name: "Datei importieren" }).click();
    await expect(page.getByText("Backup Plan.pdf")).toBeVisible();

    await page.goto("/#/settings");
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Daten sichern" }).click();
    const download = await downloadPromise;
    const backupPath = await download.path();
    expect(backupPath).toBeTruthy();
    const backupStream = await download.createReadStream();
    const backupChunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      backupStream.on("data", (chunk) => backupChunks.push(Buffer.from(chunk)));
      backupStream.on("end", resolve);
      backupStream.on("error", reject);
    });
    const backupJson = JSON.parse(Buffer.concat(backupChunks).toString("utf8"));
    expect(backupJson.documentFiles).toHaveLength(1);
    expect(backupJson.documentFiles[0].filename).toBe("Backup Plan.pdf");
    expect(backupJson.documentFiles[0].dataBase64).toBe("ZG9rdW1lbnQ=");

    await page.getByRole("button", { name: "Beta-Demodaten zurücksetzen" }).click();
    await page.goto("/#/projects");
    await expect(page.getByText("E2E Backup Projekt")).toBeHidden();

    await page.goto("/#/settings");
    await page.evaluate(() => {
      Object.defineProperty(window, "desktop", {
        configurable: true,
        value: {
          isDesktop: true,
          writeFile: async () => ({
            ok: true,
            path: "C:\\Users\\Tester\\Documents\\Bauplan Buddy\\Restored Backup Plan.pdf",
            name: "Restored Backup Plan.pdf",
            mimeType: "application/pdf",
          }),
        },
      });
    });
    await page
      .getByLabel("Beta-Datensicherung auswählen")
      .setInputFiles(backupPath!);
    await page.waitForURL("**/#/settings");

    await page.goto("/#/projects");
    await expect(page.getByText("E2E Backup Projekt")).toBeVisible();
    await page.goto("/#/documents");
    await expect(page.getByText("Backup Plan.pdf")).toBeVisible();
    await expect(page.getByText("Aus Datensicherung wiederhergestellt")).toBeVisible();
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
    await page.getByRole("button", { name: "Anmelden" }).click();
    await page.evaluate(() => {
      localStorage.setItem("bauplan_beta_user", JSON.stringify({
        email: "admin@bauplan.de",
        name: "Admin Beta",
        role: "Admin",
      }));
      localStorage.setItem("bauplan_offline_user", JSON.stringify({
        id: "offline-admin@bauplan.de",
        email: "admin@bauplan.de",
        firstName: "Admin",
        lastName: "",
        name: "Admin",
        role: "ADMIN",
        status: "ACTIVE",
        permissions: [],
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
        localStorage.removeItem("bauplan_offline_user");
        localStorage.removeItem("bauplan_beta_user");
      });
    }
  });
});
