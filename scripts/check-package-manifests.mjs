import { access, readFile, readdir } from "node:fs/promises";

const dependencyFields = ["dependencies", "optionalDependencies", "peerDependencies"];
const packagesDirectory = new URL("../packages/", import.meta.url);
const packageDirectories = (
  await readdir(packagesDirectory, {
    withFileTypes: true,
  })
)
  .filter((entry) => entry.isDirectory())
  .sort((left, right) => left.name.localeCompare(right.name));
const errors = [];
let checkedPackages = 0;

for (const packageDirectory of packageDirectories) {
  const packageUrl = new URL(`${packageDirectory.name}/`, packagesDirectory);
  const manifestUrl = new URL("package.json", packageUrl);
  const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));

  if (manifest.private) {
    continue;
  }

  checkedPackages += 1;

  for (const filename of ["LICENSE", "README.md"]) {
    try {
      await access(new URL(filename, packageUrl));
    } catch {
      errors.push(`${manifest.name}: missing ${filename}`);
    }
  }

  for (const dependencyField of dependencyFields) {
    for (const [dependencyName, dependencyRange] of Object.entries(
      manifest[dependencyField] ?? {},
    )) {
      if (dependencyName.startsWith("@litopis/") && dependencyRange.startsWith("workspace:")) {
        errors.push(
          `${manifest.name}: ${dependencyField}.${dependencyName} must use a publishable semver range`,
        );
      }
    }
  }
}

if (errors.length > 0) {
  throw new Error(`Package manifest validation failed:\n${errors.join("\n")}`);
}

console.log(`Checked ${checkedPackages} publishable package manifests.`);
