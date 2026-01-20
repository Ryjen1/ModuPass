# KRNL Integration - Quick Start Guide

## TL;DR - What You Need To Do RIGHT NOW

You already created your workflows in KRNL Studio (I can see them in your screenshots!). Now you just need to:

### 1. Export Your "verify" Workflow (2 minutes)

✅ **"create" workflow already exported and configured!**

Now export the "verify" workflow:

1. Go to https://studio.krnl.xyz
2. Click your **"verify"** workflow (should show 2 steps)
3. Click **"Export"** button (top right)
4. Copy the ENTIRE JSON
5. Open `web/src/lib/krnl-workflows-studio.ts`
6. Replace `verifyAttendanceStudioWorkflow = { ... }` with your copied JSON
7. Save the file

### 2. Test It (2 minutes)

```bash
npm run dev
```

Try creating an event. It should work now!

## What I Fixed

✅ Removed dependency on workflow IDs (which don't exist)  
✅ Updated code to use exported Studio workflows  
✅ Fixed both create and verify pages  
✅ Added proper parameter injection  
✅ Created detailed documentation

## Files Changed

- ✅ `web/src/lib/krnl-workflows-studio.ts` - NEW: Holds your exported workflows
- ✅ `web/src/lib/krnl-workflows-dsl.ts` - UPDATED: Uses Studio workflows
- ✅ `web/src/app/events/create/page.tsx` - UPDATED: Proper workflow execution
- ✅ `web/src/app/events/verify/page.tsx` - UPDATED: Proper workflow execution

## Your Workflows (from screenshots)

You have these in Studio:
- ✅ **"create"** (2 steps) - Creates events
- ✅ **"verify"** (2 steps) - Verifies attendance
- ⚠️ **"modu"** (0 steps) - Not used, can ignore

## If Export Doesn't Work

The placeholder structure in `krnl-workflows-studio.ts` should work if your Studio configuration matches what I saw in the screenshots:
- Chain ID: 11155111 (Sepolia) ✅
- Contract: 0x649457fc625E6c2a5E6581F4E8c9E5448529EdB7 ✅
- Sponsor execution fee: true ✅
- Gas settings configured ✅

Just make sure the parameter placeholders like `{{EVENT_ID}}` are preserved.

## How to Export From KRNL Studio

1. Go to https://studio.krnl.xyz
2. Click on your workflow (create or verify)
3. Click the **"Export"** button in the top right (blue button)
4. Copy the entire JSON
5. Paste it into `web/src/lib/krnl-workflows-studio.ts`
6. Make sure to keep parameter placeholders like `{{EVENT_ID}}`

## Why This Will Work

1. **KRNL Feedback**: They said workflow JSON was wrong
2. **Reference Project**: Uses `runWorkflow()` with exported configs  
3. **Your Screenshots**: Show you already created the workflows
4. **SDK Version**: v0.1.4 uses this pattern

## Next

1. Export workflows ← **DO THIS NOW**
2. Test locally
3. Resubmit to KRNL team
4. Profit! 🚀
