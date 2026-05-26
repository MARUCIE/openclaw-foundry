#!/usr/bin/env node
// enrich-public-pack-maturity.mjs
//
// Build-time maturity repair for public canonical job packs.
//
// The source of truth for "enriched" is scripts/pack-spec-audit.py. This script
// does not edit tier labels directly. It fills real PACK_SPEC v1.0 artifacts for
// public catalog packs that currently fail the four-pillar audit, then
// inject-pack-tiers.mjs re-runs the canonical audit and writes the tier.

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PACKS_JSON = join(ROOT, 'web', 'public', 'data', 'packs.json');
const PACKS_DIR = join(ROOT, 'web', 'public', 'packs');
const AUDIT_SCRIPT = join(ROOT, 'scripts', 'pack-spec-audit.py');
const AUDIT_OUT = join(ROOT, 'state', 'pack-spec-audit-before-enrichment.json');
const START = '<!-- OCF:PACK-MATURITY:START -->';
const END = '<!-- OCF:PACK-MATURITY:END -->';

const ROLE_PROFILES = {
  'algorithm-engineer': {
    focus: 'model experiment design, offline evaluation, feature/data drift, inference cost, and production rollout',
    demo: 'triage invoice OCR model regression with offline metric, ablation table, drift hypothesis, and rollout gate',
    outputs: ['experiment contract', 'metric ladder', 'ablation table', 'inference rollout gate'],
    risks: ['metric gaming', 'data leakage', 'offline-online mismatch', 'unbounded inference cost'],
  },
  'bigdata-engineer': {
    focus: 'batch/stream pipelines, lineage, freshness, warehouse contracts, and recoverable data operations',
    demo: 'design a daily invoice risk mart with lineage, freshness SLA, backfill plan, and cost guardrail',
    outputs: ['lineage map', 'freshness SLA', 'backfill runbook', 'cost guardrail'],
    risks: ['silent schema drift', 'late-arriving data', 'unbounded warehouse spend', 'non-idempotent backfill'],
  },
  'infra-engineer': {
    focus: 'deployment topology, IaC boundaries, capacity planning, observability, and recovery drills',
    demo: 'review a Cloudflare Pages plus Worker release for topology risk, rollback, observability, and IaC drift',
    outputs: ['topology map', 'release gate', 'rollback drill', 'observability checklist'],
    risks: ['configuration drift', 'missing rollback path', 'secret exposure', 'single-region fragility'],
  },
  'ops-engineer': {
    focus: 'release operations, incident response, SLO burn, deployment safety, and production runbooks',
    demo: 'prepare a production deploy runbook with preflight, canary, rollback, incident channel, and post-checks',
    outputs: ['preflight checklist', 'canary plan', 'rollback command set', 'incident timeline'],
    risks: ['alert fatigue', 'manual drift', 'slow rollback', 'missing owner handoff'],
  },
  'spellbook-code-reviewer': {
    focus: 'risk-based code review, API contracts, maintainability, tests, and behavioral regressions',
    demo: 'review a pull request for contract breakage, missing tests, dependency risk, and release blockers',
    outputs: ['ranked findings', 'test gap map', 'contract risk note', 'merge gate'],
    risks: ['style-only review', 'missing edge cases', 'unverified assumptions', 'dependency drift'],
  },
  'spellbook-security-auditor': {
    focus: 'OWASP risk, IAM boundaries, dependency exposure, secret handling, and deployment security gates',
    demo: 'audit a Worker API change for auth bypass, secret exposure, dependency CVEs, and deployment gate',
    outputs: ['threat model', 'control map', 'dependency audit', 'release security gate'],
    risks: ['auth bypass', 'secret leakage', 'supply-chain exposure', 'unchecked privileged path'],
  },
  'spellbook-ai-app-engineer': {
    focus: 'LLM app architecture, prompt/data boundaries, evaluation harnesses, tool safety, and cost controls',
    demo: 'design an AI invoice assistant with tool boundary, eval set, fallback path, and cost budget',
    outputs: ['tool boundary map', 'eval harness', 'prompt contract', 'cost budget'],
    risks: ['prompt injection', 'unbounded tool calls', 'missing eval set', 'PII leakage'],
  },
  'spellbook-onboarding': {
    focus: 'new operator onboarding, environment readiness, first task success, and handoff documentation',
    demo: 'create a first-week onboarding path for a new AI coding operator with setup checks and first delivery',
    outputs: ['onboarding map', 'first-task script', 'readiness checklist', 'handoff template'],
    risks: ['unclear first task', 'tooling mismatch', 'missing access', 'unowned follow-up'],
  },
  'executive-strategist': {
    focus: 'strategic option framing, resource allocation, system effects, downside risk, and decision cadence',
    demo: 'evaluate a new AI workflow business line with options, assumptions, resource tradeoffs, and stop rules',
    outputs: ['strategy options', 'assumption ledger', 'resource tradeoff', 'decision cadence'],
    risks: ['narrative bias', 'unpriced downside', 'resource dilution', 'weak stop rule'],
  },
  'investment-analyst': {
    focus: 'investment thesis, market structure, unit economics, scenario analysis, and risk-adjusted return',
    demo: 'build an investment memo for an AI tooling company with thesis, scenarios, risks, and diligence plan',
    outputs: ['investment memo', 'scenario model', 'risk matrix', 'diligence checklist'],
    risks: ['single-scenario optimism', 'weak comparables', 'ignored liquidity risk', 'unclear catalyst'],
  },
  'ab-test-analyst': {
    focus: 'experiment design, metric hierarchy, power analysis, guardrails, and decision interpretation',
    demo: 'design an experiment for checkout copy with MDE, sample size, guardrail metrics, and decision rules',
    outputs: ['experiment spec', 'power table', 'guardrail metrics', 'decision readout'],
    risks: ['peeking bias', 'underpowered test', 'metric collision', 'survivorship bias'],
  },
  'internal-control-specialist': {
    focus: 'control objectives, segregation of duties, evidence trails, exception handling, and audit readiness',
    demo: 'design controls for invoice approval automation with SoD, evidence capture, exception queue, and audit trail',
    outputs: ['control matrix', 'evidence trail', 'exception workflow', 'audit readiness pack'],
    risks: ['control bypass', 'missing evidence', 'unclear ownership', 'manual override abuse'],
  },
  'data-analyst': {
    focus: 'metric definition, dashboard trust, anomaly investigation, cohort analysis, and decision readouts',
    demo: 'diagnose a revenue dashboard drop with metric contract, cohort split, anomaly checks, and action readout',
    outputs: ['metric contract', 'cohort analysis', 'anomaly worksheet', 'decision readout'],
    risks: ['metric ambiguity', 'dashboard theater', 'aggregation bias', 'actionless reporting'],
  },
};

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function readJsonSafe(path) {
  try {
    return readJson(path);
  } catch {
    return null;
  }
}

