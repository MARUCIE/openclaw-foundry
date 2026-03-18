import test from 'node:test';
import assert from 'node:assert/strict';
import type { Blueprint, CatalogEntry, WizardAnswers } from '../src/types.js';
import { normalizeBlueprint } from '../src/analyzer.js';

const TODAY = new Date().toISOString().split('T')[0];

function buildAnswers(): WizardAnswers {
  return {
    userName: 'Doc Bootstrap',
    os: 'darwin',
    role: 'backend-developer',
    industry: 'saas',
    level: 'senior',
    teamSize: 'small',
    useCases: ['coding', 'api-development'],
    deliverables: ['code'],
    languages: ['typescript'],
    autonomy: 'L2-semi',
    integrations: ['github'],
    llmMode: 'skip',
  };
}

function buildCatalog(): CatalogEntry[] {
  return [
    { id: 'test-driven-development', name: 'TDD', description: '', source: 'aifleet' },
    { id: 'github-pr-creation', name: 'GitHub PR', description: '', source: 'aifleet' },
    { id: 'clawhub-known', name: 'Known ClawHub Skill', description: '', source: 'clawhub' },
  ];
}

function buildBlueprint(): Blueprint {
  return {
    version: '1.0',
    meta: {
      name: 'Generated Name',
      os: 'linux',
      created: '2024-07-30',
      profile: 'custom-profile',
      description: 'AI-generated blueprint',
    },
    openclaw: { version: 'latest', installMethod: 'npm' },
    identity: { role: 'backend-developer', soulTemplate: 'custom' },
    skills: {
      fromAifleet: ['test-driven-development', 'missing-aifleet-skill'],
      fromClawhub: ['clawhub-known', 'missing-clawhub-skill'],
      custom: [],
    },
    agents: [],
    config: { autonomy: 'L1-guided', modelRouting: 'fast', memoryChunks: 72 },
    cron: [],
    mcpServers: [],
    extensions: [],
    llm: { mode: 'skip' },
  };
}

test('normalizeBlueprint overwrites deterministic fields and filters unknown skills', () => {
  const normalized = normalizeBlueprint(buildBlueprint(), buildAnswers(), buildCatalog());

  assert.equal(normalized.meta.os, 'darwin');
  assert.equal(normalized.meta.created, TODAY);
  assert.equal(normalized.config.autonomy, 'L2-semi');
  assert.deepEqual(normalized.skills.fromAifleet, ['test-driven-development']);
  assert.deepEqual(normalized.skills.fromClawhub, ['clawhub-known']);
});
