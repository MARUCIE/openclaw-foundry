#!/usr/bin/env python3
"""Catalog drift check — fails CI when unmatched-skill count exceeds threshold.

Drift = local skill folders that exist in AI-Fleet but are not yet in
openclaw-foundry/web/public/data/skills.json catalog.

Sources scanned (must match build_inventory_by_type.py):
  - ~/.claude/skills/                                    (user)
  - 00-AI-Fleet/layers/L3-intelligence/skills/skills/    (L3)
  - 00-AI-Fleet/skills/shared/                           (shared)

CI behavior:
  - exit 0 if unmatched_count <= threshold
  - exit 1 if unmatched_count > threshold, prints unmatched list

Usage:
  python3 scripts/check-catalog-drift.py [--threshold 10] [--ai-fleet-path /path/to/00-AI-Fleet]

In CI: invoked weekly by .github/workflows/skill-catalog-drift.yml.
Locally: also runnable by Maurice as a pre-commit sanity check.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path


def collect_local_skills(ai_fleet_root: Path) -> set[str]:
    """Union of unique skill folder names across 3 source dirs."""
    sources = [
        Path(os.path.expanduser('~/.claude/skills')),
        ai_fleet_root / 'layers/L3-intelligence/skills/skills',
        ai_fleet_root / 'skills/shared',
    ]
    names: set[str] = set()
    for root in sources:
        if not root.exists():
            continue
        for d in root.iterdir():
            if d.is_dir():
                names.add(d.name)
    return names


def collect_catalog_names(catalog_path: Path) -> set[str]:
    data = json.loads(catalog_path.read_text())
    return {s['name'] for s in data.get('skills', [])}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--threshold', type=int, default=10,
                    help='Max unmatched count before CI fails (default 10)')
    ap.add_argument('--ai-fleet-path', type=Path,
                    default=Path(os.environ.get('AI_FLEET_PATH')
                                 or os.environ.get('AI_FLEET_ROOT')
                                 or (Path.home() / '00-AI-Fleet')),
                    help='Path to 00-AI-Fleet root')
    ap.add_argument('--catalog', type=Path,
                    default=Path(__file__).parent.parent / 'web/public/data/skills.json',
                    help='Path to skills.json')
    ap.add_argument('--report', type=Path, default=None,
                    help='Optional path to write drift report markdown')
    args = ap.parse_args()

    if not args.ai_fleet_path.exists():
        print(f'WARN: AI-Fleet path not found: {args.ai_fleet_path}')
        print('  (running outside Maurice local? skip drift check)')
        return 0

    if not args.catalog.exists():
        print(f'ERROR: catalog not found: {args.catalog}')
        return 2

    local = collect_local_skills(args.ai_fleet_path)
    cataloged = collect_catalog_names(args.catalog)
    unmatched = sorted(local - cataloged)
    extra = sorted(cataloged - local)  # in catalog but no local source — could be stale

    print(f'Local unique skills:   {len(local)}')
    print(f'Cataloged skills:      {len(cataloged)}')
    print(f'Unmatched (local→add): {len(unmatched)} (threshold: {args.threshold})')
    print(f'Extra (in catalog, no local source): {len(extra)} — typically stale')

    if args.report:
        report_lines = [
            f'# Catalog Drift Report',
            '',
            f'- Local unique skills: {len(local)}',
            f'- Cataloged skills: {len(cataloged)}',
            f'- Unmatched: {len(unmatched)} (threshold: {args.threshold})',
            '',
            '## Unmatched (need enrichment + catalog add)',
            '',
        ]
        for n in unmatched:
            report_lines.append(f'- `{n}`')
        if extra:
            report_lines.extend(['', '## Extra (in catalog, no local source)', ''])
            for n in extra:
                report_lines.append(f'- `{n}`')
        args.report.write_text('\n'.join(report_lines))
        print(f'\nReport written: {args.report}')

    if len(unmatched) > args.threshold:
        print(f'\nFAIL: unmatched count ({len(unmatched)}) exceeds threshold ({args.threshold})')
        if unmatched[:10]:
            print('First 10 unmatched:')
            for n in unmatched[:10]:
                print(f'  - {n}')
        print('\nNext step: run scripts/enrich-skill-via-poe.py for these names,')
        print('then scripts/skill-inventory/delta_merge_to_catalog.py (AI-Fleet) to merge.')
        return 1

    print('\nOK: drift within threshold')
    return 0


if __name__ == '__main__':
    sys.exit(main())
