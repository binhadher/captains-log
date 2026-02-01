'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Wrench,
  Fuel,
  BarChart3,
  PieChart,
  Download
} from 'lucide-react';

interface ComponentCost {
  id: string;
  name: string;
  type: string;
  category: string;
  totalCost: number;
  entryCount: number;
  currentHours?: number;
  costPerHour?: number;
}

interface MonthlyCost {
  month: string;
  monthLabel: string;
  total: number;
}

interface CostData {
  boat: {
    id: string;
    name: string;
    current_engine_hours: number;
    current_generator_hours: number;
  };
  summary: {
    totalAllTime: number;
    totalThisYear: number;
    totalLastYear: number;
    totalThisMonth: number;
    totalLastMonth: number;
    currency: string;
    averagePerMonth: number;
    entryCount: number;
  };
  byComponent: ComponentCost[];
  byMonth: MonthlyCost[];
  recentExpenses: {
    id: string;
    date: string;
    maintenance_item: string;
    cost: number;
    currency: string;
    component_name?: string;
  }[];
}

function formatCurrency(amount: number, currency: string = 'AED'): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getComponentIcon(type: string): string {
  const icons: Record<string, string> = {
    'engine': '⚙️',
    'inboard_engine': '⚙️',
    'outboard_engine': '🚤',
    'generator': '🔋',
    'ac_chiller': '❄️',
    'ac_air_handler': '🌬️',
    'bow_thruster': '🎯',
    'stern_thruster': '🎯',
    'hydraulic_system': '🔧',
    'shaft': '🔩',
    'propeller': '🌀',
  };
  return icons[type] || '🔧';
}

export default function BoatCostsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: boatId } = use(params);
  const router = useRouter();
  const [data, setData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'overview' | 'components' | 'monthly'>('overview');

  useEffect(() => {
    async function fetchCosts() {
      try {
        const response = await fetch(`/api/boats/${boatId}/costs`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch costs:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCosts();
  }, [boatId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-400 via-teal-500 to-blue-600 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-400 via-teal-500 to-blue-600 flex items-center justify-center">
        <p className="text-white">Failed to load cost data</p>
      </div>
    );
  }

  const { boat, summary, byComponent, byMonth, recentExpenses } = data;
  const maxMonthly = Math.max(...byMonth.map(m => m.total), 1);
  const yearOverYearChange = summary.totalLastYear > 0 
    ? ((summary.totalThisYear - summary.totalLastYear) / summary.totalLastYear) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-400 via-teal-500 to-blue-600">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link 
              href={`/boats/${boatId}`}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Cost Tracking</h1>
              <p className="text-white/70 text-sm">{boat.name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white/95 backdrop-blur rounded-xl p-4 shadow-lg">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <DollarSign className="w-3 h-3" />
              All Time
            </div>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(summary.totalAllTime, summary.currency)}
            </p>
            <p className="text-xs text-gray-500">{summary.entryCount} entries</p>
          </div>
          
          <div className="bg-white/95 backdrop-blur rounded-xl p-4 shadow-lg">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <Calendar className="w-3 h-3" />
              This Year
            </div>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(summary.totalThisYear, summary.currency)}
            </p>
            {yearOverYearChange !== 0 && (
              <p className={`text-xs flex items-center gap-1 ${yearOverYearChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {yearOverYearChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(yearOverYearChange).toFixed(0)}% vs last year
              </p>
            )}
          </div>
          
          <div className="bg-white/95 backdrop-blur rounded-xl p-4 shadow-lg">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <BarChart3 className="w-3 h-3" />
              This Month
            </div>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(summary.totalThisMonth, summary.currency)}
            </p>
            <p className="text-xs text-gray-500">
              avg {formatCurrency(summary.averagePerMonth, summary.currency)}/mo
            </p>
          </div>
          
          <div className="bg-white/95 backdrop-blur rounded-xl p-4 shadow-lg">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <Fuel className="w-3 h-3" />
              Cost/Hour
            </div>
            <p className="text-xl font-bold text-gray-900">
              {boat.current_engine_hours > 0 
                ? formatCurrency(summary.totalAllTime / boat.current_engine_hours, summary.currency)
                : '—'}
            </p>
            <p className="text-xs text-gray-500">
              {boat.current_engine_hours.toLocaleString()} engine hrs
            </p>
          </div>
        </div>

        {/* Monthly Trend Chart */}
        <div className="bg-white/95 backdrop-blur rounded-xl p-4 shadow-lg">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Monthly Spending (Last 12 Months)
          </h2>
          <div className="flex items-end gap-1 h-32">
            {byMonth.map((month, i) => (
              <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                <div 
                  className="w-full bg-teal-500 rounded-t transition-all hover:bg-teal-600 cursor-pointer group relative"
                  style={{ height: `${(month.total / maxMonthly) * 100}%`, minHeight: month.total > 0 ? '4px' : '0' }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {formatCurrency(month.total, summary.currency)}
                  </div>
                </div>
                <span className="text-[10px] text-gray-500 truncate w-full text-center">
                  {month.monthLabel}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cost by Component */}
        <div className="bg-white/95 backdrop-blur rounded-xl p-4 shadow-lg">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            Cost by Component
          </h2>
          {byComponent.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">
              No component costs logged yet. Add maintenance entries with costs to see breakdown.
            </p>
          ) : (
            <div className="space-y-3">
              {byComponent.map((comp) => (
                <div key={comp.id} className="flex items-center gap-3">
                  <span className="text-xl">{getComponentIcon(comp.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-800 truncate">{comp.name}</span>
                      <span className="text-sm font-bold text-gray-900 ml-2">
                        {formatCurrency(comp.totalCost, summary.currency)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{comp.entryCount} entries</span>
                      {comp.costPerHour !== undefined && comp.costPerHour > 0 && (
                        <>
                          <span>•</span>
                          <span>{formatCurrency(comp.costPerHour, summary.currency)}/hr</span>
                        </>
                      )}
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                      <div 
                        className="h-full bg-teal-500 rounded-full"
                        style={{ width: `${(comp.totalCost / summary.totalAllTime) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Expenses */}
        <div className="bg-white/95 backdrop-blur rounded-xl p-4 shadow-lg">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Recent Expenses
          </h2>
          {recentExpenses.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">
              No expenses logged yet.
            </p>
          ) : (
            <div className="space-y-2">
              {recentExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{expense.maintenance_item}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(expense.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {expense.component_name && ` • ${expense.component_name}`}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 ml-2">
                    {formatCurrency(expense.cost, expense.currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
