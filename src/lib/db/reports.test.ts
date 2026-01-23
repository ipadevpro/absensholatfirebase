import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAttendanceStats } from './reports';
import { getDocs } from 'firebase/firestore';

// Mock firebase modules
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getFirestore: vi.fn(),
}));

vi.mock('@/lib/firebase/config', () => ({
  db: {},
}));

describe('getAttendanceStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculates attendance stats correctly for ikhwan in a month', async () => {
    // Mock students
    const mockStudents = [
      { id: 'student1', name: 'Ali', classId: '7A', gender: 'ikhwan', createdAt: new Date() },
      { id: 'student2', name: 'Budi', classId: '7A', gender: 'ikhwan', createdAt: new Date() },
    ];

    // Mock attendance records
    // Assume we are testing Jan 2024.
    // Friday is Jan 5, 12, 19, 26.
    // Let's create a few records.
    const mockAttendance = [
      // Day 1: Monday, Jan 1
      { date: '2024-01-01', classId: '7A', gender: 'ikhwan', prayerType: 'zuhur', presentStudents: ['student1'] },
      { date: '2024-01-01', classId: '7A', gender: 'ikhwan', prayerType: 'ashar', presentStudents: ['student1', 'student2'] },
      // Day 5: Friday, Jan 5 (Ikhwan should have 2 prayers?)
      // Task description says: "if gender === 'ikhwan' { prayersThisDay = isFriday ? 2 : 2; }"
      // Wait, isFriday logic in the provided code snippet was:
      // if (gender === "ikhwan") { prayersThisDay = isFriday ? 2 : 2; }
      // It seems it's always 2 for now based on the requested code snippet.
      
      { date: '2024-01-05', classId: '7A', gender: 'ikhwan', prayerType: 'jumat', presentStudents: ['student1'] },
    ];

    // Mock getDocs implementation
    const mockGetDocs = getDocs as unknown as ReturnType<typeof vi.fn>;
    mockGetDocs
      .mockResolvedValueOnce({ // First call for students
        docs: mockStudents.map(s => ({ id: s.id, data: () => s })),
      })
      .mockResolvedValueOnce({ // Second call for attendance
        docs: mockAttendance.map(a => ({ data: () => a })),
      });

    const stats = await getAttendanceStats('7A', 'ikhwan', 2024, 1);

    // Ali (student1): 
    // Jan 1: Zuhur (Yes), Ashar (Yes)
    // Jan 5: Jumat (Yes) -> Assuming Jumat replaces Zuhur/Ashar or is just one of the 2 prayers?
    // The provided snippet iterates through attendanceRecords.
    // Logic:
    // attendanceRecords.forEach(record => {
    //   if (record.classId === classId && record.gender === gender) {
    //      ...
    //      totalPrayers += prayersThisDay;
    //      if (record.presentStudents.includes(student.id)) attended += prayersThisDay;
    //   }
    // })
    
    // WAIT. The provided code snippet has a logic flaw or I misunderstood it.
    // It iterates over RECORDS.
    // And for EACH record, it adds `prayersThisDay` to `totalPrayers`.
    // `prayersThisDay` is hardcoded to 2.
    // If I have 3 records (Zuhur, Ashar, Jumat), totalPrayers would be 2+2+2 = 6?
    // That seems wrong if "prayersThisDay" implies total prayers FOR THAT DAY.
    // But the loop is over RECORDS (which are per prayer/slot?).
    
    // Let's look at the provided code in the prompt again.
    /*
    attendanceRecords.forEach((record) => {
      if (record.classId === classId && record.gender === gender) {
        const recordDate = new Date(record.date);
        const day = recordDate.getDay();
        const isFriday = day === 5;

        let prayersThisDay = 0;
        if (gender === "ikhwan") {
          prayersThisDay = isFriday ? 2 : 2;
        } else {
          prayersThisDay = 2;
        }

        totalPrayers += prayersThisDay;

        if (record.presentStudents.includes(student.id)) {
          attended += prayersThisDay;
        }
      }
    });
    */
    
    // If `attendanceRecords` contains multiple records for the SAME day (e.g. Zuhur and Ashar),
    // then for Day X:
    // Record 1 (Zuhur): adds 2 to totalPrayers.
    // Record 2 (Ashar): adds 2 to totalPrayers.
    // Total for Day X becomes 4.
    
    // BUT `prayersThisDay` suggests it's the count for the day.
    // If the loop is over records, we might be double counting if we just add 2 every time.
    // However, the record structure is: `date`, `classId`, `gender`, `prayerType`, `presentStudents`.
    // So distinct records are distinct prayer slots.
    
    // If the logic is "For every record found, we assume it represents a full day's worth of prayers (2)?"
    // That sounds wrong if a record is specific to "zuhur".
    
    // OR maybe the `attendanceRecords` in the query are GROUPED by day?
    // In `src/lib/db/attendance.ts`:
    // docId = `${date}_${classId}_${gender}_${prayerType}`;
    // So one doc per prayer type per day.
    
    // So if we have Zuhur doc and Ashar doc for same day.
    // Loop runs twice.
    // 1. Zuhur doc: totalPrayers += 2.
    // 2. Ashar doc: totalPrayers += 2.
    // Total = 4.
    
    // This seems to calculate "points" rather than raw count of prayers?
    // Or maybe the intention was that `attendanceRecords` are unique by date?
    // But the query just filters by date range.
    
    // I will implement EXACTLY as specified in the prompt, but I should probably check if it makes sense.
    // The prompt says: "Step 1: Create reports DB functions... (code provided)"
    // I should use the code provided in the prompt.
    // I will assume the prompt's code is the requirement.
    
    // So for my test expectations:
    // Records: 
    // 1. Jan 1 Zuhur. loops -> totalPrayers += 2. attended += 2 (if present).
    // 2. Jan 1 Ashar. loops -> totalPrayers += 2. attended += 2 (if present).
    // 3. Jan 5 Jumat. loops -> totalPrayers += 2. attended += 2 (if present).
    
    // Ali: Present in all 3.
    // Total Prayers = 2 + 2 + 2 = 6.
    // Attended = 2 + 2 + 2 = 6.
    // Percentage = 100%.
    
    // Budi: Present in Ashar only.
    // Total Prayers = 6.
    // Attended = 2 (from Ashar).
    // Percentage = 33%.
    
    expect(stats).toHaveLength(2);
    expect(stats[0].studentName).toBe('Ali');
    expect(stats[0].percentage).toBe(100);
    
    expect(stats[1].studentName).toBe('Budi');
    expect(stats[1].percentage).toBe(33);
  });
});
