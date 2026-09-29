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
  resetSupervisorPassword: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("SupervisorsList", () => {
  const mockSupervisors: Supervisor[] = [
    {
      id: "sup-1",
      uid: "uid-sup-1",
      name: "Drs. H. Mulyadi",
      email: "mulyadi@pgii.sch.id",
      initialPassword: "password123",
      classes: ["7a", "7b"],
      createdAt: new Date(),
    },
    {
      id: "sup-2",
      uid: "uid-sup-2",
      name: "Hj. Nurhasanah, S.Pd",
      email: "nurhasanah@pgii.sch.id",
      classes: ["8a"],
      createdAt: new Date(),
    },
  ];

  it("renders table row skeletons when loading is true", () => {
    const { container } = render(
      <SupervisorsList initialSupervisors={[]} loading={true} />
    );

    // Table headers should be rendered
    expect(screen.getAllByText("Nama")[0]).toBeDefined();
    expect(screen.getAllByText("Email")[0]).toBeDefined();
    expect(screen.getAllByText("Password")[0]).toBeDefined();
    expect(screen.getAllByText("Kelas Binaan")[0]).toBeDefined();

    // Buttons should be visible
    expect(screen.getByText("Tambah Pembina")).toBeDefined();
    expect(screen.getByText("Cetak Akun (PDF)")).toBeDefined();

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

    expect(screen.getAllByText("Drs. H. Mulyadi").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Hj. Nurhasanah, S.Pd").length).toBeGreaterThan(0);
    expect(screen.getAllByText("mulyadi@pgii.sch.id").length).toBeGreaterThan(0);
    expect(screen.getAllByText("nurhasanah@pgii.sch.id").length).toBeGreaterThan(0);
  });
});
