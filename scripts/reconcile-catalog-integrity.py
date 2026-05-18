#!/usr/bin/env python3
"""
reconcile-catalog-integrity.py — Marketplace integrity reconciler.

Source of truth: ~/.claude/skills/ (Maurice's local disk).
Catalog: web/public/data/skills.json.

Three reconciliation actions:
  (a) Mark phantom entries (in catalog but not on disk) with phantom=true.
      DO NOT DELETE — data preservation per CLAUDE.md safety rules.
  (b) Append minimal skeleton entries for skills on disk but not in catalog.
      Caller can enrich later via existing enrichment pipeline.
  (c) Per-row URL validity check:
        - http(s) URL → warn only if scheme malformed (no network probe by default)
        - file:// URL → warn if path does not exist on local disk
        - empty URL → warn (no source pointer at all)

Why this script exists: per advisor-meadows F4 (audit 2026-05-18), the L→C
loop (~/.claude/skills/ → skills.json) has no automated reconciler.
resync-skills-from-local.mjs hardcodes Maurice's path and never runs in CI.
check-catalog-drift.py only detects S1→S2 direction, ignoring S2→S1 phantoms
(280 phantom entries observed today, 37% of the 748-row catalog).

Usage:
  python3 scripts/reconcile-catalog-integrity.py [--dry-run]
                                                 [--catalog PATH]
                                                 [--local-root PATH]
                                                 [--phantom-threshold N]
                                                 [--check-urls]

Exit codes:
  0  reconciliation completed (or dry-run preview emitted) cleanly
  1  invalid arguments or unreadable inputs
  2  phantom count above threshold (only when --strict)
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


DEFAULT_CATALOG = Path(__file__).resolve().parent.parent / "web" / "public" / "data" / "skills.json"
DEFAULT_LOCAL_ROOT = Path.home() / ".claude" / "skills"


def load_catalog(path: Path) -> dict[str, Any]:
    if not path.exists():
        sys.stderr.write(f"ERROR: catalog not found: {path}\n")
        sys.exit(1)
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def list_local_skills(root: Path) -> set[str]:
    """Each subdirectory of ~/.claude/skills/ is one skill (slug = dir name)."""
    if not root.exists():
        sys.stderr.write(f"ERROR: local root not found: {root}\n")
        sys.exit(1)
    return {p.name for p in root.iterdir() if p.is_dir() and not p.name.startswith(".")}


def catalog_local_slugs(catalog: dict[str, Any]) -> dict[str, dict[str, Any]]:
    """Return slug -> skill row for catalog entries with source=='local'."""
    out: dict[str, dict[str, Any]] = {}
    for s in catalog.get("skills", []):
        if s.get("source") == "local":
            slug = s.get("slug") or s.get("name")
            if slug:
                out[slug] = s
    return out


def url_problem(skill: dict[str, Any]) -> str | None:
    url = (skill.get("url") or "").strip()
    if not url:
        return "empty url"
    if url.startswith("file://"):
        path = Path(url[7:])
        if not path.exists():
            return f"file:// path does not exist: {url}"
        return None
    if url.startswith(("http://", "https://")):
        return None
    return f"unknown url scheme: {url[:40]}"


def main() -> int:
    parser = argparse.ArgumentParser(description="Reconcile skill catalog vs local disk")
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--local-root", type=Path, default=DEFAULT_LOCAL_ROOT)
    parser.add_argument("--dry-run", action="store_true",
                        help="Print reconciliation report; do NOT modify catalog file")
    parser.add_argument("--phantom-threshold", type=int, default=50,
                        help="Phantom count above which --strict mode exits 2")
    parser.add_argument("--strict", action="store_true",
                        help="Exit 2 if phantom count exceeds --phantom-threshold")
    parser.add_argument("--check-urls", action="store_true",
                        help="Warn on file:// paths that no longer exist and on empty URLs")
    args = parser.parse_args()

    catalog = load_catalog(args.catalog)
    on_disk = list_local_skills(args.local_root)
    in_catalog = catalog_local_slugs(catalog)

    phantom_slugs = sorted(set(in_catalog.keys()) - on_disk)
    missing_slugs = sorted(on_disk - set(in_catalog.keys()))

    print(f"== Reconciliation report ({args.catalog.name}) ==")
    print(f"catalog local rows : {len(in_catalog)}")
    print(f"disk skills        : {len(on_disk)}")
    print(f"phantoms (in catalog, missing on disk): {len(phantom_slugs)}")
    print(f"missing (on disk, absent from catalog): {len(missing_slugs)}")

    url_warnings: list[tuple[str, str]] = []
    if args.check_urls:
        for slug, row in in_catalog.items():
            if slug in phantom_slugs:
                continue
            p = url_problem(row)
            if p:
                url_warnings.append((slug, p))
        print(f"url problems       : {len(url_warnings)}")
        for slug, msg in url_warnings[:10]:
            print(f"  - {slug}: {msg}")
        if len(url_warnings) > 10:
            print(f"  ... and {len(url_warnings) - 10} more")

    if args.dry_run:
        if phantom_slugs[:5]:
            print(f"phantom sample (first 5): {phantom_slugs[:5]}")
        if missing_slugs[:5]:
            print(f"missing sample (first 5): {missing_slugs[:5]}")
        print("DRY-RUN: no files modified")
    else:
        phantoms_marked = 0
        for s in catalog.get("skills", []):
            if s.get("source") == "local":
                slug = s.get("slug") or s.get("name")
                if slug in phantom_slugs:
                    if not s.get("phantom"):
                        s["phantom"] = True
                        s["phantomDetectedAt"] = datetime.now(timezone.utc).isoformat()
                        phantoms_marked += 1
                elif s.get("phantom"):
                    # Resurrected: skill came back on disk
                    s.pop("phantom", None)
                    s.pop("phantomDetectedAt", None)

        skeletons_added = 0
        if missing_slugs:
            skel_template = catalog.setdefault("skills", [])
            for slug in missing_slugs:
                skel_template.append({
                    "id": f"local/{slug}",
                    "name": slug,
                    "slug": slug,
                    "author": "local",
                    "source": "local",
                    "description": f"(skeleton — enrich via resync-skills-from-local.mjs)",
                    "url": f"file://{args.local_root / slug}",
                    "category": "Uncategorized",
                    "rating": "C",
                    "downloads": 0,
                    "stars": 0,
                    "versions": 1,
                    "skeletonAddedAt": datetime.now(timezone.utc).isoformat(),
                })
                skeletons_added += 1

        catalog.setdefault("meta", {})["reconciledAt"] = datetime.now(timezone.utc).isoformat()
        catalog["meta"]["reconcileSummary"] = {
            "phantomsMarked": phantoms_marked,
            "skeletonsAdded": skeletons_added,
            "urlProblems": len(url_warnings),
            "catalogTotal": len(catalog.get("skills", [])),
        }
        # Recompute top-level total to keep meta.total consistent
        catalog["total"] = len(catalog.get("skills", []))

        with args.catalog.open("w", encoding="utf-8") as f:
            json.dump(catalog, f, ensure_ascii=False, indent=2)
        print(f"WROTE: phantoms_marked={phantoms_marked}, skeletons_added={skeletons_added}")
        print(f"catalog total now: {catalog['total']}")

    if args.strict and len(phantom_slugs) > args.phantom_threshold:
        print(f"STRICT: phantom count {len(phantom_slugs)} > threshold {args.phantom_threshold}")
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
