// Captain's Log - Database Types

export type UserRole = 'user' | 'admin';
export type PermissionLevel = 'read' | 'edit' | 'admin';
export type Currency = 'AED' | 'USD' | 'EUR';
export type DocumentCategory = 'registration' | 'insurance' | 'berth' | 'warranty' | 'invoice' | 'manual' | 'other';
export type EngineType = 'inboard' | 'outboard' | 'sterndrive' | 'pod_drive';
export type SafetyEquipmentType = 
  | 'fire_extinguisher'
  | 'engine_room_fire_system'
  | 'life_jacket'
  | 'life_raft'
  | 'flares'
  | 'epirb'
  | 'first_aid_kit'
  | 'life_ring'
  | 'fire_blanket'
  | 'other';
export type AlertType = 'document_expiry' | 'maintenance_due_date' | 'maintenance_due_hours';
export type AlertStatus = 'pending' | 'sent' | 'acknowledged' | 'dismissed';

// Component types
export type ComponentCategory = 'propulsion' | 'power' | 'maneuvering' | 'hydraulics' | 'hvac' | 'electrical' | 'tender' | 'systems';
export type ComponentType = 
  // Propulsion
  | 'engine'           // Legacy - maps to inboard
  | 'inboard_engine' 
  | 'outboard_engine'
  | 'drive_pod'
  | 'shaft' 
  | 'propeller' 
  // Power
  | 'generator'
  // Electrical / Batteries
  | 'engine_battery'
  | 'generator_battery'
  | 'house_battery'
  | 'thruster_battery'
  // Maneuvering
  | 'bow_thruster' 
  | 'stern_thruster'
  // Hydraulics
  | 'hydraulic'        // Legacy - maps to hydraulic_system
  | 'hydraulic_system'
  | 'swim_platform'
  | 'tender_crane'
  | 'passerelle'
  // HVAC
  | 'ac_chiller' 
  | 'ac_air_handler'
  // Tender
  | 'tender_outboard'
  | 'tender_jet';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  auth_provider: 'email' | 'google';
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Engine {
  brand?: string;
  model?: string;
  data_plate_url?: string; // Photo of engine data plate
}

export interface EngineBatteryInfo {
  position: string; // 'port', 'starboard', 'center', etc.
  battery_count?: number;
  battery_brand?: string;
  battery_model?: string;
  battery_type?: string; // AGM, Lithium, Lead Acid, Gel
  battery_voltage?: string; // 12V, 24V
  battery_capacity?: string; // e.g., "100Ah"
  install_date?: string;
}

export interface BoatComponent {
  id: string;
  boat_id: string;
  category: ComponentCategory;
  type: ComponentType;
  name: string;
  position?: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  install_date?: string;
  current_hours?: number;
  notes?: string;
  sort_order: number;
  // Service schedule
  scheduled_service_name?: string; // e.g., "Oil Change", "Fuel Filter", "Impeller"
  service_interval_days?: number;
  service_interval_hours?: number;
  last_service_date?: string;
  last_service_hours?: number;
  next_service_date?: string;
  next_service_hours?: number;
  // Service schedule planning notes and document
  service_schedule_notes?: string;
  service_schedule_doc_url?: string;
  // Battery fields (for battery components: house_battery, engine_battery, generator_battery, thruster_battery)
  battery_count?: number;
  battery_type?: string; // e.g., "AGM", "Lithium", "Lead Acid", "Gel"
  battery_voltage?: string; // e.g., "12V", "24V"
  battery_capacity?: string; // e.g., "100Ah", "200Ah"
  // Thruster battery info (for bow_thruster, stern_thruster)
  thruster_battery_count?: number;
  thruster_battery_brand?: string;
  thruster_battery_model?: string;
  thruster_battery_install_date?: string;
  // Per-engine battery data (for engine_battery type - stores array of battery info per engine)
  engine_batteries?: EngineBatteryInfo[];
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface Part {
  id: string;
  boat_id: string;
  component_id?: string;
  component_name?: string; // Joined from component
  name: string;
  brand?: string;
  part_number?: string;
  size_specs?: string;
  supplier?: string;
  install_date?: string;
  notes?: string;
  photo_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type HealthCheckType = 'oil_level' | 'fluid_level' | 'grease' | 'visual' | 'other';

export interface HealthCheck {
  id: string;
  boat_id: string;
  component_id?: string;
  component_name?: string; // Joined from component
  check_type: HealthCheckType;
  title: string;
  quantity?: string;
  notes?: string;
  date: string;
  created_by: string;
  created_at: string;
}

export interface Boat {
  id: string;
  owner_id: string;
  name: string;
  make?: string;
  model?: string;
  year?: number;
  length?: number;
  hull_id?: string;
  registration_number?: string;
  home_port?: string;
  photo_url?: string;
  engine_type?: EngineType; // inboard/outboard/sterndrive/pod_drive
  number_of_engines: number; // 1-6
  engines?: Engine[]; // Brand/model for each engine
  generator_brand?: string;
  generator_model?: string;
  generator_data_plate?: string; // Photo of generator data plate
  boat_data_plate?: string; // Photo of boat/hull data plate
  created_at: string;
  updated_at: string;
}

export interface LogType {
  id: string;
  name: string;
  icon?: string;
  tracks_hours: boolean;
  default_interval_days?: number;
  default_interval_hours?: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface LogEntry {
  id: string;
  boat_id: string;
  log_type_id: string;
  log_type?: LogType;
  date: string;
  description: string;
  cost?: number;
  currency: Currency;
  vendor_id?: string;
  vendor?: ServiceProvider;
  engine_hours_at_service?: number;
  generator_hours_at_service?: number;
  parts_replaced?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  boat_id: string;
  category: DocumentCategory;
  subcategory?: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  expiry_date?: string;
  linked_log_entry_id?: string;
  uploaded_by: string;
  uploaded_at: string;
  notes?: string;
}

export interface ServiceProvider {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  services_offered: string[];
  personal_rating?: number;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  boat_id: string;
  type: AlertType;
  reference_id: string;
  due_date?: string;
  due_hours?: number;
  reminder_days_before: number;
  status: AlertStatus;
  created_at: string;
  updated_at: string;
}

export interface BoatAccess {
  id: string;
  boat_id: string;
  user_id: string;
  permission_level: PermissionLevel;
  granted_by: string;
  granted_at: string;
  revoked_at?: string;
}

export interface SafetyEquipment {
  id: string;
  boat_id: string;
  type: SafetyEquipmentType;
  type_other?: string; // Custom name when type is 'other'
  quantity: number;
  expiry_date?: string;
  last_service_date?: string;
  service_interval_months?: number;
  next_service_date?: string;
  certification_number?: string;
  notes?: string;
  photo_url?: string; // Certificate or photo
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Form types for creating/editing
export type BoatFormData = Omit<Boat, 'id' | 'owner_id' | 'created_at' | 'updated_at'>;
export type LogEntryFormData = Omit<LogEntry, 'id' | 'created_by' | 'created_at' | 'updated_at' | 'log_type' | 'vendor'>;
export type DocumentFormData = Omit<Document, 'id' | 'uploaded_by' | 'uploaded_at'>;
export type ServiceProviderFormData = Omit<ServiceProvider, 'id' | 'created_by' | 'created_at' | 'updated_at'>;
