import { describe, it, expect, vi } from "vitest";
import { getAttendanceStats, getRangeAttendanceData } from "./reports";
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

describe("reports", () => {
  describe("getAttendanceStats", () => {
    it("should calculate attendance percentage correctly where 'hadir' and 'haid' are treated as attended", async () => {
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
        .mockResolvedValueOnce(mockStudentsSnapshot as any)
        .mockResolvedValueOnce(mockAttendanceSnapshot as any);

      const stats = await getAttendanceStats("7a", "akhwat", 2026, 2);

      expect(stats.length).toBe(1);
      expect(stats[0].attended).toBe(2);
      expect(stats[0].totalPrayers).toBe(2);
      expect(stats[0].percentage).toBe(100);
    });
  });

  describe("getRangeAttendanceData", () => {
    it("should accurately calculate semester range, fair monthly averages, and Sholat Jumat for Ikhwan", async () => {
      const mockStudentsSnapshot = {
        docs: [
          {
            id: "student-ikhwan",
            data: () => ({
              id: "student-ikhwan",
              nis: "212207001",
              name: "Ahmad Santoso",
              gender: "ikhwan",
              classId: "7a",
            }),
          },
          {
            id: "student-akhwat",
            data: () => ({
              id: "student-akhwat",
              nis: "212207002",
              name: "Siti Fatimah",
              gender: "akhwat",
              classId: "7a",
            }),
          },
        ],
      };

      const mockAttendanceSnapshot = {
        docs: [
          // Month 7 (Juli): Friday - Sholat Jumat & Ashar
          {
            data: () => ({
              date: "2026-07-03", // Friday
              classId: "7a",
              gender: "ikhwan",
              prayerType: "jumat",
              statuses: { "student-ikhwan": "hadir" },
            }),
          },
          {
            data: () => ({
              date: "2026-07-03", // Friday
              classId: "7a",
              gender: "ikhwan",
              prayerType: "ashar",
              statuses: { "student-ikhwan": "hadir" },
            }),
          },
          // Month 7: Akhwat on Friday (Zuhur with haid, Ashar with haid)
          {
            data: () => ({
              date: "2026-07-03",
              classId: "7a",
              gender: "akhwat",
              prayerType: "zuhur",
              statuses: { "student-akhwat": "haid" },
            }),
          },
          {
            data: () => ({
              date: "2026-07-03",
              classId: "7a",
              gender: "akhwat",
              prayerType: "ashar",
              statuses: { "student-akhwat": "haid" },
            }),
          },
        ],
      };

      vi.mocked(getDocs)
        .mockResolvedValueOnce(mockStudentsSnapshot as any)
        .mockResolvedValueOnce(mockAttendanceSnapshot as any);

      const result = await getRangeAttendanceData({
        classIds: ["7a"],
        gender: "all",
        year: 2026,
        startMonth: 7,
        endMonth: 12,
      });

      expect(result.monthlySummaries.length).toBe(2);

      // Check Ikhwan summary
      const ikhwanSummary = result.monthlySummaries.find((s) => s.studentId === "student-ikhwan");
      expect(ikhwanSummary).toBeDefined();
      expect(ikhwanSummary?.studentNis).toBe("212207001");
      expect(ikhwanSummary?.monthlyScores[7]).toBe(100);
      expect(ikhwanSummary?.monthlyScores[8]).toBeNull(); // Month 8 has no records
      expect(ikhwanSummary?.averageScore).toBe(100); // Fair average follows active months in range
      expect(ikhwanSummary?.jumatAttended).toBe(1);
      expect(ikhwanSummary?.jumatTarget).toBe(1);
      expect(ikhwanSummary?.jumatScore).toBe(100); // 100% Sholat Jumat

      // Check Akhwat summary
      const akhwatSummary = result.monthlySummaries.find((s) => s.studentId === "student-akhwat");
      expect(akhwatSummary).toBeDefined();
      expect(akhwatSummary?.monthlyScores[7]).toBe(100); // Haid counted as 100% attended
      expect(akhwatSummary?.averageScore).toBe(100);
      expect(akhwatSummary?.jumatScore).toBeNull(); // Akhwat does not have jumat score
    });
  });
});

