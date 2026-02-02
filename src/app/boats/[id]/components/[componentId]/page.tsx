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
  Loader2,
  Trash2,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { UserButton } from '@clerk/nextjs';
import { BoatComponent, Part } from '@/types/database';
import { getMaintenanceItems, getMaintenanceItemLabel } from '@/lib/maintenance-items';
import { formatDate, formatCurrency } from '@/lib/utils';
import { AddMaintenanceModal } from '@/components/maintenance/AddMaintenanceModal';
import { EditMaintenanceModal } from '@/components/maintenance/EditMaintenanceModal';
import { ServiceScheduleModal } from '@/components/maintenance/ServiceScheduleModal';
import { PartsList } from '@/components/parts/PartsList';
import { AddPartModal } from '@/components/parts/AddPartModal';
import { EditPartModal } from '@/components/parts/EditPartModal';
import { Package, Settings, Pencil } from 'lucide-react';

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

export default function ComponentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
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
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dubai flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
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
                          <DollarSign className="w-3 h-3" />
                          {formatCurrency(log.cost, log.currency as 'AED' | 'USD' | 'EUR')}
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

        {/* Documents Section - Placeholder */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Documents & Photos</h2>
            <Button size="sm" disabled>
              <Plus className="w-4 h-4 mr-1" />
              Upload
            </Button>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-3">
            Document uploads coming soon
          </p>
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
    </div>
  );
}
