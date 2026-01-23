import { getAllCoordinators } from "@/lib/db/coordinators";
import CoordinatorsList from "./components/CoordinatorsList";

export const dynamic = "force-dynamic";

export default async function CoordinatorsPage() {
  const coordinators = await getAllCoordinators();

  return (
    <div className="container mx-auto py-10 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Coordinators</h1>
        <p className="text-muted-foreground mt-2">
          Manage coordinator accounts and assignments.
        </p>
      </div>
      
      <CoordinatorsList initialCoordinators={coordinators} />
    </div>
  );
}
