// Component Templates Library
// Defines all component types, their maintenance schedules, and which boat configs they apply to

export type PropulsionType = 'inboard' | 'outboard' | 'pods';
export type BatteryVoltage = '12v' | '24v';

export interface ComponentTemplate {
  id: string;
  type: string;
  category: 'propulsion' | 'power' | 'maneuvering' | 'hydraulics' | 'hvac' | 'electrical' | 'tender';
  name: string;
  icon: string;
  description?: string;
  // Which propulsion types this component applies to (empty = all)
  appliesTo?: PropulsionType[];
  // Which propulsion types this is NOT relevant for
  excludeFor?: PropulsionType[];
  // Default maintenance schedule
  defaultServiceIntervalDays?: number;
  defaultServiceIntervalHours?: number;
  // Can have multiples (e.g., engines, batteries)
  allowMultiple?: boolean;
  // Position options if multiple (e.g., port/starboard)
  positionOptions?: string[];
  // Questions to ask during setup
  setupQuestions?: SetupQuestion[];
}

export interface SetupQuestion {
  id: string;
  question: string;
  type: 'boolean' | 'number' | 'select' | 'text';
  options?: string[];
  required?: boolean;
  defaultValue?: string | number | boolean;
}

// ============================================
// COMPONENT TEMPLATES
// ============================================

