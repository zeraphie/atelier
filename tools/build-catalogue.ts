/**
 * ─ Build catalogue ─
 *
 * Writes .ai/CATALOGUE.md: what is shared under src, each name with
 * the sentence its doc comment opens on, so a session starts knowing
 * what exists before it writes anything (.ai/REUSE.md). Listed is
 * every name a file in another folder imports, and everything under
 * the UI's atoms, molecules and utils and at the root of src, since
 * those exist to be taken. A listed function or class with no doc
 * comment fails the run, so the sentence gets written. `--check`
 * refuses a stale file; run by `bun run check`.
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, posix } from "node:path";

const ROOT = join(import.meta.dir, "..");
const OUT_PATH = ".ai/CATALOGUE.md";
const SOURCE = "src";
// The app's glue: it takes everything and nothing takes it.
const GLUE = new Set(["src/App.tsx", "src/main.ts"]);
// Listed whole, whoever takes them: they exist to be taken.
const OFFERED = ["src/ui/atoms/", "src/ui/molecules/", "src/ui/utils/"];
const FOLDERS = ["src", "camera", "canvas", "gallery", "comments", "pictures", "state", "storage"];
const LAYERS = ["atoms", "molecules", "utils", "components"];

const EXPORT =
  /^export (?:async )?(function\*?|const|let|class|abstract class|enum|interface|type) (\w+)/gm;
const IMPORT = /^import\s+([\s\S]*?)\s+from\s+"([^"]+)";/gm;

type Kind = "function" | "class" | "value" | "type";

interface Named {
  readonly name: string;
  readonly kind: Kind;
  /** The first sentence of its doc comment, or none. */
  readonly said: string | undefined;
}

interface Listed {
  readonly path: string;
  readonly names: readonly Named[];
  /** The folders that import from this file. */
  readonly takers: readonly string[];
}

function filesUnder(folder: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(join(ROOT, folder)).sort()) {
    const path = posix.join(folder, entry);
    if (statSync(join(ROOT, path)).isDirectory()) {
      found.push(...filesUnder(path));
    } else if (/\.tsx?$/.test(entry) && !entry.endsWith(".d.ts")) {
      found.push(path);
    }
  }
  return found;
}

// The folder a path is judged by: its first folder under src, or "src" for the root.
function folderOf(path: string): string {
  const parts = path.split("/");
  return parts.length > 2 ? parts[1]! : "src";
}

function kindOf(keyword: string): Kind {
  if (keyword.startsWith("function")) {
    return "function";
  }
  if (keyword.endsWith("class")) {
    return "class";
  }
  return keyword === "interface" || keyword === "type" ? "type" : "value";
}

// The doc comment that ends right above `at`, as prose; none when what is
// above is not a doc comment, or is a file's preamble.
function docAbove(text: string, at: number): string | undefined {
  const before = text.slice(0, at).trimEnd();
  if (!before.endsWith("*/")) {
    return undefined;
  }
  const start = before.lastIndexOf("/**");
  if (start < 0) {
    return undefined;
  }
  const block = before.slice(start + 3, -2);
  if (block.includes("─")) {
    return undefined;
  }
  return block
    .split("\n")
    .map((line) => line.replace(/^\s*\*\s?/, "").trim())
    .filter((line) => line !== "" && !line.startsWith("@"))
    .join(" ");
}

function firstSentence(prose: string): string {
  const match = /^(.*?[.!?])(?:\s|$)/.exec(prose);
  return (match?.[1] ?? prose).trim();
}

function exportsOf(text: string): Named[] {
  const named: Named[] = [];
  for (const match of text.matchAll(EXPORT)) {
    const prose = docAbove(text, match.index);
    named.push({
      name: match[2]!,
      kind: kindOf(match[1]!),
      said: prose === undefined ? undefined : firstSentence(prose),
    });
  }
  return named;
}

// Every name a file imports from a relative path, with the file it came from.
function importsOf(path: string, text: string): { readonly from: string; readonly name: string }[] {
  const found: { from: string; name: string }[] = [];
  for (const match of text.matchAll(IMPORT)) {
    const spec = match[2]!;
    if (!spec.startsWith(".")) {
      continue;
    }
    const from = posix.normalize(posix.join(dirname(path), spec)).replace(/\.js$/, "");
    const braces = /\{([^}]*)\}/.exec(match[1]!);
    if (braces === null) {
      continue;
    }
    for (const piece of braces[1]!.split(",")) {
      const name = piece
        .trim()
        .replace(/^type\s+/, "")
        .split(/\s+as\s+/)[0]!;
      if (name !== "") {
        found.push({ from, name });
      }
    }
  }
  return found;
}

