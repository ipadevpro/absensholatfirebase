import { describe, it, expect, vi } from "vitest";
import { getAttendanceStats } from "./reports";
import { getDocs } from "firebase/firestore";

vi.mock("firebase/firestore", () => {
  return {
    getFirestore: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    doc: vi.fn(),
    getDocs: vi.fn(),
  };
});

vi.mock("@/lib/firebase/config", () => ({
  db: {},
}));

describe("getAttendanceStats", () => {
  it("should calculate attendance percentage correctly where 'hadir' and 'haid' are treated as attended", async () => {
    // Mock students and records
    const mockStudentsSnapshot = {
      docs: [
        { id: "student-1", data: () => ({ id: "student-1", name: "Siswa 1", gender: "akhwat", classId: "7a" }) }
      ]
    };
    const mockAttendanceSnapshot = {
      docs: [
        {
          data: () => ({
            date: "2026-02-01",
            classId: "7a",
            gender: "akhwat",
            prayerType: "zuhur",
            statuses: { "student-1": "haid" }
          })
        },
        {
          data: () => ({
            date: "2026-02-01",
            classId: "7a",
            gender: "akhwat",
            prayerType: "ashar",
            statuses: { "student-1": "hadir" }
          })
        }
      ]
    };

    vi.mocked(getDocs)
      .mockResolvedValueOnce(mockStudentsSnapshot as any) // first call for students
      .mockResolvedValueOnce(mockAttendanceSnapshot as any); // second call for attendance

    const stats = await getAttendanceStats("7a", "akhwat", 2026, 2);

    expect(stats.length).toBe(1);
    expect(stats[0].attended).toBe(2); // "haid" + "hadir"
    expect(stats[0].totalPrayers).toBe(2); // 1 day * 2 prayers
    expect(stats[0].percentage).toBe(100);
  });
});