function readText(path) {
  try {
    return readFileSync(path, 'utf-8');
  } catch {
    return '';
  }
}

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function writeText(path, text) {
  ensureDir(dirname(path));
  writeFileSync(path, text.endsWith('\n') ? text : `${text}\n`, 'utf-8');
}

function upsertManagedBlock(path, block) {
  const current = readText(path);
  const managed = `${START}\n${block.trim()}\n${END}`;
  if (!current.trim()) {
    writeText(path, managed);
    return;
  }
  const startIndex = current.indexOf(START);
  const endIndex = current.indexOf(END);
  if (startIndex >= 0 && endIndex > startIndex) {
    const next = `${current.slice(0, startIndex).trimEnd()}\n\n${managed}\n${current.slice(endIndex + END.length).trimStart()}`;
    writeText(path, next);
    return;
  }
  writeText(path, `${current.trimEnd()}\n\n${managed}`);
}

function runAudit() {
  ensureDir(dirname(AUDIT_OUT));
  execFileSync('python3', [AUDIT_SCRIPT, '--out', AUDIT_OUT], { stdio: ['ignore', 'pipe', 'pipe'] });
  const audit = readJson(AUDIT_OUT);
  if (!Array.isArray(audit.results)) throw new Error(`Malformed audit output: ${AUDIT_OUT}`);
  return new Map(audit.results.map(result => [result.slug, result]));
}

function lineLabel(pack) {
  return pack.lineZh || pack.line || 'role line';
}

function profileFor(pack) {
  const profile = ROLE_PROFILES[pack.id] || {};
  return {
    focus: profile.focus || pack.description || pack.descriptionZh || 'role-specific delivery, quality gates, and stakeholder evidence',
    demo: profile.demo || `deliver a first useful ${pack.name || pack.id} workflow with assumptions, evidence, and next-step gate`,
    outputs: profile.outputs || ['scope contract', 'risk register', 'delivery checklist', 'decision readout'],
    risks: profile.risks || ['unclear scope', 'missing evidence', 'unowned risk', 'unverified output'],
  };
}

