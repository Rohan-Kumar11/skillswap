// app/api/signup/route.js
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const { full_name, username, email, mobile, password } = await request.json();

    if (!full_name || !username || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("profile_users")
      .insert([{
        full_name,
        username,
        email,
        mobile: mobile || "",
        password: hashedPassword,
        swaps: 0,
        points: 0,
        rating: 0
      }])
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // remove password before returning
    const { password: _pw, ...userWithoutPw } = data;
    return NextResponse.json({ user: userWithoutPw }, { status: 200 });
  } catch (err) {
    console.error("signup error", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
