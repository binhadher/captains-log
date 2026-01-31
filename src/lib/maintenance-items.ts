// Predefined maintenance items per component type

export interface MaintenanceItem {
  id: string;
  label: string;
  description?: string;
}

export const MAINTENANCE_ITEMS: Record<string, MaintenanceItem[]> = {
  // Inboard engines
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
  inboard_engine: [
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
  // Outboard engines (different service items)
  outboard_engine: [
    { id: 'oil_change', label: 'Oil Change', description: 'Engine oil and filter change' },
    { id: 'gear_oil', label: 'Gear Oil', description: 'Lower unit gear oil change' },
    { id: 'spark_plugs', label: 'Spark Plugs', description: 'Replace spark plugs' },
    { id: 'fuel_filter', label: 'Fuel Filter', description: 'Replace fuel filter/water separator' },
    { id: 'impeller', label: 'Water Pump Impeller', description: 'Replace water pump impeller' },
    { id: 'anodes', label: 'Anodes', description: 'Replace sacrificial anodes' },
    { id: 'prop_inspection', label: 'Propeller Inspection', description: 'Inspect prop for damage' },
    { id: 'grease', label: 'Grease Points', description: 'Grease all fittings' },
    { id: 'thermostat', label: 'Thermostat', description: 'Check/replace thermostat' },
    { id: 'other', label: 'Other', description: 'Other maintenance' },
  ],
  // Drive pods (IPS, Zeus, etc.)
  drive_pod: [
    { id: 'oil_change', label: 'Oil Change', description: 'Pod drive oil change' },
    { id: 'gear_oil', label: 'Gear Oil', description: 'Replace gear oil' },
    { id: 'steering_fluid', label: 'Steering Fluid', description: 'Check/top up steering fluid' },
    { id: 'anodes', label: 'Anodes', description: 'Replace zinc anodes' },
    { id: 'bellows', label: 'Bellows Inspection', description: 'Inspect bellows for cracks' },
    { id: 'prop_inspection', label: 'Propeller Inspection', description: 'Inspect propellers' },
    { id: 'software', label: 'Software Update', description: 'Update pod control software' },
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
  stern_thruster: [
    { id: 'inspection', label: 'Inspection', description: 'General inspection' },
    { id: 'gear_oil', label: 'Gear Oil Change', description: 'Replace gear oil' },
    { id: 'zincs', label: 'Zincs/Anodes', description: 'Replace anodes' },
    { id: 'motor_service', label: 'Motor Service', description: 'Electric motor service' },
    { id: 'propeller', label: 'Propeller Service', description: 'Thruster prop service' },
    { id: 'other', label: 'Other', description: 'Other maintenance' },
  ],
  // Batteries
  engine_battery: [
    { id: 'check_voltage', label: 'Voltage Check', description: 'Check battery voltage' },
    { id: 'load_test', label: 'Load Test', description: 'Perform load test' },
    { id: 'clean_terminals', label: 'Clean Terminals', description: 'Clean and protect terminals' },
    { id: 'check_water', label: 'Check Water Level', description: 'Check/top up electrolyte (if applicable)' },
    { id: 'replacement', label: 'Replacement', description: 'Replace battery' },
    { id: 'other', label: 'Other', description: 'Other maintenance' },
  ],
  generator_battery: [
    { id: 'check_voltage', label: 'Voltage Check', description: 'Check battery voltage' },
    { id: 'load_test', label: 'Load Test', description: 'Perform load test' },
    { id: 'clean_terminals', label: 'Clean Terminals', description: 'Clean and protect terminals' },
    { id: 'check_water', label: 'Check Water Level', description: 'Check/top up electrolyte (if applicable)' },
    { id: 'replacement', label: 'Replacement', description: 'Replace battery' },
    { id: 'other', label: 'Other', description: 'Other maintenance' },
  ],
  house_battery: [
    { id: 'check_voltage', label: 'Voltage Check', description: 'Check battery bank voltage' },
    { id: 'equalization', label: 'Equalization Charge', description: 'Perform equalization charge' },
    { id: 'clean_terminals', label: 'Clean Terminals', description: 'Clean and protect terminals' },
    { id: 'check_water', label: 'Check Water Level', description: 'Check/top up electrolyte (if applicable)' },
    { id: 'capacity_test', label: 'Capacity Test', description: 'Test battery capacity' },
    { id: 'replacement', label: 'Replacement', description: 'Replace battery bank' },
    { id: 'other', label: 'Other', description: 'Other maintenance' },
  ],
  thruster_battery: [
    { id: 'check_voltage', label: 'Voltage Check', description: 'Check battery voltage' },
    { id: 'load_test', label: 'Load Test', description: 'Perform load test' },
    { id: 'clean_terminals', label: 'Clean Terminals', description: 'Clean and protect terminals' },
    { id: 'replacement', label: 'Replacement', description: 'Replace battery' },
    { id: 'other', label: 'Other', description: 'Other maintenance' },
  ],
  // Hydraulic systems
  hydraulic_system: [
    { id: 'fluid_change', label: 'Fluid Change', description: 'Hydraulic fluid change' },
    { id: 'filter', label: 'Filter Replacement', description: 'Replace hydraulic filter' },
    { id: 'hose_inspection', label: 'Hose Inspection', description: 'Inspect hoses and fittings' },
    { id: 'pump_service', label: 'Pump Service', description: 'Hydraulic pump service' },
    { id: 'cylinder_service', label: 'Cylinder Service', description: 'Cylinder inspection/service' },
    { id: 'other', label: 'Other', description: 'Other maintenance' },
  ],
  swim_platform: [
    { id: 'fluid_check', label: 'Fluid Check', description: 'Check hydraulic fluid level' },
    { id: 'function_test', label: 'Function Test', description: 'Test raise/lower operation' },
    { id: 'hinge_lubrication', label: 'Hinge Lubrication', description: 'Lubricate hinges and pivots' },
    { id: 'seal_inspection', label: 'Seal Inspection', description: 'Inspect cylinder seals' },
    { id: 'other', label: 'Other', description: 'Other maintenance' },
  ],
  tender_crane: [
    { id: 'fluid_check', label: 'Fluid Check', description: 'Check hydraulic fluid level' },
    { id: 'function_test', label: 'Function Test', description: 'Test crane operation' },
    { id: 'wire_inspection', label: 'Wire Inspection', description: 'Inspect cables/wires for wear' },
    { id: 'lubrication', label: 'Lubrication', description: 'Lubricate moving parts' },
    { id: 'load_test', label: 'Load Test', description: 'Perform load test' },
    { id: 'other', label: 'Other', description: 'Other maintenance' },
  ],
  passerelle: [
    { id: 'fluid_check', label: 'Fluid Check', description: 'Check hydraulic fluid level' },
    { id: 'function_test', label: 'Function Test', description: 'Test extend/retract operation' },
    { id: 'hinge_lubrication', label: 'Hinge Lubrication', description: 'Lubricate hinges' },
    { id: 'teak_care', label: 'Teak Care', description: 'Clean and oil teak surfaces' },
    { id: 'other', label: 'Other', description: 'Other maintenance' },
  ],
  // Tenders
  tender_outboard: [
    { id: 'engine_service', label: 'Engine Service', description: 'Full outboard service' },
    { id: 'oil_change', label: 'Oil Change', description: 'Engine and gear oil change' },
    { id: 'fuel_system', label: 'Fuel System', description: 'Check fuel lines and filter' },
    { id: 'tube_inspection', label: 'Tube Inspection', description: 'Inspect RIB tubes for leaks' },
    { id: 'floor_inspection', label: 'Floor Inspection', description: 'Check floor boards' },
    { id: 'other', label: 'Other', description: 'Other maintenance' },
  ],
  tender_jet: [
    { id: 'engine_service', label: 'Engine Service', description: 'Full engine service' },
    { id: 'oil_change', label: 'Oil Change', description: 'Engine oil change' },
    { id: 'spark_plugs', label: 'Spark Plugs', description: 'Replace spark plugs' },
    { id: 'jet_pump', label: 'Jet Pump Inspection', description: 'Inspect impeller and wear ring' },
    { id: 'hull_inspection', label: 'Hull Inspection', description: 'Check hull for damage' },
    { id: 'winterize', label: 'Winterization', description: 'Winterize/de-winterize' },
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
