# resume-failed-flow-a2-p1-add-resumable-recovery-for-failed-planner-and-l Specification

## Purpose

Define the failed-state recovery capability for the harness, including durable
planner and lane resume checkpoints, human-confirmed resume from recoverable
`failed` states, preserved assignment and proposal context across interrupted
stages, and regression coverage for the reported stuck-flow failures.

## ADDED Requirements

### Requirement: Recoverable planner failures resume from persisted planner context

The system SHALL persist a planner recovery checkpoint whenever proposal
materialization or rematerialization fails after the current assignment and
proposal context have already been established, and SHALL let a human-confirmed
resume continue that planner stage without creating a fresh assignment.

#### Scenario: Planner materialization network failure resumes without replanning

- **WHEN** planner materialization fails because a recoverable network or tool
  operation fails after the assignment number, proposal change name, canonical
  branch, and proposal artifact paths have already been determined
- **THEN** the thread SHALL enter `failed` with a persisted planner recovery
  checkpoint that references the interrupted materialization stage
- **AND** a human-confirmed resume SHALL continue the planner flow from that
  checkpoint instead of generating a new assignment or requiring branch
  deletion

### Requirement: Recoverable lane failures resume from stage-specific checkpoints

The system SHALL persist lane recovery checkpoints for recoverable failures in
proposal approval delivery, coding, review, and final approval execution so a
later human-confirmed resume continues from the interrupted lane stage while
preserving proposal branch, OpenSpec change, and prior side effects.

#### Scenario: Proposal approval failure resumes after branch publication work

- **WHEN** proposal approval pushes or prepares the lane branch successfully but
  fails during later GitHub draft PR synchronization
- **THEN** the lane SHALL enter `failed` with a checkpoint that records the
  preserved branch and completed publication side effects
- **AND** a human-confirmed resume SHALL continue GitHub draft PR
  synchronization without re-planning the proposal or recreating earlier
  branch-side work

#### Scenario: Final approval failure resumes after artifact disposition

- **WHEN** final approval archives or deletes the active OpenSpec change
  successfully but fails before the tracking PR refresh finishes
- **THEN** the lane SHALL persist the selected finalization mode and completed
  artifact disposition in its recovery checkpoint
- **AND** a human-confirmed resume SHALL continue PR delivery without
  re-archiving, re-deleting, or recommitting the proposal artifacts

### Requirement: Resume commands and actions target only recoverable failed states

The system SHALL expose an explicit human-confirmed resume action for failed
planner and lane states only when a valid recovery checkpoint proves the flow
can continue safely.

#### Scenario: Recoverable failed lane offers retry

- **WHEN** the latest assignment contains a lane in `failed` with a valid
  recovery checkpoint for an interrupted coding, review, or final approval
  stage
- **THEN** the thread command and action surfaces SHALL present `/retry` or the
  equivalent resume action as eligible for that proposal
- **AND** the user-facing guidance SHALL describe which stage will resume

#### Scenario: Blocking failed state does not offer retry

- **WHEN** a planner or lane is `failed` but the recovery checkpoint is missing,
  incompatible with the current proposal disposition, or blocked by repository
  state that requires manual intervention
- **THEN** the system SHALL reject resume attempts without mutating assignment
  or lane state
- **AND** the user-facing guidance SHALL explain why the failure is not
  resumable

### Requirement: Recovery preserves current assignment and proposal context

The system SHALL preserve the existing assignment number, proposal numbering,
change path, branch identity, and previously recorded planner or lane outputs
when resuming a recoverable failed state.

#### Scenario: Reviewer-stage failure keeps current proposal identity

- **WHEN** a reviewer-stage delivery failure interrupts a lane after coding has
  already produced the current implementation commit and tracking PR metadata
- **THEN** the resumed lane SHALL continue with the same assignment number,
  lane index, proposal change name, branch name, and tracked PR identity
- **AND** the system SHALL NOT create a replacement proposal or require a fresh
  planning pass before review can continue

### Requirement: Conventional title metadata stays explicit

The system SHALL carry the canonical request/PR title
`fix(planner/rematerialization): restore planner recovery flow` and
conventional-title metadata `fix(planner/rematerialization)` through the
materialized OpenSpec artifacts without changing the approved change name.

#### Scenario: Materialized artifacts mirror the approved scope

- **WHEN** planner materializes this proposal
- **THEN** `proposal.md`, `design.md`, `tasks.md`, and this spec SHALL
  reference the canonical request/PR title
  `fix(planner/rematerialization): restore planner recovery flow`
- **AND** the conventional-title metadata SHALL remain separate from the change
  path `resume-failed-flow-a2-p1-add-resumable-recovery-for-failed-planner-and-l`
