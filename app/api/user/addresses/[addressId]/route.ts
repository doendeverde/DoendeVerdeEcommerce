/**
 * User Address by ID API
 * 
 * GET /api/user/addresses/[addressId] - Get address details
 * PATCH /api/user/addresses/[addressId] - Update address
 * DELETE /api/user/addresses/[addressId] - Delete address
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as addressRepository from "@/repositories/address.repository";
import { addressUpdateSchema } from "@/schemas/checkout.schema";
import { ZodError } from "zod";

interface RouteParams {
  params: Promise<{ addressId: string }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET - Get address details
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const { addressId } = await params;
    const address = await addressRepository.findAddressById(addressId, session.user.id);

    if (!address) {
      return NextResponse.json(
        { success: false, error: "Endereço não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: address,
    });
  } catch (error) {
    console.error("Error fetching address:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao buscar endereço" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH - Update address
// ─────────────────────────────────────────────────────────────────────────────

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const { addressId } = await params;
    const body = await request.json();
    
    // Validate input
    const validated = addressUpdateSchema.parse(body);
    
    // Update address
    const address = await addressRepository.updateAddress(
      addressId,
      session.user.id,
      validated
    );

    if (!address) {
      return NextResponse.json(
        { success: false, error: "Endereço não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: address,
    });
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
    
    console.error("Error updating address:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao atualizar endereço" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE - Delete address
// ─────────────────────────────────────────────────────────────────────────────

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const { addressId } = await params;
    const result = await addressRepository.deleteAddress(addressId, session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Endereço removido com sucesso",
    });
  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao remover endereço" },
      { status: 500 }
    );
  }
}
