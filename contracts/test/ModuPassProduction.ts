import { expect } from "chai";
import { ethers } from "hardhat";
import { ModuPassKRNLProduction, PassToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ModuPassKRNLProduction", function () {
  let moduPass: ModuPassKRNLProduction;
  let passToken: PassToken;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  const baseTokenURI = "https://api.modupass.xyz/metadata";
  const eventId = "test-event-001";
  
  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy ModuPassKRNLProduction
    const ModuPassFactory = await ethers.getContractFactory("ModuPassKRNLProduction");
    moduPass = await ModuPassFactory.deploy(false, baseTokenURI);
    await moduPass.waitForDeployment();
    
    // Get PassToken address
    const passTokenAddress = await moduPass.passToken();
    passToken = await ethers.getContractAt("PassToken", passTokenAddress);
  });

  describe("Deployment", function () {
    it("Should deploy with correct base URI", async function () {
      expect(await moduPass.baseTokenURI()).to.equal(baseTokenURI);
    });

    it("Should deploy PassToken contract", async function () {
      expect(await passToken.getAddress()).to.not.equal(ethers.ZeroAddress);
    });

    it("Should set ModuPass as owner of PassToken", async function () {
      expect(await passToken.owner()).to.equal(await moduPass.getAddress());
    });
  });

  describe("Pass Issuance", function () {
    it("Should issue a pass with valid KRNL auth data", async function () {
      const authData = {
        user: user1.address,
        nonce: 1,
        timestamp: Math.floor(Date.now() / 1000),
        workflowId: ethers.id("test-workflow"),
        receiptHash: ethers.id("test-receipt"),
        signature: "0x",
      };

      const tx = await moduPass.issuePass(authData, eventId, user1.address);
      const receipt = await tx.wait();

      // Check event was emitted
      const event = receipt?.logs.find(
        (log) => {
          try {
            return moduPass.interface.parseLog(log as any)?.name === "PassIssued";
          } catch {
            return false;
          }
        }
      );
      expect(event).to.not.be.undefined;

      // Check pass was created
      expect(await moduPass.hasPass(eventId, user1.address)).to.be.true;

      // Check NFT was minted
      expect(await passToken.balanceOf(user1.address)).to.equal(1);
    });

    it("Should prevent duplicate pass issuance", async function () {
      const authData1 = {
        user: user1.address,
        nonce: 1,
        timestamp: Math.floor(Date.now() / 1000),
        workflowId: ethers.id("test-workflow"),
        receiptHash: ethers.id("test-receipt-1"),
        signature: "0x",
      };

      await moduPass.issuePass(authData1, eventId, user1.address);

      const authData2 = {
        user: user1.address,
        nonce: 2,
        timestamp: Math.floor(Date.now() / 1000),
        workflowId: ethers.id("test-workflow"),
        receiptHash: ethers.id("test-receipt-2"),
        signature: "0x",
      };

      await expect(
        moduPass.issuePass(authData2, eventId, user1.address)
      ).to.be.revertedWithCustomError(moduPass, "PassAlreadyIssued");
    });

    it("Should prevent nonce reuse", async function () {
      const authData = {
        user: user1.address,
        nonce: 1,
        timestamp: Math.floor(Date.now() / 1000),
        workflowId: ethers.id("test-workflow"),
        receiptHash: ethers.id("test-receipt"),
        signature: "0x",
      };

      await moduPass.issuePass(authData, eventId, user1.address);

      // Try to reuse same nonce for different event
      await expect(
        moduPass.issuePass(authData, "different-event", user2.address)
      ).to.be.revertedWithCustomError(moduPass, "NonceAlreadyUsed");
    });

    it("Should reject expired timestamps", async function () {
      const authData = {
        user: user1.address,
        nonce: 1,
        timestamp: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
        workflowId: ethers.id("test-workflow"),
        receiptHash: ethers.id("test-receipt"),
        signature: "0x",
      };

      await expect(
        moduPass.issuePass(authData, eventId, user1.address)
      ).to.be.revertedWithCustomError(moduPass, "TimestampExpired");
    });

    it("Should reject future timestamps", async function () {
      const authData = {
        user: user1.address,
        nonce: 1,
        timestamp: Math.floor(Date.now() / 1000) + 7200, // 2 hours in future
        workflowId: ethers.id("test-workflow"),
        receiptHash: ethers.id("test-receipt"),
        signature: "0x",
      };

      await expect(
        moduPass.issuePass(authData, eventId, user1.address)
      ).to.be.revertedWithCustomError(moduPass, "TimestampTooFarInFuture");
    });

    it("Should reject invalid workflow ID", async function () {
      const authData = {
        user: user1.address,
        nonce: 1,
        timestamp: Math.floor(Date.now() / 1000),
        workflowId: ethers.ZeroHash,
        receiptHash: ethers.id("test-receipt"),
        signature: "0x",
      };

      await expect(
        moduPass.issuePass(authData, eventId, user1.address)
      ).to.be.revertedWithCustomError(moduPass, "InvalidWorkflowId");
    });

    it("Should reject invalid receipt hash", async function () {
      const authData = {
        user: user1.address,
        nonce: 1,
        timestamp: Math.floor(Date.now() / 1000),
        workflowId: ethers.id("test-workflow"),
        receiptHash: ethers.ZeroHash,
        signature: "0x",
      };

      await expect(
        moduPass.issuePass(authData, eventId, user1.address)
      ).to.be.revertedWithCustomError(moduPass, "InvalidReceiptHash");
    });

    it("Should increment pass count per event", async function () {
      expect(await moduPass.passesCountByEvent(ethers.id(eventId))).to.equal(0);

      const authData1 = {
        user: user1.address,
        nonce: 1,
        timestamp: Math.floor(Date.now() / 1000),
        workflowId: ethers.id("test-workflow"),
        receiptHash: ethers.id("test-receipt-1"),
        signature: "0x",
      };

      await moduPass.issuePass(authData1, eventId, user1.address);
      expect(await moduPass.passesCountByEvent(ethers.id(eventId))).to.equal(1);

      const authData2 = {
        user: user2.address,
        nonce: 1,
        timestamp: Math.floor(Date.now() / 1000),
        workflowId: ethers.id("test-workflow"),
        receiptHash: ethers.id("test-receipt-2"),
        signature: "0x",
      };

      await moduPass.issuePass(authData2, eventId, user2.address);
      expect(await moduPass.passesCountByEvent(ethers.id(eventId))).to.equal(2);
    });
  });

  describe("Pass Queries", function () {
    beforeEach(async function () {
      const authData = {
        user: user1.address,
        nonce: 1,
        timestamp: Math.floor(Date.now() / 1000),
        workflowId: ethers.id("test-workflow"),
        receiptHash: ethers.id("test-receipt"),
        signature: "0x",
      };

      await moduPass.issuePass(authData, eventId, user1.address);
    });

    it("Should return true for existing pass", async function () {
      expect(await moduPass.hasPass(eventId, user1.address)).to.be.true;
    });

    it("Should return false for non-existing pass", async function () {
      expect(await moduPass.hasPass(eventId, user2.address)).to.be.false;
      expect(await moduPass.hasPass("other-event", user1.address)).to.be.false;
    });

    it("Should return correct pass details", async function () {
      const pass = await moduPass.getPass(eventId, user1.address);
      
      expect(pass.eventIdHash).to.equal(ethers.id(eventId));
      expect(pass.attendee).to.equal(user1.address);
      expect(pass.workflowId).to.equal(ethers.id("test-workflow"));
      expect(pass.receiptHash).to.equal(ethers.id("test-receipt"));
      expect(pass.tokenId).to.equal(0); // First token
    });
  });

  describe("PassToken Integration", function () {
    it("Should mint NFT with correct metadata", async function () {
      const authData = {
        user: user1.address,
        nonce: 1,
        timestamp: Math.floor(Date.now() / 1000),
        workflowId: ethers.id("test-workflow"),
        receiptHash: ethers.id("test-receipt"),
        signature: "0x",
      };

      await moduPass.issuePass(authData, eventId, user1.address);

      const tokenId = 0;
      expect(await passToken.ownerOf(tokenId)).to.equal(user1.address);
      expect(await passToken.tokenEventId(tokenId)).to.equal(eventId);
    });

    it("Should allow transfers when not soulbound", async function () {
      const authData = {
        user: user1.address,
        nonce: 1,
        timestamp: Math.floor(Date.now() / 1000),
        workflowId: ethers.id("test-workflow"),
        receiptHash: ethers.id("test-receipt"),
        signature: "0x",
      };

      await moduPass.issuePass(authData, eventId, user1.address);

      const tokenId = 0;
      await passToken.connect(user1).transferFrom(user1.address, user2.address, tokenId);
      
      expect(await passToken.ownerOf(tokenId)).to.equal(user2.address);
    });
  });

  describe("Soulbound Mode", function () {
    beforeEach(async function () {
      // Deploy with soulbound = true
      const ModuPassFactory = await ethers.getContractFactory("ModuPassKRNLProduction");
      moduPass = await ModuPassFactory.deploy(true, baseTokenURI);
      await moduPass.waitForDeployment();
      
      const passTokenAddress = await moduPass.passToken();
      passToken = await ethers.getContractAt("PassToken", passTokenAddress);
    });

    it("Should prevent transfers when soulbound", async function () {
      const authData = {
        user: user1.address,
        nonce: 1,
        timestamp: Math.floor(Date.now() / 1000),
        workflowId: ethers.id("test-workflow"),
        receiptHash: ethers.id("test-receipt"),
        signature: "0x",
      };

      await moduPass.issuePass(authData, eventId, user1.address);

      const tokenId = 0;
      await expect(
        passToken.connect(user1).transferFrom(user1.address, user2.address, tokenId)
      ).to.be.revertedWithCustomError(passToken, "SoulboundToken");
    });
  });
});