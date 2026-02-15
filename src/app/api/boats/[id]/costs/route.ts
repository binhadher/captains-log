export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/boats/[id]/costs - Get detailed cost breakdown for a boat
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
      .select('id, name, owner_id, current_engine_hours, current_generator_hours')
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

    // Get all maintenance logs with costs
    const { data: logs } = await supabase
      .from('log_entries')
      .select(`
        id,
        date,
        maintenance_item,
        cost,
        currency,
        component_id,
        boat_components (
          id,
          name,
          type,
          category,
          current_hours
        )
      `)
      .eq('boat_id', boatId)
      .not('cost', 'is', null)
      .gt('cost', 0)
      .order('date', { ascending: false });

    // Calculate summary
    const now = new Date();
    const thisYear = now.getFullYear();
    const lastYear = thisYear - 1;
    const thisMonth = now.getMonth();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? lastYear : thisYear;

    let totalAllTime = 0;
    let totalThisYear = 0;
    let totalLastYear = 0;
    let totalThisMonth = 0;
    let totalLastMonth = 0;
    let entryCount = 0;
    
    // Track by component
    const componentCosts: Record<string, {
      id: string;
      name: string;
      type: string;
      category: string;
      totalCost: number;
      entryCount: number;
      currentHours?: number;
    }> = {};
    
    // Track by month (last 12 months)
    const monthlyTotals: Record<string, number> = {};
    
    // Track currency
    const currencyCounts: Record<string, number> = {};
    
    // Recent expenses
    const recentExpenses: Array<{
      id: string;
      date: string;
      maintenance_item: string;
      cost: number;
      currency: string;
      component_name?: string;
    }> = [];

    if (logs) {
      for (const log of logs) {
        const cost = Number(log.cost) || 0;
        if (cost <= 0) continue;
        
        const logDate = new Date(log.date);
        const logYear = logDate.getFullYear();
        const logMonth = logDate.getMonth();
        
        // Track currency
        const currency = log.currency || 'AED';
        currencyCounts[currency] = (currencyCounts[currency] || 0) + 1;
        
        totalAllTime += cost;
        entryCount += 1;
        
        if (logYear === thisYear) {
          totalThisYear += cost;
          if (logMonth === thisMonth) {
            totalThisMonth += cost;
          }
        }
        
        if (logYear === lastYear) {
          totalLastYear += cost;
        }
        
        if (logYear === lastMonthYear && logMonth === lastMonth) {
          totalLastMonth += cost;
        }
        
        // By component
        const component = log.boat_components as any;
        if (component) {
          if (!componentCosts[component.id]) {
            componentCosts[component.id] = {
              id: component.id,
              name: component.name,
              type: component.type,
              category: component.category,
              totalCost: 0,
              entryCount: 0,
              currentHours: component.current_hours,
            };
          }
          componentCosts[component.id].totalCost += cost;
          componentCosts[component.id].entryCount += 1;
        }
        
        // By month
        const monthKey = `${logYear}-${String(logMonth + 1).padStart(2, '0')}`;
        monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + cost;
        
        // Recent (first 10)
        if (recentExpenses.length < 10) {
          recentExpenses.push({
            id: log.id,
            date: log.date,
            maintenance_item: log.maintenance_item,
            cost: cost,
            currency: currency,
            component_name: component?.name,
          });
        }
      }
    }

    // Determine primary currency
    const primaryCurrency = Object.entries(currencyCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'AED';
    
    // Calculate average per month (based on months with data)
    const monthsWithData = Object.keys(monthlyTotals).length || 1;
    const averagePerMonth = totalAllTime / Math.max(monthsWithData, 1);
    
    // Build component array with cost per hour
    const byComponent = Object.values(componentCosts)
      .map(comp => ({
        ...comp,
        costPerHour: comp.currentHours && comp.currentHours > 0 
          ? comp.totalCost / comp.currentHours 
          : undefined,
      }))
      .sort((a, b) => b.totalCost - a.totalCost);
    
    // Build monthly array (last 12 months)
    const byMonth: { month: string; monthLabel: string; total: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(thisYear, thisMonth - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleDateString('en-US', { month: 'short' });
      byMonth.push({
        month: monthKey,
        monthLabel,
        total: monthlyTotals[monthKey] || 0,
      });
    }

    return NextResponse.json({
      boat: {
        id: boat.id,
        name: boat.name,
        current_engine_hours: boat.current_engine_hours || 0,
        current_generator_hours: boat.current_generator_hours || 0,
      },
      summary: {
        totalAllTime,
        totalThisYear,
        totalLastYear,
        totalThisMonth,
        totalLastMonth,
        currency: primaryCurrency,
        averagePerMonth,
        entryCount,
      },
      byComponent,
      byMonth,
      recentExpenses,
    });
  } catch (error) {
    console.error('GET /api/boats/[id]/costs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
