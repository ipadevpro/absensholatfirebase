# Next.js 16.0.10 React2Shell Patch Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade Next.js to 16.0.10 to resolve the React2Shell vulnerability.

**Architecture:**
- Modify `package.json` to change the `next` dependency version to `16.0.10`.
- Update package lockfile using `npm install --ignore-scripts` to bypass native postinstall issues.

**Tech Stack:** Node.js, npm, Next.js.

---

### Task 1: Update package.json & Lockfile

**Files:**
- Modify: `package.json`

**Step 1: Write minimal implementation**
Modify `package.json` to change `next` dependency:
- `"next": "16.0.10"`

**Step 2: Run npm install**
Run: `npm install --ignore-scripts`
Expected: Install finishes successfully.

**Step 3: Commit**
```bash
git add package.json package-lock.json
git commit -m "feat: upgrade next to v16.0.10 to patch React2Shell vulnerability"
```

---

### Task 2: Final Verification & Push

**Steps:**
1. Run `superpowers:verification-before-completion`
2. Run unit tests `npm test -- --run` to make sure all pass.
3. Run `npm run build` to verify there are no compilation or TypeScript errors.
4. Commit & Push to Github.
