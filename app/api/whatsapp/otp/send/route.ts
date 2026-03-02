import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: { message: "Missing phone number" } },
        { status: 400 }
      );
    }

    const response = await fetch(
      "https://genpay.solvexalabs.xyz/api/whatsapp/otp/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MONCASH_API_KEY}`,
          "Business-X-Id": process.env.MONCASH_BUSINESS_ID!,
        },
        body: JSON.stringify({ phoneNumber }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("OTP Send Error:", error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
