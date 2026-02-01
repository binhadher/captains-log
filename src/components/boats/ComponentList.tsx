'use client';

import { Cog, Gauge, Wind, Plus, Battery, Navigation, Droplets, Ship } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ComponentCard } from './ComponentCard';
import { BoatComponent, ComponentCategory } from '@/types/database';

interface ComponentListProps {
  components: BoatComponent[];
  boatId: string;
  onSetupClick: () => void;
}

const CATEGORY_INFO: Record<ComponentCategory, { label: string; icon: React.ReactNode; description: string }> = {
  propulsion: {
    label: 'Propulsion',
    icon: <Cog className="w-5 h-5" />,
    description: 'Engines, pods, shafts & propellers',
  },
  power: {
    label: 'Power',
    icon: <Battery className="w-5 h-5" />,
    description: 'Generators',
  },
  maneuvering: {
    label: 'Maneuvering',
    icon: <Navigation className="w-5 h-5" />,
    description: 'Bow & stern thrusters',
  },
  hydraulics: {
    label: 'Hydraulics',
    icon: <Droplets className="w-5 h-5" />,
    description: 'Swim platform, crane, passerelle',
  },
  hvac: {
    label: 'HVAC',
    icon: <Wind className="w-5 h-5" />,
    description: 'Air conditioning & climate control',
  },
  electrical: {
    label: 'Electrical',
    icon: <Battery className="w-5 h-5" />,
    description: 'Batteries & power systems',
  },
  tender: {
    label: 'Tender',
    icon: <Ship className="w-5 h-5" />,
    description: 'Tenders & jet skis',
  },
  systems: {
    label: 'Systems',
    icon: <Gauge className="w-5 h-5" />,
    description: 'Other systems (legacy)',
  },
};

export function ComponentList({ components, boatId, onSetupClick }: ComponentListProps) {
  // Group components by category
  const grouped = components.reduce((acc, comp) => {
    if (!acc[comp.category]) {
      acc[comp.category] = [];
    }
    acc[comp.category].push(comp);
    return acc;
  }, {} as Record<ComponentCategory, BoatComponent[]>);

  const categories: ComponentCategory[] = ['propulsion', 'power', 'maneuvering', 'hydraulics', 'hvac', 'electrical', 'tender', 'systems'];

  if (components.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <Cog className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No components configured</h3>
        <p className="text-gray-500 mb-4">
          Set up your boat's systems to start tracking maintenance for each component.
        </p>
        <Button onClick={onSetupClick}>
          <Plus className="w-4 h-4 mr-2" />
          Set Up Components
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {categories.map((category) => {
        const categoryComponents = grouped[category] || [];
        const info = CATEGORY_INFO[category];

        if (categoryComponents.length === 0) return null;

        return (
          <div key={category}>
            <div className="flex items-center gap-2 mb-3">
              <div className="text-gray-500 dark:text-gray-400 dark:text-gray-500">{info.icon}</div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                {info.label}
              </h3>
              <span className="text-xs text-gray-400 dark:text-gray-500">({categoryComponents.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categoryComponents.map((component) => (
                <ComponentCard 
                  key={component.id} 
                  component={component} 
                  boatId={boatId}
                />
              ))}
            </div>
          </div>
        );
      })}
      
      <div className="pt-4 border-t border-gray-200">
        <Button variant="outline" size="sm" onClick={onSetupClick}>
          <Plus className="w-4 h-4 mr-1" />
          Add Component
        </Button>
      </div>
    </div>
  );
}
