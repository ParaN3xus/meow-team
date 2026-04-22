import type { TeamLaneRecoveryCheckpoint, TeamWorkerLaneRecord } from "@/lib/team/types";

const hasProposalApprovalRecovery = (
  lane: Pick<
    TeamWorkerLaneRecord,
    | "branchName"
    | "baseBranch"
    | "proposalPath"
    | "pullRequest"
    | "pushedCommit"
    | "recoveryCheckpoint"
    | "status"
  >,
): string | null => {
  const checkpoint = lane.recoveryCheckpoint;
  if (lane.status !== "failed" || checkpoint?.kind !== "proposal_approval") {
    return "it is not waiting to resume proposal approval.";
  }

  if (!lane.branchName || !lane.baseBranch || !lane.proposalPath) {
    return "it no longer has the proposal branch metadata required to resume.";
  }

  if (checkpoint.checkpoint === "branch_pushed" && !lane.pushedCommit) {
    return "its saved proposal-approval checkpoint is missing the published branch metadata.";
  }

  return null;
};

const hasLaneExecutionRecovery = (
  lane: Pick<
    TeamWorkerLaneRecord,
    | "latestCoderHandoff"
    | "latestImplementationCommit"
    | "latestReviewerHandoff"
    | "recoveryCheckpoint"
    | "status"
  >,
): string | null => {
  const checkpoint = lane.recoveryCheckpoint;
  if (lane.status !== "failed" || checkpoint?.kind !== "lane_execution") {
    return "it is not waiting to resume failed lane execution.";
  }

  if (
    checkpoint.failedStage === "coding_delivery" &&
    (!lane.latestImplementationCommit || !lane.latestCoderHandoff)
  ) {
    return "its saved coding checkpoint is missing the implementation commit or coder handoff.";
  }

  if (
    checkpoint.failedStage === "review_feedback_delivery" &&
    (!lane.latestImplementationCommit || !lane.latestReviewerHandoff)
  ) {
    return "its saved reviewer-feedback checkpoint is missing the required reviewer handoff.";
  }

  return null;
};

const hasReviewApprovalRecovery = (
  lane: Pick<
    TeamWorkerLaneRecord,
    | "branchName"
    | "baseBranch"
    | "latestCoderHandoff"
    | "latestImplementationCommit"
    | "latestReviewerHandoff"
    | "pullRequest"
    | "pushedCommit"
    | "recoveryCheckpoint"
    | "status"
  >,
): string | null => {
  const checkpoint = lane.recoveryCheckpoint;
  if (lane.status !== "failed" || checkpoint?.kind !== "review_approval_delivery") {
    return "it is not waiting to resume review delivery.";
  }

  if (!lane.branchName || !lane.baseBranch) {
    return "it no longer has the lane branch metadata required to resume.";
  }

  if (!lane.latestImplementationCommit || !lane.latestCoderHandoff || !lane.latestReviewerHandoff) {
    return "its saved review-delivery checkpoint is missing the implementation or review handoff.";
  }

  if (!lane.pullRequest) {
    return "it no longer has tracking pull request metadata to refresh.";
  }

  if (checkpoint.checkpoint === "branch_pushed" && !lane.pushedCommit) {
    return "its saved review-delivery checkpoint is missing the published branch metadata.";
  }

  return null;
};

const hasPullRequestApprovalRecovery = (
  lane: Pick<
    TeamWorkerLaneRecord,
    | "branchName"
    | "baseBranch"
    | "proposalChangeName"
    | "proposalDisposition"
    | "pullRequest"
    | "recoveryCheckpoint"
    | "status"
  >,
): string | null => {
  const checkpoint = lane.recoveryCheckpoint;
  if (lane.status !== "failed" || checkpoint?.kind !== "pull_request_approval") {
    return "it is not waiting to resume final approval.";
  }

  if (!lane.branchName || !lane.baseBranch || !lane.proposalChangeName) {
    return "it no longer has the final-approval metadata required to resume.";
  }

  if (!lane.pullRequest?.humanApprovedAt) {
    return "its final approval was never confirmed by a human.";
  }

  if (
    checkpoint.proposalDisposition &&
    lane.proposalDisposition &&
    checkpoint.proposalDisposition !== lane.proposalDisposition
  ) {
    return "its saved finalization checkpoint no longer matches the current OpenSpec disposition.";
  }

  return null;
};

export const getLaneRecoveryCheckpointSkipReason = (
  lane: Pick<
    TeamWorkerLaneRecord,
    | "baseBranch"
    | "branchName"
    | "latestCoderHandoff"
    | "latestImplementationCommit"
    | "latestReviewerHandoff"
    | "proposalChangeName"
    | "proposalDisposition"
    | "proposalPath"
    | "pullRequest"
    | "pushedCommit"
    | "recoveryCheckpoint"
    | "status"
  >,
): string | null => {
  const checkpoint = lane.recoveryCheckpoint;
  if (!checkpoint) {
    return "it does not have a saved recovery checkpoint.";
  }

  switch (checkpoint.kind) {
    case "proposal_approval":
      return hasProposalApprovalRecovery(lane);
    case "lane_execution":
      return hasLaneExecutionRecovery(lane);
    case "review_approval_delivery":
      return hasReviewApprovalRecovery(lane);
    case "pull_request_approval":
      return hasPullRequestApprovalRecovery(lane);
  }
};

export const describeLaneRecoveryResume = (
  checkpoint: TeamLaneRecoveryCheckpoint | null | undefined,
): string => {
  if (!checkpoint) {
    return "Resume the saved lane checkpoint.";
  }

  return checkpoint.summary;
};
