import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const ACCESS_COOKIE = "sb-access-token";
const REFRESH_COOKIE = "sb-refresh-token";
const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
    const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

    if (!accessToken && !refreshToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 },
      );
    }

    let userId: string | undefined;
    let rotatedSession:
      | { access_token: string; refresh_token: string; expires_in: number }
      | null = null;

    if (accessToken) {
      const { data, error } = await supabase.auth.getUser(accessToken);
      if (!error && data?.user) {
        userId = data.user.id;
      }
    }

    if (!userId) {
      if (!refreshToken) {
        return NextResponse.json(
          { error: "Session expired" },
          { status: 401 },
        );
      }
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });
      if (error || !data.session || !data.user) {
        const resp = NextResponse.json(
          { error: "Session expired", details: error?.message },
          { status: 401 },
        );
        resp.cookies.delete(ACCESS_COOKIE);
        resp.cookies.delete(REFRESH_COOKIE);
        return resp;
      }
      userId = data.user.id;
      rotatedSession = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
      };
    }

    const { data: userRow, error: userRowError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (userRowError) {
      return NextResponse.json(
        { error: "Lookup failed", details: userRowError.message },
        { status: 500 },
      );
    }
    if (!userRow) {
      return NextResponse.json(
        { error: "No public.users row for auth id", authUserId: userId },
        { status: 404 },
      );
    }

    const response = NextResponse.json({ ok: 1, user: userRow });

    if (rotatedSession) {
      const secure = process.env.NODE_ENV === "production";
      response.cookies.set(ACCESS_COOKIE, rotatedSession.access_token, {
        httpOnly: true,
        secure,
        sameSite: "lax",
        path: "/",
        maxAge: rotatedSession.expires_in,
      });
      response.cookies.set(REFRESH_COOKIE, rotatedSession.refresh_token, {
        httpOnly: true,
        secure,
        sameSite: "lax",
        path: "/",
        maxAge: REFRESH_COOKIE_MAX_AGE,
      });
    }

    return response;
  } catch (error: any) {
    console.error("Partner session error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: 1 });
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  return response;
}