export const COMPONENT_TEMPLATES: ComponentTemplate[] = [
  // PROPULSION - Inboard
  {
    id: 'inboard_engine',
    type: 'inboard_engine',
    category: 'propulsion',
    name: 'Inboard Engine',
    icon: '⚙️',
    description: 'Diesel or gasoline inboard engine',
    appliesTo: ['inboard'],
    defaultServiceIntervalDays: 365,
    defaultServiceIntervalHours: 250,
    allowMultiple: true,
    positionOptions: ['port', 'starboard', 'center'],
  },
  {
    id: 'shaft',
    type: 'shaft',
    category: 'propulsion',
    name: 'Propeller Shaft',
    icon: '🔩',
    appliesTo: ['inboard'],
    defaultServiceIntervalDays: 365,
    allowMultiple: true,
    positionOptions: ['port', 'starboard', 'center'],
  },
  {
    id: 'propeller',
    type: 'propeller',
    category: 'propulsion',
    name: 'Propeller',
    icon: '🌀',
    appliesTo: ['inboard'],
    defaultServiceIntervalDays: 365,
    allowMultiple: true,
    positionOptions: ['port', 'starboard', 'center'],
  },
  
  // PROPULSION - Outboard
  {
    id: 'outboard_engine',
    type: 'outboard_engine',
    category: 'propulsion',
    name: 'Outboard Engine',
    icon: '🚤',
    description: 'Outboard motor',
    appliesTo: ['outboard'],
    defaultServiceIntervalDays: 365,
    defaultServiceIntervalHours: 100,
    allowMultiple: true,
    positionOptions: ['port', 'starboard', 'center', 'port-outer', 'port-inner', 'starboard-inner', 'starboard-outer'],
  },
  
  // PROPULSION - Pods
  {
    id: 'drive_pod',
    type: 'drive_pod',
    category: 'propulsion',
    name: 'Drive Pod',
    icon: '🔄',
    description: 'IPS, Zeus, or similar pod drive system',
    appliesTo: ['pods'],
    defaultServiceIntervalDays: 365,
    defaultServiceIntervalHours: 200,
    allowMultiple: true,
    positionOptions: ['port', 'starboard'],
  },
  
  // POWER GENERATION
  {
    id: 'generator',
    type: 'generator',
    category: 'power',
    name: 'Generator',
    icon: '🔋',
    description: 'Onboard generator (Fisher Panda, Onan, etc.)',
    defaultServiceIntervalDays: 365,
    defaultServiceIntervalHours: 500,
    allowMultiple: true,
    positionOptions: ['main', 'backup', 'emergency'],
  },
  
  // BATTERIES
  {
    id: 'engine_battery',
    type: 'engine_battery',
    category: 'electrical',
    name: 'Engine Start Battery',
    icon: '🔌',
    description: 'Battery bank for engine starting',
    defaultServiceIntervalDays: 30,
    allowMultiple: true,
    positionOptions: ['port', 'starboard', 'main'],
  },
  {
    id: 'generator_battery',
    type: 'generator_battery',
    category: 'electrical',
    name: 'Generator Start Battery',
    icon: '🔌',
    description: 'Battery for generator starting',
    defaultServiceIntervalDays: 30,
    allowMultiple: true,
  },
  {
    id: 'house_battery',
    type: 'house_battery',
    category: 'electrical',
    name: 'House Battery Bank',
    icon: '🏠',
    description: 'Batteries for domestic/house systems',
    defaultServiceIntervalDays: 30,
    allowMultiple: true,
  },
  {
    id: 'thruster_battery',
    type: 'thruster_battery',
    category: 'electrical',
    name: 'Thruster Battery',
    icon: '⚡',
    description: 'Dedicated battery for bow/stern thruster',
    defaultServiceIntervalDays: 30,
    excludeFor: ['pods'], // Pods don't need separate thruster batteries
    allowMultiple: true,
    positionOptions: ['bow', 'stern'],
  },
  
  // MANEUVERING
  {
    id: 'bow_thruster',
    type: 'bow_thruster',
    category: 'maneuvering',
    name: 'Bow Thruster',
    icon: '↔️',
    description: 'Bow thruster for docking assistance',
    excludeFor: ['pods'], // Pods handle maneuvering
    defaultServiceIntervalDays: 365,
  },
  {
    id: 'stern_thruster',
    type: 'stern_thruster',
    category: 'maneuvering',
    name: 'Stern Thruster',
    icon: '↔️',
    description: 'Stern thruster for docking assistance',
    excludeFor: ['pods'], // Pods handle maneuvering
    defaultServiceIntervalDays: 365,
  },
  
  // HYDRAULICS
  {
    id: 'hydraulic_system',
    type: 'hydraulic_system',
    category: 'hydraulics',
    name: 'Hydraulic System',
    icon: '💧',
    description: 'Main hydraulic system',
    defaultServiceIntervalDays: 365,
  },
  {
    id: 'swim_platform',
    type: 'swim_platform',
    category: 'hydraulics',
    name: 'Swim Platform Lift',
    icon: '🏊',
    description: 'Hydraulic swim platform for tender launch',
    defaultServiceIntervalDays: 180,
  },
  {
    id: 'tender_crane',
    type: 'tender_crane',
    category: 'hydraulics',
    name: 'Tender Crane',
    icon: '🏗️',
    description: 'Crane for launching tender from flybridge/deck',
    defaultServiceIntervalDays: 180,
  },
  {
    id: 'passerelle',
    type: 'passerelle',
    category: 'hydraulics',
    name: 'Passerelle/Gangway',
    icon: '🚶',
    description: 'Hydraulic gangway',
    defaultServiceIntervalDays: 180,
  },
  
  // HVAC
  {
    id: 'ac_chiller',
    type: 'ac_chiller',
    category: 'hvac',
    name: 'AC Chiller',
    icon: '❄️',
    description: 'Central air conditioning chiller unit',
    defaultServiceIntervalDays: 180,
  },
  {
    id: 'ac_air_handler',
    type: 'ac_air_handler',
    category: 'hvac',
    name: 'AC Air Handler',
    icon: '🌬️',
    description: 'Individual air conditioning unit',
    defaultServiceIntervalDays: 90,
    allowMultiple: true,
    positionOptions: ['saloon', 'master', 'vip', 'guest', 'galley', 'crew', 'flybridge', 'helm'],
  },
  
  // TENDER
  {
    id: 'tender_outboard',
    type: 'tender_outboard',
    category: 'tender',
    name: 'Tender (Outboard)',
    icon: '🚤',
    description: 'RIB or dinghy with outboard engine',
    defaultServiceIntervalDays: 365,
    defaultServiceIntervalHours: 100,
    allowMultiple: true,
  },
  {
    id: 'tender_jet',
    type: 'tender_jet',
    category: 'tender',
    name: 'Tender (Jet/PWC)',
    icon: '🌊',
    description: 'Jet ski or personal watercraft',
    defaultServiceIntervalDays: 365,
    defaultServiceIntervalHours: 50,
    allowMultiple: true,
  },
];

// ============================================
// SETUP WIZARD QUESTIONS
// ============================================

