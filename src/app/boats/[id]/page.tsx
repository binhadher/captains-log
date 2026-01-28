'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Ship, 
  Settings, 
  FileText, 
  Wrench,
  Calendar,
  MapPin,
  Loader2,
  Pencil,
  Trash2,
  Plus,
  Cog
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Boat, BoatComponent, Part, HealthCheck } from '@/types/database';
import { ComponentList } from '@/components/boats/ComponentList';
import { ComponentSetupModal } from '@/components/boats/ComponentSetupModal';
import { PartsList } from '@/components/parts/PartsList';
import { AddPartModal } from '@/components/parts/AddPartModal';
import { HealthCheckList } from '@/components/health/HealthCheckList';
import { AddHealthCheckModal } from '@/components/health/AddHealthCheckModal';
import { AlertsList } from '@/components/alerts/AlertsList';
import { Alert } from '@/lib/alerts';
import { Package, Activity, AlertTriangle } from 'lucide-react';

export default function BoatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [boat, setBoat] = useState<Boat | null>(null);
  const [components, setComponents] = useState<BoatComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [parts, setParts] = useState<Part[]>([]);
  const [showAddPart, setShowAddPart] = useState(false);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [showAddHealthCheck, setShowAddHealthCheck] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    if (params.id) {
      fetchBoat(params.id as string);
      fetchComponents(params.id as string);
      fetchParts(params.id as string);
      fetchHealthChecks(params.id as string);
      fetchAlerts(params.id as string);
    }
  }, [params.id]);

  const fetchComponents = async (boatId: string) => {
    try {
      const response = await fetch(`/api/boats/${boatId}/components`);
      if (response.ok) {
        const data = await response.json();
        setComponents(data.components || []);
      }
    } catch (err) {
      console.error('Error fetching components:', err);
    }
  };

  const fetchParts = async (boatId: string) => {
    try {
      const response = await fetch(`/api/boats/${boatId}/parts`);
      if (response.ok) {
        const data = await response.json();
        setParts(data.parts || []);
      }
    } catch (err) {
      console.error('Error fetching parts:', err);
    }
  };

  const fetchHealthChecks = async (boatId: string) => {
    try {
      const response = await fetch(`/api/boats/${boatId}/health-checks`);
      if (response.ok) {
        const data = await response.json();
        setHealthChecks(data.checks || []);
      }
    } catch (err) {
      console.error('Error fetching health checks:', err);
    }
  };

  const fetchAlerts = async (boatId: string) => {
    try {
      const response = await fetch(`/api/boats/${boatId}/alerts`);
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }
  };

  const fetchBoat = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/boats/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Boat not found');
        }
        throw new Error('Failed to fetch boat');
      }
      
      const data = await response.json();
      setBoat(data.boat);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load boat');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!boat) return;
    
    const confirmed = window.confirm(`Are you sure you want to delete "${boat.name}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/boats/${boat.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete boat');
      }

      router.push('/');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete boat');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !boat) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Ship className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">{error || 'Boat not found'}</h2>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const engineLabels = getEngineLabels(boat.number_of_engines || 2);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{boat.name}</h1>
                {boat.make && boat.model && (
                  <p className="text-sm text-gray-500">{boat.make} {boat.model}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDelete} disabled={deleting}>
                <Trash2 className="w-4 h-4 mr-1" />
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Boat Info Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Ship className="w-5 h-5" />
            Boat Details
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {boat.year && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Year</p>
                <p className="text-gray-900 font-medium">{boat.year}</p>
              </div>
            )}
            {boat.length && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Length</p>
                <p className="text-gray-900 font-medium">{boat.length} ft</p>
              </div>
            )}
            {boat.hull_id && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Hull ID</p>
                <p className="text-gray-900 font-medium">{boat.hull_id}</p>
              </div>
            )}
            {boat.home_port && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Home Port</p>
                <p className="text-gray-900 font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {boat.home_port}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Engines Card */}
        {boat.engines && boat.engines.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Engines
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {boat.engines.map((engine, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    {engineLabels[index]}
                  </p>
                  {engine.brand || engine.model ? (
                    <p className="text-gray-900 font-medium">
                      {[engine.brand, engine.model].filter(Boolean).join(' ')}
                    </p>
                  ) : (
                    <p className="text-gray-400 italic">Not specified</p>
                  )}
                </div>
              ))}
            </div>

            {/* Generator */}
            {(boat.generator_brand || boat.generator_model) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Generator</p>
                <p className="text-gray-900 font-medium">
                  {[boat.generator_brand, boat.generator_model].filter(Boolean).join(' ')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Upcoming
                <span className="text-sm font-normal text-gray-500">({alerts.length})</span>
              </h2>
            </div>
            <AlertsList alerts={alerts} boatId={boat.id} compact />
          </div>
        )}

        {/* Components Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Cog className="w-5 h-5" />
              Systems & Components
            </h2>
          </div>
          <ComponentList 
            components={components} 
            boatId={boat.id}
            onSetupClick={() => setShowSetup(true)}
          />
        </div>

        {/* Boat Health */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Boat Health
            </h2>
            <Button size="sm" onClick={() => setShowAddHealthCheck(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Quick Check
            </Button>
          </div>
          <HealthCheckList checks={healthChecks} />
        </div>

        {/* Parts Catalog */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Parts Catalog
            </h2>
            <Button size="sm" onClick={() => setShowAddPart(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Part
            </Button>
          </div>
          <PartsList parts={parts} />
        </div>

        {/* Boat-level Documents (registration, insurance, etc.) */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Boat Documents
            </h2>
            <Button size="sm" disabled>
              <Plus className="w-4 h-4 mr-1" />
              Upload
            </Button>
          </div>
          <p className="text-gray-500 text-sm">Store boat-level documents here: registration, insurance, berth contracts.</p>
        </div>
      </main>

      {/* Component Setup Modal */}
      <ComponentSetupModal
        isOpen={showSetup}
        onClose={() => setShowSetup(false)}
        boatId={boat.id}
        numberOfEngines={boat.number_of_engines || 2}
        engines={boat.engines}
        generatorBrand={boat.generator_brand}
        generatorModel={boat.generator_model}
        onComplete={() => fetchComponents(boat.id)}
      />

      {/* Add Part Modal */}
      <AddPartModal
        isOpen={showAddPart}
        onClose={() => setShowAddPart(false)}
        boatId={boat.id}
        components={components}
        onSuccess={() => fetchParts(boat.id)}
      />

      {/* Add Health Check Modal */}
      <AddHealthCheckModal
        isOpen={showAddHealthCheck}
        onClose={() => setShowAddHealthCheck(false)}
        boatId={boat.id}
        components={components}
        onSuccess={() => fetchHealthChecks(boat.id)}
      />
    </div>
  );
}

function getEngineLabels(count: number): string[] {
  const labels: Record<number, string[]> = {
    1: ['Engine'],
    2: ['Port Engine', 'Starboard Engine'],
    3: ['Port Engine', 'Center Engine', 'Starboard Engine'],
    4: ['Port Outer', 'Port Inner', 'Starboard Inner', 'Starboard Outer'],
    5: ['Port Outer', 'Port Inner', 'Center', 'Starboard Inner', 'Starboard Outer'],
    6: ['Port Outer', 'Port Mid', 'Port Inner', 'Starboard Inner', 'Starboard Mid', 'Starboard Outer'],
  };
  return labels[count] || labels[2];
}
