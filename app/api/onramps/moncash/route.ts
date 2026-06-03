import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await fetch(
      `${process.env.GEN_PAY_URL}/api/cashcash/create-payment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Business-X-Id": process.env.GEN_PAY_ID!,
          Authorization: `Bearer ${process.env.GEN_PAY_KEY}`,
        },
        body: JSON.stringify({
          ...body,
          businessId: process.env.GEN_PAY_ID,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Upstream API Error:", response.status, errorText);
      return NextResponse.json(
        { error: `Upstream error: ${response.status}`, details: errorText },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Server Proxy Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
