# Performance Optimization & Mobile Logout Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Accelerate page transitions by storing the user's role profile in AuthContext and reading it synchronously, and add a logout button to the mobile navigation.

**Architecture:**
- Auth: Modify `src/contexts/AuthContext.tsx` to store `profile: any` in state and include it in context type.
- Attendance Page: Update `src/app/dashboard/attendance/page.tsx` to read profile synchronously from `useAuth()`.
- Reports Page: Update `src/app/dashboard/reports/page.tsx` to read profile synchronously from `useAuth()`.
- Dashboard Page: Update `src/app/dashboard/page.tsx` to use the profile from `useAuth()`.
- Mobile Nav: Update `src/components/layout/MobileNav.tsx` to add a logout button.

**Tech Stack:** React, Next.js, Firebase Firestore.

---

### Task 1: Update AuthContext to Store User Profile

**Files:**
- Modify: `src/contexts/AuthContext.tsx`

**Step 1: Write minimal implementation**
Update `src/contexts/AuthContext.tsx`:
1. Add `profile: any | null` to `AuthContextType` interface.
2. Add state `const [profile, setProfile] = useState<any | null>(null);`
3. In `onAuthStateChanged`, fetch and set `profile` document data:
   - For Admin: `setProfile(adminDoc.data());`
   - For Supervisor: `setProfile(supervisorDoc.data());`
   - For Coordinator: `setProfile(coordDoc.data());`
   - On logout or if no user: `setProfile(null);`
4. Expose `profile` in the `AuthContext.Provider` value.

**Step 2: Commit**
```bash
git add src/contexts/AuthContext.tsx
git commit -m "feat: store and expose user profile in AuthContext to optimize data loading"
```

---

### Task 2: Optimize Route Pages (Attendance & Reports & Dashboard)

**Files:**
- Modify: `src/app/dashboard/attendance/page.tsx`
- Modify: `src/app/dashboard/reports/page.tsx`
- Modify: `src/app/dashboard/page.tsx`

**Step 1: Update Attendance page**
Update `checkRoleAndProfile` inside `src/app/dashboard/attendance/page.tsx` to use the cached profile from `useAuth()` synchronously instead of calling Firestore `getDoc`:
```typescript
  const { role, profile, loading: authLoading } = useAuth();
  ...
  useEffect(() => {
    if (authLoading) return;
    
    if (role === "coordinator" && profile) {
      setClassId(profile.classId);
      setGender(profile.gender);
      setIsAdmin(false);
      
      // Keep fetching last 5 days missing records here, as that is date-dynamic...
      // (already implemented)
    } else if (role === "supervisor" && profile) {
      const assignedClasses = profile.classes || [];
      setSupervisorClasses(assignedClasses);
      if (assignedClasses.length > 0) {
        setClassId(assignedClasses[0]);
      }
      setIsAdmin(true);
    } else if (role === "admin") {
      setIsAdmin(true);
    } else {
      setError("Akses ditolak atau profil tidak ditemukan.");
    }
    setLoading(false);
  }, [role, profile, authLoading]);
```

**Step 2: Update Reports page**
Update `src/app/dashboard/reports/page.tsx` similarly:
```typescript
  const { role, profile, loading: authLoading } = useAuth();
  ...
  useEffect(() => {
    if (authLoading) return;
    
    if (role === "coordinator" && profile) {
      setClassId(profile.classId);
      setGender(profile.gender);
      setIsAdmin(false);
    } else if (role === "supervisor" && profile) {
      const assignedClasses = profile.classes || [];
      setSupervisorClasses(assignedClasses);
      if (assignedClasses.length > 0) {
        setClassId(assignedClasses[0]);
      }
      setIsAdmin(true);
    } else if (role === "admin") {
      setIsAdmin(true);
    }
    setInitialLoading(false);
  }, [role, profile, authLoading]);
```

**Step 3: Update Dashboard page**
Update `src/app/dashboard/page.tsx` to get coordinator profile from `useAuth()` instead of fetching `coordinators` collection again:
```typescript
  const { role, user, profile } = useAuth();
  ...
  // In loadDashboardData:
  } else if (role === "coordinator" && profile) {
    setCoordinator(profile);
    // Continue fetching other stats...
  }
```

**Step 4: Commit**
```bash
git add src/app/dashboard/attendance/page.tsx src/app/dashboard/reports/page.tsx src/app/dashboard/page.tsx
git commit -m "feat: use cached AuthContext profile in dashboard pages for instant load"
```

---

### Task 3: Add Logout Button to Mobile Navigation

**Files:**
- Modify: `src/components/layout/MobileNav.tsx`

**Step 1: Write implementation**
Modify `src/components/layout/MobileNav.tsx`:
1. Import `LogOut` from `lucide-react`.
2. Import `useRouter` from `next/navigation`.
3. Get `logout` from `useAuth()`.
4. Add `handleLogout` handler:
   ```typescript
   const router = useRouter();
   const handleLogout = async () => {
     if (window.confirm("Apakah Anda yakin ingin keluar?")) {
       await logout();
       router.push("/login");
     }
   };
   ```
5. Render a logout button on the far right of the navigation items list:
   ```tsx
   <button
     onClick={handleLogout}
     className="relative p-3 rounded-2xl transition-all duration-300 text-red-500 hover:bg-red-50"
     title="Logout"
   >
     <LogOut size={24} strokeWidth={2} />
   </button>
   ```

**Step 2: Commit**
```bash
git add src/components/layout/MobileNav.tsx
git commit -m "feat: add logout button to mobile navigation"
```

---

### Task 4: Final Verification

**Steps:**
1. Run `superpowers:verification-before-completion`
2. Run unit tests `npm test -- --run` to make sure all pass.
3. Run `npm run build` to verify there are no compilation or TypeScript errors.
4. Commit & Push to Github.