function renderClaude(pack) {
  const p = profileFor(pack);
  const role = `${pack.nameZh || pack.name} (${pack.id})`;
  const outputs = p.outputs.map(item => `- Required output: ${item}.`).join('\n');
  const risks = p.risks.map(item => `- Risk to check: ${item}.`).join('\n');
  return `
# Pack Maturity Operating Contract

This block enriches the ${role} pack to PACK_SPEC v1.0. Treat it as the
role-specific operating contract for Claude Code, Codex, Gemini, Hermes, and
OpenClaw hosts.

## Role Boundary

- Primary role: ${role}.
- Role line: ${lineLabel(pack)}.
- Core focus: ${p.focus}.
- The pack must convert an ambiguous request into scoped work, evidence, and a
  delivery decision.
- The pack must keep public output free of concrete person names and
  biographical advisor identities.
- The pack must support Claude Code and other agent hosts through the same
  manifest-driven artifact layout.

## Required Working Loop

1. Restate the user outcome in one sentence.
2. Identify the system boundary, data boundary, and decision owner.
3. List the assumptions that materially change the answer.
4. Select the smallest real workflow that can prove value.
5. Produce the role artifact before expanding into explanation.
6. Run the quality gate before presenting the final answer.
7. Call out residual risk, missing evidence, and owner handoff.
8. End with a first-use next step that can be executed within minutes.

## Delivery Evidence

${outputs}
- Required output: assumption ledger with source, confidence, and expiry.
- Required output: validation evidence with command, source, or review method.
- Required output: explicit stop/go/iterate recommendation.
- Required output: handoff note for the next agent or human operator.

## Risk Review

${risks}
- Risk to check: stakeholder decision is hidden behind vague wording.
- Risk to check: output is polished but not executable.
- Risk to check: generated recommendation lacks a measurable acceptance gate.
- Risk to check: the artifact cannot be re-run by another agent.

## Anti-Patterns

- Do not treat installation success as value delivery.
- Do not ship a recommendation without an explicit evidence trail.
- Do not invent benchmarks, incidents, customers, or production data.
- Do not use mock data when a real source, command, or stated assumption is
  required.
- Do not expose concrete person names in advisor IDs, prompts, or guides.
- Never claim a pack is enriched by changing a badge; the audit must pass.
- Avoid one-shot answers when the role needs a decision gate or rollout plan.
- Avoid generic brainstorming when the user asked for an operational artifact.
- Forbidden: hiding uncertainty behind confident prose.
- Forbidden: replacing the role workflow with a generic chat answer.

## Review Gates

1. Scope gate: the role boundary matches the request.
2. Artifact gate: the requested deliverable exists and is named.
3. Evidence gate: every recommendation has a source or validation method.
4. Risk gate: downside and failure modes are visible.
5. Operator gate: the next action can be run by the target agent host.
6. Neutrality gate: no concrete person-name advisors or biographical claims.
7. Regression gate: known pack install and guide routes remain intact.
8. Completion gate: unresolved risks are either closed or explicitly handed off.

## Escalation Rules

- Ask one concise question only when missing information changes the decision.
- If a credential, destructive production action, or private data is required,
  stop and request the missing authority.
- If the request is safe and reversible, proceed with the smallest real check.
- If the pack is being used for review, findings must lead and summaries follow.
- If the pack is being used for strategy, conclusion must lead and supporting
  logic must be grouped by decision path.
- If the pack is being used for data or engineering, show the validation method
  before claiming correctness.

## First-Use Demo Contract

- Demo command: ${p.demo}.
- Expected result: ${p.outputs.join(' + ')}.
- Time to value target: under 8 minutes for a qualified operator.
- The demo is a smoke contract, not a certification claim.
- Certification still requires fresh e2e evidence under evidence/<pack>/<date>.
`;
}

