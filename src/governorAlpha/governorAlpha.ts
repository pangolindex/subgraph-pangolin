/* eslint-disable prefer-const */
import { Bytes } from "@graphprotocol/graph-ts";
import { Proposal } from "../../generated/schema";
import {
  ProposalCreated,
  ProposalCanceled,
  ProposalExecuted,
  VoteCast,
  ProposalQueued,
} from "../../generated/GovernorAlpha/GovernorAlpha";
import { BI_0 } from "../constants";

export function handleNewProposal(event: ProposalCreated): void {
  let proposal = new Proposal(event.params.id.toString());
  proposal.description = event.params.description;
  proposal.proposer = event.params.proposer;

  // @ts-ignore
  proposal.targets = changetype<Array<Bytes>>(event.params.targets);

  proposal.startTime = event.params.startTime;
  proposal.endTime = event.params.endTime;
  proposal.signatures = event.params.signatures;
  proposal.calldatas = event.params.calldatas;
  proposal.forVotes = BI_0;
  proposal.againstVotes = BI_0;

  proposal.save();
}

export function handleUpdatedProposalCanceled(event: ProposalCanceled): void {
  let proposal = Proposal.load(event.params.id.toString());
  if (proposal !== null) {
    proposal.canceled = true;
    proposal.save();
  }
}

export function handleUpdatedProposalExecuted(event: ProposalExecuted): void {
  let proposal = Proposal.load(event.params.id.toString());
  if (proposal !== null) {
    proposal.executed = true;
    proposal.save();
  }
}

export function handleVoteCast(event: VoteCast): void {
  let proposal = Proposal.load(event.params.proposalId.toString());
  if (proposal !== null) {
    if (event.params.support) {
      proposal.forVotes = proposal.forVotes.plus(event.params.votes);
    } else {
      proposal.againstVotes = proposal.againstVotes.plus(event.params.votes);
    }
    proposal.save();
  }
}

export function handleProposalQueued(event: ProposalQueued): void {
  let proposal = Proposal.load(event.params.id.toString());
  if (proposal !== null) {
    if (event.params.eta) {
      proposal.eta = event.params.eta;
    }
    proposal.save();
  }
}
