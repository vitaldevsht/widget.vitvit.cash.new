import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const PHONE_EMAIL_DOMAIN = process.env.PHONE_EMAIL_DOMAIN || "vf.com";

export async function POST(request: Request) {
  try {
    const { phoneNumber, pin } = await request.json();

    if (!phoneNumber || !pin) {
      return NextResponse.json(
        { success: false, error: { message: "Missing phone number or PIN" } },
        { status: 400 },
      );
    }

    if (!/^\d{6}$/.test(pin)) {
      return NextResponse.json(
        { success: false, error: { message: "PIN must be 6 digits" } },
        { status: 400 },
      );
    }

    const digits = String(phoneNumber).replace(/\D/g, "");

    const emailAttempt = await supabase.auth.signInWithPassword({
      email: `${digits}@${PHONE_EMAIL_DOMAIN}`,
      password: pin,
    });

    let session = emailAttempt.data?.session;
    let user = emailAttempt.data?.user;

    if (!session) {
      const phoneAttempt = await supabase.auth.signInWithPassword({
        phone: digits,
        password: pin,
      });
      session = phoneAttempt.data?.session;
      user = phoneAttempt.data?.user;

      if (!session) {
        return NextResponse.json(
          { success: false, error: { message: "Invalid phone or PIN" } },
          { status: 401 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      access_token: session.access_token,
      token_type: session.token_type,
      expires_in: session.expires_in,
      refresh_token: session.refresh_token,
      user,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 },
    );
  }
}
