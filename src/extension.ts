import * as vscode from "vscode";
import { registerCommands } from "./commands";
import { EXTENSION_ID } from "./config";
import { createStatusItem, disposeStatusItem, refreshStatusItem } from "./statusBar";

export function activate(context: vscode.ExtensionContext): void {
  registerCommands(context);
  createStatusItem(context);

  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => void refreshStatusItem()),
    vscode.window.onDidChangeActiveTextEditor(() => void refreshStatusItem()),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(EXTENSION_ID)) {
        createStatusItem(context);
        void refreshStatusItem();
      }
    })
  );

  void refreshStatusItem();
}

export function deactivate(): void {
  disposeStatusItem();
}
