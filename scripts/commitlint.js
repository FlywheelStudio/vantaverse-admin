#!/usr/bin/env node

/**
 * Cross-platform commitlint wrapper script
 * Handles the commit message file path argument from Husky
 */

const { execSync } = require('child_process');
const path = require('path');

function resolveCommitMessageFile() {
  if (process.argv[2]) {
    return process.argv[2];
  }

  try {
    return execSync('git rev-parse --git-path COMMIT_EDITMSG', {
      encoding: 'utf8',
    }).trim();
  } catch {
    return path.join(process.cwd(), '.git', 'COMMIT_EDITMSG');
  }
}

const commitMessageFile = resolveCommitMessageFile();
const configPath = path.join(process.cwd(), 'commitlint.config.json');

try {
  execSync(
    `commitlint --config "${configPath}" --edit "${commitMessageFile}"`,
    { stdio: 'inherit' },
  );
} catch (error) {
  process.exit(error.status || 1);
}
