import * as cp from "child_process";

export function git(cwd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    cp.execFile("git", args, { cwd }, (error, stdout, stderr) => {
      if (error) {
        const message = stderr?.trim() || error.message;
        reject(new Error(message));
        return;
      }
      resolve(stdout.trim());
    });
  });
}

export function gitOrUndefined(cwd: string, args: string[]): Promise<string | undefined> {
  return git(cwd, args).catch(() => undefined);
}
