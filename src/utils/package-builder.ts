import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { execa } from "execa";
import { getMonorepoDirpath } from "get-monorepo-root";
import { replaceTscAliasPaths } from "tsc-alias";

import { type CommonjsBundleOptions } from "~/types/commonjs.js";
import {
  generateCommonjsBundles,
  generateTypeDefinitionBundle,
} from "~/utils/bundles.js";
import { transformPackageJson } from "~/utils/package-json.js";

type BuildCallback = () => void | Promise<void>;

class PackageBuilder {
  private readonly packageJsonPath: string;
  private readonly tsconfigPath: string;
  private readonly buildCallbacks: BuildCallback[] = [];

  constructor({
    tsconfigPath,
    packageJsonPath,
  }: {
    tsconfigPath: string;
    packageJsonPath: string;
  }) {
    this.packageJsonPath = packageJsonPath;
    this.tsconfigPath = tsconfigPath;
  }

  cleanDistFolder() {
    return this.addBuildCallback(async () => {
      const distFolderPath = path.join(this.packageDirectory, "dist");
      await fs.promises.rm(distFolderPath, { recursive: true, force: true });
      await fs.promises.mkdir(distFolderPath);
    });
  }

  tsc(options?: { tsconfigPath: string }): this {
    return this.addBuildCallback(async () => {
      let tscPath = path.join(this.packageDirectory, "node_modules/.bin/tsc");
      if (!fs.existsSync(tscPath)) {
        tscPath = path.join(this.packageDirectory, "node_modules/.bin/tsc");
      }

      if (options?.tsconfigPath === undefined) {
        await execa(tscPath, { stdio: "inherit" });
        await execa(
          tscPath,
          ["--emitDeclarationOnly", "--declarationDir", "dist"],
          {
            stdio: "inherit",
          }
        );
        await replaceTscAliasPaths({ declarationDir: "dist" });
      } else {
        await execa(tscPath, ["-p", options.tsconfigPath], {
          stdio: "inherit",
        });
        await execa(
          tscPath,
          [
            "-p",
            options.tsconfigPath,
            "--emitDeclarationOnly",
            "--declarationDir",
            "dist",
          ],
          { stdio: "inherit" }
        );
        await replaceTscAliasPaths({
          declarationDir: "dist",
          configFile: options.tsconfigPath,
        });
      }
    });
  }

  generateBundles({
    commonjs = true,
    typeDefinitions = true,
  }: {
    commonjs?: boolean | { rollupOptions?: CommonjsBundleOptions };
    typeDefinitions?: boolean;
  }): this {
    return this.addBuildCallback(async () => {
      if (commonjs) {
        await generateCommonjsBundles({
          package: this.pkg,
          packageJsonPath: this.packageJsonPath,
          tsconfigPath: this.tsconfigPath,
          rollupOptions:
            typeof commonjs === "object" ? commonjs.rollupOptions : undefined,
        });
      }

      if (typeDefinitions) {
        await generateTypeDefinitionBundle({
          packageDirectory: this.packageDirectory,
        });
      }
    });
  }

  copyPackageFiles(options?: { additionalFiles?: string[] }): this {
    const packageFiles = ["readme.md", "license", "package.json"];

    return this.addBuildCallback(async () => {
      const monorepoDir = getMonorepoDirpath(import.meta.url);
      const distDir = path.join(this.packageDirectory, "dist");
      if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
      }

      await Promise.all(
        [...packageFiles, ...(options?.additionalFiles ?? [])].map(
          async (packageFilePath) => {
            let distPackageFilePath: string;
            if (
              packageFilePath.startsWith("src") ||
              packageFilePath.startsWith("./src")
            ) {
              distPackageFilePath = path.join(
                distDir,
                packageFilePath.replace(/^(\.\/)?src\//, "")
              );
            } else {
              distPackageFilePath = path.join(distDir, packageFilePath);
            }

            const packageFileFullPath = path.resolve(
              this.packageDirectory,
              packageFilePath
            );

            if (fs.existsSync(packageFileFullPath)) {
              await fs.promises.cp(packageFileFullPath, distPackageFilePath, {
                recursive: true,
              });

              if (path.parse(packageFilePath).base === "package.json") {
                const transformedPackageJson = await transformPackageJson({
                  package: this.pkg,
                });

                await fs.promises.writeFile(
                  distPackageFilePath,
                  JSON.stringify(transformedPackageJson, null, "\t")
                );
              }
            }
            // If the project is a monorepo, try copying the project files from the monorepo root
            else if (monorepoDir !== undefined) {
              // Don't copy monorepo package.json files
              if (packageFilePath === "package.json") {
                return;
              }

              const monorepoFilePath = path.join(monorepoDir, packageFilePath);

              if (fs.existsSync(monorepoFilePath)) {
                await fs.promises.cp(monorepoFilePath, distPackageFilePath, {
                  recursive: true,
                });
              }
            }
          }
        )
      );
    });
  }

  run(cb: () => void | Promise<void>) {
    return this.addBuildCallback(cb);
  }

  async build() {
    for (const buildCallback of this.buildCallbacks) {
      // eslint-disable-next-line no-await-in-loop -- The build callbacks must be run in order
      await buildCallback();
    }
  }

  private get packageDirectory() {
    return path.dirname(this.packageJsonPath);
  }

  private get pkg() {
    return JSON.parse(fs.readFileSync(this.packageJsonPath, "utf8"));
  }

  private addBuildCallback(buildCallback: BuildCallback): this {
    this.buildCallbacks.push(buildCallback);
    return this;
  }
}

export function createPackageBuilder(
  importMeta: ImportMeta,
  {
    tsconfigPath,
    packageJsonPath,
  }: {
    tsconfigPath?: string;
    packageJsonPath: string;
  }
) {
  packageJsonPath = path.resolve(
    path.dirname(fileURLToPath(importMeta.url)),
    packageJsonPath
  );
  tsconfigPath =
    tsconfigPath === undefined
      ? path.join(path.dirname(packageJsonPath), "tsconfig.json")
      : path.resolve(path.dirname(fileURLToPath(importMeta.url)), tsconfigPath);

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(
      `The package.json file at ${packageJsonPath} does not exist`
    );
  }

  return new PackageBuilder({
    packageJsonPath,
    tsconfigPath,
  });
}
