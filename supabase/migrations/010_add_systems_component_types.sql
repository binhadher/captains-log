-- Migration: Add trim system, stabilizers, and windlass component types
-- Run this if the existing DB already has the expanded type check and needs
-- to support the new 'systems' component types.

ALTER TABLE boat_components DROP CONSTRAINT IF EXISTS boat_components_type_check;

ALTER TABLE boat_components ADD CONSTRAINT boat_components_type_check
  CHECK (type IN (
    -- Propulsion
    'engine',
    'inboard_engine',
    'outboard_engine',
    'drive_pod',
    'shaft',
    'propeller',
    -- Power
    'generator',
    -- Electrical / Batteries
    'engine_battery',
    'generator_battery',
    'house_battery',
    'thruster_battery',
    -- Maneuvering
    'bow_thruster',
    'stern_thruster',
    -- Hydraulics
    'hydraulic',
    'hydraulic_system',
    'swim_platform',
    'tender_crane',
    'passerelle',
    -- HVAC
    'ac_chiller',
    'ac_air_handler',
    -- Tender
    'tender_outboard',
    'tender_jet',
    -- Custom / user-defined
    'custom',
    -- Other systems
    'trim_system',
    'stabilizers',
    'windlass'
  ));
