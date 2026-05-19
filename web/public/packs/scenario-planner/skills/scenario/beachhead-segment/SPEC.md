---
name: beachhead-segment
description: "Identify the first beachhead market segment for a product launch. Evaluates segments against burning pain, willingness to pay, winnable market share, and referral potential. Use when choosing a first market, targeting an initial customer segment, or planning market entry strategy."
---

## 是什么

帮你从一堆"看起来都不错"的市场切片里，挑出那个真痛、肯付费、能赢、还会主动转介绍的滩头堡（Beachhead，首战市场），让有限的资源砸在最容易拿下的第一仗上。

## 怎么用

1. 列出 5–8 个候选细分市场，避免一上来就锁死答案。
2. 用四把尺子量每个候选：痛感强度、付费意愿、可赢份额、转介绍潜力。
3. 给每个候选写一句话客户画像，逼自己说清楚"到底卖给谁"。
4. 排序后挑出第一名作为滩头堡，第二名留作后备。
5. 为滩头堡定义产品市场契合度（PMF，Product-Market Fit）的可衡量信号，作为下阶段验证目标。

## 架构图

```mermaid
flowchart LR
  A[候选细分市场列表] --> B[四维评估打分]
  B --> C[客户画像澄清]
  C --> D[滩头堡选定]
  D --> E[PMF 验证信号]
```

# Beachhead Segment

## Overview
Identify the first beachhead market segment for product launch. This skill evaluates potential market segments against key criteria to find your initial winning segment that enables fast PMF validation and adjacent expansion.

## When to Use
- Choosing a first market for your product
- Targeting an initial customer segment
- Planning initial market entry strategy
- Deciding where to focus limited resources
- Validating GTM assumptions with early adopters

## Key Evaluation Criteria

### 1. Burning Pain Point
Does this segment experience an acute, unmet problem?
- Daily frustration with the status quo
- Significant productivity loss or cost impact
- Emotional urgency to find a solution
- Current workarounds are expensive or fragile
- Problem is getting worse over time

### 2. Willingness to Pay
Does this segment have budget and motivation to pay for a solution?
- Documented budget allocation for this problem area
- ROI is clear and compelling (value > cost)
- Economic impact of problem justifies solution cost
- Decision-maker has autonomy or influence over budget
- No free or DIY alternatives that fully satisfy need

### 3. Winnable Market Share
Can you realistically capture 60-70% of this segment in 3-18 months?
- Segment is large enough but not oversaturated
- Limited competition or easy differentiation
- Market players are fragmented or complacent
- Your product has clear competitive advantage
- You have unique access or distribution advantage

### 4. Referral Potential
Will customers naturally refer or recommend to others?
- Segment contains professional communities
- Customers interact with adjacent segments (expansion opportunity)
- High word-of-mouth culture in this industry
- Network effects within the segment
- Solving problem for one creates demand in adjacent segments

## How It Works

### Step 1: List Potential Segments
Brainstorm all possible target segments:
- Industry verticals (SaaS, healthcare, manufacturing, etc.)
- Company size (SMB, mid-market, enterprise)
- Job titles or roles
- Geographic regions
- Use cases or use-case variations
- Customer maturity level

### Step 2: Research Pain Points
Validate burning pain in each segment:
- Customer interviews and discovery calls
- Problem validation through surveys
- Market research and analyst reports
- Competitor positioning and customer reviews
- Quantify cost/impact of the problem
- Identify current workarounds and limitations

### Step 3: Assess Willingness to Pay
Determine budget and economic viability:
- Segment's budget for this problem category
- ROI calculation (value gained vs cost)
- Current spending on solutions or workarounds
- Budget decision-making process
- Typical deal size expectations
- Pricing sensitivity in the segment

### Step 4: Evaluate Winnability
Assess realistic market share potential:
- Total addressable market (TAM) size
- Competitive landscape and positioning
- Your differentiation or unfair advantage
- Distribution access to this segment
- Time and resources required
- Market growth and momentum

### Step 5: Identify Referral Pathways
Map expansion opportunities:
- Adjacent segments that reference segment influences
- Network effects within the segment
- Professional communities and associations
- Customer-to-customer recommendations
- Natural expansion path to adjacent markets
- Viral or network effects from solving core pain

### Step 6: Select Beachhead
Choose your primary launch segment:
- Highest combined score across four criteria
- Most achievable for your current resources
- Shortest path to PMF and revenue
- Best reference for adjacent expansion
- Most enthusiastic early customer cohort

## Input Format
Use $ARGUMENTS to pass:
- Product description and capabilities
- Initial market research and validation data
- Potential segment options
- Constraints and limitations
- Timeline and resource constraints
- Current customer data or feedback

## Output
A beachhead segment analysis including:
- Top 3-5 recommended segments with scoring
- Primary beachhead segment recommendation
- Pain point validation and evidence
- Willingness to pay assessment and pricing guidance
- Realistic market share and revenue projections
- Referral and expansion pathways to adjacent segments
- 90-day customer acquisition plan for beachhead
- Post-beachhead expansion roadmap

## Framework
Based on Geoffrey Moore's beachhead market strategy in "Crossing the Chasm." Focuses on finding the smallest winnable, referenceable market that validates PMF and enables expansion.

## Tips
- Start absurdly specific. A niche beachhead is better than a vague mass market
- Choose the segment most likely to evangelize your solution
- Validate all four criteria with at least 10 customer interviews
- Select segment with fastest path to revenue and references
- Ensure beachhead can reference to adjacent market segments
- Focus all resources on dominating the beachhead (not diluting efforts)
- Plan exit from beachhead only after 60%+ market share

---

### Further Reading

- [5 GTM Principles You Should Know as a PM](https://www.productcompass.pm/p/5-gtm-principles-with-frameworks-templates)
- [Product-Led Growth 101, Part 1/2](https://www.productcompass.pm/p/product-led-growth-101-12)
- [How to Design a Value Proposition Customers Can't Resist?](https://www.productcompass.pm/p/how-to-design-value-proposition-template)
- [How to Achieve Product-Market Fit? Part I: Market and Value Proposition](https://www.productcompass.pm/p/how-to-achieve-the-product-market)
