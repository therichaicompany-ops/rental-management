-- Migration: Add need_excise_permit to rental_contracts and rental_leads tables
-- Date: 2026-09-29

-- 1. Add need_excise_permit to rental_contracts table
ALTER TABLE rental_contracts 
ADD COLUMN IF NOT EXISTS need_excise_permit boolean NOT NULL DEFAULT false;

-- 2. Add need_excise_permit to rental_leads table
ALTER TABLE rental_leads 
ADD COLUMN IF NOT EXISTS need_excise_permit boolean NOT NULL DEFAULT false;