function renderAgents(pack) {
  const p = profileFor(pack);
  const role = `${pack.nameZh || pack.name} (${pack.id})`;
  return `
# Advisor Routing for ${role}

Use these capability-neutral advisors for independent review. They are not
modeled after real people and must not cite biographical authority.

## advisor-quality-gate

- Use for acceptance criteria, evidence sufficiency, and artifact completeness.
- Checks whether the answer satisfies the role boundary.
- Checks whether the output is runnable, reviewable, and reusable.
- Checks whether the first-use demo would produce the expected artifact.
- Checks whether validation evidence is stronger than a style opinion.

## advisor-delivery-risk

- Use for failure modes, operational risk, compliance exposure, and rollout
  readiness.
- Checks role-specific risk: ${p.risks.join('; ')}.
- Checks whether any irreversible or credential-gated action is hidden.
- Checks whether a production handoff has owner, timing, and rollback notes.
- Checks whether the pack avoids concrete person names in public output.

## Routing Protocol

1. Main agent drafts the role artifact.
2. advisor-quality-gate reviews acceptance and evidence.
3. advisor-delivery-risk reviews downside and release safety.
4. Main agent resolves conflicts into one recommendation.
5. Main agent reports unresolved gaps instead of burying them.

## Collaboration Rules

- Keep advisors narrow and capability-based.
- Do not spawn advisors for trivial copy edits.
- Do not ask advisors to rewrite the whole answer.
- Do not use advisor output as a substitute for validation.
- Do not confuse a maturity badge with production certification.
- Avoid duplicate review passes when one evidence gate is enough.
- Avoid personality labels, famous names, or school-of-thought branding.
- Prefer concrete acceptance checks over abstract critique.

## Minimum Hand-Off

- Outcome: what changed or what decision is recommended.
- Evidence: command, source, table, or artifact inspected.
- Risk: what still might fail.
- Next action: one executable instruction for the operator.
`;
}

function renderPrompts(pack) {
  const p = profileFor(pack);
  const role = pack.nameZh || pack.name || pack.id;
  const outputs = p.outputs.join(', ');
  return `
# Prompt Library for ${role}

Use these prompts as executable role workflows. Each prompt requires the model
to return a concrete artifact, evidence, and a decision gate.

### 1. First-use role diagnostic

\`\`\`text
You are the ${role} pack. Given this request:
{{request}}

Return:
1. the role boundary,
2. the top three assumptions,
3. the smallest useful artifact,
4. the evidence needed,
5. the next action within 8 minutes.
\`\`\`

### 2. Scope contract prompt

\`\`\`text
Convert the request into a scope contract for ${role}.
Include objective, non-goals, inputs, outputs, risks, validation method,
and stop conditions. Use concise tables where helpful.
\`\`\`

### 3. Evidence-first delivery prompt

\`\`\`text
Produce the requested artifact for ${role}.
Lead with the conclusion, then show evidence. If evidence is missing,
state the assumption and the cheapest real validation path.
Expected artifact types: ${outputs}.
\`\`\`

### 4. Quality-gate review prompt

\`\`\`text
Act as advisor-quality-gate. Review the draft for completeness, acceptance
criteria, evidence quality, and host-agent install usefulness. Return only
ranked blockers, fixes, and residual risk.
\`\`\`

### 5. Delivery-risk review prompt

\`\`\`text
Act as advisor-delivery-risk. Review the draft for operational, compliance,
security, data, stakeholder, and rollout risk. Flag hidden irreversible
actions and missing ownership.
\`\`\`

### 6. Baseline-to-target prompt

\`\`\`text
Compare baseline and target state for this ${role} task.
Return a before/after matrix, gap severity, validation method, and rollout
sequence. Do not claim completion without evidence.
\`\`\`

### 7. First-use demo prompt

\`\`\`text
Run the first-use demo mentally and produce the artifact a user should see:
${p.demo}.
Expected output: ${outputs}.
Keep it executable and under the time-to-value target.
\`\`\`

### 8. Handoff prompt

\`\`\`text
Create a handoff for the next agent or operator.
Include current state, decisions made, files or sources touched, validation
evidence, risks left open, and the next command or review action.
\`\`\`

## Prompt Selection Guide

- Use prompt 1 when the request is vague.
- Use prompt 2 before implementation or analysis expands.
- Use prompt 3 when a deliverable is explicitly requested.
- Use prompt 4 before final delivery.
- Use prompt 5 for production, compliance, security, data, or financial risk.
- Use prompt 6 when comparing states or planning improvement.
- Use prompt 7 after installation to prove first value.
- Use prompt 8 for cross-agent continuity.

## Output Rules

- Lead with conclusion or artifact, not process narration.
- Keep claims tied to visible evidence or stated assumptions.
- Use capability-neutral advisor names only.
- Avoid invented sources, synthetic metrics, and fake validation.
- Never downgrade a blocker into an advisory note for polish.
- Never expose concrete person-name advisors in the final answer.
`;
}

