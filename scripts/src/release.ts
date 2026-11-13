import pc from "picocolors";

import { execSync } from "node:child_process";

function error(message: string): never {
  console.error(pc.red(`✗ ${message}`));
  process.exit(1);
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.length !== 1) {
    error("Usage: npm run release -- <version> (e.g. npm run release -- 1.0.0)");
  }

  const version = args[0];

  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    error(`Invalid version format: ${version}. Expected format: x.y.z`);
  }

  console.log(pc.cyan(`→ Triggering release workflow for v${version}...`));

  try {
    execSync(`gh workflow run release-orchestration.yml -f version=${version}`, {
      stdio: "inherit",
    });
  } catch {
    error(
      "Failed to trigger the release workflow. Make sure the gh CLI is installed and authenticated.",
    );
  }

  console.log(pc.green("✓ Release workflow triggered."));
  console.log();
  console.log(pc.bold("Monitor the run with:"));
  console.log(
    pc.dim(
      "  gh run watch $(gh run list --workflow=release-orchestration.yml -L 1 --json databaseId -q '.[0].databaseId')",
    ),
  );
  console.log();
  console.log(
    pc.dim(
      "Or open: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com\\///;s/\\.git$//')/actions",
    ),
  );
}

main();
