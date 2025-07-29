import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendEmail, getPasswordResetEmailHtml } from "@/lib/email/mailgun";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true }
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: "If an account with that email exists, we've sent you a password reset link."
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Save reset token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      }
    });

    // Send email
    try {
      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
      const emailHtml = getPasswordResetEmailHtml(resetUrl);
      
      await sendEmail(
        email,
        "Reset Your CodiFY Password",
        emailHtml
      );
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // Don't expose email sending errors to user
      return NextResponse.json({
        message: "If an account with that email exists, we've sent you a password reset link."
      });
    }

    return NextResponse.json({
      message: "If an account with that email exists, we've sent you a password reset link."
    });

  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
