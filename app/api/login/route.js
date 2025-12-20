// app/api/login/route.js
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const { identifier, password } = await request.json();
    if (!identifier || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    // Try matching username first, then email
    let { data: user, error } = await supabase.from("profile_users").select("*").eq("username", identifier).single();

    if (error || !user) {
      const res2 = await supabase.from("profile_users").select("*").eq("email", identifier).single();
      user = res2.data;
      error = res2.error;
    }

    if (error || !user) return NextResponse.json({ error: "User not found" }, { status: 400 });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return NextResponse.json({ error: "Incorrect password" }, { status: 400 });

    const { password: _pw, ...userWithoutPw } = user;
    return NextResponse.json({ user: userWithoutPw }, { status: 200 });
  } catch (err) {
    console.error("login error", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
