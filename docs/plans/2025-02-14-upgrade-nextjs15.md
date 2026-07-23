# Next.js 15 and React 19 Upgrade Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade the project dependencies to Next.js 15 and React 19 to fix Vercel vulnerability build errors.

**Architecture:**
- Update `package.json` to change next version to `^15.1.7` and react version to `^19.0.0`.
- Update lockfile using `npm install --legacy-peer-deps`.

**Tech Stack:** Node.js, npm, Next.js, React.

---

### Task 1: Update package.json Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Write minimal implementation**
Modify `package.json` to set the following version dependencies:
- `"next": "^15.1.7"`
- `"react": "^19.0.0"`
- `"react-dom": "^19.0.0"`
- `"@types/react": "^19.0.0"`
- `"@types/react-dom": "^19.0.0"`

**Step 2: Install dependencies**
Run: `npm install --legacy-peer-deps`
Expected: Install finishes successfully without dependency errors.

**Step 3: Commit**
```bash
git add package.json package-lock.json
git commit -m "feat: upgrade next to v15 and react to v19"
```

---

### Task 2: Final Verification

**Steps:**
1. Run `superpowers:verification-before-completion`
2. Run unit tests `npm test -- --run` to make sure all pass.
3. Run `npm run build` to verify there are no compilation or TypeScript errors.
4. Commit & Push:
   ```bash
   git push origin master
   ```