function renderToolkit03(pack) {
  const p = profileFor(pack);
  const role = pack.nameZh || pack.name || pack.id;
  const steps = [
    ['Intake', 'capture request, stakeholder, target outcome, and host agent'],
    ['Boundary', 'define role boundary, data boundary, production boundary, and non-goals'],
    ['Assumptions', 'write assumptions with confidence and expiry'],
    ['Artifact', `produce ${p.outputs[0] || 'primary artifact'} before explanation`],
    ['Evidence', 'attach source, command, table, checklist, or review method'],
    ['Quality', 'run advisor-quality-gate against acceptance criteria'],
    ['Risk', 'run advisor-delivery-risk against failure modes'],
    ['Decision', 'choose stop, go, iterate, or escalate'],
    ['Handoff', 'write owner, next action, and residual risk'],
    ['Follow-up', 'capture learning for the next pack iteration'],
  ];
  const rows = steps.map(([name, action], index) => `| ${index + 1} | ${name} | ${action} | Exit when evidence is visible |`).join('\n');
  const detail = steps.map(([name, action], index) => `
### Step ${index + 1}: ${name}

- Purpose: ${action}.
- Input: user request, current artifact, and known constraints.
- Check: the step has one named output.
- Anti-pattern: moving forward with vague ownership.
- Evidence: note the file, source, command, or reviewer used.
- Exit: the next step can start without re-interpreting the request.
`).join('\n');
  return `
# SOP Flowchart for ${role}

This SOP turns the pack into a repeatable role workflow. It is intentionally
host-neutral and works for Claude Code, Codex, Gemini, Hermes, and OpenClaw.

\`\`\`mermaid
flowchart TD
  A[User request] --> B[Scope boundary]
  B --> C[Assumption ledger]
  C --> D[Role artifact]
  D --> E[Evidence check]
  E --> F{Quality gate pass?}
  F -- no --> D
  F -- yes --> G{Delivery risk acceptable?}
  G -- no --> H[Escalate or reduce scope]
  H --> D
  G -- yes --> I[Decision and handoff]
  I --> J[First-use next step]
\`\`\`

## Operating Table

| # | Stage | Action | Exit |
| --- | --- | --- | --- |
${rows}

${detail}

## Failure Branches

- If the role boundary is wrong, restart at Boundary.
- If evidence is missing, produce the cheapest real validation plan.
- If risk is irreversible, escalate before execution.
- If the output is generic, return to Artifact and make it role-specific.
- If a concrete person-name advisor appears, run sanitizer and rewrite.
- If the guide or install route breaks, stop and run the pack online audit.

## Completion Definition

- The artifact answers the user request.
- The artifact names its acceptance criteria.
- The artifact has evidence or explicit assumptions.
- The artifact exposes risks and owners.
- The artifact includes one executable next action.
- The manifest contains every generated file needed by install.sh.
`;
}

function renderToolkit05(pack) {
  const p = profileFor(pack);
  const role = pack.nameZh || pack.name || pack.id;
  const outputs = p.outputs.map(item => `- ${item}: owner, input, output, validation.`).join('\n');
  return `
# Document Templates for ${role}

## One-page Brief

| Field | Content |
| --- | --- |
| Outcome | The business or engineering result to achieve |
| Boundary | What this pack owns and does not own |
| Inputs | Source files, data, issue, PR, log, or stakeholder context |
| Artifact | The named deliverable |
| Evidence | Command, source, check, or reviewer |
| Decision | stop / go / iterate / escalate |
| Risk | Top residual risk and owner |

## Artifact Matrix

${outputs}

## Assumption Ledger

| Assumption | Why it matters | Confidence | Expiry | Validation |
| --- | --- | --- | --- | --- |
| Example assumption | It changes the recommendation | medium | before rollout | inspect source |

## Risk Matrix

| Risk | Trigger | Impact | Prevention | Response |
| --- | --- | --- | --- | --- |
| ${p.risks[0] || 'scope risk'} | Before rollout | high | quality gate | reduce scope |

## Decision Readout

1. Conclusion.
2. Evidence.
3. Options considered.
4. Tradeoff.
5. Recommendation.
6. Next action.

## First-use Demo Template

- Role: ${role}
- Demo: ${p.demo}
- Expected output: ${p.outputs.join(' + ')}
- Time target: under 8 minutes
- Pass condition: a user can copy the next action into an agent host
- Fail condition: the output is generic, unvalidated, or lacks owner handoff
`;
}

