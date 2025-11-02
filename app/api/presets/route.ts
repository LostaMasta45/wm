import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PresetSettingsSchema } from '@/lib/presetSchema';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const brandId = searchParams.get('brand');
    const brandSlug = searchParams.get('slug');

    let where: any = {};

    if (brandId) {
      where.brandId = brandId;
    } else if (brandSlug) {
      const brand = await prisma.brand.findUnique({
        where: { slug: brandSlug },
        select: { id: true },
      });

      if (!brand) {
        return NextResponse.json(
          {
            status: 'error',
            code: 'E_BRAND_NOT_FOUND',
            message: 'Brand not found',
          },
          { status: 404 }
        );
      }

      where.brandId = brand.id;
    }

    const presets = await prisma.preset.findMany({
      where,
      select: {
        id: true,
        name: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({
      status: 'success',
      data: presets,
    });
  } catch (error) {
    console.error('GET /api/presets error:', error);
    return NextResponse.json(
      {
        status: 'error',
        code: 'E_FETCH_PRESETS',
        message: 'Failed to fetch presets',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandId, name, isDefault = false, settings, createdBy } = body;

    if (!brandId || !name || !settings || !createdBy) {
      return NextResponse.json(
        {
          status: 'error',
          code: 'E_INVALID_INPUT',
          message: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    // Validate settings schema
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

    // If setting as default, unset other defaults for this brand
    if (isDefault) {
      await prisma.preset.updateMany({
        where: { brandId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const preset = await prisma.preset.create({
      data: {
        brandId,
        name,
        isDefault,
        settings: validationResult.data,
        createdBy,
      },
    });

    return NextResponse.json(
      {
        status: 'success',
        data: preset,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/presets error:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          status: 'error',
          code: 'E_DUPLICATE_NAME',
          message: 'Preset name already exists for this brand',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        status: 'error',
        code: 'E_CREATE_PRESET',
        message: 'Failed to create preset',
      },
      { status: 500 }
    );
  }
}
