## 1. Proposal Alignment

- [ ] 1.1 Review the approved OpenSpec artifacts for "Add resumable recovery for failed planner and lane stages" and confirm the canonical request/PR title is `fix(planner/rematerialization): restore planner recovery flow`
- [ ] 1.2 Confirm the proposal stays scoped to one lifecycle-wide recovery change, preserves the current planner and pooled lane worktree model, and keeps conventional-title metadata `fix(planner/rematerialization)` separate from `branchPrefix` and OpenSpec change paths

## 2. Recovery Checkpoints

- [ ] 2.1 Extend planner persistence so recoverable planner failures store a durable resume checkpoint with assignment, proposal, and materialization-stage context instead of requiring a fresh planning pass
- [ ] 2.2 Extend lane persistence so proposal approval, coding, review, and final approval stages record explicit resume checkpoints and completed side effects needed for idempotent recovery

## 3. Resume Orchestration

- [ ] 3.1 Update thread actions, server command handling, and eligibility checks so human-confirmed `/retry` or equivalent resume actions can continue recoverable `failed` planner and lane states without replaying the wrong stage
- [ ] 3.2 Preserve existing blocking safeguards so missing checkpoints, incompatible proposal disposition, or unrecoverable repository state still fail with clear guidance instead of destructive cleanup

## 4. UI Messaging And History

- [ ] 4.1 Refresh thread status, action copy, and timeline or planner-note messaging so recoverable failed states explain what will resume and blocking failed states explain why resume is unavailable
- [ ] 4.2 Persist resumed-state history updates that show which planner or lane stage failed, which checkpoint was reused, and when human confirmation restarted the flow

## 5. Regression Coverage

- [ ] 5.1 Add regression tests for planner materialization failure followed by human-confirmed resume that preserves the existing assignment and proposal context
- [ ] 5.2 Add regression tests for post-approval push or GitHub draft PR failure, reviewer-stage delivery failure, and final approval archive or PR refresh failure so each resumes from its checkpoint without duplicating prior side effects

## 6. Validation

- [ ] 6.1 Run `pnpm fmt` after updating the OpenSpec-managed planner artifacts or any implementation files touched by this change
- [ ] 6.2 Run `pnpm lint` and targeted recovery-flow tests covering planner retry, lane retry, thread command, and coding or finalization orchestration paths
- [ ] 6.3 Run `pnpm build` before review because the change updates shared harness orchestration, persisted history, and command eligibility surfaces
