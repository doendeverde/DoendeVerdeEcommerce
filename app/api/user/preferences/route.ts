/**
 * User Preferences API
 * 
 * GET /api/user/preferences - Get user preferences
 * POST /api/user/preferences - Create preferences (if not exists)
 * PATCH /api/user/preferences - Update preferences
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as preferencesRepository from "@/repositories/preferences.repository";
import { preferencesSchema, preferencesUpdateSchema } from "@/schemas/checkout.schema";
import { ZodError } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// GET - Get user preferences
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

    const preferences = await preferencesRepository.findUserPreferences(session.user.id);
    const summary = await preferencesRepository.getPreferencesSummary(session.user.id);

    return NextResponse.json({
      success: true,
      data: {
        preferences,
        hasPreferences: summary.hasPreferences,
        isComplete: summary.isComplete,
        summary: summary.summary,
      },
    });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao buscar preferências" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST - Create preferences
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

    // Check if preferences already exist
    const existing = await preferencesRepository.userHasPreferences(session.user.id);
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Preferências já existem. Use PATCH para atualizar." },
        { status: 409 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validated = preferencesSchema.parse(body);
    
    // Create preferences
    const preferences = await preferencesRepository.createPreferences(
      session.user.id,
      validated
    );

    return NextResponse.json({
      success: true,
      data: preferences,
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
    
    console.error("Error creating preferences:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao criar preferências" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH - Update preferences
// ─────────────────────────────────────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Debug: Log incoming body
    console.log("[PATCH /api/user/preferences] Body received:", JSON.stringify(body, null, 2));
    
    // Validate input
    const validated = preferencesUpdateSchema.parse(body);
    
    // Check if preferences exist - if not, create them
    const existing = await preferencesRepository.userHasPreferences(session.user.id);
    
    let preferences;
    if (existing) {
      preferences = await preferencesRepository.updatePreferences(
        session.user.id,
        validated
      );
    } else {
      // Create instead of update
      preferences = await preferencesRepository.createPreferences(
        session.user.id,
        validated as any
      );
    }

    return NextResponse.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      console.log("[PATCH /api/user/preferences] Validation error:", JSON.stringify(error.issues, null, 2));
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
    
    console.error("Error updating preferences:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao atualizar preferências" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT - Upsert preferences (create or update)
// ─────────────────────────────────────────────────────────────────────────────

export async function PUT(request: NextRequest) {
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
    const validated = preferencesSchema.parse(body);
    
    // Upsert preferences
    const preferences = await preferencesRepository.upsertPreferences(
      session.user.id,
      validated
    );

    return NextResponse.json({
      success: true,
      data: preferences,
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
    
    console.error("Error upserting preferences:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao salvar preferências" },
      { status: 500 }
    );
  }
}
