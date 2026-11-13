import pc from "picocolors";

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");

function logStarted(message: string): void {
  console.log(pc.cyan(`→ ${message}`));
}

function logCompleted(message: string): void {
  console.log(pc.green(`✓ ${message}`));
}

function error(message: string): never {
  console.error(pc.red(`✗ ${message}`));
  process.exit(1);
}

function validateVersion(version: string): void {
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    error(`Invalid version format: ${version}. Expected format: x.y.z`);
  }
}

function updateChangelog(version: string): void {
  logStarted("Updating changelog...");
  const changelogPath = join(REPO_ROOT, "CHANGELOG.md");
  const changelog = readFileSync(changelogPath, "utf-8");

  // Find the "Unreleased" section and replace with version + date
  const today = new Date().toISOString().split("T")[0];
  const updated = changelog.replace(/## Unreleased/, `## v${version} (${today})`);

  if (updated === changelog) {
    error(
      'Could not find "## Unreleased" section in CHANGELOG.md. Please ensure the changelog has an Unreleased section.',
    );
  }

  writeFileSync(changelogPath, updated);
  logCompleted("Updated changelog with version and date");
}

function updateVersionFiles(version: string): void {
  logStarted("Updating version files...");

  // Update manifest.json
  const manifestPath = join(REPO_ROOT, "manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as {
    version: string;
    minAppVersion: string;
  };
  manifest.version = version;

  // Update plugin/package.json
  const packagePath = join(REPO_ROOT, "plugin", "package.json");
  const packageJson = JSON.parse(readFileSync(packagePath, "utf-8")) as {
    version: string;
    dependencies?: Record<string, string>;
  };
  packageJson.version = version;
  writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

  // Update manifest.minAppVersion with the obsidian version from plugin/package.json
  const obsidianVersion = packageJson.dependencies?.obsidian;
  if (obsidianVersion) {
    manifest.minAppVersion = obsidianVersion;
  }
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  // Update versions.json
  const versionsPath = join(REPO_ROOT, "versions.json");
  const versions = JSON.parse(readFileSync(versionsPath, "utf-8")) as Record<string, string>;
  const minAppVersion = manifest.minAppVersion;
  versions[version] = minAppVersion;

  // Re-sort versions in descending order
  const sortedVersions = Object.fromEntries(
    Object.entries(versions).sort(([a], [b]) => {
      const [aMajor, aMinor, aPatch] = a.split(".").map(Number);
      const [bMajor, bMinor, bPatch] = b.split(".").map(Number);

      if (aMajor !== bMajor) {
        return bMajor - aMajor;
      }
      if (aMinor !== bMinor) {
        return bMinor - aMinor;
      }
      return bPatch - aPatch;
    }),
  );

  writeFileSync(versionsPath, `${JSON.stringify(sortedVersions, null, 2)}\n`);
  logCompleted("Updated version files");

  logStarted("Running npm install to update package-lock.json...");
  execSync("npm install", { cwd: REPO_ROOT, stdio: "inherit" });
  logCompleted("Updated package-lock.json");
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.length !== 1) {
    error("Usage: npm run prepare-release -- <version>");
  }

  const version = args[0];
  validateVersion(version);

  logStarted(`Preparing release files for version ${version}...`);
  updateChangelog(version);
  updateVersionFiles(version);
  logCompleted(`Release files prepared for version ${version}`);
}

main();
