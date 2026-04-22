## Context

This change captures proposal "Add resumable recovery for failed planner and
lane stages" as OpenSpec change
`resume-failed-flow-a2-p1-add-resumable-recovery-for-failed-planner-and-l`.
The harness already persists enough data to retry planner rounds and some lane
agent attempts, but recoverability is fragmented. Planner failures can fall
back to rematerialization checks that demand branch cleanup, while coding,
review, and final approval failures often land in `failed` after side effects
such as branch publication, PR creation, archive commits, or proposal deletion
have already happened. The reported regression shows the result: after a
recoverable failure, repeated `/approve`, `/retry`, or `/ready` commands keep
re-entering the wrong path and never resume the interrupted stage.

The requested behavior is one coherent lifecycle change. A recoverable failure
must preserve the current assignment, proposal branch, OpenSpec change, and
stage outputs, then allow a human-confirmed resume from `failed` without a new
planning pass. Blocking repository conditions must still fail explicitly.

## Goals / Non-Goals

**Goals:**
- Define one persisted recovery model that works for planner materialization and
  lane stages.
- Allow human-confirmed resume from recoverable `failed` states without
  destructive branch cleanup or request-group replanning.
- Preserve stage-specific context, including assignment numbers, proposal
  metadata, change paths, branch heads, PR metadata, and artifact disposition
  checkpoints.
- Reuse existing approval or retry command surfaces with explicit eligibility
  rules and user-facing messaging for resumable failures.
- Add regression coverage for planner network failures, post-approval PR or
  push failures, reviewer-stage delivery failures, and final approval failures
  that happen after partial side effects.
- Preserve the canonical request/PR title
  `fix(planner/rematerialization): restore planner recovery flow` and
  conventional-title metadata `fix(planner/rematerialization)` across the
  materialized artifacts.

**Non-Goals:**
- Redesign the default `planner -> coder -> reviewer` workflow.
- Introduce destructive branch deletion or worktree cleanup as the primary
  recovery mechanism.
- Auto-resume failed work without an explicit human confirmation step.
- Relax existing safety checks for unrecoverable repository state, missing
  proposal artifacts, or incompatible archive/delete outcomes.
- Replan or regenerate proposals when the stored checkpoint proves the existing
  context is still usable.

## Decisions

- Persist explicit resume checkpoints at each recoverable stage boundary instead
  of inferring recovery from coarse `failed` status alone. For planner runs,
  the checkpoint should capture the materialization stage plus the assignment
  and proposal context already assembled before failure. For lanes, the
  checkpoint should record the execution status and sub-phase being resumed,
  along with the branch, publish, PR, and archive or delete side effects that
  already succeeded. Alternative considered: continue deriving recovery only
  from current status and scattered fields such as `pullRequest` or
  `retryState`. Rejected because the current state shape does not distinguish
  safe resume points from paths that would replay the wrong operation.
- Treat recoverability as explicit persisted metadata on the thread run or lane,
  not as an assumption tied to every `failed` state. Alternative considered:
  make all failed planner or lane states eligible for `/retry`. Rejected
  because missing checkpoints, dirty repositories, archived-versus-deleted
  mismatches, and lost proposal context still need a blocking failure instead
  of a blind retry.
- Reuse the human-confirmed resume surface through the existing command and
  action system, extending `/retry` and equivalent server actions to operate on
  recoverable `failed` states in addition to current retry-approval waits.
  Alternative considered: add a brand-new `/resume` command and separate UI
  action. Rejected because the operator intent is already "retry this failed
  work," and duplicating the surface would increase command and UI branching.
- Model planner and lane recovery around idempotent stage boundaries. Planner
  resume should continue from the persisted materialization checkpoint instead
  of restarting planning. Lane resume should continue from the stored execution
  phase such as proposal approval delivery, review delivery, or final archive
  delivery, skipping side effects that already completed. Alternative
  considered: always restart the whole lane stage after failure. Rejected
  because post-side-effect failures would duplicate pushes, commits, PR
  mutations, or archive actions.
- Preserve current guardrails for truly blocking repository state and surface
  those failures directly in eligibility checks and user messaging. Alternative
  considered: silently fall back to branch deletion or request-group replanning
  whenever resume preconditions fail. Rejected because it hides data loss and
  recreates the reported stuck-flow behavior under a different name.
- Cover regressions with targeted end-to-end lifecycle tests rather than only
  unit tests for checkpoint serializers. Alternative considered: validate the
  new state model through isolated type-level tests. Rejected because the risk
  is orchestration drift between persisted checkpoints, command eligibility,
  and resumed stage execution.

## Risks / Trade-offs

- [Checkpoint schema grows across planner and lane state] -> Keep one explicit
  recovery payload per scope and serialize only the fields needed to replay the
  next stage safely.
- [Resume logic can diverge from normal happy-path execution] -> Resume the
  same planner or lane executors with persisted stage markers so recovery
  remains a continuation of the standard flow rather than a separate workflow.
- [Idempotency bugs may replay side effects after partial success] -> Persist
  branch publication, PR synchronization, and archive or delete disposition
  checkpoints before transitioning to the next external operation, then cover
  each partial-success failure mode with regression tests.
- [Recoverable and blocking failures can be confused in the UI] -> Derive
  command eligibility from explicit checkpoint validity and render distinct
  guidance for resumable failures versus manual intervention failures.
- [Existing retry-round behavior could regress] -> Preserve current automatic
  retry rounds and human confirmation semantics, and extend them only where a
  failed state now has a durable resume checkpoint.

## Migration Plan

Roll out the new checkpoint schema and resume gating together. Existing active
threads or lanes without the new recovery metadata should keep current failure
behavior and require manual replanning or cleanup, while newly persisted
failures become resumable. Deploy with updated command or UI messaging plus
regression tests so operators can distinguish resumable failed states from
blocking ones.

## Open Questions

- Whether legacy failed threads or lanes created before the checkpoint fields
  exist should expose a one-time "not resumable" explanation or stay hidden
  behind existing command ineligibility.
