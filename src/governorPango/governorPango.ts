import { Bytes } from "@graphprotocol/graph-ts";
import { BI_0 } from "../constants";
import { Proposal } from "../../generated/schema";
import {
  ProposalCreated,
  ProposalCanceled,
  VoteCast,
  ProposalQueued,
  ProposalExecuted
} from "../../generated/GovernorPango/GovernorPango";


export function handleProposalCreated(event: ProposalCreated): void {
  const proposal = new Proposal(event.params.proposalId.toString());

  proposal.forVotes = BI_0;
  proposal.againstVotes = BI_0;
  proposal.startTime = event.params.startTime;
  proposal.endTime = event.params.endTime;

  proposal.executed = false;
  proposal.canceled = false;

  // @ts-ignore
  proposal.targets = changetype<Array<Bytes>>(event.params.targets);
  proposal.values = event.params.values;
  proposal.signatures = event.params.signatures;
  proposal.calldatas = event.params.calldatas;

  proposal.description = event.params.description;

  proposal.save();
}

export function handleProposalCanceled(event: ProposalCanceled): void {
  const proposal = Proposal.load(event.params.proposalId.toString())!;
  proposal.canceled = true;
  proposal.save();
}

export function handleVoteCast(event: VoteCast): void {
  const proposal = Proposal.load(event.params.proposalId.toString())!;
  if (event.params.support) {
    proposal.forVotes = proposal.forVotes.plus(event.params.votes);
  } else {
    proposal.againstVotes = proposal.againstVotes.plus(event.params.votes);
  }
  proposal.save();
}

export function handleProposalQueued(event: ProposalQueued): void {
  const proposal = Proposal.load(event.params.proposalId.toString())!;
  proposal.eta = event.params.eta;
  proposal.save();
}

export function handleProposalExecuted(event: ProposalExecuted): void {
  const proposal = Proposal.load(event.params.proposalId.toString())!;
  proposal.executed = true;
  proposal.save();
}
