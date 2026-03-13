#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [k, v] = arg.slice(2).split("=");
    out[k] = v ?? "true";
  }
  return out;
}

function fail(message) {
  process.stderr.write(`\n[desktop-release-preflight] ERROR: ${message}\n`);
  process.exit(1);
}

function warn(message) {
  process.stdout.write(`[desktop-release-preflight] WARN: ${message}\n`);
}

function info(message) {
  process.stdout.write(`[desktop-release-preflight] ${message}\n`);
}

function isSemverLike(version) {
  return /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version);
}

function requireEnv(names) {
  const missing = names.filter((name) => !process.env[name] || !String(process.env[name]).trim());
  if (missing.length > 0) {
    fail(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

function findMissingEnv(names) {
  return names.filter((name) => !process.env[name] || !String(process.env[name]).trim());
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const platform = (args.platform || "").toLowerCase();
  const publish = String(args.publish || "false").toLowerCase() === "true";
  const eventName = String(process.env.GITHUB_EVENT_NAME || "").toLowerCase();
  const envTag =
    process.env.GITHUB_REF_TYPE === "tag" ? process.env.GITHUB_REF_NAME || "" : "";
  const tag = args.tag || envTag;

  if (!["win", "mac"].includes(platform)) {
    fail('Provide --platform=win or --platform=mac');
  }

  const packagePath = path.resolve(process.cwd(), "package.json");
  if (!fs.existsSync(packagePath)) {
    fail(`package.json not found at ${packagePath}`);
  }

  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  const version = String(pkg.version || "").trim();
  const isPrerelease = version.includes("-");
  if (!version) {
    fail("package.json version is empty");
  }
  if (!isSemverLike(version)) {
    fail(`package.json version is not semver-like: "${version}"`);
  }

  if (tag) {
    const normalized = tag.startsWith("v") ? tag.slice(1) : tag;
    if (normalized !== version) {
      fail(`Tag/version mismatch. tag="${tag}" package.json="${version}"`);
    }
  } else {
    warn("No tag provided (--tag=...); skipping tag/version match check.");
  }

  if (publish) {
    requireEnv(["GH_TOKEN"]);

    const signingEnv = ["CSC_LINK", "CSC_KEY_PASSWORD"];
    if (platform === "mac") {
      signingEnv.push("APPLE_ID", "APPLE_APP_SPECIFIC_PASSWORD", "APPLE_TEAM_ID");
    }
    const missingSigningEnv = findMissingEnv(signingEnv);
    if (missingSigningEnv.length > 0) {
      if (eventName === "workflow_dispatch" || isPrerelease) {
        warn(
          `Missing signing/notarization env for beta publish; continuing with unsigned artifacts: ${missingSigningEnv.join(", ")}`
        );
      } else {
        fail(`Missing required environment variables: ${missingSigningEnv.join(", ")}`);
      }
    }
  } else {
    info("Publish disabled; signing/notarization secrets are optional for this run.");
  }

  info(`OK: platform=${platform}, publish=${publish}, version=${version}`);
}

main();
