#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

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
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const platform = (args.platform || "").toLowerCase();
  const releaseDir = path.resolve(process.cwd(), args.dir || "release");

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
    ensureAnyMatch(files, [/\.exe$/i], "Windows installer (.exe)");
    ensureAnyMatch(
      files,
      [/latest\.yml$/i, /beta\.yml$/i],
      "Windows update metadata (latest.yml or beta.yml)"
    );
    ensureAnyMatch(files, [/\.blockmap$/i], "Windows blockmap");
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