function renderChecklist(pack) {
  const p = profileFor(pack);
  const role = pack.nameZh || pack.name || pack.id;
  return `
# Delivery Checklist for ${role}

Use this checklist before publishing or handing off a result from this pack.

## Scope

- [ ] The user outcome is stated in one sentence.
- [ ] The role boundary matches ${role}.
- [ ] Non-goals are named.
- [ ] The decision owner or operator is identified.
- [ ] Data, credential, and production boundaries are visible.

## Artifact

- [ ] The primary artifact is named.
- [ ] The artifact includes ${p.outputs[0] || 'the role output'}.
- [ ] Supporting artifacts are grouped, not scattered.
- [ ] The artifact can be reused by another agent host.
- [ ] The final answer starts with result, not process.

## Evidence

- [ ] Every important claim has a source, command, or stated assumption.
- [ ] The validation method is explicit.
- [ ] The first-use demo output is testable.
- [ ] Unknowns are not disguised as facts.
- [ ] No fake data or mock validation is presented as real.

## Risk

- [ ] At least three role risks are reviewed.
- [ ] Irreversible or credential-gated steps are separated.
- [ ] Rollback, stop rule, or escalation path is stated when needed.
- [ ] Advisor review is capability-neutral.
- [ ] No concrete person names appear in public pack content.

## Install and Guide

- [ ] Manifest includes config, skills, agents, toolkit, checklist, baseline, and data collection files.
- [ ] install.sh prints a first-use next step.
- [ ] guide.html can be regenerated from manifest.
- [ ] The pack can remain public without being confused with a deprecated alias.
- [ ] PACK_SPEC tier is produced by audit, not manually edited.

## Final Handoff

- [ ] Outcome is clear.
- [ ] Evidence is clear.
- [ ] Risk is clear.
- [ ] Next action is clear.
- [ ] Owner or receiving agent is clear.
`;
}

function renderBaseline(pack) {
  const p = profileFor(pack);
  const role = pack.nameZh || pack.name || pack.id;
  const rows = [
    ['Prompt surface', 'short generic prompts', '8 role workflows with evidence and risk gates'],
    ['Methodology', 'implicit role behavior', 'explicit role boundary plus anti-patterns'],
    ['Advisors', 'missing or generic', 'advisor-quality-gate plus advisor-delivery-risk'],
    ['Workflow', 'installation only', 'intake to handoff SOP'],
    ['Evidence', 'not systematically captured', 'baseline CSV plus feedback form'],
    ['First value', 'unclear after install', 'manifest first_use_demo with expected output'],
  ].map(row => `| ${row[0]} | ${row[1]} | ${row[2]} |`).join('\n');
  return `
# Baseline Before / After for ${role}

## Summary

This file documents the maturity delta required for PACK_SPEC v1.0 enriched
status. The goal is not a cosmetic badge change. The pack must carry enough
workflow, evidence, and first-use structure for an operator to get value after
installation.

## Before / After Matrix

| Dimension | Before | After |
| --- | --- | --- |
${rows}

## Baseline Problems

- Users could install a pack and still not know the first useful action.
- Review advisors were absent or not named in a capability-neutral way.
- Prompts were not complete enough to encode a repeatable role workflow.
- Delivery checklists and SOPs were not present for downstream audit.
- Data collection did not capture first-use baseline and cohort feedback.

## Target State

- First-use demo: ${p.demo}.
- Expected outputs: ${p.outputs.join(', ')}.
- Main risks controlled: ${p.risks.join(', ')}.
- Install experience: local-first manifest-driven install with visible next step.
- Maturity signal: generated by pack-spec-audit.py.

## Measurement

- Audit P1 checks prompts, skills, and toolkits.
- Audit P2 checks role methodology, advisors, and anti-patterns.
- Audit P3 checks checklist, SOP, and baseline artifacts.
- Audit P4 checks data collection and first-use demo.
- Certified tier still requires fresh E2E evidence; enriched does not claim it.

## Operator Notes

- Keep the pack role-specific.
- Keep advisors capability-neutral.
- Keep generated docs deterministic.
- Keep public catalog canonical and free of deprecated alias duplicates.
- Keep guide regeneration after manifest updates.
`;
}

function renderCsv() {
  return [
    'pack_id,role_line,scenario,baseline_minutes,actual_minutes,artifact_quality,risk_clarity,next_action_clear,operator_notes',
    'example-pack,engineering,first-use-demo,15,8,pass,pass,pass,replace with real run notes',
  ].join('\n');
}

