import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { git } from "./git";
import { normalizePath, sanitizeName, validateWorktreeName } from "./paths";
import { refreshStatusItem } from "./statusBar";
import {
  SourcePickItem,
  Worktree,
  WorktreeOnlyPickItem,
  WorktreePickItem,
  WorktreeSource
} from "./types";
import { openFolder, requireGitRoot } from "./workspace";
import {
  copyEnvFiles,
  getCurrentBranch,
  getDefaultBranchRef,
  listWorktrees,
  suggestWorktreeName,
  uniqueWorktreePath
} from "./worktrees";

export function registerCommands(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("easyWorktreeSwitcher.pick", () => showWorktreePicker()),
    vscode.commands.registerCommand("easyWorktreeSwitcher.switch", () => switchWorktree()),
    vscode.commands.registerCommand("easyWorktreeSwitcher.create", () => createWorktree()),
    vscode.commands.registerCommand("easyWorktreeSwitcher.createFromCurrent", () =>
      createWorktree("current")
    ),
    vscode.commands.registerCommand("easyWorktreeSwitcher.createFromDefault", () =>
      createWorktree("default")
    ),
    vscode.commands.registerCommand("easyWorktreeSwitcher.openInNewWindow", () =>
      openWorktreeInNewWindow()
    ),
    vscode.commands.registerCommand("easyWorktreeSwitcher.delete", () => deleteWorktree()),
    vscode.commands.registerCommand("easyWorktreeSwitcher.refresh", () => refreshStatusItem())
  );
}

const deleteWorktreeButton: vscode.QuickInputButton = {
  iconPath: new vscode.ThemeIcon("close"),
  tooltip: "Delete Worktree"
};