// Offered whole: the UI's atoms, molecules and utils, and the root's vocabulary.
function isOffered(path: string): boolean {
  if (OFFERED.some((prefix) => path.startsWith(prefix))) {
    return true;
  }
  return folderOf(path) === "src" && !GLUE.has(path);
}

function layerOf(path: string): string {
  return path.split("/")[2] ?? "";
}

function catalogue(): { readonly text: string; readonly missing: string[] } {
  const files = filesUnder(SOURCE);
  const texts = new Map(files.map((path) => [path, readFileSync(join(ROOT, path), "utf8")]));
  const byStem = new Map(files.map((path) => [path.replace(/\.tsx?$/, ""), path]));
  const shared = new Map<string, Set<string>>();
  const takers = new Map<string, Set<string>>();
  for (const [path, text] of texts) {
    if (GLUE.has(path)) {
      continue;
    }
    for (const { from, name } of importsOf(path, text)) {
      const source = byStem.get(from);
      if (source === undefined || folderOf(source) === folderOf(path)) {
        continue;
      }
      shared.set(source, (shared.get(source) ?? new Set()).add(name));
      takers.set(source, (takers.get(source) ?? new Set()).add(folderOf(path)));
    }
  }
  const listed: Listed[] = [];
  const missing: string[] = [];
  for (const [path, text] of texts) {
    const offered = isOffered(path);
    const names = exportsOf(text).filter((named) => offered || shared.get(path)?.has(named.name));
    if (names.length === 0) {
      continue;
    }
    for (const named of names) {
      if ((named.kind === "function" || named.kind === "class") && named.said === undefined) {
        missing.push(`${path}: ${named.name} has no doc comment`);
      }
    }
    listed.push({ path, names, takers: [...(takers.get(path) ?? [])].sort() });
  }
  return { text: render(listed), missing };
}

function render(listed: readonly Listed[]): string {
  const lines = [
    "# Catalogue: what exists, before you write",
    "",
    "Written by `bun run catalogue` from the doc comments, never by hand.",
    "Listed is what is shared: every name a file in another folder",
    "imports, and everything the UI's atoms, molecules and utils and the",
    "root of src offer. Grouped by folder, then file, then name; a file's",
    "takers are the folders that import from it. Look here first, then",
    "search src, then write. [REUSE.md](REUSE.md) says why.",
  ];
  const section = (title: string, files: readonly Listed[]): void => {
    if (files.length === 0) {
      return;
    }
    lines.push("", `## ${title}`);
    for (const file of files) {
      const taken = file.takers.length > 0 ? ` (${file.takers.join(", ")})` : "";
      lines.push("", `**${file.path.replace(/^src\//, "")}**${taken}`);
      const quiet: string[] = [];
      for (const named of file.names) {
        const shown = named.kind === "function" ? `${named.name}()` : named.name;
        if (named.said === undefined) {
          quiet.push(`\`${shown}\``);
        } else {
          lines.push(`- \`${shown}\`: ${named.said}`);
        }
      }
      if (quiet.length > 0) {
        lines.push(`- Also: ${quiet.join(", ")}`);
      }
    }
  };
  for (const folder of FOLDERS) {
    section(
      folder,
      listed.filter((file) => folderOf(file.path) === folder)
    );
  }
  for (const layer of LAYERS) {
    section(
      `ui: ${layer}`,
      listed.filter((file) => folderOf(file.path) === "ui" && layerOf(file.path) === layer)
    );
  }
  section(
    "viewing",
    listed.filter((file) => folderOf(file.path) === "viewing")
  );
  return lines.join("\n") + "\n";
}

const { text, missing } = catalogue();
if (missing.length > 0) {
  console.error(missing.join("\n"));
  process.exit(1);
}
const outPath = join(ROOT, OUT_PATH);
if (process.argv.includes("--check")) {
  let current = "";
  try {
    current = readFileSync(outPath, "utf8");
  } catch {
    current = "";
  }
  if (current !== text) {
    console.error(`${OUT_PATH} is stale: run bun run catalogue`);
    process.exit(1);
  }
} else {
  writeFileSync(outPath, text);
  console.log(`wrote ${OUT_PATH}`);
}