export interface SetupStep {
  id: string;
  question: string;
  helpText?: string;
  type: 'choice' | 'number' | 'boolean' | 'text';
  options?: { value: string; label: string; icon?: string }[];
  // Which step to go to based on answer (for branching)
  nextStep?: string | Record<string, string>;
  // Components to add based on this answer
  components?: (answer: string | number | boolean) => Partial<ComponentTemplate>[];
  // Can user skip? (Default: true)
  skippable?: boolean;
  skipLabel?: string;
}

export const SETUP_STEPS: SetupStep[] = [
  // Step 1: Propulsion Type (THE FORK)
  {
    id: 'propulsion_type',
    question: 'What type of propulsion does your boat have?',
    helpText: "Don't worry if you're not sure — you can change this later",
    type: 'choice',
    options: [
      { value: 'inboard', label: 'Inboard', icon: '⚙️' },
      { value: 'outboard', label: 'Outboard', icon: '🚤' },
      { value: 'pods', label: 'Pods (IPS/Zeus)', icon: '🔄' },
    ],
    nextStep: {
      inboard: 'inboard_count',
      outboard: 'outboard_count',
      pods: 'pod_count',
    },
    skippable: true,
    skipLabel: "I'll set this up later",
  },
  
  // INBOARD BRANCH
  {
    id: 'inboard_count',
    question: 'How many inboard engines?',
    type: 'choice',
    options: [
      { value: '1', label: 'Single', icon: '1️⃣' },
      { value: '2', label: 'Twin', icon: '2️⃣' },
      { value: '3', label: 'Triple', icon: '3️⃣' },
    ],
    nextStep: 'generator',
    skippable: true,
    skipLabel: "Not sure",
  },
  
  // OUTBOARD BRANCH
  {
    id: 'outboard_count',
    question: 'How many outboard engines?',
    type: 'choice',
    options: [
      { value: '1', label: 'Single', icon: '1️⃣' },
      { value: '2', label: 'Twin', icon: '2️⃣' },
      { value: '3', label: 'Triple', icon: '3️⃣' },
      { value: '4', label: 'Quad', icon: '4️⃣' },
    ],
    nextStep: 'generator',
    skippable: true,
    skipLabel: "Not sure",
  },
  
  // POD BRANCH
  {
    id: 'pod_count',
    question: 'How many drive pods?',
    type: 'choice',
    options: [
      { value: '2', label: 'Twin pods', icon: '2️⃣' },
      { value: '3', label: 'Triple pods', icon: '3️⃣' },
    ],
    nextStep: 'generator',
    skippable: true,
    skipLabel: "Not sure",
  },
  
  // GENERATOR (all paths)
  {
    id: 'generator',
    question: 'Do you have a generator onboard?',
    helpText: 'For producing electricity when not connected to shore power',
    type: 'choice',
    options: [
      { value: 'none', label: 'No generator', icon: '❌' },
      { value: '1', label: 'One generator', icon: '1️⃣' },
      { value: '2', label: 'Two generators', icon: '2️⃣' },
    ],
    nextStep: 'thrusters',
    skippable: true,
    skipLabel: "Not sure",
  },
  
  // THRUSTERS (skip for pods)
  {
    id: 'thrusters',
    question: 'Any thrusters for docking?',
    helpText: 'Bow and/or stern thrusters help with maneuvering',
    type: 'choice',
    options: [
      { value: 'none', label: 'No thrusters', icon: '❌' },
      { value: 'bow', label: 'Bow only', icon: '⬆️' },
      { value: 'stern', label: 'Stern only', icon: '⬇️' },
      { value: 'both', label: 'Bow & Stern', icon: '↕️' },
    ],
    nextStep: 'batteries',
    skippable: true,
    skipLabel: "Not sure / None",
  },
  
  // BATTERIES
  {
    id: 'batteries',
    question: 'What battery voltage does your boat use?',
    helpText: "Check your battery labels if you're not sure",
    type: 'choice',
    options: [
      { value: '12v', label: '12 Volt', icon: '🔋' },
      { value: '24v', label: '24 Volt', icon: '🔋' },
      { value: 'mixed', label: 'Mixed (12V & 24V)', icon: '🔋' },
    ],
    nextStep: 'hvac',
    skippable: true,
    skipLabel: "I don't know",
  },
  
  // HVAC
  {
    id: 'hvac',
    question: 'Do you have air conditioning?',
    type: 'choice',
    options: [
      { value: 'none', label: 'No A/C', icon: '❌' },
      { value: 'chiller', label: 'Central chiller system', icon: '❄️' },
      { value: 'split', label: 'Split units', icon: '🌬️' },
    ],
    nextStep: 'tender',
    skippable: true,
    skipLabel: "Not sure",
  },
  
  // TENDER
  {
    id: 'tender',
    question: 'Do you have a tender or PWC?',
    helpText: 'RIB, dinghy, or jet ski',
    type: 'choice',
    options: [
      { value: 'none', label: 'No tender', icon: '❌' },
      { value: 'outboard', label: 'Tender with outboard', icon: '🚤' },
      { value: 'jet', label: 'Jet ski / PWC', icon: '🌊' },
      { value: 'both', label: 'Both', icon: '🚤🌊' },
    ],
    nextStep: 'hydraulics',
    skippable: true,
    skipLabel: "No / Not sure",
  },
  
  // HYDRAULICS
  {
    id: 'hydraulics',
    question: 'Any hydraulic systems?',
    helpText: 'Swim platform lift, tender crane, passerelle, etc.',
    type: 'choice',
    options: [
      { value: 'none', label: 'No hydraulics', icon: '❌' },
      { value: 'platform', label: 'Swim platform', icon: '🏊' },
      { value: 'crane', label: 'Tender crane', icon: '🏗️' },
      { value: 'passerelle', label: 'Passerelle', icon: '🚶' },
      { value: 'multiple', label: 'Multiple systems', icon: '✨' },
    ],
    nextStep: 'complete',
    skippable: true,
    skipLabel: "No / Not sure",
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get components that apply to a specific propulsion type
 */
export function getComponentsForPropulsion(propulsionType: PropulsionType): ComponentTemplate[] {
  return COMPONENT_TEMPLATES.filter(template => {
    // If component has specific propulsion requirements
    if (template.appliesTo && template.appliesTo.length > 0) {
      return template.appliesTo.includes(propulsionType);
    }
    // If component should be excluded for this propulsion
    if (template.excludeFor && template.excludeFor.includes(propulsionType)) {
      return false;
    }
    return true;
  });
}

/**
 * Get a specific setup step by ID
 */
export function getSetupStep(stepId: string): SetupStep | undefined {
  return SETUP_STEPS.find(step => step.id === stepId);
}

/**
 * Get the next step ID based on current step and answer
 */
export function getNextStep(currentStepId: string, answer: string): string | null {
  const step = getSetupStep(currentStepId);
  if (!step) return null;
  
  if (typeof step.nextStep === 'string') {
    return step.nextStep;
  }
  
  if (typeof step.nextStep === 'object' && answer in step.nextStep) {
    return step.nextStep[answer];
  }
  
  return null;
}

/**
 * Get engine position labels based on count
 */
export function getEngineLabels(count: number): { name: string; position: string }[] {
  const configs: Record<number, { name: string; position: string }[]> = {
    1: [{ name: 'Engine', position: 'center' }],
    2: [
      { name: 'Port Engine', position: 'port' },
      { name: 'Starboard Engine', position: 'starboard' },
    ],
    3: [
      { name: 'Port Engine', position: 'port' },
      { name: 'Center Engine', position: 'center' },
      { name: 'Starboard Engine', position: 'starboard' },
    ],
    4: [
      { name: 'Port Outer Engine', position: 'port-outer' },
      { name: 'Port Inner Engine', position: 'port-inner' },
      { name: 'Starboard Inner Engine', position: 'starboard-inner' },
      { name: 'Starboard Outer Engine', position: 'starboard-outer' },
    ],
  };
  return configs[count] || configs[2];
}

/**
 * Generate components from wizard answers
 */
export function generateComponentsFromAnswers(
  answers: Record<string, string | number | boolean>
): Partial<ComponentTemplate>[] {
  const components: Partial<ComponentTemplate>[] = [];
  const propulsion = answers.propulsion_type as PropulsionType;
  
  // ENGINES based on propulsion type
  if (propulsion === 'inboard' && answers.inboard_count) {
    const count = parseInt(answers.inboard_count as string) || 2;
    const labels = getEngineLabels(count);
    labels.forEach(({ name, position }) => {
      components.push({
        type: 'inboard_engine',
        category: 'propulsion',
        name,
        positionOptions: [position],
      });
      // Add shaft and propeller for each inboard engine
      components.push({
        type: 'shaft',
        category: 'propulsion',
        name: count === 1 ? 'Shaft' : `${position.charAt(0).toUpperCase() + position.slice(1)} Shaft`,
        positionOptions: [position],
      });
      components.push({
        type: 'propeller',
        category: 'propulsion',
        name: count === 1 ? 'Propeller' : `${position.charAt(0).toUpperCase() + position.slice(1)} Propeller`,
        positionOptions: [position],
      });
    });
  }
  
  if (propulsion === 'outboard' && answers.outboard_count) {
    const count = parseInt(answers.outboard_count as string) || 2;
    const labels = getEngineLabels(count);
    labels.forEach(({ name, position }) => {
      components.push({
        type: 'outboard_engine',
        category: 'propulsion',
        name: name.replace('Engine', 'Outboard'),
        positionOptions: [position],
      });
    });
  }
  
  if (propulsion === 'pods' && answers.pod_count) {
    const count = parseInt(answers.pod_count as string) || 2;
    const positions = count === 2 
      ? ['Port', 'Starboard'] 
      : ['Port', 'Center', 'Starboard'];
    positions.forEach(pos => {
      components.push({
        type: 'drive_pod',
        category: 'propulsion',
        name: `${pos} Pod`,
        positionOptions: [pos.toLowerCase()],
      });
    });
  }
  
  // GENERATOR
  if (answers.generator && answers.generator !== 'none') {
    const count = parseInt(answers.generator as string) || 1;
    for (let i = 0; i < count; i++) {
      components.push({
        type: 'generator',
        category: 'power',
        name: count === 1 ? 'Generator' : `Generator ${i + 1}`,
      });
    }
  }
  
  // THRUSTERS (not for pods)
  if (propulsion !== 'pods' && answers.thrusters && answers.thrusters !== 'none') {
    const thrusterConfig = answers.thrusters as string;
    if (thrusterConfig === 'bow' || thrusterConfig === 'both') {
      components.push({
        type: 'bow_thruster',
        category: 'maneuvering',
        name: 'Bow Thruster',
      });
    }
    if (thrusterConfig === 'stern' || thrusterConfig === 'both') {
      components.push({
        type: 'stern_thruster',
        category: 'maneuvering',
        name: 'Stern Thruster',
      });
    }
  }
  
  // BATTERIES
  if (answers.batteries) {
    // Always add house batteries
    components.push({
      type: 'house_battery',
      category: 'electrical',
      name: 'House Battery Bank',
    });
    // Engine start batteries
    components.push({
      type: 'engine_battery',
      category: 'electrical',
      name: 'Engine Start Batteries',
    });
  }
  
  // HVAC
  if (answers.hvac && answers.hvac !== 'none') {
    if (answers.hvac === 'chiller') {
      components.push({
        type: 'ac_chiller',
        category: 'hvac',
        name: 'AC Chiller',
      });
    }
    // Add a default air handler
    components.push({
      type: 'ac_air_handler',
      category: 'hvac',
      name: 'Saloon AC',
      positionOptions: ['saloon'],
    });
  }
  
  // TENDER
  if (answers.tender && answers.tender !== 'none') {
    if (answers.tender === 'outboard' || answers.tender === 'both') {
      components.push({
        type: 'tender_outboard',
        category: 'tender',
        name: 'Tender',
      });
    }
    if (answers.tender === 'jet' || answers.tender === 'both') {
      components.push({
        type: 'tender_jet',
        category: 'tender',
        name: 'Jet Ski',
      });
    }
  }
  
  // HYDRAULICS
  if (answers.hydraulics && answers.hydraulics !== 'none') {
    components.push({
      type: 'hydraulic_system',
      category: 'hydraulics',
      name: 'Hydraulic System',
    });
    
    if (answers.hydraulics === 'platform' || answers.hydraulics === 'multiple') {
      components.push({
        type: 'swim_platform',
        category: 'hydraulics',
        name: 'Swim Platform Lift',
      });
    }
    if (answers.hydraulics === 'crane' || answers.hydraulics === 'multiple') {
      components.push({
        type: 'tender_crane',
        category: 'hydraulics',
        name: 'Tender Crane',
      });
    }
    if (answers.hydraulics === 'passerelle' || answers.hydraulics === 'multiple') {
      components.push({
        type: 'passerelle',
        category: 'hydraulics',
        name: 'Passerelle',
      });
    }
  }
  
  return components;
}
