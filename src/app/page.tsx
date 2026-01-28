'use client';

import { useState, useEffect } from 'react';
import { UserButton } from '@clerk/nextjs';
import { Plus, Ship, AlertTriangle, Clock, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BoatCard } from '@/components/boats/BoatCard';
import { AddBoatModal } from '@/components/boats/AddBoatModal';
import { Boat } from '@/types/database';

const mockAlerts = [
  { id: '1', type: 'document', message: 'Insurance renewal', dueIn: '15 days' },
  { id: '2', type: 'maintenance', message: 'Engine service due', dueIn: '23 hours' },
];

export default function Dashboard() {
  const [boats, setBoats] = useState<Boat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddBoat, setShowAddBoat] = useState(false);

  // Fetch boats on mount
  useEffect(() => {
    fetchBoats();
  }, []);

  const fetchBoats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/boats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch boats');
      }
      
      const data = await response.json();
      setBoats(data.boats || []);
    } catch (err) {
      console.error('Error fetching boats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load boats');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBoat = (boat: Boat) => {
    setBoats([...boats, boat]);
    setShowAddBoat(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🖖</span>
              <h1 className="text-xl font-bold text-gray-900">Captain&apos;s Log</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={() => setShowAddBoat(true)} size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Boat
              </Button>
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Boats Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Ship className="w-5 h-5" />
            My Boats
          </h2>
          
          {loading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Loader2 className="w-8 h-8 text-blue-500 mx-auto mb-4 animate-spin" />
              <p className="text-gray-500">Loading your boats...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-xl border border-red-200 p-12 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchBoats} variant="outline">
                Try Again
              </Button>
            </div>
          ) : boats.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Ship className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No boats yet</h3>
              <p className="text-gray-500 mb-4">Add your first boat to start tracking maintenance and documents.</p>
              <Button onClick={() => setShowAddBoat(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Add Your First Boat
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {boats.map((boat) => (
                <BoatCard key={boat.id} boat={boat} />
              ))}
            </div>
          )}
        </section>

        {/* Alerts Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Upcoming
          </h2>
          
          {mockAlerts.length === 0 ? (
            <p className="text-gray-500">No upcoming alerts</p>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {mockAlerts.map((alert) => (
                <div key={alert.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {alert.type === 'document' ? (
                      <FileText className="w-5 h-5 text-blue-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-500" />
                    )}
                    <span className="text-gray-900">{alert.message}</span>
                  </div>
                  <span className="text-sm text-amber-600 font-medium">{alert.dueIn}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Activity */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Activity
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500">Activity will appear here once you start logging maintenance.</p>
          </div>
        </section>
      </main>

      {/* Add Boat Modal */}
      <AddBoatModal
        isOpen={showAddBoat}
        onClose={() => setShowAddBoat(false)}
        onSubmit={handleAddBoat}
      />
    </div>
  );
}
