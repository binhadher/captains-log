import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Test database connection
    const { data, error } = await supabase.from('users').select('id').limit(1);
    
    return NextResponse.json({ 
      status: 'ok', 
      time: new Date().toISOString(),
      dbConnected: !error,
      dbError: error?.message || null,
      userCount: data?.length || 0
    });
  } catch (e: any) {
    return NextResponse.json({ 
      status: 'error', 
      error: e.message 
    });
  }
}
