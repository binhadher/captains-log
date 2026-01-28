// Predefined maintenance items per component type

export interface MaintenanceItem {
  id: string;
  label: string;
  description?: string;
}

export const MAINTENANCE_ITEMS: Record<string, MaintenanceItem[]> = {
  engine: [
    { id: 'fuel_filter', label: 'Fuel Filters', description: 'Replace fuel filters' },
    { id: 'oil_filter', label: 'Oil Filters', description: 'Replace oil filters' },
    { id: 'oil_change', label: 'Oil Change', description: 'Engine oil change' },
    { id: 'air_filter', label: 'Air Filters', description: 'Replace air filters' },
    { id: 'water_separator', label: 'Water Separators', description: 'Replace water separators' },
    { id: 'belts', label: 'Belts', description: 'Inspect/replace belts' },
    { id: 'impeller', label: 'Water Impeller', description: 'Replace raw water impeller' },
    { id: 'zincs', label: 'Zincs/Anodes', description: 'Replace zinc anodes' },
    { id: 'other', label: 'Other', description: 'Other maintenance' },
  ],
  generator: [
    { id: 'fuel_filter', label: 'Fuel Filters', description: 'Replace fuel filters' },
    { id: 'oil_filter', label: 'Oil Filters', description: 'Replace oil filters' },
    { id: 'oil_change', label: 'Oil Change', description: 'Generator oil change' },
    { id: 'air_filter', label: 'Air Filters', description: 'Replace air filters' },
    { id: 'water_separator', label: 'Water Separators', description: 'Replace water separators' },
    { id: 'impeller', label: 'Water Impeller', description: 'Replace raw water impeller' },
    { id: 'belts', label: 'Belts', description: 'Inspect/replace belts' },
    { id: 'zincs', label: 'Zincs/Anodes', description: 'Replace zinc anodes' },
    { id: 'other', label: 'Other', description: 'Other maintenance' },
  ],
  shaft: [
    { id: 'inspection', label: 'Inspection', description: 'Shaft inspection and alignment check' },
    { id: 'seal_replacement', label: 'Seal Replacement', description: 'Replace shaft seal' },
    { id: 'bearing', label: 'Bearing Service', description: 'Cutlass bearing inspection/replacement' },
    { id: 'coupling', label: 'Coupling Service', description: 'Coupling inspection/service' },
    { id: 'other', label: 'Other', description: 'Other maintenance' },
  ],
  propeller: [
    { id: 'inspection', label: 'Inspection', description: 'Propeller inspection' },
    { id: 'cleaning', label: 'Cleaning', description: 'Propeller cleaning' },
    { id: 'balancing', label: 'Balancing', description: 'Propeller balancing' },
    { id: 'repair', label: 'Repair', description: 'Propeller repair' },
    { id: 'replacement', label: 'Replacement', description: 'Propeller replacement' },
    { id: 'zincs', label: 'Zincs/Anodes', description: 'Replace prop zincs' },
    { id: 'other', label: 'Other', description: 'Other maintenance' },
  ],
  hydraulic: [
    { id: 'fluid_change', label: 'Fluid Change', description: 'Hydraulic fluid change' },
    { id: 'filter', label: 'Filter Replacement', description: 'Replace hydraulic filter' },
    { id: 'hose_inspection', label: 'Hose Inspection', description: 'Inspect hoses and fittings' },
    { id: 'pump_service', label: 'Pump Service', description: 'Hydraulic pump service' },
    { id: 'cylinder_service', label: 'Cylinder Service', description: 'Cylinder inspection/service' },
    { id: 'other', label: 'Other', description: 'Other maintenance' },
  ],
  bow_thruster: [
    { id: 'inspection', label: 'Inspection', description: 'General inspection' },
    { id: 'gear_oil', label: 'Gear Oil Change', description: 'Replace gear oil' },
    { id: 'zincs', label: 'Zincs/Anodes', description: 'Replace anodes' },
    { id: 'motor_service', label: 'Motor Service', description: 'Electric motor service' },
    { id: 'propeller', label: 'Propeller Service', description: 'Thruster prop service' },
    { id: 'other', label: 'Other', description: 'Other maintenance' },
  ],
  ac_chiller: [
    { id: 'chemical_cleaning', label: 'Chemical Cleaning', description: 'Chemical cleaning of chiller' },
    { id: 'seawater_pump', label: 'Sea Water Pump', description: 'Sea water pump service' },
    { id: 'chiller_pump', label: 'Chiller Pump', description: 'Chiller pump service' },
    { id: 'refrigerant', label: 'Refrigerant Service', description: 'Check/top up refrigerant' },
    { id: 'filter_cleaning', label: 'Filter Cleaning', description: 'Clean strainers and filters' },
    { id: 'electrical', label: 'Electrical Check', description: 'Electrical system check' },
    { id: 'other', label: 'Other', description: 'Other maintenance' },
  ],
  ac_air_handler: [
    { id: 'filter_cleaning', label: 'Filter Cleaning', description: 'Clean or replace air filters' },
    { id: 'coil_cleaning', label: 'Coil Cleaning', description: 'Evaporator coil cleaning' },
    { id: 'drain_cleaning', label: 'Drain Cleaning', description: 'Condensate drain cleaning' },
    { id: 'fan_service', label: 'Fan/Blower Service', description: 'Fan motor and blower service' },
    { id: 'thermostat', label: 'Thermostat Service', description: 'Thermostat check/replacement' },
    { id: 'other', label: 'Other', description: 'Other maintenance' },
  ],
};

// Get maintenance items for a component type
export function getMaintenanceItems(componentType: string): MaintenanceItem[] {
  return MAINTENANCE_ITEMS[componentType] || [
    { id: 'service', label: 'General Service', description: 'General maintenance service' },
    { id: 'inspection', label: 'Inspection', description: 'Inspection' },
    { id: 'repair', label: 'Repair', description: 'Repair work' },
    { id: 'other', label: 'Other', description: 'Other maintenance' },
  ];
}

// Get label for a maintenance item
export function getMaintenanceItemLabel(componentType: string, itemId: string): string {
  const items = getMaintenanceItems(componentType);
  const item = items.find(i => i.id === itemId);
  return item?.label || itemId;
}
