import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// POST /api/boats/[id]/data-plate - Upload engine or generator data plate
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: boatId } = await params;
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

    // Verify ownership and get current boat data
    const { data: boat } = await supabase
      .from('boats')
      .select('*')
      .eq('id', boatId)
      .eq('owner_id', dbUser.id)
      .single();

    if (!boat) {
      return NextResponse.json({ error: 'Boat not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'engine' or 'generator'
    const engineIndex = formData.get('engineIndex') as string; // For engine data plates

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!type || !['engine', 'generator'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Must be "engine" or "generator"' }, { status: 400 });
    }

    // Create unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const fileName = `boats/${boatId}/data-plates/${type}-${engineIndex || ''}-${timestamp}.${fileExt}`;

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // Update boat record
    if (type === 'generator') {
      // Update generator_data_plate field
      const { data: updatedBoat, error: updateError } = await supabase
        .from('boats')
        .update({ generator_data_plate: publicUrl })
        .eq('id', boatId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating boat:', updateError);
        return NextResponse.json({ error: 'Failed to update boat' }, { status: 500 });
      }

      return NextResponse.json({ boat: updatedBoat, url: publicUrl });
    } else {
      // Update engine data plate in engines array
      const index = parseInt(engineIndex || '0');
      const engines = [...(boat.engines || [])];
      
      // Ensure the engine exists at this index
      while (engines.length <= index) {
        engines.push({});
      }
      
      engines[index] = {
        ...engines[index],
        data_plate_url: publicUrl,
      };

      const { data: updatedBoat, error: updateError } = await supabase
        .from('boats')
        .update({ engines })
        .eq('id', boatId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating boat:', updateError);
        return NextResponse.json({ error: 'Failed to update boat' }, { status: 500 });
      }

      return NextResponse.json({ boat: updatedBoat, url: publicUrl });
    }
  } catch (error) {
    console.error('POST /api/boats/[id]/data-plate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/boats/[id]/data-plate - Delete engine or generator data plate
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: boatId } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const engineIndex = searchParams.get('engineIndex');

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

    // Verify ownership and get current boat data
    const { data: boat } = await supabase
      .from('boats')
      .select('*')
      .eq('id', boatId)
      .eq('owner_id', dbUser.id)
      .single();

    if (!boat) {
      return NextResponse.json({ error: 'Boat not found' }, { status: 404 });
    }

    if (type === 'generator') {
      // Clear generator_data_plate field
      const { data: updatedBoat, error: updateError } = await supabase
        .from('boats')
        .update({ generator_data_plate: null })
        .eq('id', boatId)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update boat' }, { status: 500 });
      }

      return NextResponse.json({ boat: updatedBoat });
    } else if (type === 'engine' && engineIndex !== null) {
      // Clear engine data plate
      const index = parseInt(engineIndex);
      const engines = [...(boat.engines || [])];
      
      if (engines[index]) {
        engines[index] = {
          ...engines[index],
          data_plate_url: null,
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

      return NextResponse.json({ boat: updatedBoat });
    }

    return NextResponse.json({ error: 'Invalid type or missing engineIndex' }, { status: 400 });
  } catch (error) {
    console.error('DELETE /api/boats/[id]/data-plate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
