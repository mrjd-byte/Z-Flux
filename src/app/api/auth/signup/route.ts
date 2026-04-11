import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { ensureUniqueWalletId } from "@/lib/wallet_utils";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const walletId = await ensureUniqueWalletId();

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          isOnboarded: false,
          walletId,
          walletBalance: 0,
        },
      });

      const wallet = await tx.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
        },
      });

      return { user, wallet };
    });

    const token = signToken({ userId: result.user.id, email: result.user.email });

    return NextResponse.json(
      { message: "User created", token, user: { id: result.user.id, email: result.user.email } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
