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
import { BoatComponent, Part } from '@/types/database';
import { getMaintenanceItems, getMaintenanceItemLabel } from '@/lib/maintenance-items';
import { formatDate, formatCurrency } from '@/lib/utils';
import { AddMaintenanceModal } from '@/components/maintenance/AddMaintenanceModal';
import { ServiceScheduleModal } from '@/components/maintenance/ServiceScheduleModal';
import { PartsList } from '@/components/parts/PartsList';
import { AddPartModal } from '@/components/parts/AddPartModal';
import { Package, Settings } from 'lucide-react';

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

  const handleLogAdded = () => {
    if (params.componentId) {
      fetchComponent(params.componentId as string);
    }
    setShowAddLog(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !component) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Component not found'}</p>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href={`/boats/${params.id}`} className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{component.name}</h1>
                <p className="text-sm text-gray-500">{boatName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowSchedule(true)}>
                <Settings className="w-4 h-4 mr-1" />
                Schedule
              </Button>
              <Button onClick={() => setShowAddLog(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Add Log
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Component Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Details</h2>
            {component.current_hours !== undefined && component.current_hours > 0 && (
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="w-4 h-4" />
                <span className="font-medium">{component.current_hours.toLocaleString()} hours</span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {component.brand && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Brand</p>
                <p className="text-gray-900 font-medium">{component.brand}</p>
              </div>
            )}
            {component.model && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Model</p>
                <p className="text-gray-900 font-medium">{component.model}</p>
              </div>
            )}
            {component.serial_number && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Serial Number</p>
                <p className="text-gray-900 font-medium">{component.serial_number}</p>
              </div>
            )}
            {component.install_date && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Install Date</p>
                <p className="text-gray-900 font-medium">{formatDate(component.install_date)}</p>
              </div>
            )}
          </div>

          {component.notes && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-gray-700">{component.notes}</p>
            </div>
          )}
        </div>

        {/* Maintenance Items Quick Stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Items</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {maintenanceItems.filter(item => item.id !== 'other').map((item) => {
              const itemLogs = logs.filter(l => l.maintenance_item === item.id);
              const lastService = itemLogs[0];
              
              return (
                <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900 text-sm">{item.label}</p>
                  {lastService ? (
                    <p className="text-xs text-gray-500 mt-1">
                      Last: {formatDate(lastService.date)}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">No records</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Maintenance History */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Maintenance History</h2>
            <span className="text-sm text-gray-500">{logs.length} entries</span>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No maintenance records yet</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={() => setShowAddLog(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add First Log
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {getMaintenanceItemLabel(component.type, log.maintenance_item)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(log.date)}
                      </span>
                    </div>
                    {log.description && (
                      <p className="text-sm text-gray-600 mb-2">{log.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
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
                      <p className="text-xs text-gray-500 mt-2 italic">{log.notes}</p>
                    )}
                    {/* Attached Photos/Documents */}
                    {log.documents && log.documents.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
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
                                className="w-20 h-20 object-cover rounded-lg border border-gray-200 hover:border-blue-400 transition-all"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-gray-100 rounded-lg border border-gray-200 hover:border-blue-400 transition-all flex flex-col items-center justify-center">
                                <FileText className="w-6 h-6 text-gray-400" />
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
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Parts
            </h2>
            <Button size="sm" onClick={() => setShowAddPart(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Part
            </Button>
          </div>
          <PartsList parts={parts} showComponent={false} />
        </div>

        {/* Documents Section - Placeholder */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Documents & Photos</h2>
            <Button size="sm" disabled>
              <Plus className="w-4 h-4 mr-1" />
              Upload
            </Button>
          </div>
          <p className="text-gray-500 text-sm text-center py-4">
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
        components={[component]}
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
    </div>
  );
}
