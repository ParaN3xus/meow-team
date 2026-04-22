## Why

Failed planner materialization, coding handoff, review delivery, and final
approval stages can leave a thread or lane stuck in `failed` even when the
system still has enough context to continue safely. Today the normal escape
hatch is often destructive cleanup or a fresh planning pass, which drops the
current assignment, proposal, and OpenSpec context instead of resuming the
interrupted work.

## What Changes

- Introduce the
  `resume-failed-flow-a2-p1-add-resumable-recovery-for-failed-planner-and-l`
  OpenSpec change for proposal "Add resumable recovery for failed planner and
  lane stages".
- Persist durable, stage-specific recovery checkpoints for planner
  materialization and lane execution so recoverable failures can restart from
  the last safe boundary instead of replanning from scratch.
- Extend the human-confirmed recovery flow so failed-but-recoverable planner,
  coding, review, and finalization states can resume with the existing
  assignment number, proposal branch, OpenSpec change, and previously recorded
  outputs intact.
- Reuse the thread command and approval surfaces to expose an explicit resume
  action only when the stored checkpoint proves the failure is recoverable, and
  keep current hard-stop behavior for missing checkpoints or blocking
  repository state.
- Add regression coverage for the reported stuck-flow regressions, including
  planner network failure during materialization, post-approval push or PR
  setup failures, reviewer-stage delivery failures, and finalization failures
  that must resume without duplicating prior side effects.

## Capabilities

### New Capabilities

- `resume-failed-flow-a2-p1-add-resumable-recovery-for-failed-planner-and-l`:
  Recover failed planner and lane stages from persisted checkpoints so human
  confirmation can resume the interrupted stage without destructive cleanup or
  request-group replanning.

### Modified Capabilities

- None.

## Conventional Title

- Canonical request/PR title:
  `fix(planner/rematerialization): restore planner recovery flow`
- Conventional title metadata: `fix(planner/rematerialization)`
- Slash-delimited roadmap/topic scope stays in conventional-title metadata and
  does not alter `branchPrefix` or OpenSpec change paths.

## Impact

- Affected repository: `meow-team`
- Affected code: `lib/team/planner-retry.ts`, `lib/team/agent-retry.ts`,
  `lib/team/thread-actions.ts`, `lib/team/thread-command-server.ts`,
  `lib/team/history.ts`, lane execution modules under `lib/team/coding`, and
  the thread status or command UI surfaces
- Affected state: persisted thread and lane recovery metadata, command
  eligibility, failure messaging, and finalization checkpoint handling
- Reusable worktrees: preserve the current planner branch and pooled
  `/home/admin/projects/node/meow-team/.meow-team-worktrees/meow-N` lane slots
  instead of treating branch deletion as the normal recovery path
- Planner deliverable: one lifecycle-wide recovery proposal that keeps the
  coding-review pool idle until approval, then adds resumable recovery across
  planner, coding, review, and finalization with regression coverage
