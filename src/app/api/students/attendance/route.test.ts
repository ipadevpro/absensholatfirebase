import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, OPTIONS } from "./route";
import { NextRequest } from "next/server";
import * as actions from "@/app/actions/studentAttendance";

vi.mock("@/app/actions/studentAttendance", () => ({
  getStudentAttendanceByNis: vi.fn(),
}));

describe("GET /api/students/attendance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles OPTIONS preflight with CORS headers", async () => {
    const res = await OPTIONS();
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("access-control-allow-headers")).toContain("x-api-key");
  });

  it("returns 401 Unauthorized if API key is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/students/attendance?nis=12345");
    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("API Key tidak valid");
  });

  it("returns 401 Unauthorized if API key is wrong", async () => {
    const req = new NextRequest("http://localhost:3000/api/students/attendance?nis=12345", {
      headers: { "x-api-key": "wrong-key" },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("accepts valid API key via header x-api-key", async () => {
    vi.spyOn(actions, "getStudentAttendanceByNis").mockResolvedValue({
      success: true,
      student: { id: "s1", nis: "12345", name: "Ahmad", classId: "7a", gender: "ikhwan" },
      stats: {
        totalDays: 1,
        totalPrayers: 2,
        attended: 2,
        score: 100,
        grade: "A",
        summary: { hadir: 2, haid: 0, sakit: 0, izin: 0, alpa: 0 },
      },
      records: [],
    });

    const req = new NextRequest("http://localhost:3000/api/students/attendance?nis=12345", {
      headers: { "x-api-key": "sholat-api-key-2026" },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.student.name).toBe("Ahmad");
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("accepts valid API key via query parameter apiKey", async () => {
    vi.spyOn(actions, "getStudentAttendanceByNis").mockResolvedValue({
      success: true,
      student: { id: "s1", nis: "12345", name: "Ahmad", classId: "7a", gender: "ikhwan" },
      stats: {
        totalDays: 1,
        totalPrayers: 2,
        attended: 2,
        score: 100,
        grade: "A",
        summary: { hadir: 2, haid: 0, sakit: 0, izin: 0, alpa: 0 },
      },
      records: [],
    });

    const req = new NextRequest(
      "http://localhost:3000/api/students/attendance?nis=12345&apiKey=sholat-api-key-2026"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
