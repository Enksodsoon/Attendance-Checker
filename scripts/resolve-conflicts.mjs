import { execSync } from 'node:child_process';

function run(command) {
  return execSync(command, { encoding: 'utf8' }).trim();
}

const unmergedRaw = run('git diff --name-only --diff-filter=U');
if (!unmergedRaw) {
  console.log('No unmerged paths found. Nothing to resolve.');
  process.exit(0);
}

const unmergedFiles = unmergedRaw.split('\n').filter(Boolean);
const resolveWithOursPrefixes = ['app/', 'components/', 'lib/', '.gitignore', 'next-env.d.ts'];
const oursFiles = unmergedFiles.filter((file) => resolveWithOursPrefixes.some((prefix) => file === prefix || file.startsWith(prefix)));
const manualFiles = unmergedFiles.filter((file) => !oursFiles.includes(file));

for (const file of oursFiles) {
  run(`git checkout --ours -- "${file}"`);
  run(`git add -- "${file}"`);
}

console.log(`Resolved with --ours and staged: ${oursFiles.length}`);
for (const file of oursFiles) {
  console.log(` - ${file}`);
}

if (manualFiles.length > 0) {
  console.log('\nStill requires manual resolution:');
  for (const file of manualFiles) {
    console.log(` - ${file}`);
  }
  process.exit(2);
}

console.log('\nAll unmerged files were resolved and staged.');
