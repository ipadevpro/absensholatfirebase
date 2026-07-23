# Missing Attendance Warning Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a warning card for missing past days' attendance in both the Coordinator Dashboard and the Attendance page, along with quick actions to directly navigate and record them.

**Architecture:**
- Dashboard: Ensure the warning card is prominent.
- Attendance Page: Add state/effect to find missing attendance days for the coordinator. Show an alert card if there are missing days. Add quick action buttons that update the page's current date and prayer state.

**Tech Stack:** React, Tailwind CSS, Lucide icons, Firebase Firestore.

---

### Task 1: Add Missing Attendance Warning to Attendance Page

**Files:**
- Modify: `src/app/dashboard/attendance/page.tsx`

**Step 1: Write implementation**
Modify `src/app/dashboard/attendance/page.tsx`:
1. Import `subDays`, `isWeekend`, and `CalendarClock` from Lucide.
2. In `AttendanceContent` component:
   - Add state: `const [missingRecords, setMissingRecords] = useState<{ date: string; prayer: PrayerType }[]>([]);`
   - In the existing `checkRoleAndProfile` `useEffect`, if the user is a coordinator:
     - Check the last 5 school days (excluding weekends) for missing records.
     - For each missing record, add to `missing` list and call `setMissingRecords(missing)`.
3. Render the warning card right above the class selector grid if `missingRecords.length > 0`:
   ```tsx
   {missingRecords.length > 0 && (
     <Card className="border-none shadow-lg bg-amber-50 rounded-[2rem] overflow-hidden animate-in fade-in duration-300 mb-6">
       <CardContent className="p-6">
         <div className="flex flex-col md:flex-row items-center gap-6">
           <div className="bg-amber-100 p-4 rounded-3xl text-amber-600 shadow-inner">
             <CalendarClock size={32} />
           </div>
           <div className="flex-1 text-center md:text-left">
             <h3 className="text-lg font-serif font-bold text-amber-950">Ada Absensi Yang Terlewat!</h3>
             <p className="text-sm text-amber-800 mt-1">
               Anda belum mengisi absensi sholat untuk jadwal berikut. Silakan klik tombol di bawah untuk langsung mengisinya.
             </p>
           </div>
           <div className="flex flex-wrap justify-center gap-2 max-w-md">
             {missingRecords.map((record, i) => (
               <Button 
                 key={i} 
                 onClick={() => {
                   setDate(record.date);
                   // Set search params or select the prayer directly
                   // If we are showing this attendance recorder, it expects date and prayer
                   // We need to pass the clicked prayer to the selectedPrayer state
                   // Wait, selectedPrayer state is inside AttendanceRecorder component!
                   // Let's pass paramDate and paramPrayer as query parameters by updating window URL,
                   // or update page query parameters using router.push/replace so that page reloading
                   // picks up paramDate and paramPrayer!
                   window.location.href = `/dashboard/attendance?date=${record.date}&prayer=${record.prayer}`;
                 }}
                 variant="outline" 
                 className="text-[10px] h-8 rounded-full border-amber-200 bg-white hover:bg-amber-100 hover:text-amber-900 capitalize font-bold"
               >
                 {format(new Date(record.date), "EEE", { locale: idLocale })} • {record.prayer === 'jumat' ? "Jum'at" : record.prayer}
               </Button>
             ))}
           </div>
         </div>
       </CardContent>
     </Card>
   )}
   ```

**Step 2: Commit**
```bash
git add src/app/dashboard/attendance/page.tsx
git commit -m "feat: add missing attendance warnings on attendance page"
```

---

### Task 2: Final Verification

**Steps:**
1. Run `superpowers:verification-before-completion`
2. Run unit tests `npm test -- --run` to make sure all pass.
3. Run `npm run build` to verify there are no compilation or TypeScript errors.
4. Commit.
