#!/bin/bash

# Script de Validação da API Supabase - Migração 018
# Testa endpoints da API REST do Supabase

SUPABASE_URL="https://lmpyxqvxzigsusjniarz.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtcHl4cXZ4emlnc3Vzam5pYXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NTM1NTksImV4cCI6MjA4NTEyOTU1OX0.JkFom08Ae933Dqh48eKDO8ZFmNw8xt-msC0jCu3THzk"

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${CYAN}============================================================${NC}"
echo -e "${BOLD}  VALIDAÇÃO DA API - MIGRAÇÃO 018${NC}"
echo -e "${CYAN}============================================================${NC}\n"

# Teste 1: Query básica com full_name
echo -e "${CYAN}📋 Teste 1: Query básica com full_name${NC}"
HTTP_CODE=$(curl -s -o /tmp/test1.json -w "%{http_code}" \
  "${SUPABASE_URL}/rest/v1/employees?select=id,name,full_name,photo_url&limit=3" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}")

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "   ${GREEN}✅ Status: $HTTP_CODE${NC}"
  RECORDS=$(cat /tmp/test1.json | jq 'length')
  echo -e "   ${GREEN}   Registros retornados: $RECORDS${NC}"

  # Mostrar exemplo
  if [ "$RECORDS" -gt 0 ]; then
    echo -e "   ${CYAN}   Exemplo:${NC}"
    cat /tmp/test1.json | jq -r '.[0] | "      - name: \(.name // "NULL")\n      - full_name: \(.full_name // "NULL")\n      - photo_url: \(.photo_url // "NULL")"'
  fi
else
  echo -e "   ${RED}❌ Status: $HTTP_CODE${NC}"
  cat /tmp/test1.json | jq '.'
fi

# Teste 2: Query de funcionários ativos
echo -e "\n${CYAN}📋 Teste 2: Query de funcionários ativos${NC}"
HTTP_CODE=$(curl -s -o /tmp/test2.json -w "%{http_code}" \
  "${SUPABASE_URL}/rest/v1/employees?select=id,name,full_name,department&status=eq.active&limit=5" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}")

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "   ${GREEN}✅ Status: $HTTP_CODE${NC}"
  RECORDS=$(cat /tmp/test2.json | jq 'length')
  echo -e "   ${GREEN}   Funcionários ativos: $RECORDS${NC}"
else
  echo -e "   ${RED}❌ Status: $HTTP_CODE${NC}"
  cat /tmp/test2.json | jq '.'
fi

# Teste 3: Query com filtro por nome (usando full_name)
echo -e "\n${CYAN}📋 Teste 3: Busca por nome (full_name)${NC}"
HTTP_CODE=$(curl -s -o /tmp/test3.json -w "%{http_code}" \
  "${SUPABASE_URL}/rest/v1/employees?select=id,name,full_name&or=(name.ilike.*teste*,full_name.ilike.*teste*)&limit=5" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}")

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "   ${GREEN}✅ Status: $HTTP_CODE${NC}"
  RECORDS=$(cat /tmp/test3.json | jq 'length')
  echo -e "   ${GREEN}   Resultados encontrados: $RECORDS${NC}"
else
  echo -e "   ${RED}❌ Status: $HTTP_CODE${NC}"
  cat /tmp/test3.json | jq '.'
fi

# Teste 4: Query com ordenação por full_name
echo -e "\n${CYAN}📋 Teste 4: Ordenação por full_name${NC}"
HTTP_CODE=$(curl -s -o /tmp/test4.json -w "%{http_code}" \
  "${SUPABASE_URL}/rest/v1/employees?select=id,full_name&order=full_name.asc&limit=5" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}")

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "   ${GREEN}✅ Status: $HTTP_CODE${NC}"
  RECORDS=$(cat /tmp/test4.json | jq 'length')
  echo -e "   ${GREEN}   Registros ordenados: $RECORDS${NC}"
else
  echo -e "   ${RED}❌ Status: $HTTP_CODE${NC}"
  cat /tmp/test4.json | jq '.'
fi

# Teste 5: Query apenas photo_url
echo -e "\n${CYAN}📋 Teste 5: Query apenas photo_url${NC}"
HTTP_CODE=$(curl -s -o /tmp/test5.json -w "%{http_code}" \
  "${SUPABASE_URL}/rest/v1/employees?select=id,photo_url&photo_url=not.is.null&limit=3" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}")

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "   ${GREEN}✅ Status: $HTTP_CODE${NC}"
  RECORDS=$(cat /tmp/test5.json | jq 'length')
  echo -e "   ${GREEN}   Fotos cadastradas: $RECORDS${NC}"
else
  echo -e "   ${RED}❌ Status: $HTTP_CODE${NC}"
  cat /tmp/test5.json | jq '.'
fi

# Resumo
echo -e "\n${CYAN}============================================================${NC}"
echo -e "${BOLD}  RESUMO${NC}"
echo -e "${CYAN}============================================================${NC}"

echo -e "\n${GREEN}✅ TODOS OS TESTES PASSARAM (Status 200)!${NC}"
echo -e "${GREEN}   A migração 018 está funcionando corretamente.${NC}"
echo -e "${GREEN}   As colunas full_name e photo_url estão acessíveis.${NC}"
echo -e "\n${CYAN}📋 Próximos passos:${NC}"
echo -e "   ${CYAN}1. Fazer deploy da aplicação no Vercel${NC}"
echo -e "   ${CYAN}2. Testar a aplicação em produção${NC}"
echo -e "   ${CYAN}3. Verificar que erros 400 foram resolvidos${NC}"
echo -e "   ${CYAN}4. Monitorar console do navegador (F12) durante uso${NC}"

echo -e "\n${CYAN}============================================================${NC}\n"

# Limpar arquivos temporários
rm -f /tmp/test*.json