async function buildWorktreePickItems(root: string): Promise<WorktreePickItem[]> {
  const [currentBranch, defaultBranchRef, worktrees] = await Promise.all([
    getCurrentBranch(root),
    getDefaultBranchRef(root),
    listWorktrees(root)
  ]);
  const defaultBranch = defaultBranchRef.replace(/^refs\/heads\//, "").replace(/^origin\//, "");

  return [
    {
      label: `$(plus) New Worktree from "${currentBranch}"`,
      description: "current branch",
      action: "create-current",
      alwaysShow: true
    },
    {
      label: `$(plus) New Worktree from "${defaultBranch}"`,
      description: "default branch",
      action: "create-default",
      alwaysShow: true
    },
    {
      label: "",
      kind: vscode.QuickPickItemKind.Separator,
      action: "switch",
      alwaysShow: true
    },
    ...worktrees.map<WorktreePickItem>((worktree) => ({
      label: `${worktree.isCurrent ? "$(check) " : "$(repo) "}${worktree.label}`,
      description: worktree.branch ?? "detached HEAD",
      detail: worktree.worktree,
      action: "switch",
      worktree,
      buttons: worktree.isCurrent ? undefined : [deleteWorktreeButton]
    }))
  ];
}

async function showWorktreePicker(): Promise<void> {
  const root = await requireGitRoot();
  if (!root) {
    return;
  }

  const current = normalizePath(root);
  const quickPick = vscode.window.createQuickPick<WorktreePickItem>();
  quickPick.title = "Git Worktree";
  quickPick.placeholder = "Search existing worktrees";
  quickPick.matchOnDescription = true;

  const refresh = async () => {
    quickPick.busy = true;
    quickPick.items = await buildWorktreePickItems(root);
    quickPick.busy = false;
  };

  quickPick.onDidTriggerItemButton(async (event) => {
    const worktree = event.item.worktree;
    if (!worktree) {
      return;
    }

    const confirmation = await vscode.window.showWarningMessage(
      `Delete worktree "${worktree.label}"?`,
      { modal: true, detail: worktree.worktree },
      "Delete"
    );

    if (confirmation !== "Delete") {
      return;
    }

    quickPick.busy = true;
    try {
      await git(root, ["worktree", "remove", worktree.worktree]);
      await refreshStatusItem();
      await refresh();
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to delete worktree: ${(error as Error).message}`
      );
      quickPick.busy = false;
    }
  });

  quickPick.onDidAccept(async () => {
    const picked = quickPick.selectedItems[0];
    if (!picked) {
      return;
    }

    quickPick.hide();

    if (picked.action === "create-current") {
      await createWorktree("current");
      return;
    }

    if (picked.action === "create-default") {
      await createWorktree("default");
      return;
    }

    if (picked.worktree && normalizePath(picked.worktree.worktree) !== current) {
      await openFolder(picked.worktree.worktree, true);
    }
  });

  quickPick.onDidHide(() => quickPick.dispose());

  await refresh();
  quickPick.show();
}

async function switchWorktree(): Promise<void> {
  const root = await requireGitRoot();
  if (!root) {
    return;
  }

  const current = normalizePath(root);
  const worktrees = (await listWorktrees(root)).filter(
    (worktree) => normalizePath(worktree.worktree) !== current
  );

  if (worktrees.length === 0) {
    const create = await vscode.window.showInformationMessage(
      "No other Git worktrees found.",
      "Create Worktree"
    );
    if (create === "Create Worktree") {
      await createWorktree();
    }
    return;
  }

  const picked = await vscode.window.showQuickPick(
    worktrees.map<WorktreeOnlyPickItem>((worktree) => ({
      label: worktree.label,
      description: worktree.branch ?? "detached HEAD",
      detail: worktree.worktree,
      worktree
    })),
    {
      title: "Switch Git Worktree",
      placeHolder: "Open a worktree in a new window"
    }
  );

  if (picked) {
    await openFolder(picked.worktree.worktree, true);
  }
}

async function openWorktreeInNewWindow(): Promise<void> {
  const root = await requireGitRoot();
  if (!root) {
    return;
  }

  const picked = await pickWorktree(root, "Open Git Worktree in New Window");
  if (picked) {
    await openFolder(picked.worktree, true);
  }
}

async function createWorktree(source?: WorktreeSource): Promise<void> {
  const root = await requireGitRoot();
  if (!root) {
    return;
  }

  const chosenSource =
    source ??
    (
      await vscode.window.showQuickPick<SourcePickItem>(
        [
          {
            label: "$(plus) Current Branch",
            description: "Create a detached worktree from the current HEAD",
            value: "current"
          },
          {
            label: "$(plus) Default Branch",
            description: "Create a detached worktree from the repository default branch",
            value: "default"
          }
        ],
        {
          title: "Create Git Worktree",
          placeHolder: "Choose the starting point"
        }
      )
    )?.value;

  if (!chosenSource) {
    return;
  }

  const startPoint =
    chosenSource === "default" ? await getDefaultBranchRef(root) : "HEAD";
  const suggestedName = suggestWorktreeName();
  const name = await vscode.window.showInputBox({
    title: "Create Git Worktree",
    prompt: "Worktree folder name. Leave empty to use the suggested name.",
    placeHolder: suggestedName,
    validateInput: validateWorktreeName
  });

  if (name === undefined) {
    return;
  }

  const worktreeName = sanitizeName(name.trim() || suggestedName);
  const target = await uniqueWorktreePath(root, worktreeName);

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Creating worktree ${path.basename(target)}`,
      cancellable: false
    },
    async () => {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      await git(root, ["worktree", "add", "--detach", target, startPoint]);
      copyEnvFiles(root, target);
    }
  );

  await refreshStatusItem();
  await openFolder(target, true);
}

async function deleteWorktree(): Promise<void> {
  const root = await requireGitRoot();
  if (!root) {
    return;
  }

  const current = normalizePath(root);
  const candidates = (await listWorktrees(root)).filter(
    (worktree) => normalizePath(worktree.worktree) !== current
  );

  if (candidates.length === 0) {
    vscode.window.showInformationMessage("No removable Git worktrees found.");
    return;
  }

  const picked = await vscode.window.showQuickPick(
    candidates.map<WorktreeOnlyPickItem>((worktree) => ({
      label: worktree.label,
      description: worktree.branch ?? "detached HEAD",
      detail: worktree.worktree,
      worktree
    })),
    {
      title: "Delete Git Worktree",
      placeHolder: "Choose a linked worktree to remove"
    }
  );

  if (!picked) {
    return;
  }

  const confirmation = await vscode.window.showWarningMessage(
    `Delete worktree "${picked.worktree.label}"?`,
    { modal: true, detail: picked.worktree.worktree },
    "Delete"
  );

  if (confirmation !== "Delete") {
    return;
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Deleting worktree ${picked.worktree.label}`,
      cancellable: false
    },
    async () => {
      await git(root, ["worktree", "remove", picked.worktree.worktree]);
    }
  );

  await refreshStatusItem();
}

async function pickWorktree(root: string, title: string): Promise<Worktree | undefined> {
  const picked = await vscode.window.showQuickPick(
    (await listWorktrees(root)).map<WorktreeOnlyPickItem>((worktree) => ({
      label: worktree.label,
      description: worktree.branch ?? "detached HEAD",
      detail: worktree.worktree,
      worktree
    })),
    {
      title,
      placeHolder: "Choose a Git worktree"
    }
  );

  return picked?.worktree;
}