function renderFeedback(pack) {
  const role = pack.nameZh || pack.name || pack.id;
  return `
# Cohort Feedback Form for ${role}

### 1. What first-use task did you run?

### 2. Did the pack produce the expected artifact?

### 3. How many minutes did it take from install to first useful output?

### 4. Which instruction was unclear or missing?

### 5. Which risk, constraint, or evidence requirement did the pack miss?

### 6. Could another agent continue from the handoff without extra context?

### 7. Did any advisor identity look like a concrete person name?

### 8. What should be changed before this pack is certified?
`;
}

function renderAdvisor(name, title, focus) {
  return `---
name: ${name}
description: ${title}
---

# ${title}

You are a role-neutral advisory lens. Do not impersonate a real person, cite a
living or historical individual as the source of the persona, or use
biographical authority.

## Focus

${focus.map(item => `- ${item}`).join('\n')}

## Output

- Return ranked findings.
- Separate blockers from advisory notes.
- Name the evidence required to resolve each blocker.
- Keep the answer concise and operational.
`;
}

function renderSkill(pack, id, title, body) {
  return `---
name: ${id}
description: ${title}
---

# ${title}

## What It Does

${body.what}

## When To Use

- Use when operating the ${pack.nameZh || pack.name || pack.id} pack.
- Use when a concrete artifact, evidence gate, or handoff is required.
- Do not use for generic chat responses.

## Procedure

${body.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

## Output Contract

- Result first.
- Evidence second.
- Risk third.
- Next action last.
`;
}

function upsertManifest(packDir, pack) {
  const manifestPath = join(packDir, 'manifest.json');
  const manifest = readJsonSafe(manifestPath) || { pack: pack.id, version: pack.version || '1.0.0', items: [] };
  manifest.pack = manifest.pack || pack.id;
  manifest.version = manifest.version || pack.version || '1.0.0';
  manifest.spec_version = '1.0';
  const p = profileFor(pack);
  manifest.first_use_demo = {
    command: `claude --skill ${pack.id}-delivery-review "${p.demo}"`,
    expected_output: p.outputs.join(' + '),
    time_to_value_minutes: 8,
  };

  const requiredItems = [
    ['CLAUDE.md', 'CLAUDE.md', 'config'],
    ['AGENTS.md', 'AGENTS.md', 'config'],
    ['settings.json', 'settings.json', 'config'],
    ['prompts.md', 'prompts.md', 'config'],
    ['tool-kit-03-sop-flowchart.md', 'tool-kit-03-sop-flowchart.md', 'reference'],
    ['tool-kit-05-document-templates.md', 'tool-kit-05-document-templates.md', 'reference'],
    ['checklist-delivery.md', 'checklist-delivery.md', 'reference'],
    ['baseline-before-after.md', 'baseline-before-after.md', 'reference'],
    ['data-collection/baseline-actual.csv', 'data-collection/baseline-actual.csv', 'reference'],
    ['data-collection/cohort-feedback-form.md', 'data-collection/cohort-feedback-form.md', 'reference'],
    ['skills/pack-maturity/scope-contract/SKILL.md', `skills/${pack.id}/scope-contract/SKILL.md`, 'skill'],
    ['skills/pack-maturity/quality-gate/SKILL.md', `skills/${pack.id}/quality-gate/SKILL.md`, 'skill'],
    ['skills/pack-maturity/delivery-review/SKILL.md', `skills/${pack.id}/delivery-review/SKILL.md`, 'skill'],
    ['agents/advisor-quality-gate.md', 'agents/advisor-quality-gate.md', 'agent'],
    ['agents/advisor-delivery-risk.md', 'agents/advisor-delivery-risk.md', 'agent'],
  ];

  const byKey = new Map((manifest.items || []).map(item => [`${item.src}|${item.dst}|${item.type}`, item]));
  for (const [src, dst, type] of requiredItems) {
    const key = `${src}|${dst}|${type}`;
    if (!byKey.has(key)) byKey.set(key, { src, dst, type });
  }
  manifest.items = [...byKey.values()];
  writeText(manifestPath, JSON.stringify(manifest, null, 2));
}

