export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { saveFile } from '@/lib/local-storage';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: boatId } = await params;
    const supabase = createServerClient();

    // Verify boat ownership
    const { data: boat } = await supabase
      .from('boats')
      .select('id, owner_id')
      .eq('id', boatId)
      .single();

    if (!boat) return NextResponse.json({ error: 'Boat not found' }, { status: 404 });

    // Verify user owns this boat
    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!dbUser || boat.owner_id !== dbUser.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'engine', 'generator', 'boat'
    const engineIndex = formData.get('engine_index') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!['engine', 'generator', 'boat'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Must be "engine", "generator", or "boat"' }, { status: 400 });
    }

    // Save to local storage with a descriptive name
    const { publicUrl } = await saveFile(file, dbUser.id, boatId);

    // Update boat record
    if (type === 'boat') {
      const { data: updatedBoat, error: updateError } = await supabase
        .from('boats')
        .update({ boat_data_plate: publicUrl })
        .eq('id', boatId)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update boat' }, { status: 500 });
      }
      return NextResponse.json({ boat: updatedBoat, url: publicUrl });
    } else if (type === 'generator') {
      const { data: updatedBoat, error: updateError } = await supabase
        .from('boats')
        .update({ generator_data_plate: publicUrl })
        .eq('id', boatId)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update boat' }, { status: 500 });
      }
      return NextResponse.json({ boat: updatedBoat, url: publicUrl });
    } else {
      // Engine type
      const { data: boat } = await supabase
        .from('boats')
        .select('engines')
        .eq('id', boatId)
        .single();

      if (!boat) {
        return NextResponse.json({ error: 'Boat not found' }, { status: 404 });
      }

      const engines = boat.engines || [];
      const engineIdx = engineIndex ? parseInt(engineIndex) - 1 : 0;
      
      if (engineIdx >= 0 && engineIdx < engines.length) {
        engines[engineIdx] = {
          ...engines[engineIdx],
          data_plate_url: publicUrl,
        };
      }

      const { data: updatedBoat, error: updateError } = await supabase
        .from('boats')
        .update({ engines })
        .eq('id', boatId)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update boat' }, { status: 500 });
      }
      return NextResponse.json({ boat: updatedBoat, url: publicUrl });
    }
  } catch (error) {
    console.error('Data plate upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
