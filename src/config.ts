import * as vscode from "vscode";

export const EXTENSION_ID = "easyWorktreeSwitcher";
export const DEFAULT_WORKTREE_DIRECTORY = "../worktrees";

export function getConfig(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration(EXTENSION_ID);
}
