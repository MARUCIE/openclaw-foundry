---
name: deep-research
description: "Use when task requires multi-step information synthesis across sources, not answerable in one search. Runs 7-stage research pipeline with sub-agents. NOT for quick lookups or single-source questions. Trigger: research, comprehensive analysis, literature review."
category: Research
tags: deep-research, graph-of-thoughts, multi-agent, research, synthesis
source: https://github.com/AnkitClassicVision/Claude-Code-Deep-Research
---

# Deep Research -- Graph of Thoughts Pipeline

## Gotchas

1. **Don't skip Phase 1 (scoping).** Most research failures come from a vague question, not bad searching. Clarify output format, success criteria, and constraints BEFORE spawning agents.

2. **Sub-agent count matters.** 3-5 Web research agents + 1-2 academic agents + 1 cross-validation agent. More than 8 total agents = context explosion with diminishing returns.

3. **Source quality rating is non-negotiable.** Every claim needs a grade:

| Grade | What counts |
|-------|------------|
| **A** | Peer-reviewed RCT, systematic review, meta-analysis |
| **B** | Cohort study, clinical guideline, official report |
| **C** | Expert opinion, case report |
| **D** | Preprint, conference abstract |
| **E** | Anecdote, speculation |

4. **Claims below B-grade need explicit uncertainty labels.** Don't present D/E sources as facts.

5. **Cross-validation is a phase, not a suggestion.** Phase 4 (triangulation) must run before synthesis. Skip it and you get confident-sounding hallucinations.

## 7-Stage Pipeline

```
Phase 1: Question Scoping -> clarify with user, define success criteria
Phase 2: Retrieval Planning -> decompose into sub-queries, select sources
Phase 3: Iterative Querying -> spawn sub-agents, execute searches
Phase 4: Source Triangulation -> cross-reference, resolve conflicts, grade sources
Phase 5: Knowledge Synthesis -> structure findings, inline citations
Phase 6: Quality Assurance -> verify citations match content, check for hallucination
Phase 7: Output & Packaging -> format report, executive summary, bibliography
```

## Usage

```bash
ait deep-research "research topic"
# Or in conversation: "Deep research [topic]"
```

## Quality Gate

- [ ] Every factual claim has a graded, verifiable source
- [ ] Key findings confirmed by 2+ independent sources
- [ ] Contradictions acknowledged and explained
- [ ] No unsupported claims (check for hallucination in Phase 6)

---

Maurice | maurice_wen@proton.me
