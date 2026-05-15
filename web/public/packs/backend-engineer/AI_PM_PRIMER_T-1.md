# AI Product Manager · T-1 Primer

> Read this 24 hours before the workshop. 5-8 minutes.
> Then fill `data-collection/cohort-profile-baseline.csv`.

## 1. What is an AI Product Manager

An AI Product Manager is a product manager whose primary operating loop is no longer `spec → engineer → review → iterate`, but `intent → AI generate → critique → iterate`.

The shift is not "PM who uses AI tools." The shift is the locus of work moving from coordination of human labor to direct production of artifacts. When the cost of generating a PRD draft drops 10×, and the cost of generating a clickable prototype drops 10×, the bottleneck moves. It moves from "how do I get engineering to build this" to "is this the right thing to build, and do I trust myself enough to commit." That bottleneck — judgment and trust — is the AI PM's job.

## 2. The Thesis: The Traditional PM No Longer Exists

By 2026, "traditional product manager" is no longer a viable role description. It is a legacy title, like "data entry clerk" was in 2005 — the work still exists, but people who can only do that work are not employable in a competitive market.

**Every PM is now an AI PM. The only variable is whether you have realized it.**

What this looks like in the labor market — observations from Maurice's network of PM peers and hiring conversations (2024 H2 — 2026 H1):

- PRDs that took 3 days for the same PM 18 months ago now take 30 minutes when the same PM uses Cursor + a stable prompt template. Seniors who cannot keep pace are either repositioning to ops, or quietly leaving.
- Interview loops in 2-3 AI-native firms Maurice has direct knowledge of have started requiring a working prototype shipped during the interview window, built with AI tools, within a fixed timebox.
- Tutorials that explain "how a PM works" written before mid-2024 already feel outdated when Maurice compares them against how the strongest 2026 PMs in his network actually operate.

> *Source disclosure: these are Maurice's lived observations from PMs in his network (estimate ~50-80 people across 3 companies + adjacent hiring conversations) and his own delivery work. They are NOT drawn from a published statistical survey. If the pattern fails to predict what you see in your own market in 6 months, escalate — the model may be local to Maurice's network, not universal.*

## 3. AI PM vs Traditional PM — 7 Differences

