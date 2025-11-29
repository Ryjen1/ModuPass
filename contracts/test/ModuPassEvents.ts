import { expect } from "chai";
import { ethers } from "hardhat";

describe("ModuPassEvents", () => {
  it("allows an organizer to create, update, and list events", async () => {
    const [organizer, other] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("ModuPassEvents", organizer);
    const contract = await Factory.deploy();
    await contract.waitForDeployment();

    const id = "modupass-demo-001";

    // Create event
    await contract.createOrUpdateEvent(
      id,
      "ModuPass Demo",
      "Showcase for KRNL-based event passes",
      1_700_000_000,
      1_700_086_400,
    );

    // Fetch the event
    const stored = await contract.getEventById(id);
    expect(stored.id).to.equal(id);
    expect(stored.organizer).to.equal(organizer.address);
    expect(stored.name).to.equal("ModuPass Demo");

    // Non-owner cannot update
    await expect(
      contract
        .connect(other)
        .createOrUpdateEvent(
          id,
          "Hacked name",
          "Hacked description",
          1_700_000_000,
          1_700_086_400,
        ),
    ).to.be.revertedWithCustomError(contract, "EventNotOwned");

    // Owner can update
    await contract.createOrUpdateEvent(
      id,
      "ModuPass Demo (v2)",
      "Updated description",
      1_700_000_000,
      1_700_086_400,
    );

    const updated = await contract.getEventById(id);
    expect(updated.name).to.equal("ModuPass Demo (v2)");

    // Listing
    const count = await contract.getEventCount();
    expect(count).to.equal(1n);

    const list = await contract.listEvents();
    expect(list.length).to.equal(1);
    expect(list[0].id).to.equal(id);
  });
});
