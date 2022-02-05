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
import { expect } from "chai";

import { sha3, toBN, web3Instance } from '../../utils/contract-util';

import {
  deployDefaultDao,
  takeChainSnapshot,
  revertChainSnapshot,
  proposalIdGenerator,
  advanceTime
} from '../../utils/hardhat-test-util';

const proposalCounter = proposalIdGenerator().generator;

function getProposalCounter() {
  return proposalCounter().next().value;
}

describe("Adapter - Configuration", () => {
  let accounts: any;
  let owner: any;
  let daoInstance: any;
  let extensionsInstance: any;
  let adaptersInstance: any;
  let snapshotId: any;

  before("deploy dao", async () => {
    accounts = await web3Instance.eth.getAccounts();
    owner = accounts[0];

    const { dao, adapters, extensions } = await deployDefaultDao({ owner });

    daoInstance = dao;
    extensionsInstance = extensions;
    adaptersInstance = adapters
  });

  beforeEach(async () => {
    snapshotId = await takeChainSnapshot();
  });

  afterEach(async () => {
    await revertChainSnapshot(snapshotId);
  });

  it("should be possible to set a single configuration parameter", async () => {
    const dao = daoInstance;
    const configuration = adaptersInstance.configuration;
    const voting = adaptersInstance.voting;

    let key = sha3("key");

    const proposalId = getProposalCounter();
    //Submit a new configuration proposal
    await configuration.submitProposal(
      dao.address,
      proposalId,
      [key],
      [toBN("11")],
      [],
      { from: owner }
    );

    let value = await dao.getConfiguration(key);
    expect(value.toString()).equal("0");

    value = await dao.getConfiguration(key);
    expect(value.toString()).equal("0");

    await voting.submitVote(dao.address, proposalId, 1, {
      from: owner
    });

    await advanceTime(10000);
    await configuration.processProposal(dao.address, proposalId, {
      from: owner
    });

    value = await dao.getConfiguration(key);
    expect(value.toString()).equal("11");
  });

  it("should be possible to set multiple configuration parameters", async () => {
    const dao = daoInstance;
    const configuration = adaptersInstance.configuration;
    const voting = adaptersInstance.voting;

    let key1 = sha3("allowUnitTransfersBetweenMembers");
    let key2 = sha3("allowExternalUnitTransfers");

    //Submit a new configuration proposal
    const proposalId = getProposalCounter();
    await configuration.submitProposal(
      dao.address,
      proposalId,
      [key1, key2],
      [1, 2],
      [],
      { from: owner }
    );

    let value1 = await dao.getConfiguration(key1);
    let value2 = await dao.getConfiguration(key2);
    expect(value1.toString()).equal("0");
    expect(value2.toString()).equal("0");

    await voting.submitVote(dao.address, proposalId, 1, {
      from: owner
    });

    await advanceTime(10000);
    await configuration.processProposal(dao.address, proposalId, {
      from: owner
    });

    value1 = await dao.getConfiguration(key1);
    value2 = await dao.getConfiguration(key2);
    expect(value1.toString()).equal("1");
    expect(value2.toString()).equal("2");
  });

  it("should not be possible to provide a different number of keys and values", async () => {
    const dao = daoInstance;
    const configuration = adaptersInstance.configuration;
    let key = sha3("key");
    await expect(
      configuration.submitProposal(dao.address, "0x1", [key], [], [], {
        from: owner
      })
    ).to.be.revertedWith("must be an equal number of config keys and values");
  });
});
