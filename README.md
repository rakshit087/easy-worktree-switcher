# Easy Worktree Switcher

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/rakshit087.easy-worktree-switcher?label=VS%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=rakshit087.easy-worktree-switcher)
[![Open VSX Version](https://img.shields.io/open-vsx/v/rakshit087/easy-worktree-switcher?label=Open%20VSX)](https://open-vsx.org/extension/rakshit087/easy-worktree-switcher)
[![GitHub stars](https://img.shields.io/github/stars/rakshit087/easy-worktree-switcher?style=social)](https://github.com/rakshit087/easy-worktree-switcher/stargazers)
[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](LICENSE)

I wanted the worktree flow from Zed inside VS Code: one small status bar item, one quick picker, and no ceremony when I need a second checkout for a fix, review, or experiment.

This extension adds that flow to VS Code. It lists the worktrees attached to the current repository, opens another worktree in a new window, creates fresh detached worktrees from either the current branch or your default branch, and removes linked worktrees you are no longer using.

## Why I Built This

Git worktrees are the cleanest way I know to jump between tasks without stashing half-finished code. VS Code already handles folders well, but the missing piece for me was a quick, editor-native switcher that stays close to the branch picker.

Easy Worktree Switcher is intentionally small:

- no custom Git model
- no side panel to manage
- no branch checkout magic after creation
- just worktrees, quick picks, and new windows

## Features

- Status bar picker that shows the current worktree name.
- `Git: Worktree` command for the full create/switch/delete flow.
- Create a worktree from the current branch/HEAD.
- Create a worktree from the repository default branch.
- Open any linked worktree in a new VS Code window.
- Delete linked worktrees without touching the currently open workspace.
- Configurable base directory for new worktrees.
- Optional `.env` and `.env.local` copying into newly created worktrees.

New worktrees are created with `git worktree add --detach`, then you can use VS Code's branch picker in that worktree to create or check out the branch you want.

## Usage

Click the `Git Worktree` status bar item, or run `Git: Worktree` from the Command Palette.

The picker shows:

- `New Worktree from "<current branch>"`.
- `New Worktree from "<default branch>"`.
- Every linked worktree for the current repository.

Selecting an existing worktree opens it in a new VS Code window. If VS Code already has that folder open, VS Code decides whether to focus/reuse the existing window using its normal window behavior.

## Settings

```json
{
  "easyWorktreeSwitcher.worktreeDirectory": "../worktrees",
  "easyWorktreeSwitcher.statusBarPriority": 1000000,
  "easyWorktreeSwitcher.showStatusBarItem": true,
  "easyWorktreeSwitcher.copyEnvFiles": true
}
```

With the default `../worktrees`, a repository at `~/code/my-app` creates worktrees here:

```text
~/code/worktrees/my-app/
```

If the configured directory resolves inside the repository, no repository name is appended.

When `easyWorktreeSwitcher.copyEnvFiles` is enabled, `.env` and `.env.local` from the repository root are copied into each new worktree after Git creates it.

## Commands

| Command | What it does |
| --- | --- |
| `Git: Worktree` | Opens the combined picker. |
| `Git: Switch Worktree` | Opens another linked worktree. |
| `Git: Create Worktree` | Prompts for source and folder name. |
| `Git: Create Worktree from Current Branch` | Creates from `HEAD`. |
| `Git: Create Worktree from Default Branch` | Creates from `origin/HEAD`, `init.defaultBranch`, or `main`. |
| `Git: Open Worktree in New Window` | Opens a chosen worktree in a new window. |
| `Git: Delete Worktree` | Removes a linked worktree after confirmation. |
| `Git: Refresh Worktree Picker` | Refreshes the status bar worktree label. |

## Requirements

- VS Code 1.90 or newer.
- Git available on your `PATH`.
- A workspace folder inside a Git repository.
