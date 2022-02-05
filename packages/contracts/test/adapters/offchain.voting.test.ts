/**
MIT License

Copyright (c) 2020 Openlaw

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */
import { expect } from 'chai';
import {
  unitPrice,
  remaining,
  UNITS,
  web3Instance,
  toBN,
  sha3,
} from '../../utils/contract-util';

import {
  proposalIdGenerator,
  advanceTime,
  deployDaoWithOffchainVoting,
  takeChainSnapshot,
  revertChainSnapshot,
  hardhatContracts
} from '../../utils/hardhat-test-util';

import {
  createVote,
  getDomainDefinition,
  typedDataUtils,
  prepareProposalPayload,
  prepareVoteProposalData,
  prepareProposalMessage,
  prepareVoteResult,
  SigUtilSigner,
  getVoteStepDomainDefinition,
} from '../../utils/offchain-voting-utils';

const { OffchainVotingHashContract } = hardhatContracts;

const generateMembers = (amount: number) => {
  let newAccounts = [];
  for (let i = 0; i < amount; i++) {
    const account = web3Instance.eth.accounts.create();
    newAccounts.push(account);
  }
  return newAccounts;
};

const members = generateMembers(10);
const findMember = (addr: []) => members.find((member) => member.address === addr);
const newMember = members[0];
const proposalCounter = proposalIdGenerator().generator;

function getProposalCounter() {
  return proposalCounter().next().value;
}

// @ts-ignore
const onboardMember = async (dao, voting, onboarding, bank, index) => {
  const blockNumber = await web3Instance.eth.getBlockNumber();
  const proposalId = getProposalCounter();

  const proposalPayload = {
    name: "some proposal",
    body: "this is my proposal",
    choices: ["yes", "no"],
    start: Math.floor(new Date().getTime() / 1000),
    end: Math.floor(new Date().getTime() / 1000) + 10000,
    snapshot: blockNumber.toString(),
  };

  const space = "tribute";
  const chainId = 1;

  const proposalData = {
    type: "proposal",
    timestamp: Math.floor(new Date().getTime() / 1000),
    space,
    payload: proposalPayload,
    submitter: members[0].address,
  };

  //signer for myAccount (its private key)
  const signer = SigUtilSigner(members[0].privateKey);
  // @ts-ignore
  proposalData.sig = await signer(
    proposalData,
    dao.address,
    onboarding.address,
    chainId
  );

  await onboarding.submitProposal(
    dao.address,
    proposalId,
    members[index].address,
    UNITS,
    unitPrice.mul(toBN(3)).add(remaining),
    prepareVoteProposalData(proposalData, web3Instance)
  );

  const voteEntries = [];
  const membersCount = await dao.getNbMembers();

  for (let i = 0; i < parseInt(membersCount.toString()) - 1; i++) {
    const memberAddress = await dao.getMemberAddress(i);
    const member = findMember(memberAddress);
    let voteEntry;
    if (member) {
      const voteSigner = SigUtilSigner(member.privateKey);
      const weight = await bank.balanceOf(member.address, UNITS);
      voteEntry = await createVote(proposalId, weight, true);

      voteEntry.sig = voteSigner(
        voteEntry,
        dao.address,
        onboarding.address,
        chainId
      );
    } else {
      voteEntry = await createVote(proposalId, 0, true);

      voteEntry.sig = "0x";
    }

    voteEntries.push(voteEntry);
  }

  await advanceTime(10000);

  const { voteResultTree, result } = await prepareVoteResult(
    voteEntries,
    dao,
    onboarding.address,
    chainId
  );

  const rootSig = signer(
    { root: voteResultTree.getHexRoot(), type: "result" },
    dao.address,
    onboarding.address,
    chainId
  );

  const lastResult = result[result.length - 1];

  let tx = await voting.submitVoteResult(
    dao.address,
    proposalId,
    voteResultTree.getHexRoot(),
    members[0].address,
    lastResult,
    rootSig
  );

  console.log(
    `gas used for ( ${proposalId} ) votes: ` +
    new Intl.NumberFormat().format(tx.receipt.gasUsed)
  );

  await advanceTime(10000);

  await onboarding.processProposal(dao.address, proposalId, {
    value: unitPrice.mul(toBN("3")).add(remaining),
  });
};

