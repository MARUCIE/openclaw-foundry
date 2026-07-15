import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

function source(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

function json(path: string): { scripts?: Record<string, string> } {
  return JSON.parse(source(path));
}

function machineTriggerBlock(markdown: string): string {
  const match = markdown.match(/## Machine Triggers\s*```yaml\n([\s\S]*?)\n```/);
  assert.ok(match, 'postmortem must include a fenced yaml Machine Triggers block');
  return match[1];
}

function triggerEntries(block: string): string[] {
  const entries: string[] = [];
  let section = '';
  for (const rawLine of block.split('\n')) {
    const line = rawLine.trim();
    if (/^(paths|keywords|regex):\s*$/.test(line)) {
      section = line.replace(/:\s*$/, '');
      continue;
    }
    if (line.startsWith('- ') && section) entries.push(`${section}:${line.slice(2).trim()}`);
  }
  return entries;
}

function stripYamlValue(value: string): string {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}

test('postmortem scanner is wired into local and deploy build gates', () => {
  const rootPackage = json('package.json');
  const webPackage = json('web/package.json');
  const deployWorkflow = source('.github/workflows/deploy.yml');

  assert.equal(rootPackage.scripts?.['postmortem:scan'], 'node scripts/scan-postmortems.mjs --strict');
  assert.match(rootPackage.scripts?.build ?? '', /npm run postmortem:scan/);
  assert.match(
    webPackage.scripts?.prebuild ?? '',
    /^node \.\.\/scripts\/scan-postmortems\.mjs --strict &&/,
  );
  assert.match(
    deployWorkflow,
    /deploy-frontend:[\s\S]*?actions\/checkout@v6[\s\S]*?fetch-depth:\s*0/,
  );
});

test('postmortem docs expose machine triggers and verification evidence', () => {
  const files = readdirSync(new URL('../postmortem', import.meta.url))
    .filter((name) => /^PM-.*\.md$/.test(name))
    .sort();

  assert.ok(files.length > 0, 'expected at least one postmortem');

  for (const file of files) {
    const markdown = source(`postmortem/${file}`);
    const entries = triggerEntries(machineTriggerBlock(markdown));

    assert.ok(entries.length > 0, `${file} must define at least one machine trigger`);
    assert.match(markdown, /## Verification\n/, `${file} must retain verification evidence`);

    for (const entry of entries.filter((value) => value.startsWith('regex:'))) {
      const pattern = stripYamlValue(entry.slice('regex:'.length));
      assert.doesNotThrow(() => new RegExp(pattern), `${file} has invalid regex ${entry}`);
    }
  }
});

test('postmortem scanner includes untracked changes and strict acknowledgements', () => {
  const scanner = source('scripts/scan-postmortems.mjs');

  assert.match(scanner, /ls-files', '--others', '--exclude-standard'/);
  assert.match(scanner, /untracked:/);
  assert.match(scanner, /ACKED_IN_DIFF/);
  assert.match(scanner, /historical regression trigger\(s\) matched/);
});
