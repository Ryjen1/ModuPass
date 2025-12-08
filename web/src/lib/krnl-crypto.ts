import { createWalletClient, http, toBytes, keccak256, encodePacked } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';

// AuthData Structure for Viem
// We need to match the "solidityPacked" hashing logic of TargetBase.
/*
    keccak256(abi.encodePacked(
        msg.sender,
        nonce,
        expiry,
        result,
        msg.sig // function selector
    ))
*/

export async function signAuthData(
    userAddress: string,
    functionSelector: string,
    resultEncoded: string,
    nonce: bigint
) {
    const privateKey = process.env.KRNL_MOCK_MASTER_KEY as `0x${string}`;
    if (!privateKey) {
        throw new Error("Missing KRNL_MOCK_MASTER_KEY in env");
    }

    const account = privateKeyToAccount(privateKey);
    const expiry = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour

    // Construct the Hash
    // Types: address, uint256, uint256, bytes, bytes4
    const authHash = keccak256(
        encodePacked(
            ['address', 'uint256', 'uint256', 'bytes', 'bytes4'],
            [
                userAddress as `0x${string}`,
                nonce,
                expiry,
                resultEncoded as `0x${string}`,
                functionSelector as `0x${string}`
            ]
        )
    );

    // Sign the hash (Ethereum Signed Message)
    const signature = await account.signMessage({
        message: { raw: authHash }
    });

    // Return the full AuthData struct
    return {
        nonce: nonce.toString(),
        expiry: expiry.toString(),
        id: keccak256(crypto.getRandomValues(new Uint8Array(32))), // Random ID
        executions: [],
        result: resultEncoded,
        sponsorExecutionFee: false,
        signature
    };
}
