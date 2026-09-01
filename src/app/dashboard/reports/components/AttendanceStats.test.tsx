// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { AttendanceStats, getGrade } from "./AttendanceStats";
import { AttendanceStats as AttendanceStatsType } from "@/types";

describe("AttendanceStats", () => {
  const mockStats: AttendanceStatsType[] = [
    {
      studentId: "student-1",
      studentName: "Ahmad Fauzi",
      attended: 18,
      totalPrayers: 20,
      percentage: 90,
    },
    {
      studentId: "student-2",
      studentName: "Budi Santoso",
      attended: 15,
      totalPrayers: 20,
      percentage: 75,
    },
  ];

  it("calculates correct grades based on percentage", () => {
    expect(getGrade(95)).toBe("A");
    expect(getGrade(90)).toBe("A");
    expect(getGrade(85)).toBe("B");
    expect(getGrade(80)).toBe("B");
    expect(getGrade(75)).toBe("C");
    expect(getGrade(70)).toBe("C");
    expect(getGrade(65)).toBe("D");
    expect(getGrade(60)).toBe("D");
    expect(getGrade(55)).toBe("E");
    expect(getGrade(0)).toBe("E");
  });

  it("renders 5 table row skeletons when loading is true", () => {
    const { container } = render(
      <AttendanceStats stats={[]} loading={true} />
    );

    // Card title & table header should be rendered
    expect(screen.getByText("Hasil Rekapitulasi")).toBeDefined();
    expect(screen.getByText("Peringkat")).toBeDefined();
    expect(screen.getByText("Nama Siswa")).toBeDefined();
    expect(screen.getByText("Hadir")).toBeDefined();
    expect(screen.getByText("Target")).toBeDefined();
    expect(screen.getByText("Nilai (%)")).toBeDefined();
    expect(screen.getByText("Grade")).toBeDefined();

    // Skeletons should be present
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);

    // Empty state should not be visible
    expect(screen.queryByText("Belum ada data untuk ditampilkan")).toBeNull();
    expect(screen.queryByText("Ahmad Fauzi")).toBeNull();
  });

  it("renders empty state when not loading and stats array is empty", () => {
    render(<AttendanceStats stats={[]} loading={false} />);

    expect(screen.getByText("Belum ada data untuk ditampilkan")).toBeDefined();
    expect(
      screen.getByText('Pilih kelas, kategori, bulan, dan tahun lalu klik "Tampilkan".')
    ).toBeDefined();
  });

  it("renders attendance statistics rows with rank, names, attendance, and grades", () => {
    render(<AttendanceStats stats={mockStats} loading={false} />);

    // Total days indicator should be shown (20 / 2 = 10 days)
    expect(screen.getByText("10 Hari Terabsen")).toBeDefined();

    // Students rendered
    expect(screen.getByText("Ahmad Fauzi")).toBeDefined();
    expect(screen.getByText("Budi Santoso")).toBeDefined();
    expect(screen.getByText("90%")).toBeDefined();
    expect(screen.getByText("75%")).toBeDefined();
    expect(screen.getByText("A")).toBeDefined();
    expect(screen.getByText("C")).toBeDefined();
  });
});
