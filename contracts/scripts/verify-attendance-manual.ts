import { ethers } from "hardhat";

async function main() {
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x59011B8C1bF44988FD827bD83d9015CC43a9Bc40";
    console.log("Testing ModuPassTargetBase at:", contractAddress);

    const [deployer, attendee] = await ethers.getSigners();
    console.log("Acting as Master Key (Deployer):", deployer.address);
    console.log("Acting as Attendee:", attendee ? attendee.address : deployer.address);

    const MasterKeySigner = deployer;
    // If we don't have a second account in testnet, use deployer as attendee too
    const AttendeeSigner = attendee || deployer;

    // Connect to contract
    const ModuPassTargetBase = await ethers.getContractFactory("ModuPassTargetBase");
    const contract = ModuPassTargetBase.attach(contractAddress);

    // --- Helper to Generate AuthData ---
    async function generateAuthData(signer: any, userAddress: string, functionName: string, resultEncoded: string) {
        // 1. Get Nonce
        const nonce = await contract.getNonce(userAddress);

        // 2. Constants
        const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour
        const id = ethers.hexlify(ethers.randomBytes(32)); // Random execution ID
        const executions: string[] = []; // Empty for now
        const sponsorExecutionFee = false;

        // 3. Get Function Selector (msg.sig)
        const fragment = contract.interface.getFunction(functionName);
        if (!fragment) throw new Error("Function not found");
        const selector = fragment.selector;

        // 4. Construct Hash (Matches TargetBase.sol logic)
        // keccak256(abi.encodePacked(msg.sender, nonce, expiry, result, msg.sig))

        // Note: ethers.solidityPacked is equivalent to abi.encodePacked
        const packTypes = ["address", "uint256", "uint256", "bytes", "bytes4"];
        const packValues = [userAddress, nonce, expiry, resultEncoded, selector];

        const authHash = ethers.keccak256(ethers.solidityPacked(packTypes, packValues));

        // 5. Sign Hash
        // ECDSA.toEthSignedMessageHash is handled by wallet.signMessage
        const signature = await signer.signMessage(ethers.getBytes(authHash));

        return {
            nonce,
            expiry,
            id,
            executions,
            result: resultEncoded,
            sponsorExecutionFee,
            signature
        };
    }

    // --- Step 1: Create Event ---
    console.log("\n--- Step 1: Creating Event ---");
    const eventId = "manual-test-event-" + Math.floor(Date.now() / 1000);
    const eventName = "Manual KRNL Test Event";
    const codesMerkleRoot = ethers.hexlify(ethers.randomBytes(32)); // Mock root
    const maxAttendees = 100;

    // Encode result for createEvent: (string, string, bytes32, uint256)
    const createEventResult = ethers.AbiCoder.defaultAbiCoder().encode(
        ["string", "string", "bytes32", "uint256"],
        [eventId, eventName, codesMerkleRoot, maxAttendees]
    );

    // Generate AuthData (Caller is Deployer)
    const authDataCreate = await generateAuthData(MasterKeySigner, deployer.address, "createEvent", createEventResult);

    console.log("Submitting createEvent tx...");
    const txCreate = await contract.connect(deployer).createEvent(authDataCreate);
    console.log("Tx Hash:", txCreate.hash);
    await txCreate.wait();
    console.log("✅ Event Created!");

    // --- Step 2: Verify Attendance ---
    console.log("\n--- Step 2: Verifying Attendance ---");

    // Encode result for verifyAttendance: (string, address, string, uint256, bool)
    // AttendanceData struct: eventId, attendee, code, timestamp, isValid
    const mockCode = "TEST-CODE-123";
    const timestamp = Math.floor(Date.now() / 1000);
    const isValid = true; // Simulating KRNL saying "Yes, this logic passed"

    const verifyResult = ethers.AbiCoder.defaultAbiCoder().encode(
        ["tuple(string,address,string,uint256,bool)"],
        [[eventId, AttendeeSigner.address, mockCode, timestamp, isValid]]
    );

    // Generate AuthData (Caller is Attendee/Deployer)
    // IMPORTANT: TargetBase checks nonce of msg.sender. 
    // If we act as AttendeeSigner, we must use AttendeeSigner.address in hash
    const authDataVerify = await generateAuthData(MasterKeySigner, AttendeeSigner.address, "verifyAttendance", verifyResult);

    console.log("Submitting verifyAttendance tx...");
    const txVerify = await contract.connect(AttendeeSigner).verifyAttendance(authDataVerify);
    console.log("Tx Hash:", txVerify.hash);
    await txVerify.wait();
    console.log("✅ Attendance Verified!");

    // Check state
    const hasAttended = await contract.hasAttended(eventId, AttendeeSigner.address);
    console.log(`\nFinal Check: Has ${AttendeeSigner.address} attended ${eventId}? ${hasAttended}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
