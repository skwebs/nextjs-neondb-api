import { NextResponse } from 'next/server';
import { z } from 'zod';

export function handleApiError(error: unknown) {
  // Always log the full error for server-side debugging
  console.error('[API Error]:', error);

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { 
        success: false, 
        message: 'Validation failed', 
        errors: error.flatten().fieldErrors 
      },
      { status: 400 }
    );
  }

  if (error instanceof Error) {
    // Check both the error and its cause for the DB error code
    const errObj = error as unknown as Record<string, unknown>;
    const causeObj = (error.cause as unknown as Record<string, unknown>) || {};
    const errCode = errObj.code || causeObj.code;

    // Database Conflict (e.g., Unique Constraint)
    if (errCode === '23505') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Resource already exists',
          code: 'CONFLICT'
        },
        { status: 409 }
      );
    }

    // Custom operational errors can be added here
    
    // Mask raw database/system errors
    return NextResponse.json(
      { 
        success: false, 
        message: 'An internal server error occurred',
        code: 'INTERNAL_SERVER_ERROR'
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { 
      success: false, 
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR'
    },
    { status: 500 }
  );
}

export type ApiResponse<T> = 
  | { data: T; error?: never }
  | { data?: never; error: string; details?: unknown };
