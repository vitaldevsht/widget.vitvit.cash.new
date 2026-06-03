import { NextRequest, NextResponse } from "next/server";

const decodeJwtSub = (token: string | undefined): string | undefined => {
  if (!token) return undefined;
  const parts = token.split(".");
  if (parts.length < 2) return undefined;
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64").toString("utf8"),
    );
    return typeof payload?.sub === "string" ? payload.sub : undefined;
  } catch {
    return undefined;
  }
};

const vaultIdFromUrl = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  try {
    const path = new URL(url).pathname.replace(/\/$/, "");
    const last = path.split("/").pop();
    return last || undefined;
  } catch {
    return undefined;
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, token_1, token_2, amount, sent_to } = body;

    const partner_id =
      body.partner_id || decodeJwtSub(process.env.VAULT_API_TOKEN);
    const vault_id = body.vault_id || vaultIdFromUrl(process.env.VAULT_API_URL);

    if (
      !partner_id ||
      !user_id ||
      !vault_id ||
      !token_1 ||
      !token_2 ||
      amount === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: partner_id, user_id, vault_id, token_1, token_2, amount",
        },
        { status: 400 },
      );
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASEURL}/exchanges/forex`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.PARTNER_SECRET}`,
        },
        body: JSON.stringify({
          partner_id,
          user_id,
          vault_id,
          token_1,
          token_2,
          amount: Number(amount),
          sent_to,
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
