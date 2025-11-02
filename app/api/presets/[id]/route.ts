import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PresetSettingsSchema } from '@/lib/presetSchema';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const preset = await prisma.preset.findUnique({
      where: { id },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!preset) {
      return NextResponse.json(
        {
          status: 'error',
          code: 'E_PRESET_NOT_FOUND',
          message: 'Preset not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: preset,
    });
  } catch (error) {
    console.error('GET /api/presets/[id] error:', error);
    return NextResponse.json(
      {
        status: 'error',
        code: 'E_FETCH_PRESET',
        message: 'Failed to fetch preset',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, isDefault, settings } = body;

    const existingPreset = await prisma.preset.findUnique({
      where: { id },
      select: { brandId: true },
    });

    if (!existingPreset) {
      return NextResponse.json(
        {
          status: 'error',
          code: 'E_PRESET_NOT_FOUND',
          message: 'Preset not found',
        },
        { status: 404 }
      );
    }

    // Validate settings if provided
    if (settings) {
      const validationResult = PresetSettingsSchema.safeParse(settings);
      if (!validationResult.success) {
        return NextResponse.json(
          {
            status: 'error',
            code: 'E_INVALID_SETTINGS',
            message: 'Invalid preset settings',
            errors: validationResult.error.issues,
          },
          { status: 400 }
        );
      }
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.preset.updateMany({
        where: {
          brandId: existingPreset.brandId,
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    if (settings !== undefined) updateData.settings = settings;

    const preset = await prisma.preset.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      status: 'success',
      data: preset,
    });
  } catch (error) {
    console.error('PATCH /api/presets/[id] error:', error);
    return NextResponse.json(
      {
        status: 'error',
        code: 'E_UPDATE_PRESET',
        message: 'Failed to update preset',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if preset exists and has compositions
    const preset = await prisma.preset.findUnique({
      where: { id },
      include: {
        _count: {
          select: { compositions: true },
        },
      },
    });

    if (!preset) {
      return NextResponse.json(
        {
          status: 'error',
          code: 'E_PRESET_NOT_FOUND',
          message: 'Preset not found',
        },
        { status: 404 }
      );
    }

    if (preset._count.compositions > 0) {
      return NextResponse.json(
        {
          status: 'error',
          code: 'E_PRESET_IN_USE',
          message: 'Cannot delete preset that is in use by compositions',
        },
        { status: 409 }
      );
    }

    await prisma.preset.delete({
      where: { id },
    });

    return NextResponse.json({
      status: 'success',
      message: 'Preset deleted successfully',
    });
  } catch (error) {
    console.error('DELETE /api/presets/[id] error:', error);
    return NextResponse.json(
      {
        status: 'error',
        code: 'E_DELETE_PRESET',
        message: 'Failed to delete preset',
      },
      { status: 500 }
    );
  }
}
