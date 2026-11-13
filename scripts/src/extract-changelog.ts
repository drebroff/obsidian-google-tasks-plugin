import { readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");

function error(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function extractChangelogContent(version: string): string {
  const changelogPath = join(REPO_ROOT, "CHANGELOG.md");
  const changelog = readFileSync(changelogPath, "utf-8");

  // Find the section for this version
  const versionRegex = new RegExp(
    `## v${version.replace(/\./g, "\\.")} \\([^)]+\\)([\\s\\S]*?)(?=## v|$)`,
  );
  const match = changelog.match(versionRegex);

  if (!match) {
    error(`Could not find changelog content for version ${version}`);
  }

  return match[1].trim();
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.length !== 1) {
    error("Usage: npm run extract-changelog -- <version>");
  }

  const version = args[0];

  // Only the changelog content may be written to stdout: CI redirects it
  // into the release notes file.
  process.stdout.write(`${extractChangelogContent(version)}\n`);
}

main();
