import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { sendEmail, getAlertEmailHtml, getAlertEmailText } from '@/lib/email';

// This endpoint is called by a cron job to send notification emails
// Vercel Cron or external service can trigger this

// Verify cron secret to prevent unauthorized calls
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServerClient();
    const now = new Date();
    const results: { userId: string; sent: boolean; alertCount: number; error?: string }[] = [];

    // Get all users with email notifications enabled
    const { data: usersWithNotifications } = await supabase
      .from('notification_preferences')
      .select(`
        user_id,
        email_enabled,
        email_address,
        notify_document_expiry,
        notify_maintenance_due,
        notify_hours_threshold,
        advance_notice_days,
        digest_mode,
        users (
          id,
          email,
          name
        )
      `)
      .eq('email_enabled', true);

    if (!usersWithNotifications || usersWithNotifications.length === 0) {
      return NextResponse.json({ message: 'No users with notifications enabled', sent: 0 });
    }

    for (const prefs of usersWithNotifications) {
      const user = prefs.users as any;
      if (!user) continue;

      const emailTo = prefs.email_address || user.email;
      if (!emailTo) continue;

      // Get user's boats
      const { data: boats } = await supabase
        .from('boats')
        .select('id, name')
        .eq('owner_id', user.id);

      if (!boats || boats.length === 0) continue;

      const boatIds = boats.map(b => b.id);
      const boatMap = Object.fromEntries(boats.map(b => [b.id, b.name]));
      
      // Calculate the date threshold for advance notice
      const advanceDate = new Date();
      advanceDate.setDate(advanceDate.getDate() + (prefs.advance_notice_days || 14));
      const advanceDateStr = advanceDate.toISOString().split('T')[0];

      const alertsToSend: Array<{
        id: string;
        title: string;
        boatName: string;
        dueText: string;
        type: string;
        link: string;
      }> = [];

      // Get document expiry alerts
      if (prefs.notify_document_expiry) {
        const { data: expiringDocs } = await supabase
          .from('documents')
          .select('id, name, category, expiry_date, boat_id')
          .in('boat_id', boatIds)
          .not('expiry_date', 'is', null)
          .lte('expiry_date', advanceDateStr)
          .gte('expiry_date', now.toISOString().split('T')[0]);

        if (expiringDocs) {
          for (const doc of expiringDocs) {
            const dueDate = new Date(doc.expiry_date);
            const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            alertsToSend.push({
              id: `doc-${doc.id}`,
              title: `${doc.name} expiring`,
              boatName: boatMap[doc.boat_id] || 'Unknown boat',
              dueText: daysUntil <= 0 ? 'Expired!' : `${daysUntil} days`,
              type: 'document_expiry',
              link: `https://captainslog.ae/boats/${doc.boat_id}`,
            });
          }
        }
      }

      // Get maintenance due by date
      if (prefs.notify_maintenance_due) {
        const { data: components } = await supabase
          .from('boat_components')
          .select('id, name, boat_id, next_service_date')
          .in('boat_id', boatIds)
          .not('next_service_date', 'is', null)
          .lte('next_service_date', advanceDateStr)
          .gte('next_service_date', now.toISOString().split('T')[0]);

        if (components) {
          for (const comp of components) {
            const dueDate = new Date(comp.next_service_date);
            const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            alertsToSend.push({
              id: `maint-date-${comp.id}`,
              title: `${comp.name} service due`,
              boatName: boatMap[comp.boat_id] || 'Unknown boat',
              dueText: daysUntil <= 0 ? 'Overdue!' : `${daysUntil} days`,
              type: 'maintenance_date',
              link: `https://captainslog.ae/boats/${comp.boat_id}/components/${comp.id}`,
            });
          }
        }
      }

      // Get maintenance due by hours
      if (prefs.notify_hours_threshold) {
        const { data: hourComponents } = await supabase
          .from('boat_components')
          .select('id, name, boat_id, current_hours, next_service_hours')
          .in('boat_id', boatIds)
          .not('next_service_hours', 'is', null)
          .not('current_hours', 'is', null);

        if (hourComponents) {
          for (const comp of hourComponents) {
            if (comp.current_hours && comp.next_service_hours) {
              const hoursRemaining = comp.next_service_hours - comp.current_hours;
              // Alert if within 50 hours or overdue
              if (hoursRemaining <= 50) {
                alertsToSend.push({
                  id: `maint-hrs-${comp.id}`,
                  title: `${comp.name} service due`,
                  boatName: boatMap[comp.boat_id] || 'Unknown boat',
                  dueText: hoursRemaining <= 0 ? 'Overdue!' : `${hoursRemaining} hrs`,
                  type: 'maintenance_hours',
                  link: `https://captainslog.ae/boats/${comp.boat_id}/components/${comp.id}`,
                });
              }
            }
          }
        }
      }

      // Send email if there are alerts
      if (alertsToSend.length > 0) {
        const result = await sendEmail({
          to: emailTo,
          subject: `⚓ ${alertsToSend.length} maintenance alert${alertsToSend.length > 1 ? 's' : ''} - Captain's Log`,
          html: getAlertEmailHtml(alertsToSend),
          text: getAlertEmailText(alertsToSend),
        });

        results.push({
          userId: user.id,
          sent: result.success,
          alertCount: alertsToSend.length,
          error: result.error,
        });
      }
    }

    const totalSent = results.filter(r => r.sent).length;
    const totalAlerts = results.reduce((sum, r) => sum + r.alertCount, 0);

    return NextResponse.json({ 
      message: `Processed ${results.length} users`,
      sent: totalSent,
      totalAlerts,
      results,
    });
  } catch (error) {
    console.error('Cron notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
