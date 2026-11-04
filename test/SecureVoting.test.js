const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SecureVoting", function () {
  async function deployFixture() {
    const [owner, voter1, voter2, outsider] = await ethers.getSigners();
    const Voting = await ethers.getContractFactory("SecureVoting");
    const voting = await Voting.deploy();
    await voting.waitForDeployment();

    const now = (await ethers.provider.getBlock("latest")).timestamp;
    const start = now + 100;
    const end = now + 1000;
    await voting.createElection("Class Representative", start, end);
    await voting.addCandidate(1, "Candidate A", "");
    await voting.addCandidate(1, "Candidate B", "");
    await voting.registerVoter(1, voter1.address);
    await voting.registerVoter(1, voter2.address);
    return { voting, owner, voter1, voter2, outsider, start, end };
  }

  async function moveTo(timestamp) {
    await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp]);
    await ethers.provider.send("evm_mine", []);
  }

  it("sets the deployer as owner", async function () {
    const { voting, owner } = await deployFixture();
    expect(await voting.owner()).to.equal(owner.address);
  });

  it("blocks non-owners from registering voters", async function () {
    const { voting, outsider, voter2 } = await deployFixture();
    await expect(voting.connect(outsider).registerVoter(1, voter2.address))
      .to.be.revertedWithCustomError(voting, "NotOwner");
  });

  it("blocks voting before the election starts", async function () {
    const { voting, voter1 } = await deployFixture();
    await expect(voting.connect(voter1).vote(1, 1))
      .to.be.revertedWithCustomError(voting, "ElectionNotStarted");
  });

  it("records one valid vote", async function () {
    const { voting, voter1, start } = await deployFixture();
    await moveTo(start);
    await voting.connect(voter1).vote(1, 1);
    const candidates = await voting.getCandidates(1);
    expect(candidates[0].voteCount).to.equal(1);
    expect(await voting.hasVoted(1, voter1.address)).to.equal(true);
  });

  it("prevents a voter from voting twice", async function () {
    const { voting, voter1, start } = await deployFixture();
    await moveTo(start);
    await voting.connect(voter1).vote(1, 1);
    await expect(voting.connect(voter1).vote(1, 2))
      .to.be.revertedWithCustomError(voting, "AlreadyVoted");
  });

  it("rejects unregistered voters", async function () {
    const { voting, outsider, start } = await deployFixture();
    await moveTo(start);
    await expect(voting.connect(outsider).vote(1, 1))
      .to.be.revertedWithCustomError(voting, "NotRegisteredVoter");
  });

  it("rejects invalid candidate IDs", async function () {
    const { voting, voter1, start } = await deployFixture();
    await moveTo(start);
    await expect(voting.connect(voter1).vote(1, 999))
      .to.be.revertedWithCustomError(voting, "InvalidCandidate");
  });

  it("rejects votes after the deadline", async function () {
    const { voting, voter1, end } = await deployFixture();
    await moveTo(end);
    await expect(voting.connect(voter1).vote(1, 1))
      .to.be.revertedWithCustomError(voting, "ElectionClosed");
  });
});
