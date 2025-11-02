import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET - Fetch all history (with pagination)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabaseAdmin
      .from('poster_history')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
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
