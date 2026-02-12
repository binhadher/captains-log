export const dynamic = 'force-dynamic';

import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

const defaultPreferences = {
  email_enabled: false,
  email_address: null,
  push_enabled: false,
  notify_document_expiry: true,
  notify_maintenance_due: true,
  notify_hours_threshold: true,
  advance_notice_days: 14,
  digest_mode: 'immediate',
};

// GET /api/settings/notifications - Get user's notification preferences
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();
    const userEmail = user?.emailAddresses?.[0]?.emailAddress || '';

    const supabase = createServerClient();
    
    // Get user's database ID
    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get preferences
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', dbUser.id)
      .single();

    return NextResponse.json({ 
      preferences: preferences || defaultPreferences,
      userEmail,
    });
  } catch (error) {
    console.error('GET /api/settings/notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/settings/notifications - Update user's notification preferences
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const supabase = createServerClient();
    
    // Get user's database ID
    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Validate input
    const preferences = {
      user_id: dbUser.id,
      email_enabled: Boolean(body.email_enabled),
      email_address: body.email_address || null,
      push_enabled: Boolean(body.push_enabled),
      notify_document_expiry: body.notify_document_expiry !== false,
      notify_maintenance_due: body.notify_maintenance_due !== false,
      notify_hours_threshold: body.notify_hours_threshold !== false,
      advance_notice_days: Number(body.advance_notice_days) || 14,
      digest_mode: ['immediate', 'daily', 'weekly'].includes(body.digest_mode) 
        ? body.digest_mode 
        : 'immediate',
    };

    // Upsert preferences
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert(preferences, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('Error saving preferences:', error);
      return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
    }

    return NextResponse.json({ preferences: data });
  } catch (error) {
    console.error('PUT /api/settings/notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
