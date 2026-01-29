#!/bin/bash

ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtcHl4cXZ4emlnc3Vzam5pYXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NTM1NTksImV4cCI6MjA4NTEyOTU1OX0.JkFom08Ae933Dqh48eKDO8ZFmNw8xt-msC0jCu3THzk'

echo "Testing absences query..."
curl -v "https://lmpyxqvxzigsusjniarz.supabase.co/rest/v1/absences?select=id,absence_type,created_at,employees!inner(full_name)&company_id=eq.016aebd3-b2b6-4ef9-997b-49e29108c40f&limit=1" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" 2>&1 | grep -A 20 "< HTTP"
