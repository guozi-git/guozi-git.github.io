import { readFile, writeFile, mkdir, copyFile, rename } from 'node:fs/promises';
import { resolve, dirname, relative, isAbsolute } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath, URL } from 'node:url';
import { parseArgs } from 'node:util';
import process from 'node:process';
import { log, error } from 'node:console';
import { format } from 'prettier';
import { compareFactoryPapers } from '../src/lib/factory-order.ts';

export const repository = fileURLToPath(new URL('../', import.meta.url));
const dataPath = 'src/lib/factory-papers.json';
const assetsPath = 'scripts/public-assets.json';
const groups = {
  65: ['数值分析与优化', '∇'],
  90: ['数值分析与优化', '∇'],
  34: ['动力系统与差分方程', '∂'],
  37: ['动力系统与差分方程', '∂'],
  39: ['动力系统与差分方程', '∂'],
  47: ['算子与不动点理论', '∞'],
  91: ['博弈论', 'Σ'],
  60: ['概率与随机过程', 'σ'],
};
const fields = [
  'id',
  'originalTitle',
  'topic',
  'symbol',
  'msc',
  'abstract',
  'limitation',
  'scores',
  'reasons',
  'level',
  'maturity',
  'correctness',
  'confidence',
  'status',
  'pdf',
  'pages',
  'bytes',
  'sha256',
  'reviewNote',
  'scoreScale',
  'reviewDate',
  'overall',
  'levelReason',
  'maturityReason',
  'verificationReason',
  'supplement',
];
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const json = async (path) => JSON.parse(await readFile(path, 'utf8'));
const pretty = (value) => format(JSON.stringify(value), { parser: 'json', printWidth: 100 });
function inside(root, path) {
  const result = resolve(root, path),
    rel = relative(root, result);
  assert(rel && !rel.startsWith('..') && !isAbsolute(rel), '路径必须位于指定目录内');
  return result;
}
function rating(value) {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 100 &&
    Number.isInteger(value)
  );
}
export async function validate(papers, assets, root = repository, overrides = new Map()) {
  assert(Array.isArray(papers) && papers.length > 0, '论文清单不能为空');
  assert(Array.isArray(assets) && new Set(assets).size === assets.length, '资源清单存在重复');
  const ids = new Set();
  for (const p of papers) {
    assert(/^P\d{3,}$/.test(p.id) && !ids.has(p.id), `编号无效或重复：${p.id}`);
    ids.add(p.id);
    assert(
      Object.keys(p).every((k) => fields.includes(k)),
      `${p.id} 存在未知字段`,
    );
    for (const k of ['originalTitle', 'abstract', 'limitation'])
      assert(typeof p[k] === 'string' && p[k].trim(), `${p.id} 缺少 ${k}`);
    assert(typeof p.reviewNote === 'string', `${p.id} 缺少审查状态说明字段`);
    assert(p.scoreScale === 100, `${p.id} 必须明确使用百分制`);
    assert(/^\d{4}-\d{2}-\d{2}$/.test(p.reviewDate), `${p.id} 缺少审稿日期`);
    for (const k of ['overall', 'levelReason', 'maturityReason', 'verificationReason'])
      assert(typeof p[k] === 'string' && p[k].trim(), `${p.id} 缺少 ${k}`);
    assert(
      Array.isArray(p.msc) && p.msc.length && p.msc.every((c) => /^\d{2}[A-Z]\d{2}$/.test(c)),
      `${p.id} MSC 格式有误`,
    );
    const group = groups[p.msc[0].slice(0, 2)];
    assert(
      group && p.topic === group[0] && p.symbol === group[1],
      `${p.id} 主 MSC 分类不匹配；新方向须先扩展 groups`,
    );
    assert(
      ['通过', '有条件通过', '待确认', '不通过'].includes(p.status) && rating(p.correctness),
      `${p.id} 正确性状态或分数无效`,
    );
    if (p.scores === null) {
      assert(
        p.level === null &&
          ['待确认', '不通过'].includes(p.status) &&
          (p.maturity === null || rating(p.maturity)) &&
          (p.confidence === null || rating(p.confidence)) &&
          Array.isArray(p.reasons) &&
          !p.reasons.length,
        `${p.id} 未评分字段不一致`,
      );
    } else {
      assert(['通过', '有条件通过'].includes(p.status), `${p.id} 未过正确性门槛不能提前评分`);
      assert(
        Array.isArray(p.scores) && p.scores.length === 5 && p.scores.every(rating),
        `${p.id} 需要五个整数百分制评分`,
      );
      assert(
        Array.isArray(p.reasons) &&
          p.reasons.length === 5 &&
          p.reasons.every((t) => typeof t === 'string' && t.trim()),
        `${p.id} 需要五条评分理由`,
      );
      assert(
        rating(p.level) && rating(p.maturity) && rating(p.confidence),
        `${p.id} 研究水平、成熟度或置信度无效`,
      );
    }
    assert(p.status === '通过' || p.reviewNote.trim(), `${p.id} 必须说明未解决问题`);
    assert(p.pdf === `/papers/${p.id}.pdf`, `${p.id} PDF 路径必须与编号对应`);
    assert(Number.isInteger(p.pages) && p.pages > 0, `${p.id} 页数无效`);
    const bytes = overrides.get(p.pdf) ?? (await readFile(inside(root, `public${p.pdf}`)));
    assert(bytes.subarray(0, 5).toString() === '%PDF-', `${p.id} 文件不是 PDF`);
    assert(
      p.bytes === bytes.length && p.sha256 === sha(bytes),
      `${p.id} 文件大小或 SHA-256 不匹配`,
    );
    assert(assets.includes(p.pdf.slice(1)), `${p.id} PDF 未加入导出清单`);
    if (p.supplement) {
      const s = p.supplement;
      assert(s.pdf === `/papers/${p.id}-supplement.pdf`, `${p.id} 补充材料路径不匹配`);
      assert(Number.isInteger(s.pages) && s.pages > 0, `${p.id} 补充材料页数无效`);
      const content = overrides.get(s.pdf) ?? (await readFile(inside(root, `public${s.pdf}`)));
      assert(content.subarray(0, 5).toString() === '%PDF-', `${p.id} 补充材料不是PDF`);
      assert(s.bytes === content.length && s.sha256 === sha(content), `${p.id} 补充材料版本不匹配`);
      assert(assets.includes(s.pdf.slice(1)), `${p.id} 补充材料未加入导出清单`);
    }
  }
  // Later bibliography is separate from the historical scored snapshot.
  const later = [];
  for (const path of [
    'src/lib/research-stage-paper.json',
    'src/lib/research-additional-papers.json',
  ]) {
    try {
      const value = await json(inside(root, path));
      later.push(...(Array.isArray(value) ? value : [value]));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  for (const paper of later) {
    assert(/^P\d{3,}$/.test(paper.id) && !ids.has(paper.id), `编号无效或重复：${paper.id}`);
    ids.add(paper.id);
    assert(paper.pdf === `/papers/${paper.id}.pdf`, `${paper.id} PDF 路径不匹配`);
    const bytes = await readFile(inside(root, `public${paper.pdf}`));
    assert(bytes.subarray(0, 5).toString() === '%PDF-', `${paper.id} 文件不是 PDF`);
    assert(bytes.length === paper.bytes && sha(bytes) === paper.sha256, `${paper.id} 原文校验失败`);
    assert(assets.includes(paper.pdf.slice(1)), `${paper.id} 未加入导出清单`);
  }
  assert(
    assets
      .filter((a) => a.startsWith('papers/'))
      .every(
        (a) =>
          later.some((p) => p.pdf === `/${a}`) ||
          papers.some((p) => p.pdf === `/${a}` || p.supplement?.pdf === `/${a}`),
      ),
    '导出清单存在无对应论文的 PDF',
  );
  return { total: papers.length, scored: papers.filter((p) => p.scores !== null).length };
}
export async function importPaper(manifestPath, { root = repository, apply = false } = {}) {
  const input = await json(manifestPath);
  assert(
    Object.keys(input).every((k) => ['mode', 'paper', 'pdf', 'supplementPdf'].includes(k)),
    '导入包存在未知字段',
  );
  assert(
    ['add', 'update'].includes(input.mode) && input.paper && typeof input.paper === 'object',
    '需要 mode:add/update 和 paper',
  );
  assert(
    Object.keys(input.paper).every((k) => fields.includes(k)),
    'paper 存在未知字段',
  );
  const papers = await json(resolve(root, dataPath)),
    assets = await json(resolve(root, assetsPath));
  await validate(papers, assets, root);
  const existing = papers.find((p) => p.id === input.paper.id);
  assert(input.mode === 'add' ? !existing : !!existing, '新增编号已存在，或更新编号不存在');
  const paper = { ...existing, ...input.paper };
  assert(/^P\d{3,}$/.test(paper.id), '编号格式应为 P 加至少三位数字');
  const group = groups[paper.msc?.[0]?.slice(0, 2)];
  assert(group, '主 MSC 尚无对应方向，请先扩展 groups');
  [paper.topic, paper.symbol] = group;
  paper.pdf = `/papers/${paper.id}.pdf`;
  const overrides = new Map();
  if (input.pdf !== undefined) {
    assert(typeof input.pdf === 'string' && input.pdf.length > 0, 'PDF 路径无效');
    assert(
      Number.isInteger(input.paper.pages) && input.paper.pages > 0,
      '更换 PDF 时请明确填写新版页数',
    );
    const bytes = await readFile(resolve(dirname(manifestPath), input.pdf));
    paper.bytes = bytes.length;
    paper.sha256 = sha(bytes);
    overrides.set(paper.pdf, bytes);
  } else assert(existing, '新增论文必须提供 PDF');
  if (input.supplementPdf !== undefined) {
    assert(
      typeof input.supplementPdf === 'string' && input.supplementPdf.length > 0,
      '补充PDF路径无效',
    );
    assert(
      Number.isInteger(input.paper.supplement?.pages) && input.paper.supplement.pages > 0,
      '更换补充PDF时必须填写新版页数',
    );
    const bytes = await readFile(resolve(dirname(manifestPath), input.supplementPdf));
    paper.supplement = {
      pdf: `/papers/${paper.id}-supplement.pdf`,
      pages: input.paper.supplement.pages,
      bytes: bytes.length,
      sha256: sha(bytes),
    };
    overrides.set(paper.supplement.pdf, bytes);
  }
  const next = papers
    .filter((p) => p.id !== paper.id)
    .concat(paper)
    .sort(compareFactoryPapers);
  const nextAssets = [
    ...new Set([
      ...assets,
      paper.pdf.slice(1),
      ...(paper.supplement ? [paper.supplement.pdf.slice(1)] : []),
    ]),
  ];
  const result = await validate(next, nextAssets, root, overrides);
  const changed = fields.filter((k) => JSON.stringify(existing?.[k]) !== JSON.stringify(paper[k]));
  if (!apply) return { mode: 'preview', id: paper.id, changed, ...result };
  const history = resolve(
    root,
    'trash/paper-updates',
    `${new Date().toISOString().replaceAll(':', '-')}_${paper.id}_${randomUUID().slice(0, 8)}`,
  );
  await mkdir(history, { recursive: true });
  const existingPdfs = [existing?.pdf, existing?.supplement?.pdf].filter(Boolean);
  const paths = [
    dataPath,
    assetsPath,
    ...[...overrides.keys()]
      .filter((path) => existingPdfs.includes(path))
      .map((path) => `public${path}`),
  ];
  const added = [...overrides.keys()]
    .filter((path) => !existingPdfs.includes(path))
    .map((path) => `public${path}`);
  for (const name of paths) {
    const target = inside(history, name);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(inside(root, name), target);
  }
  await writeFile(resolve(history, 'restore.json'), await pretty({ files: paths, added }));
  try {
    for (const [path, bytes] of overrides) {
      const target = inside(root, `public${path}`);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, bytes);
    }
    await writeFile(resolve(root, dataPath), await pretty(next));
    await writeFile(resolve(root, assetsPath), await pretty(nextAssets));
    await validate(next, nextAssets, root);
  } catch (cause) {
    for (const name of paths) await copyFile(inside(history, name), inside(root, name));
    // An interrupted new PDF stays unlisted; no original file is deleted.
    throw new Error(`写入失败，已有文件已还原；备份：${history}`, { cause });
  }
  return { mode: 'applied', id: paper.id, changed, backup: history, ...result };
}

export async function restoreSnapshot(snapshot, { root = repository, apply = false } = {}) {
  const historyRoot = resolve(root, 'trash/paper-updates');
  const source = inside(historyRoot, relative(historyRoot, resolve(root, snapshot)));
  const manifest = await json(resolve(source, 'restore.json'));
  assert(Array.isArray(manifest.files) && Array.isArray(manifest.added), '备份清单无效');
  assert(manifest.files.includes(dataPath) && manifest.files.includes(assetsPath), '缺少数据备份');
  const allowed = (name) =>
    [dataPath, assetsPath].includes(name) ||
    /^public\/papers\/P\d{3,}(-supplement)?\.pdf$/.test(name);
  assert(
    manifest.files.every(allowed) &&
      manifest.added.every((name) => /^public\/papers\/P\d{3,}(-supplement)?\.pdf$/.test(name)),
    '备份包含不允许还原的路径',
  );
  const papers = await json(resolve(source, dataPath)),
    assets = await json(resolve(source, assetsPath));
  const overrides = new Map();
  for (const name of manifest.files.filter((name) => name.startsWith('public/')))
    overrides.set(name.slice(6), await readFile(inside(source, name)));
  const counts = await validate(papers, assets, root, overrides);
  if (!apply) return { mode: 'restore-preview', ...counts };
  const backup = resolve(historyRoot, `restore-${randomUUID()}`);
  await mkdir(backup, { recursive: true });
  for (const name of manifest.files) {
    const target = inside(backup, name);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(inside(root, name), target);
  }
  // Preserve added PDFs in trash instead of deleting them.
  for (const name of manifest.added) {
    const target = inside(backup, name);
    await mkdir(dirname(target), { recursive: true });
    await rename(inside(root, name), target);
  }
  for (const name of manifest.files) await copyFile(inside(source, name), inside(root, name));
  return { mode: 'restored', preserved: backup, ...counts };
}

async function main() {
  const { values } = parseArgs({
    options: {
      check: { type: 'boolean' },
      restore: { type: 'string' },
      input: { type: 'string' },
      apply: { type: 'boolean' },
      export: { type: 'string' },
      output: { type: 'string' },
    },
  });
  if (values.restore) log(await restoreSnapshot(values.restore, { apply: !!values.apply }));
  else if (values.check)
    log(
      await validate(
        await json(resolve(repository, dataPath)),
        await json(resolve(repository, assetsPath)),
      ),
    );
  else if (values.export) {
    assert(values.output, '导出需要 --output');
    const p = (await json(resolve(repository, dataPath))).find((p) => p.id === values.export);
    assert(p, '论文不存在');
    const target = inside(repository, values.output);
    assert(!relative(repository, target).startsWith('public'), '工作包不得放在公开资源目录');
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, await pretty({ mode: 'update', paper: p }), { flag: 'wx' });
    log(`已导出：${target}`);
  } else if (values.input) log(await importPaper(resolve(values.input), { apply: !!values.apply }));
  else
    throw new Error(
      '使用 --check、--export P045 --output .preview/P045.json 或 --input 包.json [--apply]',
    );
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  main().catch((e) => {
    error(e.message);
    process.exitCode = 1;
  });