| Axis | Traditional PM | AI PM |
|------|---------------|-------|
| **Output velocity** | 1 PRD / week | 5 PRD drafts / day, 1 chosen and shipped |
| **Prototype proximity** | "Wait for engineering" | Build it in Cursor / v0 / Figma AI in 2 hours, walk it to user |
| **Knowledge base** | Notion / Confluence | Skills library, prompt library, `agent.md` per workflow |
| **Decision basis** | Stakeholder consensus | Evidence from rapid prototype + AI-aided synthesis |
| **Failure cost** | High (months wasted) | Low (one afternoon, scrap and re-try) |
| **Tool fluency requirement** | Excel + JIRA | Claude / Cursor / Coze / agent.md + 5-10 prompt templates in active use |
| **Career inflection** | Promotion to PM Director | Build your own AI-native product (yours, not your employer's) |

## 4. The Three Operating Criteria for AI PM

An AI PM is someone who can do all three:

### 4.1 Rapid Experimentation (快速试错)

Ship 5 versions of a thing in a week. Watch which one users actually use. Kill the other 4 without grief.

Treats opinion as a hypothesis, not a position. Has an internal "I was wrong" muscle that fires within hours, not quarters.

### 4.2 Rapid Product Clarity (快速产品清晰度)

Can take a fuzzy stakeholder request and produce a 1-page PRD + a clickable prototype + 3 user-test questions, all in 4 hours.

The output is not "polished." The output is "clear enough to decide what to do next." Polish is a downstream-of-clarity property; without clarity, polish is decoration.

### 4.3 Commercial Trust (商业信任度)

After 6 months of work, the business — revenue, retention, NPS — moves measurably. Not "I delivered 12 features." Not "I ran 4 OKRs." A specific number you committed to went up, and the people who pay you trust your judgment on what to build next.

**1 of 3: junior AI PM. 2 of 3: senior AI PM. 3 of 3: principal AI PM — and you have a job market regardless of macro conditions.**

## 5. AI Capability Self-Assessment Model

Honest self-scoring. 5 minutes. No one sees this but you.

For each of the 3 criteria, rate yourself on the Dreyfus 5-level scale.

### 5.1 Rapid Experimentation Level

| Level | What it looks like |
|-------|-------------------|
| 1 · Novice | I have opinions about what should be built, but no mechanism to test them |
| 2 · Adv. Beginner | I run a user interview every quarter, treat it as confirmation of my plan |
| 3 · Competent | I ship 1 prototype / month, kill bad ones, but feel personally hurt when one dies |
| 4 · Proficient | I ship 1 prototype / week, no attachment, treat each as a hypothesis |
| 5 · Expert | I have killed > 30 prototypes in the last year, can name 3 that taught me something analysis alone would not have surfaced |

### 5.2 Rapid Product Clarity Level

| Level | What it looks like |
|-------|-------------------|
| 1 · Novice | A PRD takes me 3+ days to write, gets pushed back by engineering for ambiguity |
| 2 · Adv. Beginner | I can write a 1-pager, but it has gaps I don't see until engineering points them out |
| 3 · Competent | I produce 1-page PRD + simple wireframe in a day, mostly clear on first read |
| 4 · Proficient | I produce 1-page PRD + clickable prototype in 4 hours, engineering reads it and starts coding |
| 5 · Expert | I produce 1-page PRD + clickable prototype + 3 test questions in 2 hours, and the artifact convinces a skeptical stakeholder in one meeting |

### 5.3 Commercial Trust Level

| Level | What it looks like |
|-------|-------------------|
| 1 · Novice | I cannot name the 3 metrics my product is judged on |
| 2 · Adv. Beginner | I know the metrics, but cannot connect any of my decisions to movement in them |
| 3 · Competent | I can name 1 decision I made that moved a metric, and 1 decision that did not |
| 4 · Proficient | Over the last 6 months, > 50% of my decisions have a traceable line to a metric that moved |
| 5 · Expert | I make commitments on numbers and hit them. Leadership consults me before deciding scope, not after |

### 5.4 Your total score (out of 15)

| Score | Where you are | What this workshop will give you |
|-------|--------------|----------------------------------|
| 3-5 | Junior | Build habits across all 3 criteria; expect 1-2 level lift on weakest |
| 6-9 | Competent | Close your weakest dimension; the other 2 are not your bottleneck right now |
| 10-12 | Senior | Polish Commercial Trust if not yet at 4+; otherwise help calibrate others |
| 13-15 | Principal | You do not need this workshop. Bring your judgment to help calibrate others; we may invite you to the teaching track |

## 6. How to Use This Document

- **T-1 (24h before workshop)**: read this once. Self-score §5 honestly. Then fill `cohort-profile-baseline.csv` (different artifact — that one tracks behavioral facts, not self-scores)
- **T+0 (workshop day)**: Maurice has not seen your scores. The workshop is calibrated to lift the weakest dimension first
- **T+30 (1 month post-workshop)**: re-read. Re-score. If no movement, escalate to Maurice for 1:1 diagnostic
- **Quarterly thereafter**: repeat the score. The line should bend upward

## 7. Anti-Patterns — How NOT to Use This

- **Do not share your score with others until you trust them deeply.** The scores are a private instrument, not a credential
- **Do not optimize the score.** The score is downstream of the work. Optimizing the score directly is Goodhart's Law in action
- **Do not accept the model uncritically.** If after 6 months these 3 criteria do not predict who is producing valuable work, the model is wrong — and Maurice should hear about it

---

Maurice | maurice_wen@proton.me