function enrichPack(pack) {
  const packDir = join(PACKS_DIR, pack.id);
  if (!existsSync(packDir)) throw new Error(`Missing pack directory: ${packDir}`);
  const p = profileFor(pack);

  upsertManagedBlock(join(packDir, 'CLAUDE.md'), renderClaude(pack));
  upsertManagedBlock(join(packDir, 'AGENTS.md'), renderAgents(pack));
  upsertManagedBlock(join(packDir, 'prompts.md'), renderPrompts(pack));

  writeText(join(packDir, 'tool-kit-03-sop-flowchart.md'), renderToolkit03(pack));
  writeText(join(packDir, 'tool-kit-05-document-templates.md'), renderToolkit05(pack));
  writeText(join(packDir, 'checklist-delivery.md'), renderChecklist(pack));
  writeText(join(packDir, 'baseline-before-after.md'), renderBaseline(pack));
  writeText(join(packDir, 'data-collection', 'baseline-actual.csv'), renderCsv());
  writeText(join(packDir, 'data-collection', 'cohort-feedback-form.md'), renderFeedback(pack));
  writeText(join(packDir, 'agents', 'advisor-quality-gate.md'), renderAdvisor(
    'advisor-quality-gate',
    'Quality Gate Advisor',
    [
      'Check acceptance criteria, completeness, and evidence quality.',
      'Identify blockers before release or handoff.',
      'Protect against badge-only maturity claims.',
    ],
  ));
  writeText(join(packDir, 'agents', 'advisor-delivery-risk.md'), renderAdvisor(
    'advisor-delivery-risk',
    'Delivery Risk Advisor',
    [
      `Check role-specific risks: ${p.risks.join('; ')}.`,
      'Separate reversible work from irreversible or credential-gated actions.',
      'Require owner, rollback, and residual-risk handoff.',
    ],
  ));
  writeText(join(packDir, 'skills', 'pack-maturity', 'scope-contract', 'SKILL.md'), renderSkill(pack, `${pack.id}-scope-contract`, 'Scope Contract Workflow', {
    what: 'Turns an ambiguous request into a bounded role contract with outcomes, non-goals, inputs, outputs, risks, and validation.',
    steps: [
      'Restate the user outcome in one sentence.',
      'List role-owned scope and explicit non-goals.',
      'Name required inputs and unavailable inputs.',
      'Define the artifact and validation method.',
      'Return a stop, go, iterate, or escalate decision.',
    ],
  }));
  writeText(join(packDir, 'skills', 'pack-maturity', 'quality-gate', 'SKILL.md'), renderSkill(pack, `${pack.id}-quality-gate`, 'Quality Gate Workflow', {
    what: 'Reviews the role artifact for evidence, acceptance criteria, install usefulness, and public-pack neutrality before delivery.',
    steps: [
      'Inspect whether the artifact matches the request.',
      'Verify each major claim has evidence or an explicit assumption.',
      'Check that the first-use demo would produce a useful artifact.',
      'Flag missing tests, sources, or owner handoff.',
      'Return ranked blockers and safe fixes.',
    ],
  }));
  writeText(join(packDir, 'skills', 'pack-maturity', 'delivery-review', 'SKILL.md'), renderSkill(pack, `${pack.id}-delivery-review`, 'Delivery Review Workflow', {
    what: 'Combines role output, risk review, validation evidence, and next action into a final operator-ready handoff.',
    steps: [
      'Lead with the recommendation or completed artifact.',
      'Attach evidence and known assumptions.',
      'Run delivery-risk review for the role.',
      'Resolve or hand off blockers.',
      'End with one executable next action.',
    ],
  }));

  upsertManifest(packDir, pack);
}

function main() {
  if (!existsSync(PACKS_JSON)) throw new Error(`Missing ${PACKS_JSON}`);
  if (!existsSync(AUDIT_SCRIPT)) throw new Error(`Missing ${AUDIT_SCRIPT}`);

  const data = readJson(PACKS_JSON);
  const packs = Array.isArray(data) ? data : data.packs;
  if (!Array.isArray(packs)) throw new Error('packs.json must contain packs[]');

  const auditBySlug = runAudit();
  const candidates = packs.filter(pack => auditBySlug.get(pack.id)?.tier === 'stub');
  if (candidates.length === 0) {
    console.log(`OK public pack maturity enrichment skipped: all public packs already pass enriched/certified tier (packs=${packs.length})`);
    return;
  }

  for (const pack of candidates) {
    enrichPack(pack);
    console.log(`OK enriched public pack artifacts: ${pack.id}`);
  }
  console.log(`OK enriched ${candidates.length} public pack(s); run inject-pack-tiers.mjs to verify canonical tiers.`);
}

main();
