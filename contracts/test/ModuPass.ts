import { expect } from "chai";
import { ethers } from "hardhat";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

describe("ModuPass", () => {
  it("issues a pass from the KRNL executor and prevents duplicates", async () => {
    const [deployer, krnlExecutor, attendee] = await ethers.getSigners();

    const ModuPass = await ethers.getContractFactory("ModuPass", deployer);
    const contract = await ModuPass.deploy(krnlExecutor.address);
    await contract.waitForDeployment();

    const eventId = "devcon-2025-day1";
    const workflowId = ethers.encodeBytes32String("modupass-kernel-v0");
    const receiptHash = ethers.hexlify(ethers.randomBytes(32));

    // Call from authorized KRNL executor
    await expect(
      contract
        .connect(krnlExecutor)
        .issuePass(eventId, attendee.address, workflowId, receiptHash)
    )
      .to.emit(contract, "PassIssued")
      .withArgs(
        ethers.keccak256(ethers.toUtf8Bytes(eventId)),
        attendee.address,
        workflowId,
        receiptHash,
        // We don't assert the exact timestamp here, but we include a
        // matcher position so Chai ignores it when comparing.
        anyValue
      );

    expect(
      await contract.hasPass(eventId, attendee.address)
    ).to.equal(true);

    const pass = await contract.getPass(eventId, attendee.address);
    expect(pass.attendee).to.equal(attendee.address);

    // Second issuance for same event + attendee should revert
    await expect(
      contract
        .connect(krnlExecutor)
        .issuePass(eventId, attendee.address, workflowId, receiptHash)
    ).to.be.revertedWithCustomError(contract, "PassAlreadyIssued");

    // Non-executor cannot issue
    await expect(
      contract
        .connect(deployer)
        .issuePass(eventId, attendee.address, workflowId, receiptHash)
    ).to.be.revertedWithCustomError(contract, "NotKrnlExecutor");
  });
});
