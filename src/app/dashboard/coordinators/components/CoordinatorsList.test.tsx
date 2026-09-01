// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import CoordinatorsList from "./CoordinatorsList";
import { Coordinator } from "@/types";

vi.mock("@/lib/db/coordinators", () => ({
  deleteCoordinator: vi.fn().mockResolvedValue(undefined),
  getAllCoordinators: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/app/actions/coordinator", () => ({
  createCoordinatorAccount: vi.fn().mockResolvedValue({ success: true, uid: "new-uid" }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("CoordinatorsList", () => {
  const mockCoordinators: Coordinator[] = [
    {
      id: "coord-1",
      uid: "uid-coord-1",
      name: "Ustadz Ali",
      classId: "7a",
      gender: "ikhwan",
      createdAt: new Date(),
    },
    {
      id: "coord-2",
      uid: "uid-coord-2",
      name: "Ustadzah Fatimah",
      classId: "7b",
      gender: "akhwat",
      createdAt: new Date(),
    },
  ];

  it("renders 4 table row skeletons when loading is true", () => {
    const { container } = render(
      <CoordinatorsList initialCoordinators={[]} loading={true} />
    );

    // Table header should be rendered
    expect(screen.getByText("Nama")).toBeDefined();
    expect(screen.getByText("Kategori")).toBeDefined();
    expect(screen.getByText("Kelas")).toBeDefined();
    expect(screen.getByText("UID")).toBeDefined();
    expect(screen.getByText("Aksi")).toBeDefined();

    // Tambah Koordinator button should be visible
    expect(screen.getByText("Tambah Koordinator")).toBeDefined();

    // Skeletons should be present
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);

    // Empty state and data should not be visible
    expect(screen.queryByText("Belum ada koordinator terdaftar.")).toBeNull();
    expect(screen.queryByText("Ustadz Ali")).toBeNull();
  });

  it("renders empty state when not loading and coordinators array is empty", () => {
    render(<CoordinatorsList initialCoordinators={[]} loading={false} />);

    expect(screen.getByText("Belum ada koordinator terdaftar.")).toBeDefined();
  });

  it("renders coordinators when data is provided", () => {
    render(
      <CoordinatorsList initialCoordinators={mockCoordinators} loading={false} />
    );

    expect(screen.getByText("Ustadz Ali")).toBeDefined();
    expect(screen.getByText("Ustadzah Fatimah")).toBeDefined();
    expect(screen.getByText("uid-coord-1")).toBeDefined();
    expect(screen.getByText("uid-coord-2")).toBeDefined();
  });
});
