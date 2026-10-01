import { NextRequest, NextResponse } from "next/server";
import { getStudentAttendanceByNis } from "@/app/actions/studentAttendance";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
};

const VALID_API_KEY = process.env.ATTENDANCE_API_KEY || "sholat-api-key-2026";

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 1. Verify API Key (supports header: x-api-key, Bearer token, or query param: apiKey / api_key)
    const providedApiKey =
      request.headers.get("x-api-key") ||
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      searchParams.get("apiKey") ||
      searchParams.get("api_key");

    if (!providedApiKey || providedApiKey !== VALID_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: API Key tidak valid atau tidak disertakan. Sertakan header 'x-api-key: sholat-api-key-2026' atau parameter query '?apiKey=sholat-api-key-2026'.",
        },
        { status: 401, headers: corsHeaders }
      );
    }

    const nis = searchParams.get("nis") || searchParams.get("id");

    if (!nis) {
      return NextResponse.json(
        {
          success: false,
          error: 'Parameter "nis" (atau "id") diperlukan. Contoh: /api/students/attendance?nis=12345',
        },
        { status: 400, headers: corsHeaders }
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
      return NextResponse.json(result, { status: result.status || 404, headers: corsHeaders });
    }

    return NextResponse.json(result, { status: 200, headers: corsHeaders });
  } catch (error: any) {
    console.error("API GET /api/students/attendance error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Terjadi kesalahan internal server",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
