-- =====================================================
-- Migration 021: Recruitment System - Fase 7
-- Sistema de Recrutamento e Seleção
-- =====================================================

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE job_status AS ENUM ('draft', 'open', 'paused', 'closed', 'cancelled');
CREATE TYPE job_type AS ENUM ('full_time', 'part_time', 'contract', 'internship', 'temporary');
CREATE TYPE job_location_type AS ENUM ('on_site', 'remote', 'hybrid');
CREATE TYPE application_status AS ENUM ('new', 'screening', 'interview', 'assessment', 'offer', 'hired', 'rejected', 'withdrawn');
CREATE TYPE interview_type AS ENUM ('phone', 'video', 'in_person', 'technical', 'behavioral');
CREATE TYPE interview_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');

-- [Restante do conteúdo do SQL...]
