#!/usr/bin/env python3
"""enrich-skill-via-poe.py — Enrich each local skill via POE Gemini-3.1-Pro.

Network: routes via Tailscale dmit-us-proxy (root@100.65.4.17) because local DNS
hijacks api.poe.com. Each call is a single SSH command with base64-encoded payload.

Anti-hallucination contract:
- LLM only uses information present in SKILL.md content (no external knowledge)
- upstreamUrl must be GREP-extracted from content; null if not present
- categoryZh from closed 10-item taxonomy
- confidence + hallucinationRisk fields surface uncertainty

Usage:
    enrich_one(skill_name, skill_md_path) -> dict
    enrich_batch(skill_names) -> list[dict]
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import pathlib
import re
import shlex
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Optional

# ---- Configuration ---------------------------------------------------------

POE_BASE_URL = os.environ.get("POE_BASE_URL", "https://api.poe.com/v1")
POE_API_KEY = os.environ.get("POE_API_KEY", "")
POE_MODEL = os.environ.get("POE_MODEL", "Gemini-3.1-Pro")
SSH_PROXY_NODE = os.environ.get("SSH_PROXY_NODE", "root@100.65.4.17")
SKILLS_DIR = pathlib.Path(os.environ.get(
    "SKILLS_DIR",
    str(pathlib.Path.home() / ".claude" / "skills"),
))
CACHE_DIR = pathlib.Path(__file__).resolve().parent.parent / "state" / "skill-enrichment"
CACHE_DIR.mkdir(parents=True, exist_ok=True)
CACHE_PATH = CACHE_DIR / "cache.json"

# Closed taxonomy (Job Pack categories + Agent + 其他)
ALLOWED_CATEGORIES_ZH = [
    "写代码", "做数据", "做产品", "做业务", "定策略",
    "做研究", "场景规划", "看数据", "Agent 工具", "其他",
]
CATEGORY_EN_MAP = {
    "写代码": "Engineering",
    "做数据": "Data Engineering",
    "做产品": "Product",
    "做业务": "Business",
    "定策略": "Strategy",
    "做研究": "Research",
    "场景规划": "Scenario Planning",
    "看数据": "Data Analysis",
    "Agent 工具": "Agent Tooling",
    "其他": "Other",
}

# JSON output schema (used by validation + verify command)
ENRICHMENT_SCHEMA = {
    "type": "object",
    "properties": {
        "categoryZh": {"type": "string", "enum": ALLOWED_CATEGORIES_ZH},
        "categoryEn": {"type": "string"},
        "descriptionZh": {"type": "string", "minLength": 10, "maxLength": 200},
        "descriptionEn": {"type": "string", "minLength": 10, "maxLength": 200},
        "upstreamUrl": {"type": ["string", "null"]},
        "tags": {"type": "array", "items": {"type": "string"}},
        "confidence": {"type": "number", "minimum": 0, "maximum": 1},
        "hallucinationRisk": {"type": "string", "enum": ["low", "medium", "high"]},
    },
    "required": [
        "categoryZh", "categoryEn", "descriptionZh", "descriptionEn",
        "upstreamUrl", "tags", "confidence", "hallucinationRisk",
    ],
}

# ---- Prompt template -------------------------------------------------------

SYSTEM_PROMPT = """You are a strict skill catalog editor. You output ONLY valid JSON.

