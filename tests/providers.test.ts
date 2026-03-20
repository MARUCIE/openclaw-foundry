import test from 'node:test';
import assert from 'node:assert/strict';
import type { Blueprint, ProviderId, ProviderMeta } from '../src/types.js';
import { PROVIDER_IDS, DEPLOY_MODES, IM_CHANNELS, BlueprintSchema, TargetSchema } from '../src/types.js';
import { getProvider, listProviders, listProvidersByType, listProvidersByOS, listProvidersByIM, getProviderStats } from '../src/providers/index.js';

// --- Test helpers ---

function buildTestBlueprint(providerId: ProviderId = 'openclaw'): Blueprint {
  return BlueprintSchema.parse({
    version: '2.0',
    meta: { name: 'test-blueprint', os: 'darwin', created: '2026-03-20' },
    target: { provider: providerId, deployMode: 'local' },
    openclaw: { version: 'latest', installMethod: 'npm' },
    identity: { role: 'fullstack-developer' },
    skills: { fromAifleet: ['commit-helper'], fromClawhub: [], custom: [] },
    agents: [{ name: 'main', role: 'test', jobs: [] }],
    config: { autonomy: 'L1-guided', modelRouting: 'balanced', memoryChunks: 72 },
  });
}

// ===== Schema Tests =====

test('BlueprintSchema v2: target field defaults correctly', () => {
  const bp = BlueprintSchema.parse({
    meta: { name: 'test', os: 'darwin', created: '2026-01-01' },
    openclaw: { version: 'latest', installMethod: 'npm' },
    identity: { role: 'test' },
    skills: { fromAifleet: [], fromClawhub: [], custom: [] },
    config: { autonomy: 'L1-guided', modelRouting: 'balanced', memoryChunks: 72 },
  });
  assert.equal(bp.version, '2.0');
  assert.equal(bp.target.provider, 'openclaw');
  assert.equal(bp.target.deployMode, 'local');
});

test('BlueprintSchema v2: accepts all provider IDs', () => {
  for (const id of PROVIDER_IDS) {
    const target = TargetSchema.parse({ provider: id, deployMode: 'local' });
    assert.equal(target.provider, id);
  }
});

test('BlueprintSchema v2: accepts all deploy modes', () => {
  for (const mode of DEPLOY_MODES) {
    const target = TargetSchema.parse({ provider: 'openclaw', deployMode: mode });
    assert.equal(target.deployMode, mode);
  }
});

test('BlueprintSchema v2: accepts all IM channels', () => {
  for (const im of IM_CHANNELS) {
    const target = TargetSchema.parse({ provider: 'openclaw', deployMode: 'local', imChannel: im });
    assert.equal(target.imChannel, im);
  }
});

test('BlueprintSchema v2: credentials are optional', () => {
  const target = TargetSchema.parse({ provider: 'arkclaw', deployMode: 'cloud' });
  assert.equal(target.credentials, undefined);
});

test('BlueprintSchema v2: credentials with all fields', () => {
  const target = TargetSchema.parse({
    provider: 'arkclaw',
    deployMode: 'cloud',
    credentials: { accessKeyId: 'ak', accessKeySecret: 'sk', token: 'tok', endpoint: 'https://x' },
  });
  assert.equal(target.credentials?.accessKeyId, 'ak');
  assert.equal(target.credentials?.endpoint, 'https://x');
});

test('BlueprintSchema v2: backward compatible with v1 (no target)', () => {
  const bp = BlueprintSchema.parse({
    version: '1.0',
    meta: { name: 'legacy', os: 'linux', created: '2026-01-01' },
    openclaw: { version: 'latest', installMethod: 'npm' },
    identity: { role: 'devops' },
    skills: { fromAifleet: [], fromClawhub: [], custom: [] },
    config: { autonomy: 'L1-guided', modelRouting: 'balanced', memoryChunks: 72 },
  });
  // target should default
  assert.equal(bp.target.provider, 'openclaw');
  assert.equal(bp.target.deployMode, 'local');
});

test('BlueprintSchema v2: rejects invalid provider ID', () => {
  assert.throws(() => {
    TargetSchema.parse({ provider: 'nonexistent', deployMode: 'local' });
  });
});

test('BlueprintSchema v2: rejects invalid deploy mode', () => {
  assert.throws(() => {
    TargetSchema.parse({ provider: 'openclaw', deployMode: 'teleport' });
  });
});

// ===== Registry Tests =====

test('Registry: listProviders returns all 13 providers', () => {
  const providers = listProviders();
  assert.equal(providers.length, 13);
});

test('Registry: every PROVIDER_ID has a registered provider', () => {
  for (const id of PROVIDER_IDS) {
    const provider = getProvider(id);
    assert.equal(provider.meta.id, id, `Provider ${id} not found or ID mismatch`);
  }
});

test('Registry: getProvider returns OpenClaw for unknown ID', () => {
  const provider = getProvider('nonexistent' as ProviderId);
  assert.equal(provider.meta.id, 'openclaw');
});

test('Registry: listProvidersByType filters correctly', () => {
  const saas = listProvidersByType('saas');
  assert.ok(saas.length > 0);
  for (const p of saas) assert.equal(p.type, 'saas');

  const desktop = listProvidersByType('desktop');
  assert.ok(desktop.length > 0);
  for (const p of desktop) assert.equal(p.type, 'desktop');

  const cloud = listProvidersByType('cloud');
  assert.ok(cloud.length > 0);
  for (const p of cloud) assert.equal(p.type, 'cloud');
});

