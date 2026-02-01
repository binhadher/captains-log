-- Migration: Expand component types and categories for flexible boat setup
-- Run this in Supabase SQL Editor

-- Drop existing constraints
ALTER TABLE boat_components DROP CONSTRAINT IF EXISTS boat_components_category_check;
ALTER TABLE boat_components DROP CONSTRAINT IF EXISTS boat_components_type_check;

-- Add new expanded constraints
ALTER TABLE boat_components ADD CONSTRAINT boat_components_category_check 
  CHECK (category IN (
    'propulsion',    -- Engines, shafts, propellers, pods
    'power',         -- Generator
    'electrical',    -- Batteries
    'maneuvering',   -- Thrusters
    'hydraulics',    -- Hydraulic systems, swim platform, crane, passerelle
    'hvac',          -- AC chiller, air handlers
    'tender',        -- Tenders and PWC
    'systems'        -- Legacy, general systems
  ));

ALTER TABLE boat_components ADD CONSTRAINT boat_components_type_check 
  CHECK (type IN (
    -- Propulsion (legacy + new)
    'engine',            -- Legacy inboard
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
    'hydraulic',         -- Legacy
    'hydraulic_system',
    'swim_platform',
    'tender_crane',
    'passerelle',
    -- HVAC
    'ac_chiller',
    'ac_air_handler',
    -- Tender
    'tender_outboard',
    'tender_jet'
  ));
