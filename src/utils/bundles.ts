/* eslint-disable max-depth -- Bundling is complex */

import fs from "node:fs";
import { builtinModules } from "node:module";
import path from "node:path";

import alias from "@rollup/plugin-alias";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import esbuild from "esbuild";
import type { ExternalOption, Plugin } from "rollup";
import { rollup } from "rollup";
import bundleESM from "rollup-plugin-bundle-esm";
import depsExternal from "rollup-plugin-deps-external";
import dts from "rollup-plugin-dts";
import esbuildPlugin from "rollup-plugin-esbuild";
import workspaceImports from "rollup-plugin-workspace-imports";
import type { PackageJson } from "type-fest";

import type { CommonjsBundleOptions } from "~/types/commonjs.js";

export async function generateTypeDefinitionBundle({
  packageDirectory,
}: {
  packageDirectory: string;
}) {
  const distFolderPath = path.join(packageDirectory, "dist");

  // Bundle declaration files with rollup-plugin-dts
  const bundle = await rollup({
    plugins: [dts()],
    input: path.join(distFolderPath, "index.d.ts"),
    output: {
      file: path.join(distFolderPath, "bundle.d.ts"),
      format: "es",
    },
  });

  await bundle.write({
    file: path.join(distFolderPath, "bundle.d.ts"),
  });
}

interface GenerateCommonjsBundlesArgs {
  tsconfigPath: string;
  package: PackageJson;
  packageJsonPath: string;
  rollupOptions?: CommonjsBundleOptions;
}

