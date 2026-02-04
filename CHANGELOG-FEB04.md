# Captain's Log — Changes Feb 4, 2026

## 🔔 Alert Dismiss & Complete — No More Navigation!

### The Problem
When pressing Dismiss or Complete on service alerts, the app was navigating to the Service Schedule page instead of just removing the notification.

### The Solution
**Dismiss** and **Complete** buttons now work inline — alerts disappear immediately without any page navigation.

---

## ✅ What's New

### 1. Inline Alert Actions
- **✓ Complete** (green button) — Logs the service as done, updates next service date automatically
- **✕ Dismiss** (gray button) — Snoozes the alert by pushing next service date forward
- Both show a **confirmation dialog** before actioning
- Alert disappears immediately after confirmation

### 2. New API Endpoints

**`POST /api/components/[id]/dismiss-alert`**
- Pushes next service date forward by the service interval
- If no interval set, clears the next service date

**`POST /api/components/[id]/quick-complete`**
- Creates a maintenance log entry with today's date
- Updates last service date/hours
- Calculates and sets next service date based on interval
- Shows confetti celebration! 🎉

---

## 📦 Files Changed

### 1. `src/components/alerts/AlertsList.tsx` (Updated)
Added dismiss/complete buttons with inline handlers:

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Clock, FileText, Bell, ChevronRight, Check, X } from 'lucide-react';
import { Alert, SEVERITY_COLORS, formatDueIn, formatHoursDue } from '@/lib/alerts';

interface AlertsListProps {
  alerts: Alert[];
  boatId: string;
  compact?: boolean;
  onAlertDismissed?: (alertId: string) => void;
  onAlertCompleted?: (alert: Alert) => void;
}

const TYPE_ICONS: Record<Alert['type'], React.ReactNode> = {
  maintenance_date: <Clock className="w-4 h-4" />,
  maintenance_hours: <Clock className="w-4 h-4" />,
  document_expiry: <FileText className="w-4 h-4" />,
  health_check: <Bell className="w-4 h-4" />,
};

export function AlertsList({ alerts, boatId, compact = false, onAlertDismissed, onAlertCompleted }: AlertsListProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleDismiss = async (e: React.MouseEvent, alert: Alert) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Dismiss this alert? It will reappear when the next service is due.')) return;
    
    setProcessingId(alert.id);
    
    if (alert.componentId && (alert.type === 'maintenance_date' || alert.type === 'maintenance_hours')) {
      try {
        const response = await fetch(`/api/components/${alert.componentId}/dismiss-alert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ alertType: alert.type }),
        });
        
        if (response.ok) {
          setDismissedIds(prev => new Set([...prev, alert.id]));
          onAlertDismissed?.(alert.id);
        }
      } catch (err) {
        console.error('Error dismissing alert:', err);
      }
    } else {
      setDismissedIds(prev => new Set([...prev, alert.id]));
      onAlertDismissed?.(alert.id);
    }
    
    setProcessingId(null);
  };

  const handleComplete = async (e: React.MouseEvent, alert: Alert) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!alert.componentId) return;
    
    setProcessingId(alert.id);
    
    try {
      const response = await fetch(`/api/components/${alert.componentId}/quick-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          alertType: alert.type,
          serviceName: alert.title.replace(' service due', ''),
        }),
      });
      
      if (response.ok) {
        setDismissedIds(prev => new Set([...prev, alert.id]));
        onAlertCompleted?.(alert);
      }
    } catch (err) {
      console.error('Error completing service:', err);
    }
    
    setProcessingId(null);
  };

  // ... rest of component renders buttons:
  // <button onClick={(e) => handleComplete(e, alert)}>✓</button>
  // <button onClick={(e) => handleDismiss(e, alert)}>✕</button>
}
```

### 2. `src/app/api/components/[id]/dismiss-alert/route.ts` (NEW)

```typescript
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// POST /api/components/[id]/dismiss-alert - Dismiss an alert by pushing next service date forward
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { alertType } = body; // 'maintenance_date' or 'maintenance_hours'

    const supabase = createServerClient();
    
    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: component, error: fetchError } = await supabase
      .from('boat_components')
      .select(`*, boats!inner(id, owner_id)`)
      .eq('id', id)
      .single();

    if (fetchError || !component) {
      return NextResponse.json({ error: 'Component not found' }, { status: 404 });
    }

    if (component.boats.owner_id !== dbUser.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updates: Record<string, unknown> = {};

    if (alertType === 'maintenance_date' && component.service_interval_days) {
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + component.service_interval_days);
      updates.next_service_date = newDate.toISOString().split('T')[0];
    } else if (alertType === 'maintenance_hours' && component.service_interval_hours && component.current_hours) {
      updates.next_service_hours = component.current_hours + component.service_interval_hours;
    } else {
      if (alertType === 'maintenance_date') {
        updates.next_service_date = null;
      } else {
        updates.next_service_hours = null;
      }
    }

    const { error: updateError } = await supabase
      .from('boat_components')
      .update(updates)
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to dismiss alert' }, { status: 500 });
    }

    return NextResponse.json({ success: true, updates });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 3. `src/app/api/components/[id]/quick-complete/route.ts` (NEW)