ZERO HALLUCINATION RULES:
1. Only use information PRESENT in the provided SKILL.md content. Never invent capabilities, authors, version numbers, or stats.
2. For `upstreamUrl`: scan the SKILL.md for explicit URLs (github.com/, https://, docs sites, npmjs.com, etc.). Output the FIRST authoritative source URL found verbatim. If NO URL is present in the content, output null. NEVER construct or guess URLs.
3. For `categoryZh`: pick EXACTLY ONE from this closed list: 写代码, 做数据, 做产品, 做业务, 定策略, 做研究, 场景规划, 看数据, Agent 工具, 其他. Use 其他 if uncertain.
4. For `descriptionZh` (Chinese 1-2 sentences) and `descriptionEn` (English 1-2 sentences): summarize ONLY what the SKILL.md describes. No marketing fluff. No invented benefits.
5. For `tags`: 3-7 lowercase tags derived from explicit content keywords. No synonyms, no over-generation.
6. For `confidence`: 0.0-1.0, where lower means SKILL.md is sparse/ambiguous.
7. For `hallucinationRisk`: "low" if content is detailed and you used only it; "medium" if you had to interpret; "high" if content is too sparse to summarize accurately.

Output schema (no markdown fences, no commentary, JUST the JSON object):
{
  "categoryZh": "...",
  "categoryEn": "...",
  "descriptionZh": "...",
  "descriptionEn": "...",
  "upstreamUrl": "..." or null,
  "tags": ["..."],
  "confidence": 0.0,
  "hallucinationRisk": "low"
}"""


def build_user_prompt(skill_name: str, skill_md_content: str) -> str:
    truncated = skill_md_content[:6000]  # cap input to control cost
    if len(skill_md_content) > 6000:
        truncated += "\n[... truncated, total " + str(len(skill_md_content)) + " chars ...]"
    return f"Skill name: {skill_name}\n\nSKILL.md content:\n```\n{truncated}\n```\n\nOutput the JSON now."


# ---- Cache layer -----------------------------------------------------------

def load_cache() -> dict:
    if CACHE_PATH.exists():
        try:
            return json.loads(CACHE_PATH.read_text())
        except (json.JSONDecodeError, OSError) as e:
            print(f"WARN cache read failed ({CACHE_PATH}): {e} — starting empty",
                  file=sys.stderr)
            return {}
    return {}


_SAVE_LOCK = __import__("threading").Lock()


def save_cache(cache: dict) -> None:
    # Race-fix 2026-05-16: parallel=4 workers raced on the shared `cache.json.tmp`
    # path — second worker's `tmp.replace` failed with ENOENT because first
    # worker had already renamed the tmp away. Lock + per-thread suffix.
    with _SAVE_LOCK:
        suffix = f".json.tmp.{__import__('os').getpid()}.{__import__('threading').get_ident()}"
        tmp = CACHE_PATH.with_suffix(suffix)
        try:
            tmp.write_text(json.dumps(cache, ensure_ascii=False, indent=2))
            tmp.replace(CACHE_PATH)
        except OSError as e:
            print(f"WARN save_cache failed ({tmp.name}): {e}", file=sys.stderr)


def cache_key(skill_name: str, content_hash: str) -> str:
    return f"{skill_name}::{content_hash[:12]}"


# ---- POE call via SSH proxy ------------------------------------------------

def call_poe(messages: list, max_tokens: int = 1024, temperature: float = 0.0,
             max_retries: int = 5) -> dict:
    """Call POE chat completions via Tailscale SSH proxy. Retries on 429/5xx."""
    if not POE_API_KEY:
        raise RuntimeError("POE_API_KEY not set")

    payload = {
        "model": POE_MODEL,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
    }
    payload_b64 = base64.b64encode(json.dumps(payload).encode()).decode()

    remote_script = (
        f'PAYLOAD=$(echo "{payload_b64}" | base64 -d); '
        f'curl -sS -w "\\n__HTTP_CODE__%{{http_code}}" -X POST '
        f'"{POE_BASE_URL}/chat/completions" '
        f'-H "Authorization: Bearer {POE_API_KEY}" '
        f'-H "Content-Type: application/json" '
        f'-d "$PAYLOAD"'
    )

    for attempt in range(max_retries):
        try:
            result = subprocess.run(
                ["ssh", "-o", "ConnectTimeout=10",
                 "-o", "StrictHostKeyChecking=accept-new",
                 "-o", "RemoteCommand=none",
                 "-o", "RequestTTY=no",
                 SSH_PROXY_NODE,
                 remote_script],
                capture_output=True, text=True, timeout=120,
            )
            raw = result.stdout
            # extract HTTP code marker
            http_code = 200
            m = re.search(r"__HTTP_CODE__(\d{3})$", raw.strip())
            if m:
                http_code = int(m.group(1))
                raw = raw[: m.start()].rstrip()

            if http_code == 429 or http_code >= 500:
                wait = (2 ** attempt) + 0.5 * attempt
                print(f"  [retry {attempt+1}/{max_retries}] HTTP {http_code} → sleep {wait:.1f}s",
                      file=sys.stderr)
                time.sleep(wait)
                continue

            if http_code != 200:
                return {"_error": f"HTTP {http_code}", "_raw": raw[:500]}

            try:
                return json.loads(raw)
            except json.JSONDecodeError as e:
                return {"_error": f"json decode: {e}", "_raw": raw[:500]}

        except subprocess.TimeoutExpired:
            print(f"  [retry {attempt+1}/{max_retries}] timeout → sleep 5s", file=sys.stderr)
            time.sleep(5)
            continue
        except Exception as e:
            return {"_error": f"subprocess: {e}"}

    return {"_error": "max retries exhausted"}


# ---- Validation ------------------------------------------------------------

def parse_llm_json(content: str) -> Optional[dict]:
    """Extract JSON object from LLM response, even if wrapped in markdown fences."""
    if not content:
        return None
    # Strip common fence patterns
    content = content.strip()
    fence_match = re.search(r"```(?:json)?\s*\n(.+?)\n```", content, re.DOTALL)
    if fence_match:
        content = fence_match.group(1).strip()
    try:
        return json.loads(content)
    except json.JSONDecodeError as e1:
        # Try to find first { ... last }
        first = content.find("{")
        last = content.rfind("}")
        if first >= 0 and last > first:
            try:
                return json.loads(content[first:last + 1])
            except json.JSONDecodeError as e2:
                print(f"WARN JSON parse failed (initial: {e1}; bracket-extract: {e2}); "
                      f"content[:120]={content[:120]!r}", file=sys.stderr)
                return None
        print(f"WARN JSON parse failed ({e1}); no {{...}} pair found in content[:120]={content[:120]!r}",
              file=sys.stderr)
    return None


def validate_enrichment(obj: dict, skill_md_content: str) -> tuple[bool, list[str]]:
    """Return (is_valid, list_of_errors). Anti-hallucination: upstreamUrl must
    actually be present in the content if non-null."""
    errors = []
    required = ["categoryZh", "categoryEn", "descriptionZh", "descriptionEn",
                "upstreamUrl", "tags", "confidence", "hallucinationRisk"]
    for k in required:
        if k not in obj:
            errors.append(f"missing field: {k}")

    if obj.get("categoryZh") not in ALLOWED_CATEGORIES_ZH:
        errors.append(f"categoryZh '{obj.get('categoryZh')}' not in allowed list")

    url = obj.get("upstreamUrl")
    if url is not None:
        if not isinstance(url, str):
            errors.append("upstreamUrl not string or null")
        elif not (url.startswith("http://") or url.startswith("https://")):
            errors.append(f"upstreamUrl not http/https: {url[:60]}")
        elif url not in skill_md_content:
            # KEY anti-hallucination check: URL must actually appear in source
            errors.append(f"upstreamUrl HALLUCINATED (not in SKILL.md): {url[:80]}")

    risk = obj.get("hallucinationRisk")
    if risk not in ("low", "medium", "high"):
        errors.append(f"hallucinationRisk invalid: {risk}")

    conf = obj.get("confidence")
    if not isinstance(conf, (int, float)) or not (0 <= conf <= 1):
        errors.append(f"confidence out of range: {conf}")

    return (len(errors) == 0, errors)


# ---- Skill source loader ---------------------------------------------------

def load_skill_md(skill_name: str) -> Optional[tuple[str, str]]:
    """Return (content, md_path) or None if not found."""
    sdir = SKILLS_DIR / skill_name
    if not sdir.is_dir():
        print(f"WARN skill dir missing: {sdir}", file=sys.stderr)
        return None
    for fn in ("SKILL.md", "SPEC.md", "skill.md"):
        p = sdir / fn
        if p.exists():
            try:
                return (p.read_text(errors="replace"), str(p))
            except OSError as e:
                print(f"WARN read failed {p}: {e}", file=sys.stderr)
                return None
    print(f"WARN no SKILL.md/SPEC.md/skill.md under {sdir}", file=sys.stderr)
    return None


# ---- Per-entry enrichment --------------------------------------------------

def enrich_one(skill_name: str, skill_md_path: Optional[str] = None,
               cache: Optional[dict] = None) -> dict:
    """Enrich one skill. Returns dict with skill_name + enrichment fields + meta."""
    loaded = load_skill_md(skill_name)
    if not loaded:
        return {
            "skill_name": skill_name,
            "_error": "SKILL.md not found",
            "_path": str(SKILLS_DIR / skill_name),
        }
    content, path = loaded
    content_hash = hashlib.sha256(content.encode()).hexdigest()
    key = cache_key(skill_name, content_hash)

    if cache is not None and key in cache:
        cached = cache[key]
        cached["_from_cache"] = True
        return cached

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": build_user_prompt(skill_name, content)},
    ]
    response = call_poe(messages, max_tokens=1024)
    if "_error" in response:
        return {"skill_name": skill_name, "_error": response["_error"], "_raw": response.get("_raw")}

    try:
        msg = response["choices"][0]["message"]
        llm_content = msg.get("content", "")
        usage = response.get("usage", {})
    except (KeyError, IndexError) as e:
        return {"skill_name": skill_name, "_error": f"response shape: {e}", "_raw": str(response)[:500]}

    obj = parse_llm_json(llm_content)
    if obj is None:
        return {
            "skill_name": skill_name,
            "_error": "JSON parse failed",
            "_llm_content": llm_content[:500],
        }

    is_valid, errors = validate_enrichment(obj, content)
    enriched = {
        "skill_name": skill_name,
        "skill_md_path": path,
        "content_hash": content_hash[:16],
        "categoryZh": obj.get("categoryZh"),
        "categoryEn": obj.get("categoryEn"),
        "category": obj.get("categoryZh"),  # alias for catalog compatibility
        "descriptionZh": obj.get("descriptionZh"),
        "descriptionEn": obj.get("descriptionEn"),
        "upstreamUrl": obj.get("upstreamUrl"),
        "tags": obj.get("tags", []),
        "confidence": obj.get("confidence"),
        "hallucinationRisk": obj.get("hallucinationRisk"),
        "validation": {"valid": is_valid, "errors": errors},
        "tokens": {
            "prompt": usage.get("prompt_tokens"),
            "completion": usage.get("completion_tokens"),
            "total": usage.get("total_tokens"),
        },
        "enriched_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    if cache is not None:
        cache[key] = enriched
        save_cache(cache)
    return enriched


# ---- Batch -----------------------------------------------------------------

def enrich_batch(skill_names: list[str], parallel: int = 4,
                 progress_path: Optional[pathlib.Path] = None) -> list[dict]:
    cache = load_cache()
    results = []
    completed = 0
    total = len(skill_names)

    def task(name: str) -> dict:
        return enrich_one(name, cache=cache)

    with ThreadPoolExecutor(max_workers=parallel) as pool:
        futures = {pool.submit(task, n): n for n in skill_names}
        for fut in as_completed(futures):
            res = fut.result()
            results.append(res)
            completed += 1
            status = "OK" if "validation" in res and res["validation"]["valid"] else "WARN"
            if "_error" in res:
                status = "ERROR"
            print(f"  [{completed}/{total}] {status} {res.get('skill_name', '?')}", file=sys.stderr)
            if progress_path:
                progress_path.write_text(json.dumps(
                    {"completed": completed, "total": total, "last": res.get("skill_name")},
                    ensure_ascii=False))

    return results


# ---- CLI -------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--skill", action="append", help="Single skill name (repeatable)")
    ap.add_argument("--all-local", action="store_true", help="Enrich all skills under SKILLS_DIR")
    ap.add_argument("--limit", type=int, default=0, help="Limit number of entries (0=all)")
    ap.add_argument("--parallel", type=int, default=4, help="Concurrent SSH calls")
    ap.add_argument("--output", required=True, help="Output JSON path")
    ap.add_argument("--progress", default=None, help="Progress JSON path (atomic write per entry)")
    args = ap.parse_args()

    if args.all_local:
        names = sorted(p.name for p in SKILLS_DIR.iterdir()
                       if p.is_dir() and not p.name.startswith(("_", ".")))
    elif args.skill:
        names = args.skill
    else:
        ap.error("specify --skill <name> (repeatable) or --all-local")

    if args.limit > 0:
        names = names[: args.limit]

    print(f"Enriching {len(names)} skills (parallel={args.parallel})", file=sys.stderr)
    progress_path = pathlib.Path(args.progress) if args.progress else None
    results = enrich_batch(names, parallel=args.parallel, progress_path=progress_path)

    out_path = pathlib.Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(results, ensure_ascii=False, indent=2))

    # Summary
    ok = sum(1 for r in results if r.get("validation", {}).get("valid"))
    err = sum(1 for r in results if "_error" in r)
    print(f"DONE total={len(results)} ok={ok} err={err} → {out_path}", file=sys.stderr)


if __name__ == "__main__":
    main()
