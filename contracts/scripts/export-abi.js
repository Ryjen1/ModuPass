const fs = require('fs');
const path = require('path');

async function main() {
    const artifactPath = path.join(__dirname, '../artifacts/contracts/ModuPassTargetBase.sol/ModuPassTargetBase.json');
    const artifact = require(artifactPath);

    const abi = artifact.abi;
    const outputPath = path.join(__dirname, '../../KRNL_TargetBase_ABI.json');

    fs.writeFileSync(outputPath, JSON.stringify(abi, null, 2));
    console.log(`ABI extracted to ${outputPath}`);
}

main();