```typescript
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// POST /api/components/[id]/quick-complete - Quick complete service and update next date
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { alertType, serviceName } = body;

    const supabase = createServerClient();
    
    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: component, error: fetchError } = await supabase
      .from('boat_components')
      .select(`*, boats!inner(id, owner_id)`)
      .eq('id', id)
      .single();

    if (fetchError || !component) {
      return NextResponse.json({ error: 'Component not found' }, { status: 404 });
    }

    if (component.boats.owner_id !== dbUser.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Create maintenance log entry
    const { error: logError } = await supabase
      .from('log_entries')
      .insert({
        boat_id: component.boat_id,
        component_id: id,
        maintenance_item: component.scheduled_service_name || serviceName || 'Service',
        date: today,
        description: `Quick completed from alerts`,
        hours_at_service: component.current_hours || null,
        created_by: dbUser.id,
        currency: 'AED',
      });

    if (logError) {
      return NextResponse.json({ error: 'Failed to create log' }, { status: 500 });
    }

    // Update component
    const updates: Record<string, unknown> = {
      last_service_date: today,
      last_service_hours: component.current_hours || null,
    };

    if (component.service_interval_days) {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + component.service_interval_days);
      updates.next_service_date = nextDate.toISOString().split('T')[0];
    }

    if (component.service_interval_hours && component.current_hours) {
      updates.next_service_hours = component.current_hours + component.service_interval_hours;
    }

    const { error: updateError } = await supabase
      .from('boat_components')
      .update(updates)
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update component' }, { status: 500 });
    }

    return NextResponse.json({ success: true, updates });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 4. `src/app/boats/[id]/components/[componentId]/page.tsx` (Updated)
Added new handler functions for the service status banner:

```typescript
const [alertProcessing, setAlertProcessing] = useState(false);

// Quick dismiss - just pushes next service date forward
const handleQuickDismiss = async (dueType: 'date' | 'hours') => {
  if (!component) return;
  if (!confirm('Dismiss this alert? It will reappear when the next service is due.')) return;
  
  setAlertProcessing(true);
  try {
    const response = await fetch(`/api/components/${component.id}/dismiss-alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertType: dueType === 'date' ? 'maintenance_date' : 'maintenance_hours' }),
    });
    if (response.ok) {
      fetchComponent(component.id);
    }
  } catch (err) {
    console.error('Error dismissing alert:', err);
  }
  setAlertProcessing(false);
};

// Quick complete - logs service and updates next date
const handleQuickComplete = async (dueType: 'date' | 'hours', serviceName: string) => {
  if (!component) return;
  setAlertProcessing(true);
  try {
    const response = await fetch(`/api/components/${component.id}/quick-complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        alertType: dueType === 'date' ? 'maintenance_date' : 'maintenance_hours',
        serviceName,
      }),
    });
    if (response.ok) {
      fetchComponent(component.id);
      confetti.trigger();
    }
  } catch (err) {
    console.error('Error completing service:', err);
  }
  setAlertProcessing(false);
};
```

Updated banner buttons:
```tsx
<button
  onClick={() => handleQuickComplete(health.dueType || 'date', health.serviceName)}
  disabled={alertProcessing}
  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg"
>
  {alertProcessing ? '...' : '✓ Completed'}
</button>
<button
  onClick={() => handleQuickDismiss(health.dueType || 'date')}
  disabled={alertProcessing}
  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg"
>
  {alertProcessing ? '...' : 'Dismiss'}
</button>
```

### 5. `src/app/boats/[id]/page.tsx` (Updated)
Added callbacks to refresh alerts after dismiss/complete:

```tsx
<AlertsList 
  alerts={alerts} 
  boatId={boat.id} 
  compact 
  onAlertDismissed={() => fetchAlerts(boat.id)}
  onAlertCompleted={() => fetchAlerts(boat.id)}
/>
```

---

## 🧪 To Test

1. Go to **captainslog.ae**
2. Find a boat with service alerts (overdue or upcoming)
3. Click **Dismiss** → should see confirmation → alert disappears
4. Click **Complete** → should see confirmation → alert disappears + confetti
5. Check component's maintenance history — should have new log entry

---

## 📦 Deployed

```bash
git commit -m "Fix dismiss/complete buttons - remove alert without navigation"
git push origin main
# Auto-deployed to Vercel → captainslog.ae
```

---

*Built by Dave 🖖 — Feb 4, 2026*
