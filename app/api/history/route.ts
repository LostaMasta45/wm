import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Fetch all history (with pagination)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // For homepage preview (limit=6), only fetch essential fields
    const isPreview = limit <= 6;
    
    const query = supabaseAdmin
      .from('poster_history')
      .select(
        isPreview 
          ? 'id, template_id, template_name, brand_slug, thumbnail_url, poster_url, settings, created_at'
          : '*',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Add cache headers for better performance
    const headers = new Headers();
    headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    
    return NextResponse.json(
      {
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
      { headers }
    );
  } catch (error: any) {
    console.error('Get history error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Save new history entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      template_id,
      template_name,
      brand_slug,
      poster_url,
      thumbnail_url,
      settings,
      dimensions,
      file_size,
      format = 'png',
      user_id,
    } = body;

    // Validate required fields
    if (!template_id || !template_name || !brand_slug || !poster_url || !settings) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('poster_history')
      .insert({
        template_id,
        template_name,
        brand_slug,
        poster_url,
        thumbnail_url: thumbnail_url || poster_url, // Use poster_url as fallback
        settings,
        dimensions,
        file_size,
        format,
        user_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    console.error('Save history error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
