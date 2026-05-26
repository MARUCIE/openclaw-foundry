#!/usr/bin/env node
// Remove concrete person-name based advisor identities from generated role packs.
//
// The public pack surface must use role-neutral capability labels. This script is
// intentionally wired into generation/build so copied upstream skills or agents
// cannot reintroduce named personas.

import {
  chmodSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(SCRIPT_DIR, '..');

const args = process.argv.slice(2);
const CHECK_ONLY = args.includes('--check');

function valuesFor(flag) {
  const values = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === flag && args[i + 1]) values.push(resolve(args[i + 1]));
  }
  return values;
}

const DEFAULT_PACKS_DIR = join(PROJECT_ROOT, 'web', 'public', 'packs');
const DEFAULT_SOURCE_DIR = join(PROJECT_ROOT, 'data', 'job-packs');
const DEFAULT_CATALOG = join(PROJECT_ROOT, 'web', 'public', 'data', 'packs.json');

const packsDirs = valuesFor('--packs-dir');
if (packsDirs.length === 0 && existsSync(DEFAULT_PACKS_DIR)) packsDirs.push(DEFAULT_PACKS_DIR);

const extraDirs = valuesFor('--extra-dir');
if (extraDirs.length === 0 && existsSync(DEFAULT_SOURCE_DIR)) extraDirs.push(DEFAULT_SOURCE_DIR);

const catalogFiles = valuesFor('--catalog');
if (catalogFiles.length === 0) {
  for (const file of [
    DEFAULT_CATALOG,
    join(PROJECT_ROOT, 'web', 'public', 'data', 'collections.json'),
  ]) {
    if (existsSync(file)) catalogFiles.push(file);
  }
}

const PATH_RENAMES = new Map([
  ['advisor-munger', 'advisor-decision-framework'],
  ['advisor-drucker', 'advisor-business-value'],
  ['advisor-meadows', 'advisor-systems-thinking'],
  ['advisor-buffett', 'advisor-strategic-focus'],
  ['advisor-taleb', 'advisor-tail-risk'],
  ['advisor-hickey', 'advisor-software-simplicity'],
  ['advisor-brooks', 'advisor-project-complexity'],
  ['advisor-jobs', 'advisor-product-experience'],
  ['advisor-hara', 'advisor-design-simplicity'],
  ['advisor-catmull', 'advisor-team-culture'],
  ['advisor-musk', 'advisor-execution-speed'],
  ['advisor-orwell', 'advisor-language-clarity'],
  ['karpathy-autoresearch', 'iterative-autoresearch'],
  ['porters-five-forces', 'industry-forces'],
]);