/**
	Bundles all dependencies with Rollup to produce a CommonJS bundle
*/
// eslint-disable-next-line complexity -- This function is complex by nature
export async function generateCommonjsBundles({
  package: pkg,
  packageJsonPath,
  rollupOptions,
}: GenerateCommonjsBundlesArgs): Promise<void> {
  if (pkg.exports === undefined || pkg.exports === null) {
    console.info(
      "The `exports` property of `package.json` was not set; skipping creation of CommonJS bundles"
    );
    return;
  }

  const browser = rollupOptions?.browser;
  delete rollupOptions?.browser;

  const entryPoints: Array<{ sourcePath: string; destinationPath: any }> = [];
  if (typeof pkg.exports === "string") {
    entryPoints.push({ sourcePath: ".", destinationPath: pkg.exports });
  } else {
    const exportsKeys = Object.entries(pkg.exports);
    for (const [exportsKey, exportsValue] of exportsKeys) {
      if (exportsKey.startsWith(".")) {
        if (exportsValue === null) continue;

        // We don't support star paths
        if (exportsKey.includes("*")) continue;

        if (typeof exportsValue === "string") {
          if (pkg.type === "module") {
            if (!/\.(ts|js|mjs)$/.test(exportsValue)) continue;
          } else {
            if (!/\.(ts|mjs)$/.test(exportsValue)) continue;
          }

          entryPoints.push({
            sourcePath: exportsKey,
            destinationPath: {
              types: "./bundle.d.ts",
              import: "./index.js",
              require: "./index.cjs",
            },
          });
        } else if (
          exportsValue !== undefined &&
          "import" in exportsValue &&
          typeof exportsValue.import === "string"
        ) {
          if (pkg.type === "module") {
            if (!/\.(ts|js|mjs)$/.test(exportsValue.import)) continue;
          } else {
            if (!/\.(ts|mjs)$/.test(exportsValue.import)) continue;
          }

          entryPoints.push({
            sourcePath: exportsKey,
            destinationPath: exportsValue.import,
          });
        }
      } else if (exportsKey === "import" && typeof exportsValue === "string") {
        if (pkg.type === "module") {
          if (!/\.(ts|js|mjs)$/.test(exportsValue)) continue;
        } else {
          if (!/\.(ts|mjs)$/.test(exportsValue)) continue;
        }

        entryPoints.push({ sourcePath: ".", destinationPath: exportsValue });
      }
    }
  }

  const packageDirectory = path.dirname(packageJsonPath);
  const tsconfigPath = path.join(packageJsonPath, "tsconfig.json");

  // Weird typing for `plugins` comes from rollup
  const plugins: Array<false | null | undefined | Plugin> = [
    workspaceImports(),
    (bundleESM as any)(),
    (depsExternal as any)({ packagePath: packageJsonPath }),
    (alias.default ?? alias)({
      entries: [
        {
          find: "string_decoder/",
          replacement: "string_decoder",
        },
      ],
    }),
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Typings for @rollup/plugin-json are broken
    (json.default ?? json)(),
    browser
      ? nodeResolve({
          browser: true,
        })
      : nodeResolve({
          // Need to remove `default` from the list because some libraries have `default` pointing to the browser version of the package
          exportConditions: ["node", "module", "import"],
        }),
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Typings for @rollup/plugin-commonjs are broken
    (commonjs.default ?? commonjs)(),
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Typings for rollup-plugin-esbuild are broken
    (esbuildPlugin.default ?? esbuildPlugin)({
      tsconfig: tsconfigPath,
    }),
  ];

  if (rollupOptions?.extendPlugins !== undefined) {
    plugins.push(...rollupOptions.extendPlugins);
  }

  let external: ExternalOption = builtinModules.flatMap((module) => [
    module,
    `node:${module}`,
  ]);

  if (rollupOptions?.external) {
    if (typeof rollupOptions.external === "function") {
      external = rollupOptions.external;
    } else {
      external.push(...[rollupOptions.external].flat());
    }
  }

  await Promise.all(
    entryPoints.map(async (entryPoint) => {
      const commonjsDestinationPath = entryPoint.destinationPath
        .replace(/\/src\//, "/")
        .replace(/\.(m|c)?ts$/, ".cjs");
      await fs.promises.mkdir(path.join(packageDirectory, "dist"), {
        recursive: true,
      });
      const bundle = await rollup({
        plugins,
        input: path.join(packageDirectory, entryPoint.destinationPath),
        output: {
          // Rollup emitting CommonJS code is a bit buggy, so instead, we output ESM and then transform the code into CommonJS using ESBuild
          format: "esm",
          inlineDynamicImports: true,
        },
        ...rollupOptions,
        external,
      });
      const { output } = await bundle.generate({
        format: "esm",
      });
      let { code: cjsOutput } = await esbuild.transform(output[0].code, {
        format: "cjs",
      });

      // An old version of `ansi-styles` uses `Object.defineProperty()` to make the "exports" property immutable (https://github.com/chalk/ansi-styles/pull/12/files). However, this breaks Rollup bundling, so we need to hackily replace it
      cjsOutput = cjsOutput.replace(
        /Object\.defineProperty\((\w+),\s*"exports",\s*/,
        "$1.exports = ((properties) => properties.get())("
      );

      const commonjsFilePath = path.join(
        packageDirectory,
        "dist",
        commonjsDestinationPath
      );
      await fs.promises.writeFile(commonjsFilePath, cjsOutput);
    })
  );

  const exportsObject: Record<
    string,
    { types: string; import: string; require: string }
  > = {};

  for (const entryPoint of entryPoints) {
    const entryPointFileName = path.parse(entryPoint.destinationPath).name;
    exportsObject[entryPoint.sourcePath] = {
      types:
        entryPoint.sourcePath === "."
          ? "./bundle.d.ts"
          : `./${entryPointFileName}.d.ts`,
      import: `./${entryPointFileName}.js`,
      require: `./${entryPointFileName}.cjs`,
    };
  }

  // Adding the subpath exports of the exports we didn't transform
  if (typeof pkg.exports === "object") {
    for (const [exportKey, exportValue] of Object.entries(pkg.exports)) {
      if (
        !entryPoints.some((entryPoint) => entryPoint.sourcePath === exportKey)
      ) {
        // @ts-expect-error: correct type
        exportsObject[exportKey] = exportValue;
      }
    }
  }

  pkg.exports = exportsObject;
}
