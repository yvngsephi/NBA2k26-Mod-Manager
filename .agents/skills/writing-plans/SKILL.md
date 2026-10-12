---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# Writing Plans

Write comprehensive, bite-sized implementation plans before writing any implementation code.

Assume the executing engineer has general engineering capability but zero prior context for this specific codebase, questionable taste, and needs exact file paths, interfaces, and testing steps spelled out.

**Announce at start:** *"I am using the writing-plans skill to create the implementation plan."*

---

## Core Principles

1. **Test-Driven Development (TDD)**: Every task begins with a failing test before writing production code.
2. **Bite-Sized Granularity**: Each step represents a 2–5 minute action.
3. **No Placeholders**: Every step must contain exact code blocks, commands, and file paths. Vague instructions (*"add appropriate error handling"*, *"write tests for above"*, *"TODO"*) are plan failures.
4. **Interface Isolation**: Each task explicitly documents the interfaces it consumes and produces so tasks can be executed or reviewed in isolation.

---

## File Structure & Decomposition

Before defining tasks, map out every file to be created or modified:
- Design units with single responsibilities and clear boundary interfaces.
- Prefer smaller, focused files over monolithic modules.
- Place files that change together near each other.
- In existing codebases, follow established conventions while refactoring cleanly where complexity has sprawled.

---

## Bite-Sized Task Granularity

Structure each implementation task around standard 2–5 minute steps:
1. **Write failing test**: Define test case with expected behavior.
2. **Run test to verify failure**: Run command and confirm expected failure output.
3. **Write minimal implementation**: Implement just enough code to satisfy the test.
4. **Run test to verify pass**: Run command and confirm clean pass.
5. **Commit**: Exact git commit command for the atomic milestone.

---

## Implementation Plan Format

Save implementation plans to `docs/plans/YYYY-MM-DD-<feature-name>.md` (or the project's designated plan directory, or Antigravity's `implementation_plan.md` artifact if executing in planning mode).

Every plan must follow this template:

````markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [One sentence describing the concrete outcome]

**Architecture:** [2–3 sentences summarizing technical approach]

**Tech Stack:** [Key libraries, frameworks, test runners, and tools]

**Spec:** [Link/path to the design spec document this plan implements]

## Global Constraints
- [Version requirements, dependency restrictions, architectural boundaries, or platform constraints copied from the spec]

## Review Focus
[List the top 3–5 failure modes, edge cases, or untracked inputs that could break this feature, and ensure they are assigned to specific tests below]

---

### Task 1: [Component Name]

**Files:**
- Create: `exact/path/to/new_file.ext`
- Modify: `exact/path/to/existing_file.ext:10-30`
- Test: `tests/exact/path/to/test_file.ext`

**Interfaces:**
- Consumes: [Exact signatures/types needed from prior tasks or modules]
- Produces: [Exact function/class names, parameters, and return types exported]

- [ ] **Step 1: Write the failing test**
```javascript
// Exact test code
test('should perform specific behavior', () => {
  // ...
});
```

- [ ] **Step 2: Run test to verify it fails**
Command: `npm test -- tests/path/test_file.ext`
Expected: FAIL with "function not defined" or similar

- [ ] **Step 3: Write minimal implementation**
```javascript
// Exact minimal code needed to pass
export function myFeature() {
  // ...
}
```

- [ ] **Step 4: Run test to verify it passes**
Command: `npm test -- tests/path/test_file.ext`
Expected: PASS

- [ ] **Step 5: Commit changes**
Command: `git add <files> && git commit -m "feat(scope): implement specific behavior"`
````

---

## Anti-Placeholder Rules

The following are strict plan failures:
- Writing `"TBD"`, `"TODO"`, or `"implement later"`.
- Instructions like *"Add error handling and input validation"* without specifying the exact checks and errors.
- *"Write unit tests for the functions above"* without providing the actual test code.
- *"Repeat steps similar to Task 2"* without including the explicit code and commands.
- Calling functions, methods, or properties not defined in the plan or codebase.

---

## Plan Self-Review Checklist

Run this self-review before sharing the plan with the user:
1. **Spec Coverage**: Does every requirement from the spec map to at least one task?
2. **Placeholder Scan**: Search the plan for any vague phrases or omitted code snippets.
3. **Type & Signature Consistency**: Do exported names and parameter types match between producer and consumer tasks?
4. **Review Focus Verification**: Are the failure modes identified in the header covered by tests in the tasks?

---

## Handoff & Execution Selection

After the plan is written and self-reviewed, present it to your human partner and ask for confirmation before modifying code:

> *"Plan complete and saved to `<path>`. Please review the plan. How would you like to proceed with execution?"*
> 
> - **Subagent-driven**: Separate subagents execute and verify individual tasks independently.
> - **Native Session**: Implement tasks sequentially within this session with clean test verification at each step.
