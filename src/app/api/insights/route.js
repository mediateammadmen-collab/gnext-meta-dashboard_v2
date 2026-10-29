import { NextResponse } from "next/server";
import {
  getAccountInsightsByCountry,
  getSpendByCountry,
  resolveDateParams,
  shapeSummary,
} from "@/lib/meta";
import { COUNTRIES, DEFAULT_RANGE, DEFAULT_COUNTRY } from "@/lib/constants";

export const revalidate = 300;

export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const range = searchParams.get("range") || DEFAULT_RANGE;
  const country = searchParams.get("country") || DEFAULT_COUNTRY;
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  try {
    const dateParams = resolveDateParams(range, start, end);
    const countryCode = COUNTRIES.find((c) => c.value === country)?.code || null;
    const [summaryRows, byCountry] = await Promise.all([
      getAccountInsightsByCountry(dateParams, countryCode),
      countryCode ? [] : getSpendByCountry(dateParams),
    ]);
    const summary = shapeSummary(summaryRows, byCountry);

    return NextResponse.json({ range, country, summary });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch insights" },
      { status: 502 }
    );
  }
}
