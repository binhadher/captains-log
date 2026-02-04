'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  Clock, 
  Calendar,
  FileText,
  Image,
  Trash2,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';
import { ComponentDetailSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { UserButton } from '@clerk/nextjs';
import { BoatComponent, Part } from '@/types/database';
import { getMaintenanceItems, getMaintenanceItemLabel } from '@/lib/maintenance-items';
import { formatDate } from '@/lib/utils';
import { useCurrency, AedSymbol } from '@/components/providers/CurrencyProvider';
import { CurrencyToggle } from '@/components/ui/CurrencyToggle';
import { AddMaintenanceModal } from '@/components/maintenance/AddMaintenanceModal';
import { EditMaintenanceModal } from '@/components/maintenance/EditMaintenanceModal';
import { ServiceScheduleModal } from '@/components/maintenance/ServiceScheduleModal';
import { PartsList } from '@/components/parts/PartsList';
import { AddPartModal } from '@/components/parts/AddPartModal';
import { EditPartModal } from '@/components/parts/EditPartModal';
import { ComponentDocumentUpload } from '@/components/documents/ComponentDocumentUpload';
import { Package, Settings, Pencil, Copy, Check, Share2, Trash2 as TrashIcon, FileText as FileIcon, Image as ImageIcon } from 'lucide-react';
import { Confetti } from '@/components/ui/Confetti';
import { useConfetti } from '@/hooks/useConfetti';

interface ComponentDocument {
  id: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
}

interface Document {
  id: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size: number;
}

interface LogEntry {
  id: string;
  maintenance_item: string;
  date: string;
  description: string;
  cost?: number;
  currency: string;
  hours_at_service?: number;
  notes?: string;
  created_at: string;
  documents?: Document[];
}

// Helper function to format currency with proper symbol
function formatCurrencyDisplay(amount: number, currencyCode: string): string {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  if (currencyCode === 'USD') return `$${formatted}`;
  if (currencyCode === 'EUR') return `€${formatted}`;
  return `AED ${formatted}`; // Use text for share/copy since SVG won't work in text
}

// Health status calculation for component
type HealthStatus = 'good' | 'warning' | 'overdue' | 'unknown';

interface HealthInfo {
  status: HealthStatus;
  serviceName: string;
  message: string;
  dueType?: 'date' | 'hours';
  daysUntil?: number;
  hoursUntil?: number;
}

function getComponentHealthInfo(component: BoatComponent): HealthInfo {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const serviceName = component.scheduled_service_name || 'Service';
  
  // Check date-based service
  if (component.next_service_date) {
    const serviceDate = new Date(component.next_service_date);
    const daysUntil = Math.ceil((serviceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) {
      return { 
        status: 'overdue', 
        serviceName,
        message: `Overdue by ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''}`,
        dueType: 'date',
        daysUntil,
      };
    } else if (daysUntil <= 7) {
      return { 
        status: 'warning', 
        serviceName,
        message: `Due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
        dueType: 'date',
        daysUntil,
      };
    }
  }
  
  // Check hours-based service
  if (component.next_service_hours && component.current_hours !== undefined) {
    const hoursUntil = component.next_service_hours - component.current_hours;
    
    if (hoursUntil < 0) {
      return { 
        status: 'overdue', 
        serviceName,
        message: `Overdue by ${Math.abs(hoursUntil).toLocaleString()} hours`,
        dueType: 'hours',
        hoursUntil,
      };
    } else if (hoursUntil <= 25) {
      return { 
        status: 'warning', 
        serviceName,
        message: `Due in ${hoursUntil.toLocaleString()} hours`,
        dueType: 'hours',
        hoursUntil,
      };
    }
  }
  
  return { status: 'good', serviceName, message: '' };
}

export default function ComponentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currency } = useCurrency();
  const [component, setComponent] = useState<BoatComponent | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddLog, setShowAddLog] = useState(false);
  const [showAddPart, setShowAddPart] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [boatName, setBoatName] = useState<string>('');
  const [parts, setParts] = useState<Part[]>([]);
  const [allComponents, setAllComponents] = useState<BoatComponent[]>([]);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [editingLog, setEditingLog] = useState<LogEntry | null>(null);
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);
  const [componentDocs, setComponentDocs] = useState<ComponentDocument[]>([]);
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [alertProcessing, setAlertProcessing] = useState(false);
  const confetti = useConfetti();

  // Check if we should auto-open schedule modal
  useEffect(() => {
    if (searchParams.get('openSchedule') === 'true' && component) {
      setShowSchedule(true);
      // Clean up the URL
      router.replace(`/boats/${params.id}/components/${params.componentId}`, { scroll: false });
    }
  }, [searchParams, component, params.id, params.componentId, router]);

  useEffect(() => {
    if (params.componentId) {
      fetchComponent(params.componentId as string);
    }
  }, [params.componentId]);

  const fetchComponent = async (componentId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/components/${componentId}`);
      
      if (!response.ok) {
        throw new Error('Component not found');
      }
      
      const data = await response.json();
      setComponent(data.component);
      setLogs(data.logs || []);
      setBoatName(data.component.boat_name || '');
      
      // Fetch parts for this component
      fetchParts(data.component.boat_id, componentId);
      
      // Fetch all components for the boat (needed for "apply to all engines" feature)
      fetchAllComponents(data.component.boat_id);
      
      // Fetch documents for this component
      fetchComponentDocs(componentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load component');
    } finally {
      setLoading(false);
    }
  };

  const fetchParts = async (boatId: string, componentId: string) => {
    try {
      const response = await fetch(`/api/boats/${boatId}/parts`);
      if (response.ok) {
        const data = await response.json();
        // Filter to just this component's parts
        const componentParts = (data.parts || []).filter(
          (p: Part) => p.component_id === componentId
        );
        setParts(componentParts);
      }
    } catch (err) {
      console.error('Error fetching parts:', err);
    }
  };

  const fetchComponentDocs = async (componentId: string) => {
    try {
      const response = await fetch(`/api/components/${componentId}/documents`);
      if (response.ok) {
        const data = await response.json();
        setComponentDocs(data.documents || []);
      }
    } catch (err) {
      console.error('Error fetching component documents:', err);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!component || !confirm('Delete this document?')) return;
    
    try {
      const response = await fetch(`/api/components/${component.id}/documents?docId=${docId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setComponentDocs(docs => docs.filter(d => d.id !== docId));
      }
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  const fetchAllComponents = async (boatId: string) => {
    try {
      const response = await fetch(`/api/boats/${boatId}/components`);
      if (response.ok) {
        const data = await response.json();
        setAllComponents(data.components || []);
      }
    } catch (err) {
      console.error('Error fetching components:', err);
    }
  };

  const handleLogAdded = () => {
    if (params.componentId) {
      fetchComponent(params.componentId as string);
    }
    setShowAddLog(false);
    // Celebrate! 🎉
    confetti.trigger();
  };

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

  if (loading) {
    return <ComponentDetailSkeleton />;
  }

  if (error || !component) {
    return (
      <div className="min-h-screen bg-dubai flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Component not found'}</p>
          <Link href={`/boats/${params.id}`}>
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Boat
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const maintenanceItems = getMaintenanceItems(component.type);

  return (
    <div className="min-h-screen bg-dubai">
      {/* Header */}
      <header className="glass-header sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Link href={`/boats/${params.id}`} className="p-2 hover:bg-gray-200 dark:hover:bg-white/20 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-white" />
              </Link>
              <div>
                <h1 className="text-lg font-bold text-teal-700 dark:text-white">{component.name}</h1>
                <p className="text-xs text-teal-600 dark:text-gray-300">{boatName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CurrencyToggle />
              <ThemeToggle />
              <Link 
                href="/settings" 
                className="p-2 bg-gray-200 dark:bg-white/20 hover:bg-gray-300 dark:hover:bg-white/30 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5 text-gray-700 dark:text-white" />
              </Link>
              <Button variant="outline" size="sm" onClick={() => setShowSchedule(true)}>
                <Settings className="w-4 h-4 mr-1" />
                Schedule
              </Button>
              <Button size="sm" onClick={() => setShowAddLog(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Add Log
              </Button>
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Service Status Banner */}
        {(() => {
          const health = getComponentHealthInfo(component);
          if (health.status === 'overdue') {
            return (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-red-700 dark:text-red-300">{health.serviceName}</p>
                    <p className="text-sm text-red-600 dark:text-red-400">{health.message}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 ml-13">
                  <button
                    onClick={() => handleQuickComplete(health.dueType || 'date', health.serviceName)}
                    disabled={alertProcessing}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {alertProcessing ? '...' : '✓ Completed'}
                  </button>
                  <button
                    onClick={() => handleQuickDismiss(health.dueType || 'date')}
                    disabled={alertProcessing}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {alertProcessing ? '...' : 'Dismiss'}
                  </button>
                </div>
              </div>
            );
          }
          if (health.status === 'warning') {
            return (
              <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-amber-700 dark:text-amber-300">{health.serviceName}</p>
                    <p className="text-sm text-amber-600 dark:text-amber-400">{health.message}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 ml-13">
                  <button
                    onClick={() => handleQuickComplete(health.dueType || 'date', health.serviceName)}
                    disabled={alertProcessing}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {alertProcessing ? '...' : '✓ Completed'}
                  </button>
                  <button
                    onClick={() => handleQuickDismiss(health.dueType || 'date')}
                    disabled={alertProcessing}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {alertProcessing ? '...' : 'Dismiss'}
                  </button>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Component Info */}
        <div className="glass-card rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Details</h2>
            {component.current_hours !== undefined && component.current_hours > 0 && (
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Clock className="w-4 h-4" />
                <span className="font-medium text-sm">{component.current_hours.toLocaleString()} hours</span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {component.brand && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Brand</p>
                <p className="text-gray-900 dark:text-white font-medium text-sm">{component.brand}</p>
              </div>
            )}
            {component.model && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Model</p>
                <p className="text-gray-900 dark:text-white font-medium text-sm">{component.model}</p>
              </div>
            )}
            {component.serial_number && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Serial Number</p>
                <p className="text-gray-900 dark:text-white font-medium text-sm">{component.serial_number}</p>
              </div>
            )}
            {component.install_date && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Install Date</p>
                <p className="text-gray-900 dark:text-white font-medium text-sm">{formatDate(component.install_date)}</p>
              </div>
            )}
          </div>

          {component.notes && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-gray-700 dark:text-gray-300 text-sm">{component.notes}</p>
            </div>
          )}
        </div>

        {/* Maintenance Items Quick Stats */}
        <div className="glass-card rounded-xl p-4 mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Service Items</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {maintenanceItems.filter(item => item.id !== 'other').map((item) => {
              const itemLogs = logs.filter(l => l.maintenance_item === item.id);
              const lastService = itemLogs[0];
              
              return (
                <div key={item.id} className="p-2 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg">
                  <p className="font-medium text-gray-900 dark:text-white text-xs">{item.label}</p>
                  {lastService ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Last: {formatDate(lastService.date)}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 dark:text-gray-400 mt-0.5">No records</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Maintenance History */}
        <div className="glass-card rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Maintenance History</h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">{logs.length} entries</span>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-6">
              <Calendar className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">No maintenance records yet</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => setShowAddLog(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add First Log
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white text-sm">
                          {getMaintenanceItemLabel(component.type, log.maintenance_item)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(log.date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingLog(log)}
                          className="p-1.5 text-amber-500 hover:text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded transition-all"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={async () => {
                            const text = [
                              `${getMaintenanceItemLabel(component.type, log.maintenance_item)} - ${formatDate(log.date)}`,
                              log.description && `Description: ${log.description}`,
                              log.hours_at_service && `Hours: ${log.hours_at_service.toLocaleString()}`,
                              log.cost && `Cost: ${formatCurrencyDisplay(log.cost, currency)}`,
                              log.notes && `Notes: ${log.notes}`,
                            ].filter(Boolean).join('\n');
                            if (navigator.share) {
                              try {
                                await navigator.share({
                                  title: getMaintenanceItemLabel(component.type, log.maintenance_item),
                                  text: text,
                                });
                              } catch (err) {
                                // User cancelled
                              }
                            } else {
                              await navigator.clipboard.writeText(text);
                              setCopiedLogId(log.id);
                              setTimeout(() => setCopiedLogId(null), 2000);
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded transition-all"
                          title="Share"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={async () => {
                            const text = [
                              `${getMaintenanceItemLabel(component.type, log.maintenance_item)} - ${formatDate(log.date)}`,
                              log.description && `Description: ${log.description}`,
                              log.hours_at_service && `Hours: ${log.hours_at_service.toLocaleString()}`,
                              log.cost && `Cost: ${formatCurrencyDisplay(log.cost, currency)}`,
                              log.notes && `Notes: ${log.notes}`,
                            ].filter(Boolean).join('\n');
                            await navigator.clipboard.writeText(text);
                            setCopiedLogId(log.id);
                            setTimeout(() => setCopiedLogId(null), 2000);
                          }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-all"
                          title="Copy"
                        >
                          {copiedLogId === log.id ? (
                            <Check className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm('Delete this maintenance log?')) return;
                            try {
                              const response = await fetch(`/api/maintenance-logs/${log.id}`, { method: 'DELETE' });
                              if (response.ok) {
                                fetchComponent(params.componentId as string);
                              }
                            } catch (err) {
                              console.error('Error deleting log:', err);
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {log.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">{log.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      {log.hours_at_service && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {log.hours_at_service.toLocaleString()} hrs
                        </span>
                      )}
                      {log.cost && (
                        <span className="flex items-center gap-1">
                          {currency === 'AED' ? (
                            <AedSymbol className="w-3 h-3" />
                          ) : currency === 'USD' ? (
                            <span>$</span>
                          ) : (
                            <span>€</span>
                          )}
                          {log.cost.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {log.notes && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">{log.notes}</p>
                    )}
                    {/* Attached Photos/Documents */}
                    {log.documents && log.documents.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {log.documents.map((doc) => (
                          <a 
                            key={doc.id} 
                            href={doc.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block"
                          >
                            {doc.file_type.startsWith('image/') ? (
                              <img 
                                src={doc.file_url} 
                                alt={doc.name}
                                className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700 hover:border-cyan-400 transition-all"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-cyan-400 transition-all flex flex-col items-center justify-center">
                                <FileText className="w-5 h-5 text-gray-400" />
                                <span className="text-xs text-gray-500 mt-1 truncate max-w-full px-1">
                                  {doc.name.split('.').pop()?.toUpperCase()}
                                </span>
                              </div>
                            )}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Parts for this Component */}
        <div className="glass-card rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="w-4 h-4" />
              Parts
            </h2>
            <Button size="sm" onClick={() => setShowAddPart(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Part
            </Button>
          </div>
          <PartsList 
            parts={parts} 
            showComponent={false}
            onEdit={(part) => setEditingPart(part)}
            onDelete={async (part) => {
              try {
                const response = await fetch(`/api/parts/${part.id}`, { method: 'DELETE' });
                if (response.ok && component) {
                  fetchParts(component.boat_id, component.id);
                }
              } catch (err) {
                console.error('Error deleting part:', err);
              }
            }}
          />
        </div>

        {/* Documents Section */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Documents & Photos
              {componentDocs.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">({componentDocs.length})</span>
              )}
            </h2>
            <Button size="sm" onClick={() => setShowDocUpload(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Upload
            </Button>
          </div>
          {componentDocs.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-3">
              No documents or photos uploaded yet
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {componentDocs.map((doc) => (
                <div key={doc.id} className="relative group">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 hover:opacity-90 transition-opacity"
                  >
                    {doc.file_type.startsWith('image/') ? (
                      <img src={doc.file_url} alt={doc.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-2">
                        <FileIcon className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-xs text-gray-500 dark:text-gray-400 text-center truncate w-full">
                          {doc.name}
                        </span>
                      </div>
                    )}
                  </a>
                  <button
                    onClick={() => handleDeleteDoc(doc.id)}
                    className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete"
                  >
                    <TrashIcon className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Maintenance Modal */}
      <AddMaintenanceModal
        isOpen={showAddLog}
        onClose={() => setShowAddLog(false)}
        componentId={component.id}
        componentType={component.type}
        componentName={component.name}
        currentHours={component.current_hours}
        onSuccess={handleLogAdded}
      />

      {/* Add Part Modal */}
      <AddPartModal
        isOpen={showAddPart}
        onClose={() => setShowAddPart(false)}
        boatId={component.boat_id}
        components={allComponents.length > 0 ? allComponents : [component]}
        preselectedComponentId={component.id}
        onSuccess={() => fetchParts(component.boat_id, component.id)}
      />

      {/* Service Schedule Modal */}
      <ServiceScheduleModal
        isOpen={showSchedule}
        onClose={() => setShowSchedule(false)}
        componentId={component.id}
        componentName={component.name}
        componentType={component.type}
        currentHours={component.current_hours}
        currentSchedule={{
          scheduled_service_name: component.scheduled_service_name,
          service_interval_days: component.service_interval_days,
          service_interval_hours: component.service_interval_hours,
          next_service_date: component.next_service_date,
          next_service_hours: component.next_service_hours,
        }}
        onSuccess={() => fetchComponent(component.id)}
      />

      {/* Edit Part Modal */}
      <EditPartModal
        isOpen={!!editingPart}
        onClose={() => setEditingPart(null)}
        part={editingPart}
        onSuccess={() => fetchParts(component.boat_id, component.id)}
        onDelete={() => fetchParts(component.boat_id, component.id)}
      />

      {/* Edit Maintenance Log Modal */}
      <EditMaintenanceModal
        isOpen={!!editingLog}
        onClose={() => setEditingLog(null)}
        log={editingLog}
        componentType={component.type}
        onSuccess={() => fetchComponent(component.id)}
        onDelete={() => fetchComponent(component.id)}
      />

      {/* Confetti celebration for completed maintenance */}
      <Confetti isActive={confetti.isActive} onComplete={confetti.onComplete} />

      {/* Component Document Upload Modal */}
      <ComponentDocumentUpload
        isOpen={showDocUpload}
        onClose={() => setShowDocUpload(false)}
        componentId={component.id}
        boatId={component.boat_id}
        onSuccess={() => fetchComponentDocs(component.id)}
      />
    </div>
  );
}
