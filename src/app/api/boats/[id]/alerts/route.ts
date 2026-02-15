export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { Alert, calculateSeverity, calculateHoursSeverity } from '@/lib/alerts';

// GET /api/boats/[id]/alerts - Get alerts for a boat
export async function GET(
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

    // Verify boat access (owner or crew)
    const { data: boat } = await supabase
      .from('boats')
      .select('id, name, owner_id')
      .eq('id', boatId)
      .single();

    if (!boat) {
      return NextResponse.json({ error: 'Boat not found' }, { status: 404 });
    }

    const isOwner = boat.owner_id === dbUser.id;
    if (!isOwner) {
      const { data: crewAccess } = await supabase
        .from('boat_users')
        .select('id')
        .eq('boat_id', boatId)
        .eq('user_id', userId)
        .single();
      if (!crewAccess) {
        return NextResponse.json({ error: 'Boat not found' }, { status: 404 });
      }
    }

    const alerts: Alert[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check component service dates
    const { data: components } = await supabase
      .from('boat_components')
      .select('*')
      .eq('boat_id', boatId);

    if (components) {
      for (const comp of components) {
        // Date-based service due
        if (comp.next_service_date) {
          const dueDate = new Date(comp.next_service_date);
          const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilDue <= 30) {
            alerts.push({
              id: `comp-date-${comp.id}`,
              type: 'maintenance_date',
              severity: calculateSeverity(daysUntilDue),
              title: `${comp.name} service due`,
              description: `Scheduled maintenance`,
              dueDate: comp.next_service_date,
              componentId: comp.id,
              componentName: comp.name,
              boatId: boat.id,
              boatName: boat.name,
            });
          }
        }

        // Hours-based service due
        if (comp.next_service_hours && comp.current_hours) {
          const hoursUntilDue = comp.next_service_hours - comp.current_hours;
          
          if (hoursUntilDue <= 50) {
            alerts.push({
              id: `comp-hours-${comp.id}`,
              type: 'maintenance_hours',
              severity: calculateHoursSeverity(hoursUntilDue),
              title: `${comp.name} service due`,
              description: `Based on running hours`,
              dueHours: comp.next_service_hours,
              currentHours: comp.current_hours,
              componentId: comp.id,
              componentName: comp.name,
              boatId: boat.id,
              boatName: boat.name,
            });
          }
        }
      }
    }

    // Check document expiry dates
    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .eq('boat_id', boatId)
      .not('expiry_date', 'is', null);

    if (documents) {
      for (const doc of documents) {
        if (doc.expiry_date) {
          const expiryDate = new Date(doc.expiry_date);
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          const reminderDays = doc.reminder_days || 30;
          
          if (daysUntilExpiry <= reminderDays) {
            alerts.push({
              id: `doc-${doc.id}`,
              type: 'document_expiry',
              severity: calculateSeverity(daysUntilExpiry),
              title: `${doc.name} expires`,
              description: doc.category.charAt(0).toUpperCase() + doc.category.slice(1),
              dueDate: doc.expiry_date,
              documentId: doc.id,
              boatId: boat.id,
              boatName: boat.name,
            });
          }
        }
      }
    }

    // Check safety equipment expiry and service dates
    const { data: safetyEquipment } = await supabase
      .from('safety_equipment')
      .select('*')
      .eq('boat_id', boatId);

    const SAFETY_TYPE_LABELS: Record<string, string> = {
      fire_extinguisher: 'Fire Extinguishers',
      engine_room_fire_system: 'Engine Room Fire System',
      life_jacket: 'Life Jackets',
      life_raft: 'Life Raft',
      flares: 'Flares',
      epirb: 'EPIRB',
      first_aid_kit: 'First Aid Kit',
      life_ring: 'Life Ring',
      fire_blanket: 'Fire Blanket',
      other: 'Safety Equipment',
    };

    if (safetyEquipment) {
      for (const item of safetyEquipment) {
        const itemName = item.type === 'other' ? item.type_other : SAFETY_TYPE_LABELS[item.type] || item.type;
        
        // Check expiry date
        if (item.expiry_date) {
          const expiryDate = new Date(item.expiry_date);
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpiry <= 30) {
            alerts.push({
              id: `safety-exp-${item.id}`,
              type: 'document_expiry', // Reuse type for expiry alerts
              severity: calculateSeverity(daysUntilExpiry),
              title: `${itemName} expires`,
              description: 'Safety equipment',
              dueDate: item.expiry_date,
              boatId: boat.id,
              boatName: boat.name,
            });
          }
        }
        
        // Check service due date
        if (item.next_service_date) {
          const serviceDate = new Date(item.next_service_date);
          const daysUntilService = Math.ceil((serviceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilService <= 30) {
            alerts.push({
              id: `safety-svc-${item.id}`,
              type: 'maintenance_date',
              severity: calculateSeverity(daysUntilService),
              title: `${itemName} service due`,
              description: 'Safety equipment inspection',
              dueDate: item.next_service_date,
              boatId: boat.id,
              boatName: boat.name,
            });
          }
        }
      }
    }

    // Sort alerts by severity then date
    const severityOrder = { overdue: 0, urgent: 1, upcoming: 2, info: 3 };
    alerts.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      
      // Then by date
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return 0;
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('GET /api/boats/[id]/alerts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
