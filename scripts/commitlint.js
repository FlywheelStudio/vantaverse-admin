#!/usr/bin/env node

/**
 * Cross-platform commitlint wrapper script
 * Handles the commit message file path argument from Husky
 */

const { execSync } = require('child_process');
const path = require('path');

const commitMessageFile =
  process.argv[2] || path.join(process.cwd(), '.git', 'COMMIT_EDITMSG');

const configPath = path.join(process.cwd(), 'commitlint.config.json');

try {
  execSync(
    `commitlint --config "${configPath}" --edit "${commitMessageFile}"`,
    { stdio: 'inherit' },
  );
} catch (error) {
  process.exit(error.status || 1);
}
