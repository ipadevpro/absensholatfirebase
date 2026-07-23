# Firestore Rules Update Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update `firestore.rules` to define the supervisor role and grant it appropriate read/write access to Firestore collections, fixing "Missing or insufficient permissions" errors.

**Architecture:**
- Define `isSupervisor()` helper function checking document existence in `supervisors` collection.
- Grant `isSupervisor()` read/write access to `/students/`, `/attendance/`, and `/coordinators/` matching requirements.
- Add rules for the `/supervisors/` collection (read/write only for admins, plus read for supervisors checking their own document on login).
- Add rule for `settings` collection (read for admins, coordinators, and supervisors).

**Tech Stack:** Firebase Security Rules.

---

### Task 1: Update firestore.rules

**Files:**
- Modify: `firestore.rules`

**Step 1: Write minimal implementation**
Modify `firestore.rules` to:
1. Define `isSupervisor()` checking `exists(/databases/$(database)/documents/supervisors/$(request.auth.uid))`.
2. Allow `isSupervisor()` to read students, attendance, coordinators.
3. Allow `isSupervisor()` to write attendance.
4. Allow admin (`isGuru()`) to read/write supervisors, and supervisors (`isAuthenticated() && request.auth.uid == supervisorId`) to read their own profile.
5. Allow read of `settings` collection for authenticated users (admin, supervisor, coordinator).

Updated rules content:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Fungsi isGuru mengecek keberadaan dokumen UID di koleksi admins
    function isGuru() {
      return isAuthenticated() && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    // Fungsi isSupervisor mengecek keberadaan dokumen UID di koleksi supervisors
    function isSupervisor() {
      return isAuthenticated() && exists(/databases/$(database)/documents/supervisors/$(request.auth.uid));
    }

    // Fungsi isCoordinator mengecek keberadaan dokumen UID di koleksi coordinators
    function isCoordinator() {
      return isAuthenticated() && exists(/databases/$(database)/documents/coordinators/$(request.auth.uid));
    }

    // Aturan untuk koleksi Students
    match /students/{studentId} {
      allow read: if isGuru() || isSupervisor() || isCoordinator();
      allow write: if isGuru();
    }

    // Aturan untuk koleksi Coordinators
    match /coordinators/{coordinatorId} {
      // User boleh membaca datanya sendiri, atau Admin/Supervisor boleh membaca semua
      allow read: if isGuru() || isSupervisor() || (isAuthenticated() && request.auth.uid == coordinatorId);
      allow write: if isGuru();
    }

    // Aturan untuk koleksi Supervisors
    match /supervisors/{supervisorId} {
      // User boleh membaca datanya sendiri, atau Admin boleh membaca semua
      allow read: if isGuru() || (isAuthenticated() && request.auth.uid == supervisorId);
      allow write: if isGuru();
    }

    // Aturan untuk koleksi Attendance
    match /attendance/{attendanceId} {
      allow read: if isGuru() || isSupervisor() || isCoordinator();
      allow write: if isGuru() || isSupervisor() || isCoordinator();
    }
    
    // Aturan untuk koleksi Admins
    match /admins/{adminId} {
      allow read: if isAuthenticated() && request.auth.uid == adminId || isGuru();
      allow write: if false; // Admin hanya bisa ditambah via Console/Admin SDK
    }

    // Aturan untuk koleksi Settings
    match /settings/{settingId} {
      allow read: if isGuru() || isSupervisor() || isCoordinator();
      allow write: if isGuru();
    }
  }
}
```

**Step 2: Commit**
```bash
git add firestore.rules
git commit -m "feat: update firestore rules to support supervisor role and settings"
```

---

### Task 2: Final Verification

**Steps:**
1. Run `superpowers:verification-before-completion`
2. Run unit tests `npm test -- --run` to make sure all pass.
3. Run `npm run build` to verify there are no compilation or TypeScript errors.
4. Commit.
