import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Inject businessId if not present or override it to match the secure config
    const payload = {
      ...body,
      businessId: process.env.MONCASH_BUSINESS_ID,
    };

    const response = await fetch(
      "https://genpay.solvexalabs.xyz/api/cashcash/create-payment",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MONCASH_API_KEY}`,
          "Business-X-Id": process.env.MONCASH_BUSINESS_ID!,
        },

        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Upstream API Error:", response.status, errorText);
      return NextResponse.json(
        { error: `Upstream error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Server Proxy Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
