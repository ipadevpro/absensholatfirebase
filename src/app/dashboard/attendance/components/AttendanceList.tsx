import { Student } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface AttendanceListProps {
  students: Student[];
  presentIds: Set<string>;
  updatingIds: Set<string>;
  onToggle: (studentId: string, checked: boolean) => void;
  prayerKey: string;
}

export function AttendanceList({ students, presentIds, updatingIds, onToggle, prayerKey }: AttendanceListProps) {
  if (students.length === 0) {
    return <p className="text-center text-gray-500 py-8">Belum ada siswa di kelas ini.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {students.map((student) => (
        <div key={student.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
          <Checkbox 
            id={`${prayerKey}-${student.id}`} 
            checked={presentIds.has(student.id)}
            onCheckedChange={(checked) => onToggle(student.id, checked as boolean)}
            disabled={updatingIds.has(student.id)}
            className="h-5 w-5"
          />
          <Label 
            htmlFor={`${prayerKey}-${student.id}`}
            className="flex-grow cursor-pointer font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {student.name}
          </Label>
          {updatingIds.has(student.id) && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        </div>
      ))}
    </div>
  );
}
