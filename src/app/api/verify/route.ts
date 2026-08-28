import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and code are required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const verification = await prisma.verification.findFirst({
      where: { userId: user.id, code },
    });
    if (!verification) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    if (verification.expiresAt < new Date()) {
      await prisma.verification.delete({ where: { id: verification.id } });
      return NextResponse.json({ error: "Code expired" }, { status: 400 });
    }

    // mark user verified
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    // delete verification record
    await prisma.verification.delete({ where: { id: verification.id } });

    // issue JWT
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET not set");
    const token = jwt.sign({ id: user.id, email: user.email }, secret, {
      expiresIn: "7d",
    });

    const res = NextResponse.json({ message: "Verified" });
    res.cookies.set("token", token, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (err) {
    if (err instanceof Error)
      return NextResponse.json({ error: err.message }, { status: 500 });
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
