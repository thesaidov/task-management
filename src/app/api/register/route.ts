// src/app/api/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/mailer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    // Register user
    const user = await registerUser(name, email, password);

    // create verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes

    await prisma.verification.create({
      data: {
        userId: user.id,
        code,
        expiresAt,
      },
    });

    // send email (best-effort)
    try {
      await sendVerificationEmail(email, code);
    } catch (e) {
      // don't expose internal errors
      console.error("Failed to send verification email", e);
    }

    return NextResponse.json(
      { message: "Verification code sent to email" },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
