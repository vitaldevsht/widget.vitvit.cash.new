import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const partnerId = searchParams.get("partner_id");

    if (!code) {
      return NextResponse.json(
        { error: "Missing required query param: code" },
        { status: 400 },
      );
    }

    if (!partnerId) {
      return NextResponse.json(
        { error: "Missing required query param: partner_id" },
        { status: 400 },
      );
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASEURL}/wallets/execute?code=${encodeURIComponent(code)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.PARTNER_SECRET}`,
          partner_id: partnerId,
        },
      },
    );

    const text = await response.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }

    if (!response.ok) {
      console.error("execute upstream error", response.status, text);
      return NextResponse.json(
        { error: `Upstream error: ${response.status}`, details: data },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("execute proxy error", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error?.message },
      { status: 500 },
    );
  }
}
