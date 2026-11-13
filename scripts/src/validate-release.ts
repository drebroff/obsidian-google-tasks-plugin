import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");

const REQUIRED_ASSETS = ["main.js", "manifest.json", "styles.css"];

function error(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.length !== 1) {
    error("Usage: npm run validate-release -- <version>");
  }

  const version = args[0];

  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    error(`Invalid version format: ${version}. Expected format: x.y.z`);
  }

  // The release tag must match the version in manifest.json: the Obsidian
  // registry serves the manifest from the repository HEAD and the binaries
  // from the GitHub release with the matching tag.
  const manifest = JSON.parse(readFileSync(join(REPO_ROOT, "manifest.json"), "utf-8")) as {
    version: string;
  };
  if (manifest.version !== version) {
    error(
      `manifest.json version (${manifest.version}) does not match the release tag (${version})`,
    );
  }

  // versions.json must map the released version to the minimum app version.
  const versions = JSON.parse(readFileSync(join(REPO_ROOT, "versions.json"), "utf-8")) as Record<
    string,
    string
  >;
  if (!(version in versions)) {
    error(`versions.json has no entry for version ${version}`);
  }

  // The build must have produced all assets required by Obsidian.
  const distDir = join(REPO_ROOT, "plugin", "dist");
  for (const asset of REQUIRED_ASSETS) {
    if (!existsSync(join(distDir, asset))) {
      error(`Missing release asset: plugin/dist/${asset}`);
    }
  }

  console.log(`✓ Release ${version} is ready for publishing`);
}

main();
