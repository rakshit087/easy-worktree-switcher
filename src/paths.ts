import * as path from "path";

export function normalizePath(value: string): string {
  return path.resolve(value);
}

export function isSubPathOrSame(candidate: string, parent: string): boolean {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

export function sanitizeName(value: string): string {
  return (
    value
      .trim()
      .replace(/^refs\/heads\//, "")
      .replace(/[^A-Za-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "worktree"
  );
}

export function validateWorktreeName(value: string): string | undefined {
  if (!value.trim()) {
    return undefined;
  }

  if (
    value.includes("/") ||
    value.includes("\\") ||
    value === "." ||
    value === ".."
  ) {
    return "Use a folder name, not a path.";
  }

  if (sanitizeName(value) !== value) {
    return "Use letters, numbers, dots, underscores, or hyphens.";
  }

  return undefined;
}
