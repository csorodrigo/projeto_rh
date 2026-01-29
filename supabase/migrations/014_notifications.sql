-- =====================================================
-- Migration: Notifications System
-- Description: Sistema completo de notificações in-app e email
-- Author: Sistema RH
-- Date: 2026-01-29
-- =====================================================

-- Enum para tipos de notificação
CREATE TYPE notification_type AS ENUM (
  'birthday',              -- Aniversário
  'work_anniversary',      -- Aniversário de admissão
  'vacation_expiring',     -- Férias vencendo
  'absence_pending',       -- Ausência pendente de aprovação
  'absence_approved',      -- Ausência aprovada
  'absence_rejected',      -- Ausência rejeitada
  'time_missing',          -- Ponto não registrado
  'compliance_violation',  -- Violação de compliance
  'document_expiring',     -- Documento vencendo
  'aso_expiring',          -- ASO vencendo
  'new_employee',          -- Novo funcionário
  'payroll_ready',         -- Folha pronta
  'system'                 -- Notificação do sistema
);

-- Enum para prioridade
CREATE TYPE notification_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- Tabela de notificações
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Tipo e conteúdo
  type notification_type NOT NULL,
  priority notification_priority DEFAULT 'medium',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,

  -- Ação relacionada
  link VARCHAR(500),
  action_text VARCHAR(100),

  -- Dados relacionados (JSON flexível)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Estado
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMP,

  -- Email
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP,
  email_error TEXT,

  -- Auditoria
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de preferências de notificação por usuário
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Canais preferidos
  enable_in_app BOOLEAN DEFAULT TRUE,
  enable_email BOOLEAN DEFAULT TRUE,
  enable_push BOOLEAN DEFAULT FALSE,

  -- Tipos de notificação habilitados
  notify_birthdays BOOLEAN DEFAULT TRUE,
  notify_work_anniversaries BOOLEAN DEFAULT TRUE,
  notify_vacation_expiring BOOLEAN DEFAULT TRUE,
  notify_absences BOOLEAN DEFAULT TRUE,
  notify_time_tracking BOOLEAN DEFAULT TRUE,
  notify_compliance BOOLEAN DEFAULT TRUE,
  notify_documents BOOLEAN DEFAULT TRUE,
  notify_payroll BOOLEAN DEFAULT TRUE,
  notify_system BOOLEAN DEFAULT TRUE,

  -- Configurações de email
  email_digest BOOLEAN DEFAULT FALSE,
  email_digest_frequency VARCHAR(20) DEFAULT 'daily', -- 'instant', 'hourly', 'daily', 'weekly'
  email_digest_time TIME DEFAULT '09:00:00',

  -- Horário "não incomodar"
  do_not_disturb_enabled BOOLEAN DEFAULT FALSE,
  do_not_disturb_start TIME,
  do_not_disturb_end TIME,

  -- Auditoria
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de logs de notificações enviadas (para auditoria)
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,

  -- Detalhes do envio
  channel VARCHAR(20) NOT NULL, -- 'in_app', 'email', 'push'
  status VARCHAR(20) NOT NULL,  -- 'sent', 'failed', 'bounced'
  error_message TEXT,

  -- Metadados
  email_to VARCHAR(255),
  email_subject VARCHAR(500),
  provider_response JSONB,

  -- Auditoria
  sent_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read) WHERE NOT archived;
CREATE INDEX idx_notifications_company ON notifications(company_id, created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type, created_at DESC);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE NOT read AND NOT archived;

CREATE INDEX idx_notification_prefs_user ON notification_preferences(user_id);
CREATE INDEX idx_notification_logs_notification ON notification_logs(notification_id);
CREATE INDEX idx_notification_logs_user ON notification_logs(user_id, sent_at DESC);

-- Trigger para updated_at
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Policies para notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Policies para notification_preferences
CREATE POLICY "Users can view their own preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies para notification_logs (apenas leitura para auditoria)
CREATE POLICY "Admins can view notification logs"
  ON notification_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'company_admin', 'hr_manager')
    )
  );

-- Função para criar preferências padrão ao criar usuário
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id, company_id)
  VALUES (NEW.id, NEW.company_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_user_notification_preferences
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- Função para marcar todas como lidas
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE notifications
  SET
    read = TRUE,
    read_at = NOW(),
    updated_at = NOW()
  WHERE
    user_id = p_user_id
    AND read = FALSE
    AND archived = FALSE;

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para arquivar notificações antigas (rodar mensalmente)
CREATE OR REPLACE FUNCTION archive_old_notifications()
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE notifications
  SET
    archived = TRUE,
    archived_at = NOW(),
    updated_at = NOW()
  WHERE
    read = TRUE
    AND archived = FALSE
    AND created_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View para estatísticas de notificações
CREATE OR REPLACE VIEW notification_stats AS
SELECT
  company_id,
  user_id,
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE NOT read) as unread_count,
  COUNT(*) FILTER (WHERE read) as read_count,
  COUNT(*) FILTER (WHERE archived) as archived_count,
  COUNT(*) FILTER (WHERE email_sent) as email_sent_count,
  MAX(created_at) as last_notification_at
FROM notifications
GROUP BY company_id, user_id;

-- Comentários
COMMENT ON TABLE notifications IS 'Notificações in-app e por email do sistema';
COMMENT ON TABLE notification_preferences IS 'Preferências de notificação por usuário';
COMMENT ON TABLE notification_logs IS 'Logs de envio de notificações para auditoria';
COMMENT ON COLUMN notifications.metadata IS 'Dados adicionais em JSON (employee_id, absence_id, etc)';
COMMENT ON COLUMN notification_preferences.email_digest IS 'Agrupar notificações em um email digest';
