export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export interface CostCategory {
  name: string;
  total: number;
  count: number;
  color: string;
}

export interface CostSummary {
  totalAllTime: number;
  totalThisYear: number;
  totalThisMonth: number;
  currency: string;
  byCategory: CostCategory[];
  byMonth: { month: string; total: number }[];
}

// Category colors for the visual chart
const CATEGORY_COLORS: Record<string, string> = {
  'Engine Service': '#3B82F6', // blue
  'Generator Service': '#10B981', // green
  'A/C Service': '#06B6D4', // cyan
  'General Maintenance': '#8B5CF6', // purple
  'Dry Docking': '#F59E0B', // amber
  'Hull Cleaning': '#6366F1', // indigo
  'Electronics': '#EC4899', // pink
  'Safety Equipment': '#EF4444', // red
  'Parts & Supplies': '#14B8A6', // teal
  'Other': '#6B7280', // gray
};

function getCategoryFromItem(item: string): string {
  const lowerItem = item.toLowerCase();
  
  if (lowerItem.includes('engine') || lowerItem.includes('oil change') || lowerItem.includes('impeller')) {
    return 'Engine Service';
  }
  if (lowerItem.includes('generator')) {
    return 'Generator Service';
  }
  if (lowerItem.includes('a/c') || lowerItem.includes('ac ') || lowerItem.includes('air con') || lowerItem.includes('chiller')) {
    return 'A/C Service';
  }
  if (lowerItem.includes('dry dock') || lowerItem.includes('drydock') || lowerItem.includes('haul')) {
    return 'Dry Docking';
  }
  if (lowerItem.includes('hull') || lowerItem.includes('antifoul') || lowerItem.includes('bottom')) {
    return 'Hull Cleaning';
  }
  if (lowerItem.includes('electronic') || lowerItem.includes('radar') || lowerItem.includes('gps') || lowerItem.includes('radio')) {
    return 'Electronics';
  }
  if (lowerItem.includes('safety') || lowerItem.includes('life') || lowerItem.includes('fire') || lowerItem.includes('flare')) {
    return 'Safety Equipment';
  }
  if (lowerItem.includes('part') || lowerItem.includes('filter') || lowerItem.includes('belt') || lowerItem.includes('zinc')) {
    return 'Parts & Supplies';
  }
  
  return 'General Maintenance';
}

// GET /api/costs - Get cost summary across all user's boats
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
      .select('id')
      .eq('owner_id', dbUser.id);

    if (!boats || boats.length === 0) {
      return NextResponse.json({ 
        summary: {
          totalAllTime: 0,
          totalThisYear: 0,
          totalThisMonth: 0,
          currency: 'AED',
          byCategory: [],
          byMonth: [],
        }
      });
    }

    const boatIds = boats.map(b => b.id);
    
    // Get all log entries with costs
    const { data: logs } = await supabase
      .from('log_entries')
      .select('id, date, cost, currency, maintenance_item')
      .in('boat_id', boatIds)
      .not('cost', 'is', null)
      .order('date', { ascending: false });

    if (!logs || logs.length === 0) {
      return NextResponse.json({ 
        summary: {
          totalAllTime: 0,
          totalThisYear: 0,
          totalThisMonth: 0,
          currency: 'AED',
          byCategory: [],
          byMonth: [],
        }
      });
    }

    // Calculate totals
    const now = new Date();
    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth();
    
    let totalAllTime = 0;
    let totalThisYear = 0;
    let totalThisMonth = 0;
    const categoryTotals: Record<string, { total: number; count: number }> = {};
    const monthlyTotals: Record<string, number> = {};
    
    // Default currency (use the most common one)
    const currencyCounts: Record<string, number> = {};
    
    for (const log of logs) {
      const cost = Number(log.cost) || 0;
      if (cost <= 0) continue;
      
      const logDate = new Date(log.date);
      const logYear = logDate.getFullYear();
      const logMonth = logDate.getMonth();
      
      // Track currency
      const currency = log.currency || 'AED';
      currencyCounts[currency] = (currencyCounts[currency] || 0) + 1;
      
      // All time
      totalAllTime += cost;
      
      // This year
      if (logYear === thisYear) {
        totalThisYear += cost;
      }
      
      // This month
      if (logYear === thisYear && logMonth === thisMonth) {
        totalThisMonth += cost;
      }
      
      // By category
      const category = getCategoryFromItem(log.maintenance_item || 'Other');
      if (!categoryTotals[category]) {
        categoryTotals[category] = { total: 0, count: 0 };
      }
      categoryTotals[category].total += cost;
      categoryTotals[category].count += 1;
      
      // By month (last 12 months)
      const monthKey = `${logYear}-${String(logMonth + 1).padStart(2, '0')}`;
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + cost;
    }
    
    // Determine primary currency
    const primaryCurrency = Object.entries(currencyCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'AED';
    
    // Build category array
    const byCategory: CostCategory[] = Object.entries(categoryTotals)
      .map(([name, data]) => ({
        name,
        total: data.total,
        count: data.count,
        color: CATEGORY_COLORS[name] || CATEGORY_COLORS['Other'],
      }))
      .sort((a, b) => b.total - a.total);
    
    // Build monthly array (last 12 months)
    const byMonth: { month: string; total: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(thisYear, thisMonth - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      byMonth.push({
        month: monthLabel,
        total: monthlyTotals[monthKey] || 0,
      });
    }

    const summary: CostSummary = {
      totalAllTime,
      totalThisYear,
      totalThisMonth,
      currency: primaryCurrency,
      byCategory,
      byMonth,
    };

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('GET /api/costs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
