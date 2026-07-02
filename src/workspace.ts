import * as vscode from "vscode";
import { git } from "./git";

export function getWorkspaceRoot(): string | undefined {
  const activeUri = vscode.window.activeTextEditor?.document.uri;
  if (activeUri?.scheme === "file") {
    const folder = vscode.workspace.getWorkspaceFolder(activeUri);
    if (folder) {
      return folder.uri.fsPath;
    }
  }

  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

export async function requireGitRoot(): Promise<string | undefined> {
  const workspaceRoot = getWorkspaceRoot();
  if (!workspaceRoot) {
    vscode.window.showWarningMessage("Open a Git repository folder first.");
    return undefined;
  }

  try {
    return await git(workspaceRoot, ["rev-parse", "--show-toplevel"]);
  } catch {
    vscode.window.showWarningMessage("The current workspace is not a Git repository.");
    return undefined;
  }
}

export async function openFolder(folderPath: string, forceNewWindow: boolean): Promise<void> {
  await vscode.commands.executeCommand(
    "vscode.openFolder",
    vscode.Uri.file(folderPath),
    forceNewWindow
  );
}
