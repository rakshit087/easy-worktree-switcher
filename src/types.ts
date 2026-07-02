import * as vscode from "vscode";

export type WorktreeSource = "current" | "default";

export interface WorktreeListEntry {
  worktree: string;
  branch?: string;
  head?: string;
  detached?: boolean;
  bare?: boolean;
}

export interface Worktree {
  worktree: string;
  label: string;
  branch?: string;
  head?: string;
  detached?: boolean;
  isCurrent: boolean;
}

export interface WorktreePickItem extends vscode.QuickPickItem {
  action: "create-current" | "create-default" | "switch";
  worktree?: Worktree;
}

export interface WorktreeOnlyPickItem extends vscode.QuickPickItem {
  worktree: Worktree;
}

export interface SourcePickItem extends vscode.QuickPickItem {
  value: WorktreeSource;
}
