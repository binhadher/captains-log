export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createServerClient();
    
    // Test database connection
    const { data, error } = await supabase.from('users').select('id').limit(1);
    
    return NextResponse.json({ 
      status: 'ok', 
      time: new Date().toISOString(),
      dbConnected: !error,
      dbError: error?.message || null,
      userCount: data?.length || 0
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ 
      status: 'error', 
      error: message
    });
  }
}
