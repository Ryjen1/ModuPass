const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'node_modules', '@krnl-dev', 'sdk-react-7702', 'dist', 'wasm', 'WasmInitializer.js');

try {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');

        // Strategy 1: Replace new URL construction with static string
        // Matches new URL('../../wasm/eip7702.wasm', import.meta.url).href
        let newContent = content.replace(/new URL\(['"]\.\.\/.*?eip7702\.wasm['"],\s*import\.meta\.url\)\.href/g, "'/eip7702.wasm'");
        newContent = newContent.replace(/new URL\(['"]\.\.\/.*?wasm_exec\.js['"],\s*import\.meta\.url\)\.href/g, "'/wasm_exec.js'");

        // Strategy 2: If the file was already partially patched to use /eip7702.wasm but inside new URL(..., ...)
        newContent = newContent.replace(/new URL\(['"]\/eip7702\.wasm['"],\s*import\.meta\.url\)\.href/g, "'/eip7702.wasm'");
        newContent = newContent.replace(/new URL\(['"]\/wasm_exec\.js['"],\s*import\.meta\.url\)\.href/g, "'/wasm_exec.js'");

        // Strategy 3: Handle simple relative string (fallback if not using new URL syntax, unlikely based on inspection)
        // ../../wasm/eip7702.wasm -> /eip7702.wasm
        newContent = newContent.replace(/\.\.\/\.\.\/wasm\/eip7702\.wasm/g, '/eip7702.wasm');

        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log('Successfully patched WasmInitializer.js paths');
    } else {
        console.warn('WasmInitializer.js not found');
    }
} catch (error) {
    console.error('Patch error:', error);
    process.exit(1);
}
