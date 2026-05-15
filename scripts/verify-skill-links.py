#!/usr/bin/env python3
"""T7: HTTP HEAD verification of every upstreamUrl in enriched.json.

Anti-hallucination L2 gate: even if the LLM copied a URL from SKILL.md content
(L1 already enforces "URL must literally appear in source"), the URL itself
might be 404, parked, or moved. This pass classifies every upstream URL into
{ok, redirect, gone, timeout, blocked} and writes link-status.json.

Reads:  state/skill-enrichment/enriched.json
Writes: state/skill-enrichment/link-status.json

Notes:
- HEAD with a 6s timeout, fall back to GET range bytes=0-0 if HEAD blocked
- 4 concurrent workers (HTTP, no Tailscale needed for github/gitlab/etc.)
- Counts as 'ok' if final status is 2xx after following redirects
- Emits a 'finalUrl' if Location chain resolved differently from upstreamUrl
"""
from __future__ import annotations
import argparse
import json
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Optional

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X) skill-link-verifier/1.0"
TIMEOUT_S = 6


def check_one(url: str) -> dict:
    if not url:
        return {"url": None, "status": "skip", "reason": "no upstreamUrl"}
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA}, method="HEAD")
        with urllib.request.urlopen(req, timeout=TIMEOUT_S) as resp:
            return {
                "url": url,
                "status": "ok",
                "httpCode": resp.status,
                "finalUrl": resp.url if resp.url != url else None,
            }
    except urllib.error.HTTPError as e:
        if e.code in (405, 501):
            try:
                req = urllib.request.Request(
                    url, headers={"User-Agent": UA, "Range": "bytes=0-0"}
                )
                with urllib.request.urlopen(req, timeout=TIMEOUT_S) as resp:
                    return {"url": url, "status": "ok", "httpCode": resp.status,
                            "method": "GET-range",
                            "finalUrl": resp.url if resp.url != url else None}
            except Exception as e2:
                return {"url": url, "status": "blocked", "httpCode": getattr(e2, 'code', None),
                        "reason": str(e2)[:120]}
        if e.code in (301, 302, 307, 308):
            return {"url": url, "status": "redirect", "httpCode": e.code,
                    "finalUrl": e.headers.get("Location")}
        if e.code in (404, 410):
            return {"url": url, "status": "gone", "httpCode": e.code}
        return {"url": url, "status": "blocked", "httpCode": e.code, "reason": str(e)[:120]}
    except (urllib.error.URLError, TimeoutError) as e:
        return {"url": url, "status": "timeout", "reason": str(e)[:120]}
    except Exception as e:
        return {"url": url, "status": "error", "reason": str(e)[:120]}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", default="state/skill-enrichment/enriched.json")
    ap.add_argument("--output", default="state/skill-enrichment/link-status.json")
    ap.add_argument("--parallel", type=int, default=4)
    args = ap.parse_args()

    in_path = Path(args.input)
    if not in_path.exists():
        print(f"ERROR: {in_path} missing", file=sys.stderr)
        return 2

    enriched = json.loads(in_path.read_text())
    todo = [(e["skill_name"], e.get("upstreamUrl")) for e in enriched]
    print(f"NOTE: {len(todo)} entries; "
          f"{sum(1 for _,u in todo if u)} have upstreamUrl",
          file=sys.stderr)

    results: list[dict] = []
    with ThreadPoolExecutor(max_workers=args.parallel) as pool:
        future_map = {pool.submit(check_one, u): n for n, u in todo}
        for i, fut in enumerate(as_completed(future_map), 1):
            name = future_map[fut]
            try:
                r = fut.result()
            except Exception as e:
                r = {"url": None, "status": "error", "reason": str(e)[:120]}
            r["skill_name"] = name
            results.append(r)
            if i % 50 == 0:
                print(f"NOTE: {i}/{len(todo)} checked", file=sys.stderr)

    summary: dict[str, int] = {}
    for r in results:
        summary[r["status"]] = summary.get(r["status"], 0) + 1

    out = {
        "checkedAt": __import__("datetime").datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "total": len(results),
        "summary": summary,
        "results": sorted(results, key=lambda r: r["skill_name"]),
    }
    Path(args.output).write_text(json.dumps(out, ensure_ascii=False, indent=2))
    print(f"OK: wrote {args.output} — summary={summary}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
