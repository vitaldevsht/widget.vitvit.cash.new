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

export interface ErrorResponse {
  error: string;
  code: string;
  details?: string;
  required?: string[];
}

function httpError(
  status: number,
  code: string,
  message: string,
  extra?: Partial<ErrorResponse>,
) {
  return NextResponse.json<ErrorResponse>(
    { error: message, code, ...extra },
    { status },
  );
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    let body: Record<string, any> = {};

    if (
      request.headers.get("content-length") &&
      request.headers.get("content-length") !== "0"
    ) {
      if (!contentType.includes("application/json")) {
        return httpError(
          415,
          "UNSUPPORTED_MEDIA_TYPE",
          "Content-Type must be application/json",
        );
      }
      try {
        body = await request.json();
      } catch (e: any) {
        return httpError(400, "INVALID_JSON", "Malformed JSON body", {
          details: e?.message,
        });
      }
    }

    const vitvit_user_id =
      request.headers.get("vitvit_user_id") ?? body.vitvit_user_id;
    const deposit_address =
      request.headers.get("deposit_address") ?? body.deposit_address;
    const initOp = request.headers.get("init_op") ?? body.init_op;
    const amount = request.headers.get("amount") ?? body.amount;
    const partner_id = request.headers.get("partner_id") ?? body.partner_id;
    const partner_fee = request.headers.get("partner_fee") ?? body.partner_fee;
    const partner_address =
      request.headers.get("partner_address") ?? body.partner_address;

    const missing: string[] = [];
    if (!partner_id) missing.push("partner_id");
    if (!vitvit_user_id) missing.push("vitvit_user_id");
    // if (!deposit_address) missing.push("deposit_address");
    if (!initOp) missing.push("init_op");
    if (!amount) missing.push("amount");

    if (missing.length > 0) {
      return httpError(
        400,
        "MISSING_PARAMETERS",
        "Missing required parameters",
        {
          required: missing,
        },
      );
    }

    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return httpError(
        422,
        "INVALID_AMOUNT",
        "amount must be a positive number",
      );
    }

    if (partner_fee !== undefined && partner_fee !== null) {
      const feeNum = Number(partner_fee);
      if (!Number.isFinite(feeNum) || feeNum < 0) {
        return httpError(
          422,
          "INVALID_PARTNER_FEE",
          "partner_fee must be a non-negative number",
        );
      }
    }

    const { data: userRow, error: userRowError } = await supabase
      .from("users")
      .select("*")
      .eq("id", vitvit_user_id)
      .single();

    if (userRowError) {
      if (userRowError.code === "PGRST116") {
        return httpError(404, "USER_NOT_FOUND", "User not found", {
          details: userRowError.message,
        });
      }
      return httpError(502, "DB_ERROR", "Database query failed", {
        details: userRowError.message,
      });
    }

    if (!userRow) {
      return httpError(404, "USER_NOT_FOUND", "User not found");
    }

    const baseUrl = request.nextUrl.origin;
    const params = new URLSearchParams({
      clientId: String(userRow.id),
      phone: String(userRow.phone ?? ""),
      partner_id: String(partner_id ?? ""),
      external_address: String(deposit_address),
      amount: String(amountNum),
      partner_fee: String(partner_fee ?? ""),
      partner_address: String(partner_address ?? ""),
    });

    return NextResponse.json({
      ok: 1,
      ["url_" + initOp]: `${baseUrl}/partner/${initOp}?${params.toString()}`,
    });
  } catch (error: any) {
    console.error("log-user API Error:", error);
    return httpError(500, "INTERNAL_ERROR", "Internal Server Error", {
      details: error?.message,
    });
  }
}

export async function GET() {
  return httpError(405, "METHOD_NOT_ALLOWED", "Method Not Allowed");
}