describe("Adapter - Offchain Voting", () => {
  let daoInstance: any;
  let extensionsInstance: any;
  let adaptersInstance: any;
  let snapshotId: any;
  let votingHelpersInstance: any;
  let accounts: any;
  let owner: any;

  before("deploy dao", async () => {
    accounts = await web3Instance.eth.getAccounts();
    owner = accounts[1];

    const {
      dao,
      adapters,
      extensions,
      votingHelpers,
    } = await deployDaoWithOffchainVoting({
      owner: owner,
      newMember: newMember.address,
    });
    daoInstance = dao;
    extensionsInstance = extensions;
    adaptersInstance = adapters
    snapshotId = await takeChainSnapshot();
    votingHelpersInstance = votingHelpers;
  });

  beforeEach(async () => {
    await revertChainSnapshot(snapshotId);
    snapshotId = await takeChainSnapshot();
  });

  it("should type & hash be consistent for proposals between javascript and solidity", async () => {
    const dao = daoInstance;

    let blockNumber = await web3Instance.eth.getBlockNumber();
    const proposalPayload = {
      type: "proposal",
      name: "some proposal",
      body: "this is my proposal",
      choices: ["yes", "no"],
      start: Math.floor(new Date().getTime() / 1000),
      end: Math.floor(new Date().getTime() / 1000) + 10000,
      snapshot: blockNumber.toString(),
    };

    const proposalData = {
      type: "proposal",
      timestamp: Math.floor(new Date().getTime() / 1000),
      space: "tribute",
      payload: proposalPayload,
      submitter: members[0].address,
      sig: "0x00",
    };

    const chainId = 1;
    let { types, domain } = getDomainDefinition(
      proposalData,
      dao.address,
      owner,
      chainId
    );

    const snapshotContract = votingHelpersInstance.snapshotProposalContract;
    //Checking proposal type
    const solProposalMsg = await snapshotContract.PROPOSAL_MESSAGE_TYPE();
    const jsProposalMsg = typedDataUtils.encodeType("Message", types);
    expect(jsProposalMsg).equal(solProposalMsg);

    //Checking payload
    const hashStructPayload =
      "0x" +
      typedDataUtils.hashStruct(
        "MessagePayload",
        prepareProposalPayload(proposalPayload),
        types,
        true
      ).toString("hex");
    const solidityHashPayload = await snapshotContract.hashProposalPayload(
      proposalPayload
    );
    expect(solidityHashPayload).equal(hashStructPayload);

    //Checking entire payload
    const hashStruct =
      "0x" +
      typedDataUtils.hashStruct(
        "Message",
        prepareProposalMessage(proposalData),
        types
      ).toString("hex");
    const solidityHash = await snapshotContract.hashProposalMessage(
      proposalData
    );
    expect(solidityHash).equal(hashStruct);

    //Checking domain
    const domainDef = await snapshotContract.EIP712_DOMAIN();
    const jsDomainDef = typedDataUtils.encodeType("EIP712Domain", types);
    expect(domainDef).equal(jsDomainDef);

    //Checking domain separator
    const domainHash = await snapshotContract.DOMAIN_SEPARATOR(
      dao.address,
      owner
    );
    const jsDomainHash =
      "0x" +
      typedDataUtils.hashStruct("EIP712Domain", domain, types, true).toString(
        "hex"
      );
    expect(domainHash).equal(jsDomainHash);
  });

  it("should type & hash be consistent for votes between javascript and solidity", async () => {
    const chainId = 1;
    const dao = daoInstance;
    const offchainVoting = votingHelpersInstance.offchainVoting;
    const snapshotContract = votingHelpersInstance.snapshotProposalContract;

    const proposalHash = sha3("test");
    const voteEntry = await createVote(proposalHash, 1, true);

    const { types } = getDomainDefinition(
      voteEntry,
      dao.address,
      owner,
      chainId
    );

    //Checking proposal type
    const solProposalMsg = await snapshotContract.VOTE_MESSAGE_TYPE();
    const jsProposalMsg = typedDataUtils.encodeType("Message", types);
    expect(jsProposalMsg).equal(solProposalMsg);

    //Checking entire payload
    const hashStruct =
      "0x" +
      typedDataUtils.hashStruct("Message", voteEntry, types).toString("hex");
    const solidityHash = await snapshotContract.hashVoteInternal(voteEntry);
    expect(hashStruct).equal(solidityHash);

    const nodeDef = getVoteStepDomainDefinition(
      dao.address,
      dao.address,
      chainId
    );

    const ovHashAddr = await offchainVoting.ovHash();
    const ovHash = await OffchainVotingHashContract.at(ovHashAddr);

    const solNodeDef = await ovHash.VOTE_RESULT_NODE_TYPE();
    const jsNodeMsg = typedDataUtils.encodeType("Message", nodeDef.types);

    expect(solNodeDef).equal(jsNodeMsg);
  });

  it("should be possible to propose a new voting by signing the proposal hash", async () => {
    const dao = daoInstance;
    const onboarding = adaptersInstance.onboarding;
    const bank = extensionsInstance.bankExt;

    for (var i = 1; i < members.length; i++) {
      await onboardMember(
        dao,
        votingHelpersInstance.offchainVoting,
        onboarding,
        bank,
        i
      );
    }
  });
});