test('Registry: listProvidersByOS filters correctly', () => {
  const darwinProviders = listProvidersByOS('darwin');
  assert.ok(darwinProviders.length >= 10); // most support darwin
  for (const p of darwinProviders) assert.ok(p.platforms.includes('darwin'));

  const androidProviders = listProvidersByOS('android');
  assert.ok(androidProviders.length >= 1); // at least miclaw
});

test('Registry: listProvidersByIM filters correctly', () => {
  const feishu = listProvidersByIM('feishu');
  assert.ok(feishu.length >= 1);
  for (const p of feishu) assert.ok(p.imChannels.includes('feishu'));
});

test('Registry: getProviderStats returns correct type counts', () => {
  const stats = getProviderStats();
  assert.equal(typeof stats.desktop, 'number');
  assert.equal(typeof stats.saas, 'number');
  assert.equal(typeof stats.cloud, 'number');
  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  assert.equal(total, 13);
});

// ===== Provider Meta Integrity Tests =====

test('Provider meta: all providers have required fields', () => {
  const providers = listProviders();
  for (const p of providers) {
    assert.ok(p.id, `Missing id`);
    assert.ok(p.name, `${p.id}: missing name`);
    assert.ok(p.vendor, `${p.id}: missing vendor`);
    assert.ok(p.type, `${p.id}: missing type`);
    assert.ok(p.platforms.length > 0, `${p.id}: no platforms`);
    assert.ok(p.status, `${p.id}: missing status`);
    assert.ok(p.consoleUrl.startsWith('https://'), `${p.id}: consoleUrl must be HTTPS`);
    assert.ok(p.description.length > 10, `${p.id}: description too short`);
  }
});

test('Provider meta: no duplicate IDs', () => {
  const providers = listProviders();
  const ids = providers.map(p => p.id);
  const unique = new Set(ids);
  assert.equal(ids.length, unique.size, 'Duplicate provider IDs found');
});

test('Provider meta: provider type matches expected categories', () => {
  const validTypes = new Set(['cloud', 'desktop', 'mobile', 'saas', 'remote']);
  for (const p of listProviders()) {
    assert.ok(validTypes.has(p.type), `${p.id}: invalid type "${p.type}"`);
  }
});

test('Provider meta: IM channels are valid', () => {
  const validIMs = new Set(IM_CHANNELS);
  for (const p of listProviders()) {
    for (const im of p.imChannels) {
      assert.ok(validIMs.has(im as any), `${p.id}: invalid IM channel "${im}"`);
    }
  }
});

// ===== Provider Interface Tests =====

test('Provider interface: getRequirements returns array', () => {
  for (const id of PROVIDER_IDS) {
    const provider = getProvider(id);
    const reqs = provider.getRequirements();
    assert.ok(Array.isArray(reqs), `${id}: getRequirements must return array`);
    for (const r of reqs) {
      assert.ok(r.name, `${id}: requirement missing name`);
      assert.ok(r.check, `${id}: requirement missing check command`);
      assert.ok(r.installHint, `${id}: requirement missing installHint`);
      assert.equal(typeof r.required, 'boolean', `${id}: requirement.required must be boolean`);
    }
  }
});

test('Provider interface: diagnose returns valid structure', async () => {
  // Test with openclaw (the only guaranteed-working provider)
  const provider = getProvider('openclaw');
  const result = await provider.diagnose();
  assert.equal(typeof result.healthy, 'boolean');
  assert.ok(Array.isArray(result.checks));
  assert.ok(Array.isArray(result.suggestions));
  for (const c of result.checks) {
    assert.ok(c.name);
    assert.ok(['ok', 'warn', 'error'].includes(c.status));
    assert.ok(c.message);
  }
});

test('Provider interface: deploy with missing credentials returns error for cloud providers', async () => {
  const cloudIds: ProviderId[] = ['arkclaw', 'jdcloud', 'huaweicloud', 'aliyun', 'duclaw'];
  for (const id of cloudIds) {
    const provider = getProvider(id);
    const bp = buildTestBlueprint(id);
    // No credentials — should fail gracefully
    const result = await provider.deploy(bp);
    assert.equal(result.success, false, `${id}: deploy without credentials should fail`);
    assert.ok(result.steps.length > 0, `${id}: should have at least one step`);
    assert.ok(
      result.steps.some(s => s.status === 'error'),
      `${id}: should have an error step`,
    );
  }
});

test('Provider interface: deploy with missing token returns error for SaaS providers', async () => {
  const saasIds: ProviderId[] = ['kimiclaw', 'maxclaw'];
  for (const id of saasIds) {
    const provider = getProvider(id);
    const bp = buildTestBlueprint(id);
    const result = await provider.deploy(bp);
    assert.equal(result.success, false, `${id}: deploy without token should fail`);
    assert.ok(result.steps.some(s => s.status === 'error'), `${id}: should have error`);
  }
});

// ===== OpenClaw Provider Specific =====

test('OpenClaw provider: meta is correct', () => {
  const p = getProvider('openclaw');
  assert.equal(p.meta.id, 'openclaw');
  assert.equal(p.meta.type, 'desktop');
  assert.equal(p.meta.status, 'stable');
  assert.equal(p.meta.vendor, 'Anthropic');
  assert.ok(p.meta.platforms.includes('darwin'));
  assert.ok(p.meta.platforms.includes('win32'));
  assert.ok(p.meta.platforms.includes('linux'));
});

test('OpenClaw provider: test returns valid result', async () => {
  const p = getProvider('openclaw');
  const bp = buildTestBlueprint();
  const result = await p.test(bp);
  assert.equal(typeof result.success, 'boolean');
  assert.ok(Array.isArray(result.checks));
});
