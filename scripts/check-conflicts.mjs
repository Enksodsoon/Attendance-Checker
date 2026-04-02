import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const conflictPattern = /^(<<<<<<<|=======|>>>>>>>)/m;

const files = execSync('git ls-files', { encoding: 'utf8' })
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);

const conflicted = [];

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  if (conflictPattern.test(content)) {
    conflicted.push(file);
  }
}

if (conflicted.length > 0) {
  console.error('Merge conflict markers found in:');
  for (const file of conflicted) {
    console.error(` - ${file}`);
  }
  process.exit(1);
}

console.log('No merge conflict markers found in tracked files.');
