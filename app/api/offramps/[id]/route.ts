import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Missing id", details: "Onramp id is required" },
        { status: 400 },
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASEURL;
    const token = process.env.PARTNER_SECRET;

    if (!baseUrl || !token) {
      return NextResponse.json(
        {
          error: "Server misconfiguration",
          details: "NEXT_PUBLIC_BASEURL or PARTNER_SECRET is not set",
        },
        { status: 500 },
      );
    }

    const response = await fetch(`${baseUrl}/offramps/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Offramps GET Error:", response.status, errorText);
      return NextResponse.json(
        {
          error: `Upstream error: ${response.status}`,
          details: errorText,
        },
        { status: response.status },
      );
    }

    const data = await response.json().catch(() => ({}));
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("delete-deposit proxy error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
