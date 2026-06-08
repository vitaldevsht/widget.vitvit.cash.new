import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASEURL}/exchanges/key-value`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.PARTNER_SECRET}`,
        },
        body: JSON.stringify({
          key: "notes",
          value: orderId,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Upstream error: ${response.status}`, details: errorText },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Exchange Forex API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
