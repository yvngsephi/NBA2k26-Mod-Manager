---
name: brainstorming
description: "You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation."
---

# Brainstorming

Help turn ideas into fully formed designs and specifications through natural collaborative dialogue before writing any code.

Start by classifying how much process the request needs, then work through your path: understand the context, refine the idea, present a design, and obtain your human partner's explicit approval.

---

## Establish Shared Understanding

The outcome of brainstorming is an understanding your human partner can recognize and correct, grounded in what they want to accomplish.

1. **Discover intent.** Use the request and available context to identify the intended outcome, who it is for, and what success looks like. When that information is missing, ask one focused question about purpose or intended use before proposing features or an approach. Knowing the project type does not tell you why your partner wants it.
2. **Write back your understanding.** Summarize the intended outcome, relevant constraints, and success criteria in a short note your partner can assess. Separate what they said from assumptions. Invite correction and incorporate their answer before treating this as the design brief.
3. **Carry intent into the design.** Preserve the agreed understanding in the selected path's design artifact: the written spec for architectural work, or the in-chat design for bounded work and spikes. Check proposed features and technical choices against that understanding.

When the request already supplies the purpose and constraints, reflect that understanding instead of asking redundant questions. Keep the note concise; its accuracy and the opportunity to correct it matter.

---

## Hard Gate

> [!CAUTION]
> **Hard Gate**: Before taking any implementation action—including writing product code, scaffolding, installing dependencies, or modifying files—complete the selected path's prerequisites:
> - **Spike**: Human partner approves the question and probe plan.
> - **Bounded**: Human partner approves the short in-chat design.
> - **Architectural**: Human partner reviews and approves the written spec, then reviews the written implementation plan.

A reply approves the stage actually presented. Approval of an idea or feature scope does not approve artifacts that do not exist yet. Resume at the earliest incomplete stage; do not turn one approval into permission to skip the rest of the selected path. Read-only project exploration is allowed while those prerequisites remain incomplete.

---

## Three Paths

Before asking detailed questions, classify the request and state the classification explicitly:

- **Spike** — A feasibility question (*"can we..."*, *"is it possible..."*, *"quick and dirty probe"*).
  - Output is an answer, not permanent code.
  - Present the question and what you will try in 2–3 sentences, get approval, then investigate as cheaply as correctness allows.
  - No formal spec file. Report findings as a recommendation; anything built remains labeled throwaway.
- **Bounded** — A well-scoped change to code that already exists in this repository (e.g., a new flag, a small endpoint, a one-file fix, a localized UI tweak).
  - Bounded means the flow being modified is already present to read and inspect.
  - Ask clarifying questions that matter, present a short design **in chat** (approach, files touched, testing), and **STOP**.
  - Implementation begins only after explicit approval. No spec document required.
- **Architectural** — New projects, new subsystems, major refactorings, or changes altering interfaces others depend on.
  - Follow the complete process: clarify purpose/constraints, propose 2–3 approaches with trade-offs, sectioned design review, written specification document, inline self-review, user review gate, and transition to the `writing-plans` skill.

*Rule of thumb*: When in doubt between two paths, choose the heavier one. Hidden complexity discovered mid-task upgrades the path—stop, notify the partner, and step up.

---

## Red Flags

| Thought | Reality |
|---|---|
| *"This is too simple to need a design"* | Follow the selected path: bounded gets a short in-chat design; architectural gets the written spec and planning handoffs. |
| *"I'll call it bounded and skip the spec"* | Reaching for a label to skip work IS the doubt—take the heavier path. |
| *"It's bounded and obvious—I'll start while they read it"* | The gate is the approval, not the design's length. Present, then wait for explicit confirmation. |
| *"I understand this kind of app, so it's bounded"* | Bounded measures the codebase, not your familiarity. A new project has no existing flow—it is architectural. |
| *"The spike worked, so I'll keep the code"* | A spike's output is an answer. Keeping the code is a new request—reclassify it. |
| *"It grew, but I'm almost done"* | Hidden complexity upgrades the path mid-task. Stop and announce the upgrade. |

---

## Step-by-Step Workflow

### 1. Bounded Path
1. **Explore project context**: Inspect relevant files, existing patterns, tests, and dependencies.
2. **Ask clarifying questions**: One at a time, focusing strictly on ambiguities that affect implementation.
3. **Present short design in chat**: Specify approach, files touched, and verification method.
4. **Get explicit approval**: Stop and wait for the user's confirmation before modifying any code.
5. **Implement**: Proceed with test-driven implementation.

### 2. Architectural Path
1. **Explore project context**: Review directory structure, existing architectural patterns, and docs.
2. **Clarify intent & constraints**: Ask questions one at a time (prefer multiple-choice where appropriate) covering purpose, constraints, and success criteria.
3. **Propose 2–3 approaches**: Outline trade-offs, pros/cons, and lead with a clear recommendation.
4. **Present design in sections**:
   - Divide into manageable sections (architecture, components/modules, data flow, error handling, testing).
   - Get user alignment after each section.
5. **Write design document (spec)**:
   - Save to `docs/specs/YYYY-MM-DD-<topic>-design.md` (or the project's designated spec directory).
6. **Spec Self-Review**:
   - *Placeholder scan*: Ensure no "TBD", "TODO", or vague requirements exist.
   - *Internal consistency*: Ensure components and data models align across sections.
   - *Scope check*: Confirm the spec is focused enough for a single implementation plan or needs decomposition.
   - *Ambiguity check*: Eliminate requirements that could be interpreted multiple ways.
7. **User Review Gate**:
   - Provide a clickable link to the written spec and request approval:
     > *"Spec written and saved to `<path>`. Please review it and let me know if you would like any changes before we create the implementation plan."*
8. **Transition to Implementation Planning**:
   - Once approved, invoke the **`writing-plans`** skill to break the spec into granular, test-driven tasks.
