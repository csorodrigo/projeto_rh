-- =====================================================
-- Script de Teste - Portal de Carreiras
-- Execute este script após rodar a migration 021
-- =====================================================

-- Assume que você tem uma empresa com ID conhecido
-- Substitua 'your-company-id' pelo ID real da sua empresa

-- 1. Criar uma vaga de teste pública
INSERT INTO job_postings (
  company_id,
  title,
  description,
  requirements,
  responsibilities,
  nice_to_have,
  benefits,
  department,
  location,
  location_type,
  job_type,
  experience_level,
  salary_min,
  salary_max,
  salary_currency,
  show_salary,
  status,
  is_public,
  featured,
  positions_available,
  published_at,
  tags
) VALUES (
  'your-company-id'::uuid,
  'Desenvolvedor Full Stack Sênior',
  'Estamos buscando um desenvolvedor full stack experiente para liderar projetos de transformação digital. Você trabalhará com tecnologias modernas e terá autonomia para propor soluções inovadoras.',
  ARRAY[
    'Experiência sólida com React e Node.js',
    'Conhecimento profundo de TypeScript',
    'Experiência com bancos de dados SQL e NoSQL',
    'Conhecimento de práticas de DevOps e CI/CD',
    'Inglês intermediário para leitura técnica'
  ],
  ARRAY[
    'Desenvolver e manter aplicações web complexas',
    'Arquitetar soluções escaláveis e performáticas',
    'Mentorear desenvolvedores júnior e pleno',
    'Participar de code reviews e definições técnicas',
    'Colaborar com equipes de produto e design'
  ],
  ARRAY[
    'Experiência com Next.js e Supabase',
    'Conhecimento de containers (Docker/Kubernetes)',
    'Experiência com metodologias ágeis',
    'Contribuições open source'
  ],
  ARRAY[
    'Vale refeição R$ 30/dia',
    'Vale transporte',
    'Plano de saúde e odontológico',
    'Gympass',
    'Day off no aniversário',
    'Horário flexível',
    'Home office 2x por semana',
    'Budget para cursos e livros'
  ],
  'Tecnologia',
  'São Paulo, SP',
  'hybrid',
  'full_time',
  'senior',
  12000.00,
  18000.00,
  'BRL',
  true,
  'active',
  true,
  true, -- Vaga em destaque
  2, -- 2 vagas disponíveis
  NOW(),
  ARRAY['react', 'nodejs', 'typescript', 'full-stack']
);

-- 2. Criar mais algumas vagas para ter variedade
INSERT INTO job_postings (
  company_id,
  title,
  description,
  requirements,
  responsibilities,
  benefits,
  department,
  location,
  location_type,
  job_type,
  experience_level,
  status,
  is_public,
  positions_available,
  published_at,
  tags
) VALUES
(
  'your-company-id'::uuid,
  'Designer UX/UI',
  'Buscamos um designer criativo para criar experiências incríveis para nossos usuários.',
  ARRAY[
    'Portfólio comprovando experiência',
    'Domínio de Figma',
    'Conhecimento de design systems',
    'Experiência com pesquisa de usuário'
  ],
  ARRAY[
    'Criar wireframes e protótipos',
    'Realizar testes de usabilidade',
    'Manter e evoluir o design system',
    'Colaborar com desenvolvedores'
  ],
  ARRAY[
    'Vale refeição',
    'Plano de saúde',
    'Horário flexível',
    'Home office'
  ],
  'Design',
  'São Paulo, SP',
  'hybrid',
  'full_time',
  'mid',
  'active',
  true,
  1,
  NOW(),
  ARRAY['design', 'ux', 'ui', 'figma']
),
(
  'your-company-id'::uuid,
  'Analista de Suporte Técnico',
  'Profissional para prestar suporte técnico aos nossos clientes.',
  ARRAY[
    'Experiência com atendimento ao cliente',
    'Conhecimentos básicos de redes',
    'Boa comunicação',
    'Disponibilidade para trabalhar em turnos'
  ],
  ARRAY[
    'Atender chamados técnicos',
    'Diagnosticar e resolver problemas',
    'Documentar soluções',
    'Escalar quando necessário'
  ],
  ARRAY[
    'Vale refeição',
    'Vale transporte',
    'Plano de saúde',
    'Treinamentos'
  ],
  'Suporte',
  'Rio de Janeiro, RJ',
  'on_site',
  'full_time',
  'entry',
  'active',
  true,
  3,
  NOW(),
  ARRAY['suporte', 'helpdesk', 'atendimento']
),
(
  'your-company-id'::uuid,
  'Estagiário de Marketing Digital',
  'Oportunidade para estudantes de Marketing ou áreas relacionadas.',
  ARRAY[
    'Cursando Marketing, Publicidade ou áreas afins',
    'Conhecimentos básicos de redes sociais',
    'Criatividade',
    'Boa escrita'
  ],
  ARRAY[
    'Auxiliar na criação de conteúdo',
    'Gerenciar redes sociais',
    'Acompanhar métricas',
    'Apoiar em campanhas'
  ],
  ARRAY[
    'Bolsa auxílio',
    'Vale transporte',
    'Seguro de vida',
    'Ambiente jovem e dinâmico'
  ],
  'Marketing',
  'São Paulo, SP',
  'remote',
  'internship',
  'entry',
  'active',
  true,
  2,
  NOW(),
  ARRAY['marketing', 'social-media', 'estágio']
);

