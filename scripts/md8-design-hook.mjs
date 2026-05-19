import { execSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

function getTargetHtmlFiles() {
  const output = execSync(
    "find doc outputs/reports -type f -name '*.html' 2>/dev/null",
    { cwd: root, encoding: 'utf8' }
  );

  return output
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .filter((entry) => entry.endsWith('.html'));
}

function getStyleBlocks(content) {
  return [...content.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((match) => match[1]);
}

function checkSpacing(styleBlocks, filePath, violations) {
  const propertyPattern =
    /(margin(?:-top|-right|-bottom|-left)?|padding(?:-top|-right|-bottom|-left)?|gap|row-gap|column-gap|min-width|max-width|width|height|min-height|max-height)\s*:\s*([^;{}]+)/g;

  for (const block of styleBlocks) {
    for (const match of block.matchAll(propertyPattern)) {
      const property = match[1];
      const value = match[2];
      const pxMatches = [...value.matchAll(/-?\d+px/g)];

      for (const pxMatch of pxMatches) {
        const pxValue = Number.parseInt(pxMatch[0], 10);
        if (
          (property === 'gap' || property === 'row-gap' || property === 'column-gap') &&
          Math.abs(pxValue) === 1
        ) {
          continue;
        }
        if (Math.abs(pxValue) % 4 !== 0) {
          violations.push(
            `${filePath}: ${property} uses ${pxMatch[0]}, which breaks the MD8 4dp subdivision rule`
          );
        }
      }
    }
  }
}

function assertRule(condition, message, violations) {
  if (!condition) {
    violations.push(message);
  }
}

const changedFiles = getTargetHtmlFiles();

for (const filePath of changedFiles) {
  const absolutePath = path.join(root, filePath);
  const content = await readFile(absolutePath, 'utf8');
  const styleBlocks = getStyleBlocks(content);
  const joinedStyles = styleBlocks.join('\n');
  const violations = [];
  const hasStatusTag = content.includes('.status-tag');

  checkSpacing(styleBlocks, filePath, violations);

  assertRule(
    /html,\s*body[\s\S]*?overflow-x\s*:\s*hidden/.test(joinedStyles),
    `${filePath}: html/body must set overflow-x: hidden`,
    violations
  );
  assertRule(
    /word-break:\s*keep-all/.test(joinedStyles) && /overflow-wrap:\s*break-word/.test(joinedStyles),
    `${filePath}: CJK narrative blocks must declare keep-all + break-word`,
    violations
  );
  assertRule(
    !/th:first-child\s*,\s*td:first-child\s*\{[^}]*white-space\s*:\s*nowrap/.test(joinedStyles),
    `${filePath}: narrative first-column nowrap is forbidden`,
    violations
  );
  if (hasStatusTag) {
    assertRule(
      /\.status-tag[\s\S]*?min-width\s*:/.test(joinedStyles),
      `${filePath}: .status-tag must set a min-width`,
      violations
    );
    assertRule(
      /\.status-tag[\s\S]*?text-align\s*:\s*center/.test(joinedStyles),
      `${filePath}: .status-tag must center its label`,
      violations
    );
  }

  const hasRiskMatrixHeaders =
    content.includes('<th>风险</th>') &&
    content.includes('<th>状态</th>') &&
    content.includes('<th>缓释动作</th>');

  if (hasRiskMatrixHeaders) {
    assertRule(
      /<table class="risk-table">/.test(content),
      `${filePath}: risk matrix tables must use class="risk-table"`,
      violations
    );
    assertRule(
      /\.risk-table th:nth-child\(2\),[\s\S]*?white-space\s*:\s*nowrap/.test(joinedStyles),
      `${filePath}: .risk-table must reserve a fixed nowrap status column`,
      violations
    );
    assertRule(
      /\.term-token[\s\S]*?white-space\s*:\s*nowrap/.test(joinedStyles),
      `${filePath}: .term-token style is required for mixed CJK/Latin technical labels`,
      violations
    );
    assertRule(
      content.includes('class="term-token"'),
      `${filePath}: mixed CJK/Latin risk labels must isolate technical terms with .term-token`,
      violations
    );
  }

  if (violations.length > 0) {
    console.error('MD8 design hook failed:\n');
    for (const violation of violations) {
      console.error(`- ${violation}`);
    }
    process.exit(1);
  }
}

console.log('MD8 design hook: pass');
