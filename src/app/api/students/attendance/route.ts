import { NextRequest, NextResponse } from "next/server";
import { getStudentAttendanceByNis } from "@/app/actions/studentAttendance";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nis = searchParams.get("nis") || searchParams.get("id");

    if (!nis) {
      return NextResponse.json(
        {
          success: false,
          error: 'Parameter "nis" (atau "id") diperlukan. Contoh: /api/students/attendance?nis=12345',
        },
        { status: 400 }
      );
    }

    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");

    const options: { year?: number; month?: number } = {};
    if (yearParam && !isNaN(parseInt(yearParam, 10))) {
      options.year = parseInt(yearParam, 10);
    }
    if (monthParam && !isNaN(parseInt(monthParam, 10))) {
      options.month = parseInt(monthParam, 10);
    }

    const result = await getStudentAttendanceByNis(nis, options);

    if (!result.success) {
      return NextResponse.json(result, { status: result.status || 404 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("API GET /api/students/attendance error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Terjadi kesalahan internal server",
      },
      { status: 500 }
    );
  }
}