-- 3. Verificar se as vagas foram criadas
SELECT
  id,
  title,
  department,
  location,
  job_type,
  is_public,
  status,
  featured
FROM job_postings
WHERE company_id = 'your-company-id'::uuid
ORDER BY created_at DESC;

-- 4. Verificar se as etapas do pipeline foram criadas automaticamente
SELECT
  id,
  name,
  order_index,
  color,
  is_default
FROM recruitment_stages
WHERE company_id = 'your-company-id'::uuid
ORDER BY order_index;

-- 5. Simular uma candidatura (normalmente viria do formulário web)
-- Criar um candidato de teste
WITH new_candidate AS (
  INSERT INTO candidates (
    company_id,
    email,
    name,
    phone,
    linkedin_url,
    location,
    source
  ) VALUES (
    'your-company-id'::uuid,
    'teste@exemplo.com',
    'João da Silva',
    '(11) 98765-4321',
    'https://linkedin.com/in/joaosilva',
    'São Paulo, SP',
    'careers_page'
  )
  RETURNING id
),
first_stage AS (
  SELECT id FROM recruitment_stages
  WHERE company_id = 'your-company-id'::uuid
  ORDER BY order_index
  LIMIT 1
)
INSERT INTO applications (
  job_id,
  candidate_id,
  company_id,
  status,
  current_stage_id,
  source,
  custom_questions
)
SELECT
  (SELECT id FROM job_postings WHERE title = 'Desenvolvedor Full Stack Sênior' LIMIT 1),
  new_candidate.id,
  'your-company-id'::uuid,
  'applied',
  first_stage.id,
  'careers_page',
  '{"cover_letter": "Tenho grande interesse na vaga e acredito ter o perfil ideal..."}'::jsonb
FROM new_candidate, first_stage;

-- 6. Verificar a candidatura criada
SELECT
  a.id,
  a.status,
  a.applied_at,
  c.name as candidate_name,
  c.email as candidate_email,
  j.title as job_title,
  rs.name as current_stage
FROM applications a
JOIN candidates c ON c.id = a.candidate_id
JOIN job_postings j ON j.id = a.job_id
LEFT JOIN recruitment_stages rs ON rs.id = a.current_stage_id
WHERE a.company_id = 'your-company-id'::uuid
ORDER BY a.applied_at DESC;

-- 7. Testar contadores
SELECT
  id,
  title,
  applications_count,
  views_count,
  positions_available,
  positions_filled
FROM job_postings
WHERE company_id = 'your-company-id'::uuid;

-- =====================================================
-- Queries úteis para o dashboard interno
-- =====================================================

-- Dashboard: Visão geral de recrutamento
SELECT
  COUNT(*) FILTER (WHERE status = 'active' AND is_public = true) as vagas_ativas,
  COUNT(*) FILTER (WHERE status = 'active' AND is_public = false) as vagas_internas,
  COUNT(*) FILTER (WHERE status = 'draft') as vagas_rascunho,
  SUM(applications_count) as total_candidaturas,
  SUM(positions_available - positions_filled) as vagas_em_aberto
FROM job_postings
WHERE company_id = 'your-company-id'::uuid;

-- Vagas com mais candidaturas
SELECT
  title,
  department,
  applications_count,
  positions_available,
  published_at
FROM job_postings
WHERE company_id = 'your-company-id'::uuid
  AND status = 'active'
ORDER BY applications_count DESC
LIMIT 5;

-- Candidaturas por estágio (funil)
SELECT
  rs.name as stage,
  rs.order_index,
  COUNT(a.id) as count
FROM recruitment_stages rs
LEFT JOIN applications a ON a.current_stage_id = rs.id
  AND a.company_id = 'your-company-id'::uuid
WHERE rs.company_id = 'your-company-id'::uuid
GROUP BY rs.id, rs.name, rs.order_index
ORDER BY rs.order_index;

-- Candidaturas recentes (últimos 7 dias)
SELECT
  a.applied_at,
  c.name as candidate_name,
  c.email,
  j.title as job_title,
  a.status,
  rs.name as current_stage
FROM applications a
JOIN candidates c ON c.id = a.candidate_id
JOIN job_postings j ON j.id = a.job_id
LEFT JOIN recruitment_stages rs ON rs.id = a.current_stage_id
WHERE a.company_id = 'your-company-id'::uuid
  AND a.applied_at > NOW() - INTERVAL '7 days'
ORDER BY a.applied_at DESC;

-- Candidatos por fonte de origem
SELECT
  source,
  COUNT(*) as count
FROM candidates
WHERE company_id = 'your-company-id'::uuid
GROUP BY source
ORDER BY count DESC;

-- =====================================================
-- Cleanup (se quiser limpar os dados de teste)
-- =====================================================

-- CUIDADO: Isso vai deletar TODOS os dados de recrutamento da empresa
-- DELETE FROM applications WHERE company_id = 'your-company-id'::uuid;
-- DELETE FROM candidates WHERE company_id = 'your-company-id'::uuid;
-- DELETE FROM job_postings WHERE company_id = 'your-company-id'::uuid;
-- DELETE FROM recruitment_stages WHERE company_id = 'your-company-id'::uuid AND is_default = false;
