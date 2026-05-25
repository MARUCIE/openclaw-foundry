#!/usr/bin/env python3
"""
Tier1 Skill: cognitive-reflection

Runnable wrapper around scripts/cognitive_reflection.py
"""

from __future__ import annotations

import json
import re
import shlex
import subprocess
import sys
from pathlib import Path
from typing import Any

from skills.core.base_skill import BaseSkill, SkillResult


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[5]


def _script_path() -> Path:
    return _repo_root() / "scripts" / "cognitive_reflection.py"


def _tokenize_prompt(prompt: str) -> list[str]:
    try:
        return shlex.split(prompt or "")
    except ValueError:
        return (prompt or "").split()


def _parse_flag_value(prompt: str, flag: str) -> str | None:
    tokens = _tokenize_prompt(prompt)
    for index, token in enumerate(tokens):
        if token != flag:
            continue
        if index + 1 >= len(tokens):
            return None
        value = str(tokens[index + 1]).strip()
        return value or None
    return None


def _guess_action(prompt: str) -> str:
    tokens = _tokenize_prompt(prompt)
    if tokens:
        first = tokens[0].strip().lower()
        if first in {"install", "evaluate", "promote"}:
            return first
    p = (prompt or "").strip().lower()
    if re.search(r"\b(promote|promoted|rule)\b|晋升|规则", p):
        return "promote"
    if re.search(r"\b(evaluate|score|gate|quality)\b|评分|评估|门禁", p):
        return "evaluate"
    if re.search(r"\b(install|inject|setup|refresh)\b|安装|注入|刷新", p):
        return "install"
    return "evaluate"


def _run_json(args: list[str]) -> tuple[bool, dict[str, Any], str | None]:
    proc = subprocess.run(args, capture_output=True, text=True)
    if proc.returncode != 0:
        return False, {"stdout": proc.stdout.strip(), "stderr": proc.stderr.strip(), "command": args}, proc.stderr.strip() or "command failed"
    try:
        payload = json.loads(proc.stdout.strip())
    except Exception as exc:
        return False, {"stdout": proc.stdout.strip(), "stderr": proc.stderr.strip(), "command": args}, f"invalid JSON from helper: {exc}"
    return True, payload, None


class CognitiveReflectionSkill(BaseSkill):
    name = "cognitive-reflection"
    version = "0.1.0"
    description = "Install and operate the Knowledge Architecture + Decision Journal + Quality Gate reflection loop."
    category = "productivity"
    emoji = ""

    def get_capabilities(self) -> list[str]:
        return [
            "cognitive-reflection-install",
            "cognitive-reflection-evaluate",
            "cognitive-reflection-promote",
        ]

    def validate_input(self, prompt: str, **kwargs: Any) -> bool:
        return bool((prompt or "").strip()) or bool(kwargs.get("action"))

    async def execute(self, prompt: str, **kwargs: Any) -> SkillResult:
        action = str(kwargs.get("action") or "").strip().lower() or _guess_action(prompt)
        script = _script_path()
        project_root = str(kwargs.get("project_root") or _parse_flag_value(prompt, "--project-root") or "").strip() or str(Path.cwd())
        explicit_target = str(kwargs.get("target") or _parse_flag_value(prompt, "--target") or "").strip()

        if action == "install":
            cmd = [sys.executable, str(script), "install", "--json"]
            if explicit_target:
                cmd.extend(["--target", explicit_target])
            ok, payload, err = _run_json(cmd)
            artifacts = [str(payload.get("target"))] if ok and isinstance(payload, dict) and payload.get("target") else []
            return SkillResult(success=ok, output=payload, error=err, artifacts=artifacts)

        if action == "evaluate":
            cmd = [
                sys.executable,
                str(script),
                "evaluate",
                "--project-root",
                project_root,
                "--json",
            ]
            if explicit_target:
                cmd.extend(["--target", explicit_target])
            for flag in ("--note", "--decision", "--rule", "--failure-mode", "--evidence"):
                value = _parse_flag_value(prompt, flag)
                if value:
                    cmd.extend([flag, value])
            if not any(_parse_flag_value(prompt, flag) for flag in ("--note", "--decision", "--rule", "--failure-mode", "--evidence")):
                raw_note = (prompt or "").strip()
                if raw_note and raw_note.lower() != "evaluate":
                    cmd.extend(["--note", raw_note])
            ok, payload, err = _run_json(cmd)
            return SkillResult(success=ok, output=payload, error=err)

        if action == "promote":
            cmd = [
                sys.executable,
                str(script),
                "promote",
                "--json",
            ]
            if explicit_target:
                cmd.extend(["--target", explicit_target])
            for flag in ("--rule", "--decision", "--failure-mode", "--evidence", "--signals", "--tradeoff", "--follow-up"):
                value = _parse_flag_value(prompt, flag)
                if value:
                    cmd.extend([flag, value])
            ok, payload, err = _run_json(cmd)
            artifacts = [str(payload.get("target"))] if ok and isinstance(payload, dict) and payload.get("target") else []
            return SkillResult(success=ok, output=payload, error=err, artifacts=artifacts)

        return SkillResult(
            success=True,
            output={
                "skill": self.name,
                "usage": [
                    'ai skills run cognitive-reflection "install"',
                    'ai skills run cognitive-reflection "evaluate --project-root . --note \\"...\\" --decision \\"...\\" --rule \\"...\\""',
                    'ai skills run cognitive-reflection "promote --rule \\"...\\" --decision \\"...\\" --failure-mode \\"...\\""',
                ],
            },
        )
