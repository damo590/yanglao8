#!/usr/bin/env node
/**
 * 把人工审核完的 JSON 写入 Supabase
 * 运行：SUPABASE_URL=xxx SUPABASE_SERVICE_KEY=xxx node scripts/insert-subsidies.js
 * 默认读取 scripts/output/subsidies-all.json
 * 支持指定文件：node scripts/insert-subsidies.js scripts/output/subsidies-北京.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY; // service role key，有写入权限

async function upsertBatch(items) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/subsidies`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify(items),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase 写入错误 (${res.status}): ${err}`);
  }
  return res;
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('请设置环境变量 SUPABASE_URL 和 SUPABASE_SERVICE_KEY');
    process.exit(1);
  }

  const inputFile = process.argv[2] || path.join(__dirname, 'output', 'subsidies-all.json');

  if (!fs.existsSync(inputFile)) {
    console.error(`文件不存在：${inputFile}`);
    console.error('请先运行 generate-subsidies.js');
    process.exit(1);
  }

  const items = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  console.log(`读取 ${items.length} 条数据，开始写入 Supabase...`);

  // 分批写入，每批 50 条
  const BATCH = 50;
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    await upsertBatch(batch);
    console.log(`✓ 写入 ${Math.min(i + BATCH, items.length)} / ${items.length}`);
  }

  console.log('\n✅ 写入完成');
  console.log('提醒：新数据 is_published=false，在 Supabase 后台把核对好的记录改为 true 后前端才会显示');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
