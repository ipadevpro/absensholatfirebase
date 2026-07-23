# Design Spec: Dashboard Performance Optimization & Mobile Logout

## Background
1. **Performance Issue:** Navigating between dashboard pages shows a loading spinner and has lag because each page component performs redundant, sequential Firestore queries (`getDoc`) to fetch user roles and profiles.
2. **Mobile Logout:** Users on mobile cannot log out easily since the sidebar is hidden and the header layout doesn't have a logout button.

## Proposed Solutions
1. **Auth Context Profiling:**
   - Modify `src/contexts/AuthContext.tsx` to fetch the user's profile document once on login and store it in `profile` state.
   - Export `profile` from `useAuth()`.
   - Update `attendance/page.tsx`, `reports/page.tsx`, and `dashboard/page.tsx` to synchronously read the role and profile from `useAuth()` instead of doing database lookups on page mount.
2. **Mobile Logout Button:**
   - Modify `src/components/layout/MobileNav.tsx` to add a Logout action button on the far right using the `LogOut` icon from `lucide-react`.
