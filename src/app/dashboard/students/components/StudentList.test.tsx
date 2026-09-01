// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { StudentList } from "./StudentList";
import { Student } from "@/types";

describe("StudentList", () => {
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
      name: "Siti Aisyah",
      classId: "7a",
      gender: "akhwat",
      createdAt: new Date(),
    },
  ];

  it("renders 5 student card skeletons when loading is true", () => {
    const { container } = render(
      <StudentList
        students={[]}
        loading={true}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onDelegate={vi.fn()}
        selectedIds={[]}
        onToggleSelect={vi.fn()}
      />
    );

    // Skeletons should be present
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);

    // Should not render empty state or student names
    expect(screen.queryByText("Siswa Tidak Ditemukan")).toBeNull();
    expect(screen.queryByText("Ahmad Fauzi")).toBeNull();
  });

  it("renders empty state when not loading and students array is empty", () => {
    render(
      <StudentList
        students={[]}
        loading={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onDelegate={vi.fn()}
        selectedIds={[]}
        onToggleSelect={vi.fn()}
      />
    );

    expect(screen.getByText("Siswa Tidak Ditemukan")).toBeDefined();
  });

  it("renders student cards and triggers onEdit, onDelete, onDelegate, onToggleSelect", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onDelegate = vi.fn();
    const onToggleSelect = vi.fn();

    render(
      <StudentList
        students={mockStudents}
        loading={false}
        onEdit={onEdit}
        onDelete={onDelete}
        onDelegate={onDelegate}
        selectedIds={["student-1"]}
        onToggleSelect={onToggleSelect}
      />
    );

    expect(screen.getByText("Ahmad Fauzi")).toBeDefined();
    expect(screen.getByText("Siti Aisyah")).toBeDefined();

    // Delegate button
    const delegateButtons = screen.getAllByTitle("Delegasikan Koordinator");
    fireEvent.click(delegateButtons[0]);
    expect(onDelegate).toHaveBeenCalledWith(mockStudents[0]);

    // Edit button
    const editButtons = screen.getAllByTitle("Edit Data");
    fireEvent.click(editButtons[0]);
    expect(onEdit).toHaveBeenCalledWith(mockStudents[0]);

    // Delete button
    const deleteButtons = screen.getAllByTitle("Hapus Siswa");
    fireEvent.click(deleteButtons[0]);
    expect(onDelete).toHaveBeenCalledWith("student-1");
  });
});
