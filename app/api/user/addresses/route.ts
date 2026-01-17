/**
 * User Addresses API
 * 
 * GET /api/user/addresses - List user addresses
 * POST /api/user/addresses - Create new address
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as addressRepository from "@/repositories/address.repository";
import { addressSchema } from "@/schemas/checkout.schema";
import { ZodError } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// GET - List user addresses
// ─────────────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const addresses = await addressRepository.findUserAddresses(session.user.id);

    return NextResponse.json({
      success: true,
      data: {
        addresses,
        hasAddress: addresses.length > 0,
      },
    });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao buscar endereços" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST - Create new address
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validated = addressSchema.parse(body);
    
    // Create address
    const address = await addressRepository.createAddress(session.user.id, validated);

    return NextResponse.json({
      success: true,
      data: address,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Dados inválidos",
          details: error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }
    
    console.error("Error creating address:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao criar endereço" },
      { status: 500 }
    );
  }
}
