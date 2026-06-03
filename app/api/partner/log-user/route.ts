import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export interface VaultRate {
  label: string;
  HTGV_USDC?: number;
  USDC_HTGV?: number;
}

export interface VaultResponse {
  id: string;
  name: string;
  wallet_address: string;
  rates: VaultRate[];
}

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, any> = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const accessToken =
      request.headers.get("access_token") ?? body.access_token;
    const externalAddress =
      request.headers.get("external_address") ?? body.external_address;
    const initOp = request.headers.get("init_op") ?? body.init_op;
    const amount = request.headers.get("amount") ?? body.amount;

    if (!accessToken || !externalAddress || !initOp || !amount) {
      return NextResponse.json(
        {
          error: "Missing required parameters",
          required: ["access_token", "external_address", "init_op", "amount"],
        },
        { status: 400 },
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Invalid or expired access_token" },
        { status: 401 },
      );
    }

    const { data: userRow, error: userRowError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    console.log(userRow);

    if (userRowError || !userRow) {
      return NextResponse.json(
        {
          error: "User not found in users table",
          details: userRowError?.message,
        },
        { status: 404 },
      );
    }

    const baseUrl = request.nextUrl.origin;

    const response = {
      ok: 1,
      url_deposit: `${baseUrl}/partner/deposit?clientId=${userRow?.id}&phone=${userRow?.phone}&partner_id=${userRow?.partner_id}&first_name=${userRow?.first_name}&external_address=${externalAddress}&amount=${amount || 100}&access_token=${accessToken}`,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Quote API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
