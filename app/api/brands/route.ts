import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('user');

    let query = supabaseAdmin
      .from('brands')
      .select('id, name, slug, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('owner_user_id', userId);
    }

    const { data: brands, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      status: 'success',
      data: brands,
    });
  } catch (error) {
    console.error('GET /api/brands error:', error);
    return NextResponse.json(
      {
        status: 'error',
        code: 'E_FETCH_BRANDS',
        message: 'Failed to fetch brands',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, ownerUserId } = body;

    if (!name || !slug || !ownerUserId) {
      return NextResponse.json(
        {
          status: 'error',
          code: 'E_INVALID_INPUT',
          message: 'Missing required fields: name, slug, ownerUserId',
        },
        { status: 400 }
      );
    }

    const { data: brand, error } = await supabaseAdmin
      .from('brands')
      .insert({
        name,
        slug,
        owner_user_id: ownerUserId,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          {
            status: 'error',
            code: 'E_DUPLICATE_SLUG',
            message: 'Brand slug already exists',
          },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      status: 'success',
      data: brand,
    }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/brands error:', error);

    return NextResponse.json(
      {
        status: 'error',
        code: 'E_CREATE_BRAND',
        message: 'Failed to create brand',
      },
      { status: 500 }
    );
  }
}
