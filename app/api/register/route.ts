import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/schemas/auth.schema";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      // Transforma arrays de erro em strings únicas
      const fieldErrors = result.error.flatten().fieldErrors;
      const errors: Record<string, string> = {};
      
      Object.entries(fieldErrors).forEach(([key, value]) => {
        if (value && value.length > 0) {
          errors[key] = value[0]; // Pega primeira mensagem do array
        }
      });
      
      return NextResponse.json(
        {
          success: false,
          errors,
        },
        { status: 400 }
      );
    }

    const { fullName, email, password, birthDate, whatsapp } = result.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          errors: { email: "Email já cadastrado" },
        },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        fullName,
        email: email.toLowerCase(),
        passwordHash,
        birthDate: new Date(birthDate),
        whatsapp: whatsapp || null,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          name: user.fullName,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao criar conta. Tente novamente.",
      },
      { status: 500 }
    );
  }
}
