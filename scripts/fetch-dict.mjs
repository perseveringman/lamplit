// 下载 ECDICT 到 .dict-cache/。
//
// 词典数据不进版本库（812MB）。新克隆的仓库跑一次这个脚本即可：
//   npm run dict:fetch && npm run dict:cache
//
// 数据来源：https://github.com/skywind3000/ECDICT  （ecdict-sqlite-28）
// 该数据集由 skywind3000 整理，本仓库只把它当作构建期输入，不再分发原始数据。
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIR = path.join(ROOT, '.dict-cache');
const ZIP = path.join(DIR, 'ecdict-sqlite.zip');
const DB = path.join(DIR, 'stardict.db');
const URL = 'https://github.com/skywind3000/ECDICT/releases/download/1.0.28/ecdict-sqlite-28.zip';

if (fs.existsSync(DB)) {
  console.log(`词典已存在：${path.relative(ROOT, DB)}（${(fs.statSync(DB).size / 1048576).toFixed(0)}MB）`);
  process.exit(0);
}

fs.mkdirSync(DIR, { recursive: true });
console.log(`下载 ${URL}`);
console.log('约 207MB，解压后约 812MB。这一步只需要做一次。');

try {
  execFileSync('curl', ['-L', '--fail', '--progress-bar', '-o', ZIP, URL], { stdio: 'inherit' });
} catch (e) {
  console.error('\n下载失败。可以手动下载后解压到 .dict-cache/stardict.db：');
  console.error(`  ${URL}`);
  process.exit(1);
}

console.log('解压…');
execFileSync('unzip', ['-o', '-q', ZIP, '-d', DIR], { stdio: 'inherit' });
fs.rmSync(ZIP, { force: true });

if (!fs.existsSync(DB)) {
  console.error(`解压后没有找到 ${path.relative(ROOT, DB)}，请检查压缩包内容。`);
  process.exit(1);
}
console.log(`完成：${path.relative(ROOT, DB)}`);
console.log('下一步：npm run dict:cache');
