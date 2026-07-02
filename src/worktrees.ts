import * as fs from "fs";
import * as path from "path";
import { DEFAULT_WORKTREE_DIRECTORY, getConfig } from "./config";
import { git, gitOrUndefined } from "./git";
import { generateRandomWorktreeName } from "./names";
import { isSubPathOrSame, normalizePath } from "./paths";
import { Worktree, WorktreeListEntry } from "./types";

export async function listWorktrees(root: string): Promise<Worktree[]> {
  const output = await git(root, ["worktree", "list", "--porcelain"]);
  const entries: WorktreeListEntry[] = [];
  let current: WorktreeListEntry | undefined;

  for (const line of output.split(/\r?\n/)) {
    if (!line.trim()) {
      if (current) {
        entries.push(current);
        current = undefined;
      }
      continue;
    }

    if (line.startsWith("worktree ")) {
      if (current) {
        entries.push(current);
      }
      current = { worktree: line.slice("worktree ".length) };
    } else if (current && line.startsWith("branch ")) {
      current.branch = line.slice("branch ".length).replace(/^refs\/heads\//, "");
    } else if (current && line.startsWith("HEAD ")) {
      current.head = line.slice("HEAD ".length);
    } else if (current && line === "detached") {
      current.detached = true;
    } else if (current && line === "bare") {
      current.bare = true;
    }
  }

  if (current) {
    entries.push(current);
  }

  const normalizedRoot = normalizePath(root);
  return entries
    .filter((entry) => entry.worktree && !entry.bare)
    .map((entry) => toWorktree(entry.worktree, entry, normalizedRoot));
}

export function toWorktree(
  worktreePath: string,
  entry?: WorktreeListEntry,
  normalizedRoot?: string
): Worktree {
  return {
    worktree: worktreePath,
    label: path.basename(worktreePath),
    branch: entry?.branch,
    head: entry?.head,
    detached: entry?.detached,
    isCurrent: normalizedRoot
      ? normalizePath(worktreePath) === normalizedRoot
      : false
  };
}

export async function getCurrentWorktree(root: string): Promise<Worktree> {
  const worktrees = await listWorktrees(root);
  const current = normalizePath(root);
  return (
    worktrees.find((worktree) => normalizePath(worktree.worktree) === current) ??
    toWorktree(root)
  );
}

export async function getDefaultBranchRef(root: string): Promise<string> {
  const remoteHead = await gitOrUndefined(root, [
    "symbolic-ref",
    "refs/remotes/origin/HEAD",
    "--short"
  ]);

  if (remoteHead) {
    return remoteHead;
  }

  const initDefault = await gitOrUndefined(root, [
    "config",
    "--get",
    "init.defaultBranch"
  ]);

  return initDefault ?? "main";
}

export async function getCurrentBranch(root: string): Promise<string> {
  return (
    (await gitOrUndefined(root, ["branch", "--show-current"])) ??
    (await gitOrUndefined(root, ["rev-parse", "--short", "HEAD"])) ??
    "worktree"
  );
}

export function suggestWorktreeName(): string {
  return generateRandomWorktreeName();
}

export function getWorktreeBaseDirectory(root: string): string {
  const configured = getConfig().get<string>(
    "worktreeDirectory",
    DEFAULT_WORKTREE_DIRECTORY
  );
  const cleaned =
    (configured ?? DEFAULT_WORKTREE_DIRECTORY).replace(/[\\\/]+$/, "") ||
    DEFAULT_WORKTREE_DIRECTORY;
  const resolved = path.isAbsolute(cleaned)
    ? path.resolve(cleaned)
    : path.resolve(root, cleaned);

  if (isSubPathOrSame(resolved, root)) {
    return resolved;
  }

  return path.join(resolved, path.basename(root));
}

const ENV_FILES_TO_COPY = [".env", ".env.local"];

export function copyEnvFiles(root: string, target: string): void {
  if (!getConfig().get<boolean>("copyEnvFiles", true)) {
    return;
  }

  for (const fileName of ENV_FILES_TO_COPY) {
    const source = path.join(root, fileName);
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, path.join(target, fileName));
    }
  }
}

export async function uniqueWorktreePath(root: string, name: string): Promise<string> {
  const baseDir = getWorktreeBaseDirectory(root);
  let candidate = path.join(baseDir, name);
  let suffix = 2;

  while (fs.existsSync(candidate)) {
    candidate = path.join(baseDir, `${name}-${suffix}`);
    suffix += 1;
  }

  return candidate;
}
