import * as vscode from "vscode";
import { getConfig } from "./config";
import { git } from "./git";
import { getCurrentWorktree } from "./worktrees";
import { getWorkspaceRoot } from "./workspace";

let statusItem: vscode.StatusBarItem | undefined;

export function createStatusItem(context: vscode.ExtensionContext): void {
  statusItem?.dispose();
  statusItem = undefined;

  if (!getConfig().get<boolean>("showStatusBarItem", true)) {
    return;
  }

  const priority = getConfig().get<number>("statusBarPriority", 10000);
  statusItem = vscode.window.createStatusBarItem(
    "easyWorktreeSwitcher.picker",
    vscode.StatusBarAlignment.Left,
    priority
  );
  statusItem.name = "Git Worktree";
  statusItem.command = "easyWorktreeSwitcher.pick";
  context.subscriptions.push(statusItem);
}

export async function refreshStatusItem(): Promise<void> {
  if (!statusItem) {
    return;
  }

  const workspaceRoot = getWorkspaceRoot();
  if (!workspaceRoot) {
    statusItem.hide();
    return;
  }

  try {
    const root = await git(workspaceRoot, ["rev-parse", "--show-toplevel"]);
    const current = await getCurrentWorktree(root);
    statusItem.text = `$(list-tree) ${current.label}`;
    statusItem.tooltip = `Git Worktree: ${current.worktree}`;
    statusItem.show();
  } catch {
    statusItem.hide();
  }
}

export function disposeStatusItem(): void {
  statusItem?.dispose();
}
