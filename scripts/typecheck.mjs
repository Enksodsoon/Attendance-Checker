import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!existsSync('.next/types')) {
  run('npx', ['next', 'build', '--no-lint', '--experimental-app-only', '--experimental-build-mode', 'compile']);
}

run('npx', ['tsc', '--noEmit']);
