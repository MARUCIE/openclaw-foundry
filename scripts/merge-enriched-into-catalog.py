#!/usr/bin/env python3
"""T8: merge enriched.json + link-status.json into web/public/data/skills.json.

For every existing catalog entry that matches an enriched record by `name`:
  - replace `category` ← enrichment.categoryZh (closed taxonomy)
  - replace `description` ← enrichment.descriptionEn
  - replace `descriptionZh` ← enrichment.descriptionZh
  - replace `tags` ← enrichment.tags (LLM-curated, more relevant than scraped)
  - if enrichment.upstreamUrl present AND link-status says ok/redirect:
        set `url` ← (finalUrl preferred over upstreamUrl)
  - set `confidence` and `hallucinationRisk` for transparency
  - set `enrichedAt` timestamp

For local skills NOT in catalog:
  - APPEND new entry with sane defaults (rating='B', stars=0, downloads=0)

For catalog entries NOT in local (dropped from local collection):
  - flip `stale: true`, do NOT delete
  - reason: cohort might still link to them

Updates `meta.byCategory` distribution and `meta.syncedAt`.
"""
from __future__ import annotations
import argparse
import datetime
import json
import sys
from pathlib import Path

DEFAULT_CATALOG = "web/public/data/skills.json"
DEFAULT_ENRICHED = "state/skill-enrichment/enriched.json"
DEFAULT_LINK_STATUS = "state/skill-enrichment/link-status.json"


def load_json(path: str) -> any:
    p = Path(path)
    if not p.exists():
        return None
    return json.loads(p.read_text())


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--catalog", default=DEFAULT_CATALOG)
    ap.add_argument("--enriched", default=DEFAULT_ENRICHED)
    ap.add_argument("--link-status", default=DEFAULT_LINK_STATUS)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--out", default=None,
                    help="Output path; default = overwrite catalog")
    args = ap.parse_args()

    catalog = load_json(args.catalog)
    if not catalog or "skills" not in catalog:
        print(f"ERROR: catalog {args.catalog} missing or malformed", file=sys.stderr)
        return 2

    enriched = load_json(args.enriched)
    if not enriched:
        print(f"ERROR: enriched {args.enriched} missing", file=sys.stderr)
        return 2

    link_status_doc = load_json(args.link_status) or {}
    link_index: dict[str, dict] = {}
    for r in (link_status_doc.get("results") or []):
        link_index[r["skill_name"]] = r

    # Filter out entries that failed validation (parse-fail / URL hallucination /
    # missing fields). Keeping them would silently corrupt category + description
    # in the catalog. Invalid entries simply don't update; existing values stay.
    invalid_count = sum(1 for e in enriched if not e.get("validation", {}).get("valid"))
    if invalid_count:
        print(f"NOTE: {invalid_count}/{len(enriched)} enriched entries failed validation, skipped",
              file=sys.stderr)
    enrich_index: dict[str, dict] = {
        e["skill_name"]: e for e in enriched
        if e.get("validation", {}).get("valid")
    }
    catalog_names = {s["name"] for s in catalog["skills"]}
    enriched_names = set(enrich_index.keys())

    common = catalog_names & enriched_names
    new_local = enriched_names - catalog_names
    dropped_local = catalog_names - enriched_names

    print(f"NOTE: catalog={len(catalog_names)} "
          f"enriched={len(enriched_names)} "
          f"common={len(common)} new={len(new_local)} dropped={len(dropped_local)}",
          file=sys.stderr)

    now_iso = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    updated = 0
    for s in catalog["skills"]:
        e = enrich_index.get(s["name"])
        if not e:
            if s["name"] in dropped_local:
                s["stale"] = True
            continue
        if e.get("descriptionEn"):
            s["description"] = e["descriptionEn"]
        if e.get("descriptionZh"):
            s["descriptionZh"] = e["descriptionZh"]
        if e.get("categoryZh"):
            s["category"] = e["categoryZh"]
        if e.get("tags"):
            s["tags"] = e["tags"]
        if e.get("upstreamUrl"):
            link = link_index.get(s["name"], {})
            if link.get("status") in ("ok", "redirect"):
                final = link.get("finalUrl") or e["upstreamUrl"]
                s["url"] = final
        s["confidence"] = e.get("confidence")
        s["hallucinationRisk"] = e.get("hallucinationRisk")
        s["enrichedAt"] = now_iso
        s["stale"] = False
        updated += 1

    appended = 0
    for name in sorted(new_local):
        e = enrich_index[name]
        new_entry = {
            "id": f"local/{name}",
            "name": name,
            "author": "local",
            "source": "local",
            "sourceLocal": "claude",
            "description": e.get("descriptionEn", ""),
            "descriptionZh": e.get("descriptionZh", ""),
            "category": e.get("categoryZh", "其他"),
            "rating": "B",
            "url": (link_index.get(name, {}).get("finalUrl")
                    or e.get("upstreamUrl")
                    or ""),
            "stars": 0,
            "downloads": 0,
            "versions": 1,
            "tags": e.get("tags", []),
            "stale": False,
            "confidence": e.get("confidence"),
            "hallucinationRisk": e.get("hallucinationRisk"),
            "enrichedAt": now_iso,
        }
        catalog["skills"].append(new_entry)
        appended += 1

    by_cat: dict[str, int] = {}
    for s in catalog["skills"]:
        by_cat[s["category"]] = by_cat.get(s["category"], 0) + 1
    catalog["meta"]["byCategory"] = dict(sorted(by_cat.items(),
                                                key=lambda kv: -kv[1]))
    catalog["meta"]["syncedAt"] = now_iso
    catalog["meta"]["enrichmentRun"] = {
        "at": now_iso,
        "updated": updated,
        "appended": appended,
        "dropped": len(dropped_local),
        "model": "POE Gemini-3.1-Pro",
    }
    catalog["total"] = len(catalog["skills"])

    print(f"NOTE: updated={updated} appended={appended} dropped_marked_stale={len(dropped_local)}",
          file=sys.stderr)
    print(f"NOTE: byCategory = {catalog['meta']['byCategory']}", file=sys.stderr)

    out_path = args.out or args.catalog
    if args.dry_run:
        print(f"DRY: would write {out_path} ({len(catalog['skills'])} entries)",
              file=sys.stderr)
        return 0
    Path(out_path).write_text(json.dumps(catalog, ensure_ascii=False, indent=2))
    print(f"OK: wrote {out_path}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
