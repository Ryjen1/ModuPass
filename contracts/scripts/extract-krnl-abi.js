const fs = require('fs');
const path = require('path');

// Read the compiled contract artifact
const artifactPath = path.join(__dirname, '../artifacts/contracts/ModuPassKRNLVerification.sol/ModuPassKRNLVerification.json');
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

// Extract just the verifyAttendance function ABI
const verifyAttendanceABI = artifact.abi.filter(item =>
    item.type === 'function' && item.name === 'verifyAttendance'
);

// Output the ABI in a format KRNL Studio can use
console.log('=== KRNL Studio ABI (Paste this) ===\n');
console.log(JSON.stringify(verifyAttendanceABI, null, 2));

// Also save to file
const outputPath = path.join(__dirname, '../krnl-studio-abi.json');
fs.writeFileSync(outputPath, JSON.stringify(verifyAttendanceABI, null, 2));
console.log(`\n✅ ABI saved to: ${outputPath}`);
