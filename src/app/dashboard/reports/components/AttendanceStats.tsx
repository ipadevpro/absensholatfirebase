import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttendanceStats as AttendanceStatsType } from "@/types";

interface AttendanceStatsProps {
  stats: AttendanceStatsType[];
}

function getGrade(percentage: number): string {
  if (percentage >= 90) return "A";
  if (percentage >= 80) return "B";
  if (percentage >= 70) return "C";
  if (percentage >= 60) return "D";
  return "E";
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case "A":
      return "text-green-600 font-bold";
    case "B":
      return "text-blue-600 font-bold";
    case "C":
      return "text-yellow-600 font-bold";
    case "D":
      return "text-orange-600 font-bold";
    case "E":
      return "text-red-600 font-bold";
    default:
      return "";
  }
}

export function AttendanceStats({ stats }: AttendanceStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Total Prayers</TableHead>
              <TableHead className="text-right">Attended</TableHead>
              <TableHead className="text-right">Percentage</TableHead>
              <TableHead className="text-center">Grade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                  No data available
                </TableCell>
              </TableRow>
            ) : (
              stats.map((stat, index) => {
                const grade = getGrade(stat.percentage);
                return (
                  <TableRow key={stat.studentId}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{stat.studentName}</TableCell>
                    <TableCell className="text-right">{stat.totalPrayers}</TableCell>
                    <TableCell className="text-right">{stat.attended}</TableCell>
                    <TableCell className="text-right">{stat.percentage}%</TableCell>
                    <TableCell className={`text-center ${getGradeColor(grade)}`}>
                      {grade}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
