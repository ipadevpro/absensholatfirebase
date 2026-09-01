// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import SupervisorsList from "./SupervisorsList";
import { Supervisor } from "@/types";

vi.mock("@/lib/db/supervisors", () => ({
  deleteSupervisor: vi.fn().mockResolvedValue(undefined),
  getAllSupervisors: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/app/actions/supervisor", () => ({
  createSupervisorAccount: vi.fn().mockResolvedValue({ success: true, uid: "new-sup-uid" }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("SupervisorsList", () => {
  const mockSupervisors: Supervisor[] = [
    {
      id: "sup-1",
      uid: "uid-sup-1",
      name: "Drs. H. Mulyadi",
      classes: ["7a", "7b"],
      createdAt: new Date(),
    },
    {
      id: "sup-2",
      uid: "uid-sup-2",
      name: "Hj. Nurhasanah, S.Pd",
      classes: ["8a"],
      createdAt: new Date(),
    },
  ];

  it("renders 4 table row skeletons when loading is true", () => {
    const { container } = render(
      <SupervisorsList initialSupervisors={[]} loading={true} />
    );

    // Table header should be rendered
    expect(screen.getByText("Nama")).toBeDefined();
    expect(screen.getByText("Kelas Binaan")).toBeDefined();
    expect(screen.getByText("UID")).toBeDefined();
    expect(screen.getByText("Aksi")).toBeDefined();

    // Tambah Pembina button should be visible
    expect(screen.getByText("Tambah Pembina")).toBeDefined();

    // Skeletons should be present
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);

    // Empty state and data should not be visible
    expect(screen.queryByText("Belum ada data pembina.")).toBeNull();
    expect(screen.queryByText("Drs. H. Mulyadi")).toBeNull();
  });

  it("renders empty state when not loading and supervisors array is empty", () => {
    render(<SupervisorsList initialSupervisors={[]} loading={false} />);

    expect(screen.getByText("Belum ada data pembina.")).toBeDefined();
  });

  it("renders supervisors when data is provided", () => {
    render(
      <SupervisorsList initialSupervisors={mockSupervisors} loading={false} />
    );

    expect(screen.getByText("Drs. H. Mulyadi")).toBeDefined();
    expect(screen.getByText("Hj. Nurhasanah, S.Pd")).toBeDefined();
    expect(screen.getByText("uid-sup-1")).toBeDefined();
    expect(screen.getByText("uid-sup-2")).toBeDefined();
  });
});