const ADVISOR_PROFILES = {
  'advisor-decision-framework': {
    title: 'Decision Framework Advisor',
    description: 'Role-neutral advisor for inversion, incentives, tradeoffs, and decision risk.',
    focus: [
      'Invert the decision and identify how the plan can fail.',
      'Map incentives, constraints, and second-order effects.',
      'Separate reversible experiments from irreversible commitments.',
    ],
  },
  'advisor-business-value': {
    title: 'Business Value Advisor',
    description: 'Role-neutral advisor for customer value, effectiveness, and business outcomes.',
    focus: [
      'Clarify the customer or stakeholder outcome being served.',
      'Separate visible activity from measurable value creation.',
      'Connect priorities to constraints, accountability, and operating cadence.',
    ],
  },
  'advisor-systems-thinking': {
    title: 'Systems Thinking Advisor',
    description: 'Role-neutral advisor for feedback loops, leverage points, and system side effects.',
    focus: [
      'Map feedback loops, delays, and reinforcing or balancing forces.',
      'Identify small leverage points with disproportionate downstream effects.',
      'Surface unintended consequences before recommending action.',
    ],
  },
  'advisor-strategic-focus': {
    title: 'Strategic Focus Advisor',
    description: 'Role-neutral advisor for focus, durability, compounding, and resource allocation.',
    focus: [
      'Test whether the opportunity has durable advantage or only short-term appeal.',
      'Protect focus by making tradeoffs explicit.',
      'Define pass criteria as clearly as go criteria.',
    ],
  },
  'advisor-tail-risk': {
    title: 'Tail Risk Advisor',
    description: 'Role-neutral advisor for fragility, asymmetry, stress tests, and downside exposure.',
    focus: [
      'Look for hidden fragility under extreme but plausible scenarios.',
      'Prefer asymmetric upside with bounded downside.',
      'Add skin-in-the-game and stress-test checks to recommendations.',
    ],
  },
  'advisor-software-simplicity': {
    title: 'Software Simplicity Advisor',
    description: 'Role-neutral advisor for simplicity, composability, and reducing accidental complexity.',
    focus: [
      'Prefer clear data, small interfaces, and explicit boundaries.',
      'Remove incidental complexity before adding abstractions.',
      'Challenge stateful or clever designs that weaken maintenance.',
    ],
  },
  'advisor-project-complexity': {
    title: 'Project Complexity Advisor',
    description: 'Role-neutral advisor for essential complexity, scheduling risk, and team scaling.',
    focus: [
      'Separate essential complexity from accidental process or tooling overhead.',
      'Expose coordination cost and schedule risk early.',
      'Recommend smaller milestones with observable completion evidence.',
    ],
  },
  'advisor-product-experience': {
    title: 'Product Experience Advisor',
    description: 'Role-neutral advisor for product clarity, user delight, and decisive scope control.',
    focus: [
      'Reduce a product promise to one clear user outcome.',
      'Cut features that blur the primary experience.',
      'Raise the bar on onboarding, naming, copy, and interaction quality.',
    ],
  },
  'advisor-design-simplicity': {
    title: 'Design Simplicity Advisor',
    description: 'Role-neutral advisor for visual restraint, structural clarity, and useful emptiness.',
    focus: [
      'Remove visual noise and expose the underlying structure.',
      'Use whitespace, rhythm, and hierarchy to make decisions easier.',
      'Question whether each element needs to exist.',
    ],
  },
  'advisor-team-culture': {
    title: 'Team Culture Advisor',
    description: 'Role-neutral advisor for candor, creative safety, and collaboration dynamics.',
    focus: [
      'Protect candid feedback without turning it into blame.',
      'Separate idea quality from status, role, or personality.',
      'Design review loops that improve the work and the team.',
    ],
  },
  'advisor-execution-speed': {
    title: 'Execution Speed Advisor',
    description: 'Role-neutral advisor for first principles, urgency, and removing execution bottlenecks.',
    focus: [
      'Return to first principles before optimizing inherited process.',
      'Shorten feedback loops and remove avoidable handoffs.',
      'Use aggressive timelines only when evidence and safeguards are visible.',
    ],
  },
  'advisor-language-clarity': {
    title: 'Language Clarity Advisor',
    description: 'Role-neutral advisor for plain language, weak-signal detection, and argument compression.',
    focus: [
      'Replace vague phrasing with testable claims.',
      'Detect jargon that hides weak reasoning.',
      'Compress research into decisions, evidence, and uncertainty.',
    ],
  },
};

