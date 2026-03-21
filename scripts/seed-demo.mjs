import fs from 'node:fs';
import path from 'node:path';

const filePath = path.join(process.cwd(), 'supabase', 'seed', 'seed_demo.sql');
const sql = fs.readFileSync(filePath, 'utf8');

console.log('Demo seed SQL ready to execute against Supabase:');
console.log(sql);
