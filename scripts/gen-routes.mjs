// Regenerates src/routeTree.gen.ts from the files in src/routes.
//
// This mirrors exactly what @tanstack/start (via start-plugin-core) does inside
// vite: it runs @tanstack/router-generator AND appends the TanStack Start
// "Register" module-augmentation footer that wires up router.tsx / start.ts.
// We need a standalone runner because the installed vite/rolldown native binaries
// in this environment are win32-only, so `vite dev/build` can't run here — but
// tsc can, and it depends on this generated file for Link type-safety.
//
// The footer logic is copied verbatim from:
//   node_modules/@tanstack/start-plugin-core/dist/esm/start-router-plugin/route-tree-footer.js
import path from "node:path";
import { Generator, getConfig } from "@tanstack/router-generator";

const root = process.cwd();
const framework = "react";
const generatedRouteTree = path.resolve(root, "./src/routeTree.gen.ts");
const routerFilePath = path.resolve(root, "./src/router.tsx");
const startFilePath = path.resolve(root, "./src/start.ts");

function buildRouteTreeFileFooter() {
  const getImportPath = (absolutePath) => {
    let relativePath = path.relative(path.dirname(generatedRouteTree), absolutePath);
    if (!relativePath.startsWith(".")) relativePath = "./" + relativePath;
    return relativePath.split(path.sep).join("/");
  };
  const appendFooterBlock = (lines, block) => {
    if (!block) return;
    if (lines.length > 0) {
      lines[lines.length - 1] += `\n${block}`;
      return;
    }
    lines.push(block);
  };
  const footer = [];
  appendFooterBlock(footer, `import type { getRouter } from '${getImportPath(routerFilePath)}'`);
  appendFooterBlock(footer, `import type { startInstance } from '${getImportPath(startFilePath)}'`);
  appendFooterBlock(
    footer,
    `declare module '@tanstack/${framework}-start' {
  interface Register {
    ssr: true
    router: Awaited<ReturnType<typeof getRouter>>`,
  );
  appendFooterBlock(footer, `    config: Awaited<ReturnType<typeof startInstance.getOptions>>`);
  appendFooterBlock(footer, `  }
}`);
  return footer;
}

const config = getConfig(
  {
    target: framework,
    routesDirectory: "./src/routes",
    generatedRouteTree: "./src/routeTree.gen.ts",
    routeTreeFileFooter: buildRouteTreeFileFooter,
  },
  root,
);

const generator = new Generator({ config, root });
await generator.run();
console.log("ROUTE_TREE_REGENERATED");
