import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const partnerId = body?.partner_id || request.headers.get("partner_id");

    if (!partnerId) {
      return NextResponse.json(
        { error: "Missing required field: partner_id" },
        { status: 400 },
      );
    }

    const { partner_id: _omit, user_id, amount, amount_receive } = body || {};

    if (!user_id || !amount || !amount_receive) {
      return NextResponse.json(
        {
          error: "Missing required fields: user_id, amount, amount_receive",
        },
        { status: 400 },
      );
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASEURL}/wallets/partner/init-transaction`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.PARTNER_SECRET}`,
          partner_id: partnerId,
        },
        body: JSON.stringify(body),
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
      console.error("init-transaction upstream error", response.status, text);
      return NextResponse.json(
        { error: `Upstream error: ${response.status}`, details: data },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("init-transaction proxy error", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error?.message },
      { status: 500 },
    );
  }
}
