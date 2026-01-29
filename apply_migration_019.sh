#!/bin/bash

# Script para aplicar Migração 019 no Supabase
# IMPORTANTE: Este script precisa ser executado manualmente no Supabase SQL Editor
# pois o Supabase não permite execução de SQL arbitrário via API REST

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║  APLICANDO MIGRAÇÃO 019 NO SUPABASE                    ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}INSTRUÇÕES:${NC}"
echo ""
echo "1. Abra o Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/lmpyxqvxzigsusjniarz"
echo ""
echo "2. Vá em: SQL Editor (menu lateral)"
echo ""
echo "3. Clique em: New query"
echo ""
echo "4. Copie TODO o conteúdo do arquivo:"
echo "   supabase/migrations/019_fix_rls_joins.sql"
echo ""
echo "5. Cole no editor e clique: RUN"
echo ""
echo "6. Aguarde mensagem de sucesso"
echo ""
echo -e "${YELLOW}Abrindo arquivo da migração...${NC}"
echo ""

# Abrir arquivo no editor (macOS)
if command -v code &> /dev/null; then
    code "supabase/migrations/019_fix_rls_joins.sql"
    echo -e "${GREEN}✓ Arquivo aberto no VS Code${NC}"
elif command -v open &> /dev/null; then
    open "supabase/migrations/019_fix_rls_joins.sql"
    echo -e "${GREEN}✓ Arquivo aberto${NC}"
fi

echo ""
echo -e "${CYAN}Conteúdo a copiar:${NC}"
echo "════════════════════════════════════════════════════════"
cat "supabase/migrations/019_fix_rls_joins.sql"
echo "════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}Após executar no Supabase, pressione ENTER aqui...${NC}"
read -r

echo ""
echo "Aguardando 5 segundos para o Supabase processar..."
sleep 5

echo ""
echo -e "${CYAN}Validando aplicação da migração...${NC}"

# Testar se as policies foram criadas
SERVICE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtcHl4cXZ4emlnc3Vzam5pYXJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU1MzU1OSwiZXhwIjoyMDg1MTI5NTU5fQ.FBPczqIfHr6Ieilv0Gp9WZL5c_M75Jklk-_XpUrbCbU'

echo "Testando query problemática de absences..."
HTTP_CODE=$(curl -s -o /tmp/test_migration_019.json -w "%{http_code}" \
  "https://lmpyxqvxzigsusjniarz.supabase.co/rest/v1/absences?select=id,absence_type,employees!inner(full_name)&limit=1" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}")

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Query de absences: HTTP 200 OK!${NC}"
else
  echo -e "${YELLOW}⚠ Query de absences: HTTP $HTTP_CODE${NC}"
  cat /tmp/test_migration_019.json | jq '.' 2>/dev/null || cat /tmp/test_migration_019.json
fi

echo ""
echo "Testando query problemática de asos..."
HTTP_CODE=$(curl -s -o /tmp/test_asos_019.json -w "%{http_code}" \
  "https://lmpyxqvxzigsusjniarz.supabase.co/rest/v1/asos?select=id,expiration_date,employees!inner(full_name)&limit=1" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}")

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Query de asos: HTTP 200 OK!${NC}"
else
  echo -e "${YELLOW}⚠ Query de asos: HTTP $HTTP_CODE${NC}"
  cat /tmp/test_asos_019.json | jq '.' 2>/dev/null || cat /tmp/test_asos_019.json
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo -e "${GREEN}Migração 019 validada!${NC}"
echo "════════════════════════════════════════════════════════"

# Limpar
rm -f /tmp/test_migration_019.json /tmp/test_asos_019.json
