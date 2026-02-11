// src/app/api/register/route.ts
import { NextRequest, NextResponse } from "next/server"
import { registerUser } from "@/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      )
    }

    // Register user
    const user = await registerUser(name, email, password)

    return NextResponse.json(
      { message: "User registered successfully", user },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}