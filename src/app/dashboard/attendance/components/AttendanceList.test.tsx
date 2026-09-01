// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { AttendanceList } from "./AttendanceList";
import { Student } from "@/types";

describe("AttendanceList", () => {
  const mockStudents: Student[] = [
    {
      id: "student-1",
      name: "Ahmad Fauzi",
      classId: "7a",
      gender: "ikhwan",
      createdAt: new Date(),
    },
    {
      id: "student-2",
      name: "Budi Santoso",
      classId: "7a",
      gender: "ikhwan",
      createdAt: new Date(),
    },
  ];

  it("renders 5 skeleton items when loading is true with legend intact", () => {
    const { container } = render(
      <AttendanceList
        students={[]}
        studentStatuses={{}}
        updatingIds={new Set()}
        onStatusChange={vi.fn()}
        prayerKey="zuhur"
        gender="ikhwan"
        loading={true}
      />
    );

    // Should find animated skeleton elements
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);

    // Legend should be present
    expect(screen.getByText("Keterangan Status:")).toBeDefined();
    expect(screen.getByText("Hadir")).toBeDefined();
    expect(screen.getByText("Sakit")).toBeDefined();
    expect(screen.getByText("Izin")).toBeDefined();
    expect(screen.getByText("Alpa")).toBeDefined();
  });

  it("renders empty state when not loading and students array is empty", () => {
    render(
      <AttendanceList
        students={[]}
        studentStatuses={{}}
        updatingIds={new Set()}
        onStatusChange={vi.fn()}
        prayerKey="zuhur"
        gender="ikhwan"
        loading={false}
      />
    );

    expect(screen.getByText("Belum Ada Siswa")).toBeDefined();
  });

  it("renders student cards and handles status change when students exist", () => {
    const onStatusChange = vi.fn();
    render(
      <AttendanceList
        students={mockStudents}
        studentStatuses={{ "student-1": "hadir" }}
        updatingIds={new Set()}
        onStatusChange={onStatusChange}
        prayerKey="zuhur"
        gender="ikhwan"
        loading={false}
      />
    );

    expect(screen.getByText("Ahmad Fauzi")).toBeDefined();
    expect(screen.getByText("Budi Santoso")).toBeDefined();

    // Find and click 'S' (sakit) button for second student
    const buttons = screen.getAllByTitle("Sakit");
    expect(buttons.length).toBe(2);
    fireEvent.click(buttons[1]);
    expect(onStatusChange).toHaveBeenCalledWith("student-2", "sakit");
  });

  it("shows Haid status option when gender is akhwat", () => {
    const akhwatStudent: Student = {
      id: "student-3",
      name: "Fatimah Zahra",
      classId: "7b",
      gender: "akhwat",
      createdAt: new Date(),
    };

    render(
      <AttendanceList
        students={[akhwatStudent]}
        studentStatuses={{}}
        updatingIds={new Set()}
        onStatusChange={vi.fn()}
        prayerKey="zuhur"
        gender="akhwat"
        loading={false}
      />
    );

    expect(screen.getByTitle("Haid")).toBeDefined();
    expect(screen.getByText("Haid")).toBeDefined();
  });

  it("sets correct aria-pressed, aria-label and touch-manipulation attributes on status buttons", () => {
    render(
      <AttendanceList
        students={mockStudents}
        studentStatuses={{ "student-1": "hadir" }}
        updatingIds={new Set()}
        onStatusChange={vi.fn()}
        prayerKey="zuhur"
        gender="ikhwan"
        loading={false}
      />
    );

    // Ahmad Fauzi's Hadir button should have aria-pressed=true
    const ahmadHadirBtn = screen.getByRole("button", { name: "Ahmad Fauzi - Hadir" });
    expect(ahmadHadirBtn).toBeDefined();
    expect(ahmadHadirBtn.getAttribute("aria-pressed")).toBe("true");
    expect(ahmadHadirBtn.className).toContain("touch-manipulation");
    expect(ahmadHadirBtn.className).toContain("active:scale-[0.96]");

    // Ahmad Fauzi's Sakit button should have aria-pressed=false
    const ahmadSakitBtn = screen.getByRole("button", { name: "Ahmad Fauzi - Sakit" });
    expect(ahmadSakitBtn).toBeDefined();
    expect(ahmadSakitBtn.getAttribute("aria-pressed")).toBe("false");
  });
});
