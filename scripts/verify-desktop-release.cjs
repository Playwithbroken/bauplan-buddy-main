#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

function parseArgs(argv) {
  const parsed = {};
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [key, value] = arg.slice(2).split("=");
    parsed[key] = value ?? "true";
  }
  return parsed;
}

function fail(message) {
  process.stderr.write(`\n[verify-desktop-release] ERROR: ${message}\n`);
  process.exit(1);
}

function ensureAnyMatch(files, patterns, label) {
  const matched = files.filter((file) => patterns.some((re) => re.test(file)));
  if (matched.length === 0) {
    fail(`Missing ${label}. Expected one of: ${patterns.map((p) => p.toString()).join(", ")}`);
  }

  return matched;
}

function verifyUnsignedWindowsInstaller(releaseDir, installerName) {
  if (process.platform !== "win32") {
    process.stdout.write(
      "[verify-desktop-release] WARN: skipping Authenticode check outside Windows.\n"
    );
    return;
  }

  const installerPath = path.join(releaseDir, installerName);
  const powershellPath = installerPath.replace(/'/g, "''");
  const powershellCommand = [
    `$signature = Get-AuthenticodeSignature -LiteralPath '${powershellPath}'`,
    "Write-Output $signature.Status",
  ].join("; ");

  let status;
  try {
    status = execFileSync(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", powershellCommand],
      { encoding: "utf8" }
    ).trim();
  } catch (error) {
    fail(`Unable to inspect Authenticode signature for ${installerName}: ${error.message}`);
  }

  if (status !== "NotSigned") {
    fail(`Expected unsigned Windows beta installer, got Authenticode status "${status}".`);
  }

  process.stdout.write(
    `[verify-desktop-release] Authenticode OK: ${installerName} is unsigned.\n`
  );
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const platform = (args.platform || "").toLowerCase();
  const releaseDir = path.resolve(process.cwd(), args.dir || "release");
  const allowUnpacked = String(args.allowUnpacked || "false").toLowerCase() === "true";
  const expectUnsigned = String(args.expectUnsigned || "false").toLowerCase() === "true";

  if (!platform || !["win", "mac"].includes(platform)) {
    fail('Provide --platform=win or --platform=mac');
  }

  if (!fs.existsSync(releaseDir)) {
    fail(`Release directory not found: ${releaseDir}`);
  }

  const files = fs.readdirSync(releaseDir);
  if (files.length === 0) {
    fail(`Release directory is empty: ${releaseDir}`);
  }

  if (platform === "win") {
    if (allowUnpacked && fs.existsSync(path.join(releaseDir, "win-unpacked", "Bauplan Buddy.exe"))) {
      process.stdout.write(
        `[verify-desktop-release] OK (${platform}, unpacked) in ${releaseDir}\nFiles: ${files.length}\n`
      );
      return;
    }

    const installers = ensureAnyMatch(files, [/\.exe$/i], "Windows installer (.exe)");
    ensureAnyMatch(
      files,
      [/latest\.yml$/i, /beta\.yml$/i],
      "Windows update metadata (latest.yml or beta.yml)"
    );
    ensureAnyMatch(files, [/\.blockmap$/i], "Windows blockmap");

    if (expectUnsigned) {
      verifyUnsignedWindowsInstaller(releaseDir, installers[0]);
    }
  }

  if (platform === "mac") {
    ensureAnyMatch(files, [/\.dmg$/i], "macOS installer (.dmg)");
    ensureAnyMatch(files, [/-mac\.yml$/i, /latest-mac\.yml$/i], "macOS update metadata");
    ensureAnyMatch(files, [/\.zip$/i], "macOS zip artifact");
  }

  process.stdout.write(
    `[verify-desktop-release] OK (${platform}) in ${releaseDir}\nFiles: ${files.length}\n`
  );
}

main();
