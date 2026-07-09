import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const moduleRoot = fileURLToPath(new URL("../src/modules/", import.meta.url));
const tokenRoot = fileURLToPath(new URL("../design-system/tokens/", import.meta.url));
const bundlePath = fileURLToPath(new URL("../src/styles/design-system.css", import.meta.url));
const ignoredStyleRoots = [
  fileURLToPath(new URL("../src/components/shadcn/", import.meta.url)),
  fileURLToPath(new URL("../src/components/ui/shadcn/", import.meta.url)),
];
const violations = [];

function filesBelow(directory, extension) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (ignoredStyleRoots.some((ignoredRoot) => path.startsWith(ignoredRoot))) {
      return [];
    }
    return entry.isDirectory() ? filesBelow(path, extension) : path.endsWith(extension) ? [path] : [];
  });
}

function lineNumber(text, index) {
  return text.slice(0, index).split("\n").length;
}

const rules = [
  { name: "alias de cor inexistente", pattern: /var\(--color-/g },
  { name: "cor hexadecimal local", pattern: /#[\da-f]{3,8}\b/gi },
  { name: "font-size fora de token", pattern: /font-size\s*:\s*(?:\d|\.)/g },
  { name: "font-weight fora de token", pattern: /font-weight\s*:\s*[1-9]00\b/g },
];

for (const file of filesBelow(moduleRoot, ".css")) {
  const text = readFileSync(file, "utf8");
  for (const rule of rules) {
    for (const match of text.matchAll(rule.pattern)) {
      violations.push(`${file.replace(root, "")}:${lineNumber(text, match.index)} — ${rule.name}`);
    }
  }
}

function tokensFrom(text) {
  return new Map(
    [...text.matchAll(/^\s*(--[\w-]+)\s*:\s*([^;]+);/gm)].map((match) => [
      match[1],
      match[2].trim().toLowerCase().replaceAll(/['"]/g, "").replaceAll(/\s+/g, " "),
    ]),
  );
}

const referenceTokens = new Map();
for (const file of filesBelow(tokenRoot, ".css")) {
  for (const [name, value] of tokensFrom(readFileSync(file, "utf8"))) {
    referenceTokens.set(name, value);
  }
}
const bundleTokens = tokensFrom(readFileSync(bundlePath, "utf8"));
for (const [name, value] of referenceTokens) {
  if (bundleTokens.has(name) && bundleTokens.get(name) !== value) {
    violations.push(`src/styles/design-system.css — token ${name} diverge da referência`);
  }
}

if (violations.length) {
  console.error(["Design system inválido:", ...violations.map((item) => `- ${item}`)].join("\n"));
  process.exit(1);
}

console.log("Design system: aliases, cores locais, tipografia e tokens verificados.");
