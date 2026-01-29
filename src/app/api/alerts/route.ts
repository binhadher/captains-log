import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { Alert, calculateSeverity, calculateHoursSeverity } from '@/lib/alerts';

// GET /api/alerts - Get alerts across ALL user's boats
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Get all user's boats
    const { data: boats } = await supabase
      .from('boats')
      .select('id, name')
      .eq('owner_id', dbUser.id);

    if (!boats || boats.length === 0) {
      return NextResponse.json({ alerts: [] });
    }

    const alerts: Alert[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const boatIds = boats.map(b => b.id);
    const boatMap = Object.fromEntries(boats.map(b => [b.id, b.name]));

    // Check component service dates across all boats
    const { data: components } = await supabase
      .from('boat_components')
      .select('*')
      .in('boat_id', boatIds);

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
              boatId: comp.boat_id,
              boatName: boatMap[comp.boat_id],
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
              boatId: comp.boat_id,
              boatName: boatMap[comp.boat_id],
            });
          }
        }
      }
    }

    // Check document expiry dates across all boats
    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .in('boat_id', boatIds)
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
              boatId: doc.boat_id,
              boatName: boatMap[doc.boat_id],
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
    console.error('GET /api/alerts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
