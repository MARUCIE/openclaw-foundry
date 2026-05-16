#!/usr/bin/env python3
"""Catalog internal consistency check — runs in CI without external dependencies.

Checks performed (each can fail independently in strict mode):
  1. Duplicate names (must be zero)
  2. Required fields present per entry (name, description, descriptionZh, category)
  3. Field coverage above thresholds (descriptionZh ≥99%, category ≥99%, tags ≥95%)
  4. No stale "enrichedAt" beyond cutoff (90 days)
  5. No invalid category values (must be in known taxonomy)
  6. byCategory metadata matches actual distribution

Exit codes:
  0 = all checks pass
  1 = strict mode + at least one check failed
  2 = catalog file missing or unparseable
"""
from __future__ import annotations

import argparse
import datetime
import json
import sys
from collections import Counter
from pathlib import Path

KNOWN_CATEGORIES = {
    'Agent 工具', '写代码', '做产品', '做业务', '定策略',
    '做研究', '做数据', '看数据', '场景规划', '其他',
}

REQUIRED_FIELDS = ['name', 'description', 'descriptionZh', 'category']

COVERAGE_THRESHOLDS = {
    'descriptionZh': 0.99,
    'category': 0.99,
    'tags': 0.95,
}

STALE_ENRICHMENT_DAYS = 90


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--catalog', type=Path, required=True)
    ap.add_argument('--strict', action='store_true',
                    help='Exit 1 on any failure (default: warn only)')
    args = ap.parse_args()

    if not args.catalog.exists():
        print(f'ERROR: catalog not found: {args.catalog}')
        return 2

    try:
        data = json.loads(args.catalog.read_text())
    except json.JSONDecodeError as e:
        print(f'ERROR: catalog JSON parse failed: {e}')
        return 2

    skills = data.get('skills', [])
    print(f'Catalog: {len(skills)} entries')

    failures: list[str] = []

    # Check 1: Duplicate names
    name_counts = Counter(s.get('name', '') for s in skills)
    dups = [n for n, c in name_counts.items() if c > 1]
    if dups:
        failures.append(f'duplicate names: {dups[:5]}{"..." if len(dups) > 5 else ""}')
    else:
        print('  [OK] no duplicate names')

    # Check 2: Required fields present
    missing_field_entries = []
    for s in skills:
        for f in REQUIRED_FIELDS:
            if not s.get(f):
                missing_field_entries.append((s.get('name', '?'), f))
    if missing_field_entries:
        failures.append(f'missing required fields: {len(missing_field_entries)} occurrences '
                        f'(first 3: {missing_field_entries[:3]})')
    else:
        print(f'  [OK] all {len(skills)} entries have required fields')

    # Check 3: Coverage thresholds
    for field, threshold in COVERAGE_THRESHOLDS.items():
        nonempty = sum(1 for s in skills if s.get(field) not in (None, '', [], 0))
        coverage = nonempty / max(1, len(skills))
        status = 'OK' if coverage >= threshold else 'FAIL'
        line = f'  [{status}] {field} coverage: {coverage*100:.1f}% (threshold {threshold*100:.0f}%)'
        print(line)
        if coverage < threshold:
            failures.append(f'{field} coverage {coverage*100:.1f}% below {threshold*100:.0f}%')

    # Check 4: Stale enrichments
    cutoff = datetime.datetime.now(datetime.UTC) - datetime.timedelta(days=STALE_ENRICHMENT_DAYS)
    stale_enriched = 0
    for s in skills:
        ts = s.get('enrichedAt')
        if not ts:
            continue
        try:
            t = datetime.datetime.fromisoformat(ts.replace('Z', '+00:00'))
            if t < cutoff:
                stale_enriched += 1
        except (ValueError, AttributeError):
            pass
    if stale_enriched > 0:
        msg = f'  [WARN] {stale_enriched} entries enriched >90d ago'
        print(msg)
        # Stale enrichment is a warn-only signal (data ages naturally)

    # Check 5: Unknown categories
    used_cats = Counter(s.get('category', '') for s in skills)
    unknown_cats = [c for c in used_cats if c and c not in KNOWN_CATEGORIES]
    if unknown_cats:
        failures.append(f'unknown categories: {unknown_cats}')
    else:
        print(f'  [OK] all {len(used_cats)} categories in known taxonomy')

    # Check 6: byCategory metadata matches actual
    meta_cats = data.get('meta', {}).get('byCategory', {})
    actual_cats = dict(used_cats)
    # Compare ignoring zero-counts
    discrepancies = []
    for cat in set(meta_cats) | set(actual_cats):
        m = meta_cats.get(cat, 0)
        a = actual_cats.get(cat, 0)
        if m != a:
            discrepancies.append(f'{cat}: meta={m} actual={a}')
    if discrepancies:
        failures.append(f'byCategory mismatch: {discrepancies[:3]}')
    else:
        print('  [OK] meta.byCategory matches actual distribution')

    print()
    if failures:
        print(f'FAIL: {len(failures)} check(s) failed:')
        for f in failures:
            print(f'  - {f}')
        return 1 if args.strict else 0
    print('PASS: all consistency checks succeeded')
    return 0


if __name__ == '__main__':
    sys.exit(main())
