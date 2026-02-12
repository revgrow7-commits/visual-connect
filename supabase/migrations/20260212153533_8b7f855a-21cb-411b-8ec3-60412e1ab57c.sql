-- Add new roles to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'rh';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'colaborador';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gestor';