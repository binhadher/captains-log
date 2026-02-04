'use client';

import { Cog, Gauge, Wind, Plus, Battery, Navigation, Droplets, Ship } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ComponentCard } from './ComponentCard';
import { BoatComponent, ComponentCategory } from '@/types/database';

interface ComponentListProps {
  components: BoatComponent[];
  boatId: string;
  onSetupClick: () => void;
  onAddClick: () => void;
  onEditComponent?: (component: BoatComponent) => void;
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

export function ComponentList({ components, boatId, onSetupClick, onAddClick, onEditComponent }: ComponentListProps) {
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
      <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
        <Cog className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No components configured</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Set up your boat's systems to start tracking maintenance for each component.
        </p>
        <Button onClick={onSetupClick}>
          <Plus className="w-4 h-4 mr-2" />
          Set Up Components
        </Button>
      </div>
    );
  }

  // Special sorting for propulsion: Port items first (Engine, Shaft, Prop), then Starboard
  const sortPropulsion = (components: BoatComponent[]) => {
    const typeOrder = ['engine', 'inboard_engine', 'outboard_engine', 'drive_pod', 'shaft', 'propeller'];
    
    const isPort = (c: BoatComponent) => 
      c.name.toLowerCase().includes('port') || c.position?.toLowerCase().includes('port');
    const isStarboard = (c: BoatComponent) => 
      c.name.toLowerCase().includes('starboard') || c.position?.toLowerCase().includes('starboard');
    
    const portComponents = components
      .filter(isPort)
      .sort((a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type));
    
    const starboardComponents = components
      .filter(isStarboard)
      .sort((a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type));
    
    const otherComponents = components
      .filter(c => !isPort(c) && !isStarboard(c))
      .sort((a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type));
    
    return { portComponents, starboardComponents, otherComponents };
  };

  return (
    <div className="space-y-6">
      {categories.map((category) => {
        const categoryComponents = grouped[category] || [];
        const info = CATEGORY_INFO[category];

        if (categoryComponents.length === 0) return null;

        // Special layout for propulsion - Port on left, Starboard on right
        if (category === 'propulsion') {
          const { portComponents, starboardComponents, otherComponents } = sortPropulsion(categoryComponents);
          const hasPortStarboard = portComponents.length > 0 && starboardComponents.length > 0;

          return (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <div className="text-gray-500 dark:text-gray-400">{info.icon}</div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                  {info.label}
                </h3>
                <span className="text-xs text-gray-400">({categoryComponents.length})</span>
              </div>
              
              {hasPortStarboard ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Port Column */}
                  <div className="space-y-3">
                    {portComponents.map((component) => (
                      <ComponentCard 
                        key={component.id} 
                        component={component} 
                        boatId={boatId}
                        onEdit={onEditComponent}
                      />
                    ))}
                  </div>
                  {/* Starboard Column */}
                  <div className="space-y-3">
                    {starboardComponents.map((component) => (
                      <ComponentCard 
                        key={component.id} 
                        component={component} 
                        boatId={boatId}
                        onEdit={onEditComponent}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[...portComponents, ...starboardComponents, ...otherComponents].map((component) => (
                    <ComponentCard 
                      key={component.id} 
                      component={component} 
                      boatId={boatId}
                      onEdit={onEditComponent}
                    />
                  ))}
                </div>
              )}
              
              {/* Other propulsion components (center, single engine boats, etc.) */}
              {otherComponents.length > 0 && hasPortStarboard && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  {otherComponents.map((component) => (
                    <ComponentCard 
                      key={component.id} 
                      component={component} 
                      boatId={boatId}
                      onEdit={onEditComponent}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        }

        return (
          <div key={category}>
            <div className="flex items-center gap-2 mb-3">
              <div className="text-gray-500 dark:text-gray-400">{info.icon}</div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                {info.label}
              </h3>
              <span className="text-xs text-gray-400">({categoryComponents.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categoryComponents.map((component) => (
                <ComponentCard 
                  key={component.id} 
                  component={component} 
                  boatId={boatId}
                  onEdit={onEditComponent}
                />
              ))}
            </div>
          </div>
        );
      })}
      
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="outline" size="sm" onClick={onAddClick}>
          <Plus className="w-4 h-4 mr-1" />
          Add Component
        </Button>
      </div>
    </div>
  );
}
