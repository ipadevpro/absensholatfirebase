import { describe, it, expect, vi, beforeEach } from "vitest";
import { getStudentAttendanceByNis } from "./studentAttendance";
import { adminDb } from "@/lib/firebase/admin";

vi.mock("@/lib/firebase/admin", () => {
  return {
    adminAuth: {},
    adminDb: {
      collection: vi.fn(),
    },
  };
});

describe("studentAttendance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getStudentAttendanceByNis", () => {
    it("returns 400 if empty query", async () => {
      const res = await getStudentAttendanceByNis("");
      expect(res.success).toBe(false);
      expect(res.status).toBe(400);
    });

    it("returns 404 if student not found", async () => {
      const mockCollection = vi.fn().mockImplementation((colName: string) => {
        if (colName === "students") {
          return {
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                get: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
              }),
            }),
            doc: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue({ exists: false }),
            }),
          };
        }
        return {};
      });

      (adminDb.collection as any) = mockCollection;

      const res = await getStudentAttendanceByNis("99999");
      expect(res.success).toBe(false);
      expect(res.status).toBe(404);
    });

    it("successfully calculates attendance and grade by NIS", async () => {
      const mockStudentDoc = {
        id: "student-1",
        exists: true,
        data: () => ({
          nis: "12345",
          name: "Fulan bin Fulan",
          classId: "7a",
          gender: "ikhwan",
        }),
      };

      const mockAttendanceDocs = [
        {
          id: "2026-09-01_7a_ikhwan_zuhur",
          data: () => ({
            date: "2026-09-01",
            classId: "7a",
            gender: "ikhwan",
            prayerType: "zuhur",
            statuses: { "student-1": "hadir" },
          }),
        },
        {
          id: "2026-09-01_7a_ikhwan_ashar",
          data: () => ({
            date: "2026-09-01",
            classId: "7a",
            gender: "ikhwan",
            prayerType: "ashar",
            statuses: { "student-1": "hadir" },
          }),
        },
      ];

      const mockCollection = vi.fn().mockImplementation((colName: string) => {
        if (colName === "students") {
          return {
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                get: vi.fn().mockResolvedValue({
                  empty: false,
                  docs: [mockStudentDoc],
                }),
              }),
            }),
            doc: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue(mockStudentDoc),
            }),
          };
        }
        if (colName === "attendance") {
          const queryMock: any = {
            where: vi.fn().mockImplementation(() => queryMock),
            get: vi.fn().mockResolvedValue({
              docs: mockAttendanceDocs,
            }),
          };
          return queryMock;
        }
        return {};
      });

      (adminDb.collection as any) = mockCollection;

      const res = await getStudentAttendanceByNis("12345");
      expect(res.success).toBe(true);
      expect(res.student?.name).toBe("Fulan bin Fulan");
      expect(res.student?.nis).toBe("12345");
      expect(res.stats?.attended).toBe(2);
      expect(res.stats?.totalDays).toBe(1);
      expect(res.stats?.totalPrayers).toBe(2);
      expect(res.stats?.score).toBe(100);
      expect(res.stats?.grade).toBe("A");
      expect(res.stats?.summary.hadir).toBe(2);
    });

    it("falls back to document ID when NIS is not set on student doc", async () => {
      const mockStudentDoc = {
        id: "doc-id-abc",
        exists: true,
        data: () => ({
          name: "Siti Aminah",
          classId: "8b",
          gender: "akhwat",
        }),
      };

      const mockAttendanceDocs = [
        {
          id: "2026-09-02_8b_akhwat_zuhur",
          data: () => ({
            date: "2026-09-02",
            classId: "8b",
            gender: "akhwat",
            prayerType: "zuhur",
            statuses: { "doc-id-abc": "haid" }, // haid counted as attended
          }),
        },
      ];

      const mockCollection = vi.fn().mockImplementation((colName: string) => {
        if (colName === "students") {
          return {
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                get: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
              }),
            }),
            doc: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue(mockStudentDoc),
            }),
          };
        }
        if (colName === "attendance") {
          const queryMock: any = {
            where: vi.fn().mockImplementation(() => queryMock),
            get: vi.fn().mockResolvedValue({
              docs: mockAttendanceDocs,
            }),
          };
          return queryMock;
        }
        return {};
      });

      (adminDb.collection as any) = mockCollection;

      const res = await getStudentAttendanceByNis("doc-id-abc");
      expect(res.success).toBe(true);
      expect(res.student?.name).toBe("Siti Aminah");
      expect(res.student?.nis).toBeNull();
      expect(res.stats?.summary.haid).toBe(1);
      expect(res.stats?.attended).toBe(1);
    });
  });
});
