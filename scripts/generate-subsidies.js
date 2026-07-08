#!/usr/bin/env node
/**
 * 用 DeepSeek API 批量生成各城市养老补贴数据
 * 运行：DEEPSEEK_API_KEY=sk-xxx node scripts/generate-subsidies.js
 * 输出：scripts/output/subsidies-{city}.json（人工核对后再入库）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'output');

const CITIES = ['北京', '上海', '长沙'];

const SYSTEM_PROMPT = `你是中国老年政策数据专家，熟悉各地养老补贴政策细节。
请严格输出JSON数组，不要包含任何JSON以外的文字、markdown代码块或说明。`;

function buildPrompt(city) {
  return `请生成${city}市老年人（60岁以上）可申请的养老相关补贴和福利政策清单。

要求：
- 包含${city}市2023-2024年现行政策
- 涵盖：高龄津贴、长护险（如有试点）、失能补贴、养老服务补贴、困难老人补贴、残疾人相关补贴等
- 金额不确定时用"约"标注，政策已停止则不列入
- 严格JSON数组格式，每条补贴一个对象

每个对象的字段：
{
  "city": "${city}",
  "name": "补贴全称",
  "category": "高龄津贴|长护险|失能补贴|低保相关|养老服务补贴|残疾人补贴|其他",
  "age_min": 最低申请年龄数字或null,
  "age_max": null或具体数字,
  "care_levels": null或["自理","半失能","失能","重度失能","失智"]的子集,
  "hukou_type": "城镇|农村|不限",
  "income_type": "低保|低收入|不限",
  "amount": "具体描述，如'200元/月'或'约200元/月'或'按费用60%报销，每月上限800元'",
  "amount_monthly": 月均金额整数估算或null,
  "eligibility": ["条件1", "条件2"],
  "materials": ["材料1", "材料2"],
  "apply_channel": "申请入口，如'户籍所在地街道/乡镇民政办'",
  "apply_url": "官方链接字符串或null",
  "policy_year": 政策年份整数,
  "confidence": "high|medium|low",
  "notes": "备注，如'各区金额可能不同'或null"
}

直接输出JSON数组，第一个字符必须是 [`;
}

async function callDeepSeek(city) {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      temperature: 0.2,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildPrompt(city) },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek API 错误 (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

function parseJson(raw, city) {
  const trimmed = raw.trim();
  // 去掉可能的 markdown 代码块
  const cleaned = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) throw new Error('不是数组');
    return parsed;
  } catch (e) {
    console.error(`[${city}] JSON 解析失败:`, e.message);
    // 保存原始输出供排查
    fs.writeFileSync(path.join(OUTPUT_DIR, `subsidies-${city}-raw.txt`), raw, 'utf8');
    throw e;
  }
}

async function generateCity(city) {
  console.log(`\n▶ 生成 ${city}...`);
  const raw = await callDeepSeek(city);
  const items = parseJson(raw, city);

  // 补充 is_published 字段（默认 false，人工审核后改 true）
  const withMeta = items.map(item => ({
    ...item,
    is_published: false,
  }));

  const outPath = path.join(OUTPUT_DIR, `subsidies-${city}.json`);
  fs.writeFileSync(outPath, JSON.stringify(withMeta, null, 2), 'utf8');
  console.log(`✓ ${city}: 生成 ${withMeta.length} 条，已保存到 ${outPath}`);
  return withMeta;
}

async function main() {
  if (!process.env.DEEPSEEK_API_KEY) {
    console.error('请设置环境变量 DEEPSEEK_API_KEY');
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const all = [];
  for (const city of CITIES) {
    try {
      const items = await generateCity(city);
      all.push(...items);
      // 避免频率限制，城市间间隔 2 秒
      await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
      console.error(`✗ ${city} 生成失败:`, e.message);
    }
  }

  // 汇总文件
  const allPath = path.join(OUTPUT_DIR, 'subsidies-all.json');
  fs.writeFileSync(allPath, JSON.stringify(all, null, 2), 'utf8');
  console.log(`\n✅ 全部完成：共 ${all.length} 条，汇总文件：${allPath}`);
  console.log('\n下一步：人工核对金额和条件，然后运行 insert-subsidies.js 写入 Supabase');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
