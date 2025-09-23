# CONTEXT (Louhen Landing)

This folder is the **single source of truth** for how we collaborate with AI agents (Codex) and with each other in this repository.  
Its purpose: ensure consistency, speed, and safety when making changes.

---

## How to use

1. **Always check here first** before starting a new task.  
   - Read `agents.md` (rules for Codex).  
   - Skim `decision_log.md` (what’s locked in).  

2. **When asking Codex for help**, follow the ritual:  
   - **PLAN** → outline steps first.  
   - **DIFF** → apply surgical changes only.  
   - **VALIDATE** → run the test & QA steps.  
   - **REVERT** → know how to undo safely.  

3. **Keep this folder updated** whenever decisions or conventions change.

---

## Folder contents

- **agents.md** — roles, priorities, guardrails, and syntax for Codex.
- **project_overview.md** — goals, non-goals, stack, success metrics.
- **decision_log.md** — locked decisions and history of changes.
- **coding_conventions.md** — style guide, naming, folder layout, commit rules.
- **architecture.md** — high-level map of flows, data, envs, CI/CD.
- **acceptance_checklists.md** — reusable QA steps to paste into PRs.
- **glossary.md** — domain terms (LouhenFit, Fit Confidence, etc.) for consistent language.

---

## Why this exists

- **Consistency** — every collaborator and agent works the same way.  
- **Scalability** — rules scale across repos and contributors.  
- **Trust** — locked decisions prevent regressions.  
- **Speed** — no need to repeat context every time.

---

*If in doubt: update this folder, don’t let knowledge live only in your head or in chat threads.*