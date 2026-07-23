# Design Spec: Upgrade to Next.js 15 & React 19

## Background
Vercel flags the current Next.js 16 pre-release version as vulnerable or unsupported, causing build failures. We will upgrade the project to the latest stable Next.js 15 release (`^15.1.7`) along with React 19 (`^19.0.0`) to resolve this.

## Requirements
1. **Dependency Updates:**
   - Update `next` to `^15.1.7`.
   - Update `react` and `react-dom` to `^19.0.0`.
   - Update `@types/react` and `@types/react-dom` to `^19.0.0`.
2. **Lockfile Generation:**
   - Run `npm install --legacy-peer-deps` to resolve peer dependency issues with React 19.
3. **Verification:**
   - Run unit tests and Next.js build.
   - Commit and push to remote repository.