const TEXT_REPLACEMENTS = [
  ...[...PATH_RENAMES.entries()].map(([from, to]) => [new RegExp(escapeRegExp(from), 'g'), to]),

  [/Charlie Munger(?:&#39;s|'s|’s)?/g, 'Decision Framework'],
  [/\bMunger(?:&#39;s|'s|’s)?\b/g, 'Decision Framework'],
  [/查理[·・ ]?芒格/g, '决策框架'],
  [/芒格/g, '决策框架'],

  [/Peter Drucker(?:&#39;s|'s|’s)?/g, 'Business Value'],
  [/\bDrucker(?:&#39;s|'s|’s)?\b/g, 'Business Value'],
  [/彼得[·・ ]?德鲁克/g, '业务价值'],
  [/德鲁克/g, '业务价值'],

  [/Donella Meadows(?:&#39;s|'s|’s)?/g, 'Systems Thinking'],
  [/\bMeadows(?:&#39;s|'s|’s)?\b/g, 'Systems Thinking'],
  [/唐娜拉[·・ ]?梅多斯/g, '系统思维'],
  [/梅多斯/g, '系统思维'],

  [/Warren Buffett(?:&#39;s|'s|’s)?/g, 'Strategic Focus'],
  [/\bBuffett(?:&#39;s|'s|’s)?\b/g, 'Strategic Focus'],
  [/沃伦[·・ ]?巴菲特/g, '战略聚焦'],
  [/巴菲特/g, '战略聚焦'],

  [/Nassim Nicholas Taleb(?:&#39;s|'s|’s)?/g, 'Tail Risk'],
  [/Nassim Taleb(?:&#39;s|'s|’s)?/g, 'Tail Risk'],
  [/\bTaleb(?:&#39;s|'s|’s)?\b/g, 'Tail Risk'],
  [/纳西姆[·・ ]?塔勒布/g, '尾部风险'],
  [/塔勒布/g, '尾部风险'],

  [/Rich Hickey(?:&#39;s|'s|’s)?/g, 'Software Simplicity'],
  [/\bHickey(?:&#39;s|'s|’s)?\b/g, 'Software Simplicity'],
  [/里奇[·・ ]?希基/g, '软件简化'],
  [/希基/g, '软件简化'],

  [/Fred(?:erick)? Brooks(?:&#39;s|'s|’s)?/g, 'Project Complexity'],
  [/\bBrooks(?:&#39s|&#39;s|'s|’s)?\b/g, 'Project Complexity'],
  [/弗雷德[·・ ]?布鲁克斯/g, '项目复杂度'],
  [/布鲁克斯/g, '项目复杂度'],

  [/Steve Jobs(?:&#39s|&#39;s|'s|’s)?/g, 'Product Experience'],
  [/Jobs\s*\+\s*Hara\s*\+\s*Catmull/g, 'Product Experience + Design Simplicity + Team Culture'],
  [/Hara\s*\+\s*Jobs/g, 'Design Simplicity + Product Experience'],
  [/Jobs\/Ive/g, 'Product Experience / Interface Craft'],
  [/Jobs was/g, 'The product-experience lens was'],
  [/Jobs real-time/g, 'Product-experience real-time'],
  [/Jobs&#39;|Jobs'|Jobs’/g, 'Product Experience'],
  [/\bJobs:\s*/g, 'Product Experience: '],
  [/#100 Jobs Portfolio/g, '#100 Work Portfolio'],
  [/乔布斯/g, '产品体验'],

  [/Jony Ive(?:&#39s|&#39;s|'s|’s)?/g, 'Interface Craft'],
  [/\bIve(?:&#39s|&#39;s|'s|’s)?\b/g, 'Interface Craft'],

  [/Kenya Hara(?:&#39s|&#39;s|'s|’s)?/g, 'Design Simplicity'],
  [/\bHara(?:&#39s|&#39;s|'s|’s)?\b/g, 'Design Simplicity'],
  [/原研哉/g, '设计简化'],

  [/Edwin Catmull(?:&#39s|&#39;s|'s|’s)?/g, 'Team Culture'],
  [/Ed Catmull(?:&#39s|&#39;s|'s|’s)?/g, 'Team Culture'],
  [/\bCatmull(?:&#39s|&#39;s|'s|’s)?\b/g, 'Team Culture'],
  [/卡特穆尔/g, '团队文化'],

  [/Elon Musk(?:&#39s|&#39;s|'s|’s)?/g, 'Execution Speed'],
  [/\bMusk(?:&#39s|&#39;s|'s|’s)?\b/g, 'Execution Speed'],
  [/马斯克/g, '执行速度'],

  [/George Orwell(?:&#39s|&#39;s|'s|’s)?/g, 'Language Clarity'],
  [/\bOrwell(?:&#39s|&#39;s|'s|’s)?\b/g, 'Language Clarity'],
  [/奥威尔/g, '语言清晰'],

  [/Andrej Karpathy(?:&#39s|&#39;s|'s|’s)?/g, 'Iterative Research'],
  [/\bKarpathy(?:&#39s|&#39;s|'s|’s)?\b/g, 'Iterative Research'],
  [/卡帕西/g, '迭代研究'],

  [/Porter&#39;s Five Forces/g, 'Five Forces'],
  [/Porter's Five Forces/g, 'Five Forces'],
  [/Porters Five Forces/g, 'Five Forces'],
  [/\bPorter(?:&#39s|&#39;s|'s|’s)?\b/g, 'Industry Structure'],
  [/波特五力模型/g, '五力模型'],
  [/波特/g, '行业结构'],

  [/\bPareto\b/g, '80/20 Rule'],
  [/Tony Ulwick and Sabeen Sattar/g, 'JTBD practitioners'],
  [/Tony Ulwick/g, 'JTBD practitioner'],
  [/Sabeen Sattar/g, 'JTBD practitioner'],
  [/Alexander Osterwalder/g, 'Business Model Canvas practitioner'],
  [/Ash Maurya/g, 'Lean Canvas practitioner'],
  [/Paweł Huryn and Aatir Abdul Rauf/g, 'JTBD template practitioners'],
  [/Pawel Huryn and Aatir Abdul Rauf/g, 'JTBD template practitioners'],
  [/Paweł Huryn/g, 'JTBD template practitioner'],
  [/Pawel Huryn/g, 'JTBD template practitioner'],
  [/Aatir Abdul Rauf/g, 'JTBD template practitioner'],
  [/Ben Yoskovitz/g, 'metrics practitioner'],
  [/Geoffrey Moore/g, 'beachhead strategy practitioner'],
  [/Miqdad Jaffer/g, 'AI PRD practitioner'],
  [/\(by Business Model Canvas practitioner\)/g, '(from Business Model Canvas literature)'],
  [/\(Strategyzer, Business Model Canvas practitioner\)/g, '(Strategyzer)'],
  [/\(Lean Canvas practitioner\)/g, '(Lean Canvas literature)'],
  [/\(JTBD template practitioner\)/g, '(JTBD template literature)'],
  [/\(by JTBD template practitioners\)/g, '(from JTBD template literature)'],
  [/\(metrics practitioner, \*Lean Analytics\*\)/g, '(*Lean Analytics*)'],
  [/ by metrics practitioner/g, ' from metrics literature'],
  [/beachhead strategy practitioner's beachhead market strategy/g, 'beachhead market strategy'],
  [/by AI PRD practitioner \(Product Lead @ OpenAI\)/g, 'from AI PRD practice'],

  [/"curator":\s*"Maurice"/g, '"curator": "Agent Foundry Team"'],
  [/Maurice\s*\|\s*maurice_wen@proton\.me/g, 'Agent Foundry Team'],
  [/maurice_wen@proton\.me/g, 'project-owner contact channel'],
  [/Maurice(?:&#39s|&#39;s|'s|’s)?/g, 'the program owner'],
  [/Jobs-fix/g, 'first-use-demo hint'],
  [/~\/Projects\/18-agent-matrix\/core\/swarm\//g, 'agent-matrix/core/swarm/'],
  [/~\/Projects\/18-agent-matrix\/data\/agent_cards\.json/g, 'agent-matrix/data/agent_cards.json'],
  [/~\/Projects\/18-agent-matrix\/data\/pheromone\.db/g, 'agent-matrix/data/pheromone.db'],
  [/~\/Projects\/18-agent-matrix\/doc\/\.\.\.\/SWARM_UPGRADE_ARCHITECTURE\.html/g, 'agent-matrix/doc/SWARM_UPGRADE_ARCHITECTURE.html'],
];

const FORBIDDEN_PATTERNS = [
  ['old advisor id', /advisor-(munger|drucker|meadows|buffett|taleb|hickey|brooks|jobs|hara|catmull|musk|orwell)/],
  ['old skill id', /karpathy-autoresearch|porters-five-forces/],
  ['named advisor', /\b(Munger|Drucker|Meadows|Buffett|Taleb|Hickey|Brooks|Hara|Catmull|Musk|Orwell|Karpathy|Porter|Pareto)\b/],
  ['product persona', /Steve Jobs|Jony Ive|Jobs\s*\+|Jobs\/Ive|Jobs was|Jobs&#39;|Jobs'|Jobs’|\bIve\b/],
  ['external instructor name', /Tony Ulwick|Sabeen Sattar/],
  ['external framework author name', /Alexander Osterwalder|Ash Maurya|Paweł Huryn|Pawel Huryn|Aatir Abdul Rauf|Ben Yoskovitz|Geoffrey Moore|Miqdad Jaffer/],
  ['Chinese named advisor', /芒格|德鲁克|梅多斯|巴菲特|塔勒布|希基|布鲁克斯|乔布斯|原研哉|卡特穆尔|马斯克|奥威尔|卡帕西|波特/],
  ['personal owner signature', /Maurice|maurice_wen@proton\.me/],
  ['legacy comment', /Jobs-fix/],
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function listFiles(root) {
  const out = [];
  if (!existsSync(root)) return out;
  const st = statSync(root);
  if (st.isFile()) return [root];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.DS_Store') continue;
    const full = join(root, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

function listPaths(root) {
  const out = [];
  if (!existsSync(root)) return out;
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.DS_Store') continue;
    const full = join(root, entry.name);
    out.push(full);
    if (entry.isDirectory()) out.push(...listPaths(full));
  }
  return out;
}

function rewriteText(text) {
  let next = text;
  for (const [pattern, replacement] of TEXT_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }
  next = next.replace(/^\s*>\s*\*?Source disclosure:[^\n]*$/gm, '> Source disclosure: internal cohort observations; validate against the target market before reuse.');
  next = next.replace(/向 the program owner 反馈/g, '向项目负责人反馈');
  next = next.replace(/the program owner \+ tech lead/g, 'program owner + tech lead');
  next = next.replace(/仅 the program owner 可见/g, '仅项目负责人可见');
  next = next.replace(/负责人：cohort \+ 程序负责人（the program owner）/g, '负责人：cohort + 程序负责人');
  return next;
}

function renameGeneratedPaths(root) {
  let renamed = 0;
  const paths = listPaths(root).sort((a, b) => b.length - a.length);
  for (const path of paths) {
    if (!existsSync(path)) continue;
    const rel = relative(root, path);
    let newRel = rel;
    for (const [from, to] of PATH_RENAMES) {
      newRel = newRel.split(from).join(to);
    }
    if (newRel === rel) continue;
    const target = join(root, newRel);
    mkdirSync(dirname(target), { recursive: true });
    const isDir = statSync(path).isDirectory();
    if (isDir && existsSync(target)) {
      rmSync(path, { recursive: true, force: true });
      renamed += 1;
      continue;
    }
    if (existsSync(target)) rmSync(target, { recursive: true, force: true });
    renameSync(path, target);
    renamed += 1;
  }
  return renamed;
}

function rewriteFiles(roots, files) {
  let changed = 0;
  for (const file of [...roots.flatMap(listFiles), ...files.filter(existsSync)]) {
    let text;
    try {
      text = readFileSync(file, 'utf-8');
    } catch {
      continue;
    }
    if (text.includes('\u0000')) continue;
    const next = rewriteText(text);
    if (next !== text) {
      writeFileSync(file, next, 'utf-8');
      if (file.endsWith('/install.sh')) chmodSync(file, 0o755);
      changed += 1;
    }
  }
  return changed;
}

function renderAdvisorProfile(id, profile) {
  const focus = profile.focus.map((item) => `- ${item}`).join('\n');
  return `---\nname: ${id}\ndescription: ${JSON.stringify(profile.description)}\n---\n# ${profile.title}\n\nYou are a role-neutral advisory lens. Do not impersonate a real person, cite a living or historical individual as the source of the persona, or use biographical authority. Provide concise, evidence-oriented critique from the capability described by this file.\n\n## Focus\n\n${focus}\n\n## Operating Rules\n\n- Stay in the named capability lane.\n- Give the strongest useful challenge before recommendations.\n- Make assumptions, risks, and stop conditions explicit.\n- Do not modify files; return advisory output only.\n`;
}

function rewriteAdvisorFiles(packsRoot) {
  let written = 0;
  for (const file of listFiles(packsRoot)) {
    const match = file.match(/\/agents\/(advisor-[a-z-]+)\.md$/);
    if (!match) continue;
    const id = match[1];
    const profile = ADVISOR_PROFILES[id];
    if (!profile) continue;
    writeFileSync(file, renderAdvisorProfile(id, profile), 'utf-8');
    written += 1;
  }
  return written;
}

function ensureManifestAdvisorFiles(packsRoot) {
  let written = 0;
  for (const manifestPath of listFiles(packsRoot).filter((file) => file.endsWith('/manifest.json'))) {
    let manifest;
    try {
      manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    } catch {
      continue;
    }
    const packDir = dirname(manifestPath);
    for (const item of manifest.items || []) {
      if (item?.type !== 'agent') continue;
      for (const candidate of [item.src, item.dst]) {
        const match = String(candidate || '').match(/agents\/(advisor-[a-z-]+)\.md$/);
        if (!match) continue;
        const id = match[1];
        const profile = ADVISOR_PROFILES[id];
        if (!profile) continue;
        const target = join(packDir, 'agents', `${id}.md`);
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, renderAdvisorProfile(id, profile), 'utf-8');
        written += 1;
      }
    }
  }
  return written;
}

function audit(roots, files) {
  const findings = [];
  for (const file of [...roots.flatMap(listFiles), ...files.filter(existsSync)]) {
    let text;
    try {
      text = readFileSync(file, 'utf-8');
    } catch {
      continue;
    }
    if (text.includes('\u0000')) continue;
    const rel = relative(PROJECT_ROOT, file);
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i += 1) {
      for (const [label, pattern] of FORBIDDEN_PATTERNS) {
        if (pattern.test(lines[i])) {
          findings.push({ file: rel, line: i + 1, label, text: lines[i].trim().slice(0, 220) });
          break;
        }
      }
      if (findings.length > 200) return findings;
    }
  }
  return findings;
}

if (packsDirs.length === 0) {
  console.error('ERROR: no packs directory found. Pass --packs-dir <path>.');
  process.exit(1);
}

let renamed = 0;
let changed = 0;
let advisors = 0;
const textRoots = [...packsDirs, ...extraDirs];
const textFiles = catalogFiles;

if (!CHECK_ONLY) {
  for (const dir of packsDirs) renamed += renameGeneratedPaths(dir);
  changed = rewriteFiles(textRoots, textFiles);
  for (const dir of packsDirs) advisors += rewriteAdvisorFiles(dir);
  for (const dir of packsDirs) advisors += ensureManifestAdvisorFiles(dir);
}

const findings = audit(textRoots, textFiles);
if (findings.length > 0) {
  console.error(`ERROR: pack person-name audit failed (${findings.length} findings; showing up to 200).`);
  for (const f of findings.slice(0, 200)) {
    console.error(`${f.file}:${f.line} [${f.label}] ${f.text}`);
  }
  process.exit(1);
}

console.log(
  CHECK_ONLY
    ? `OK pack person-name audit passed: packs=${packsDirs.length} extras=${extraDirs.length} catalogs=${catalogFiles.length}`
    : `OK sanitized pack person names: renamed=${renamed} changed=${changed} advisors=${advisors}`,
);
