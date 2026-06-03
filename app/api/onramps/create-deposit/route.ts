import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      partner_id,
      customer_id,
      currency,
      method,
      provider,
      amount,
      transaction_id,
      ref_number,
      images = [],
      notes = null,
      approved_by = null,
      approved_date = null,
      approved_key = null,
      hash = null,
    } = body ?? {};

    if (!partner_id || !customer_id || !currency || !amount) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: "partner_id, customer_id, currency and amount are required",
        },
        { status: 400 },
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASEURL;
    const token = process.env.PARTNER_SECRET;

    if (!baseUrl || !token) {
      return NextResponse.json(
        {
          error: "Server misconfiguration",
          details: "NEXT_PUBLIC_BASEURL or VAULT_API_TOKEN is not set",
        },
        { status: 500 },
      );
    }

    const response = await fetch(`${baseUrl}/onramps`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        partner_id,
        customer_id,
        approved_by,
        currency,
        method,
        provider,
        amount,
        transaction_id,
        ref_number,
        images,
        notes,
        approved_date,
        approved_key,
        hash,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Onramps API Error:", response.status, errorText);
      return NextResponse.json(
        {
          error: `Upstream error: ${response.status}`,
          details: errorText,
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("create-deposit proxy error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
