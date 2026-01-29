import { createClient } from '@/lib/supabase/server';
import type {
  ReportTemplate,
  ReportSchedule,
  ReportHistory,
  ReportCategory,
  ReportTemplateShare,
  ReportConfig,
} from '@/types/reports';

/**
 * Templates
 */

export async function createTemplate(data: {
  company_id: string;
  name: string;
  description?: string;
  type: string;
  config: ReportConfig;
  format: string;
  created_by: string;
}) {
  const supabase = createClient();

  const { data: template, error } = await supabase
    .from('report_templates')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return template;
}

export async function updateTemplate(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    config: ReportConfig;
    format: string;
  }>
) {
  const supabase = createClient();

  const { data: template, error } = await supabase
    .from('report_templates')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return template;
}

export async function deleteTemplate(id: string) {
  const supabase = createClient();

  const { error } = await supabase.from('report_templates').delete().eq('id', id);

  if (error) throw error;
}

export async function getTemplate(id: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('report_templates')
    .select(
      `
      *,
      created_by_user:profiles!report_templates_created_by_fkey(name, email),
      schedule:report_schedules(*),
      categories:report_template_categories(
        category:report_categories(*)
      )
    `
    )
    .eq('id', id)
    .single();

  if (error) throw error;

  // Flatten categories
  const template = {
    ...data,
    created_by_user: data.created_by_user?.[0] || null,
    schedule: data.schedule?.[0] || null,
    categories: data.categories?.map((tc: any) => tc.category) || [],
  };

  return template as ReportTemplate;
}

export async function listTemplates(filters?: {
  company_id?: string;
  type?: string;
  created_by?: string;
  search?: string;
  favorite?: boolean;
  shared_with_me?: boolean;
}) {
  const supabase = createClient();

  let query = supabase
    .from('report_templates')
    .select(
      `
      *,
      created_by_user:profiles!report_templates_created_by_fkey(name, email),
      schedule:report_schedules(id, frequency, active, next_run),
      categories:report_template_categories(
        category:report_categories(*)
      ),
      is_favorite:report_favorites(user_id)
    `
    )
    .order('created_at', { ascending: false });

  if (filters?.company_id) {
    query = query.eq('company_id', filters.company_id);
  }

  if (filters?.type) {
    query = query.eq('type', filters.type);
  }

  if (filters?.created_by) {
    query = query.eq('created_by', filters.created_by);
  }

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Flatten relations
  const templates = data?.map((template: any) => ({
    ...template,
    created_by_user: template.created_by_user?.[0] || null,
    schedule: template.schedule?.[0] || null,
    categories: template.categories?.map((tc: any) => tc.category) || [],
    is_favorite: template.is_favorite?.length > 0,
  }));

  // Aplicar filtros client-side
  let filtered = templates || [];

  if (filters?.favorite) {
    filtered = filtered.filter(t => t.is_favorite);
  }

  return filtered as ReportTemplate[];
}

export async function getMyTemplates(userId: string, companyId: string) {
  return listTemplates({ created_by: userId, company_id: companyId });
}

export async function getFavoriteTemplates(userId: string, companyId: string) {
  return listTemplates({ favorite: true, company_id: companyId });
}

export async function duplicateTemplate(id: string, newName: string, userId: string) {
  const supabase = createClient();

  // Buscar template original
  const original = await getTemplate(id);

  // Criar cópia
  const { data: duplicate, error } = await supabase
    .from('report_templates')
    .insert({
      company_id: original.company_id,
      name: newName,
      description: original.description,
      type: original.type,
      config: original.config,
      format: original.format,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;

  // Copiar categorias
  if (original.categories && original.categories.length > 0) {
    const categoryLinks = original.categories.map(cat => ({
      template_id: duplicate.id,
      category_id: cat.id,
    }));

    await supabase.from('report_template_categories').insert(categoryLinks);
  }

  return duplicate;
}

/**
 * Favoritos
 */

export async function favoriteTemplate(templateId: string, userId: string) {
  const supabase = createClient();

  const { error } = await supabase.from('report_favorites').insert({
    template_id: templateId,
    user_id: userId,
  });

  if (error) throw error;
}

export async function unfavoriteTemplate(templateId: string, userId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('report_favorites')
    .delete()
    .eq('template_id', templateId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Schedules
 */

export async function createSchedule(data: {
  template_id: string;
  frequency: string;
  cron_expression?: string;
  time?: string;
  day_of_week?: number;
  day_of_month?: number;
  date_period: string;
  recipients?: string[];
  active?: boolean;
}) {
  const supabase = createClient();

  const { data: schedule, error } = await supabase
    .from('report_schedules')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return schedule;
}

export async function updateSchedule(
  id: string,
  data: Partial<{
    frequency: string;
    cron_expression: string;
    time: string;
    day_of_week: number;
    day_of_month: number;
    date_period: string;
    recipients: string[];
    active: boolean;
  }>
) {
  const supabase = createClient();

  const { data: schedule, error } = await supabase
    .from('report_schedules')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return schedule;
}

export async function deleteSchedule(id: string) {
  const supabase = createClient();

  const { error } = await supabase.from('report_schedules').delete().eq('id', id);

  if (error) throw error;
}

export async function getSchedule(id: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('report_schedules')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as ReportSchedule;
}

export async function getTemplateSchedule(templateId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('report_schedules')
    .select('*')
    .eq('template_id', templateId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // Ignorar erro de não encontrado
  return data as ReportSchedule | null;
}

export async function toggleScheduleActive(id: string, active: boolean) {
  const supabase = createClient();

  const { error } = await supabase.from('report_schedules').update({ active }).eq('id', id);

  if (error) throw error;
}

/**
 * Histórico
 */

export async function getReportHistory(templateId: string, limit = 50) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('report_history')
    .select(
      `
      *,
      template:report_templates(name, type),
      generated_by_user:profiles!report_history_generated_by_fkey(name, email)
    `
    )
    .eq('template_id', templateId)
    .order('generated_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data?.map((history: any) => ({
    ...history,
    template: history.template?.[0] || null,
    generated_by_user: history.generated_by_user?.[0] || null,
  })) as ReportHistory[];
}

export async function getRecentHistory(companyId: string, limit = 20) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('report_history')
    .select(
      `
      *,
      template:report_templates!inner(name, type, company_id),
      generated_by_user:profiles!report_history_generated_by_fkey(name, email)
    `
    )
    .eq('template.company_id', companyId)
    .order('generated_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data?.map((history: any) => ({
    ...history,
    template: history.template?.[0] || null,
    generated_by_user: history.generated_by_user?.[0] || null,
  })) as ReportHistory[];
}

/**
 * Categorias
 */

export async function createCategory(data: {
  company_id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}) {
  const supabase = createClient();

  const { data: category, error } = await supabase
    .from('report_categories')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return category;
}

export async function updateCategory(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    color: string;
    icon: string;
  }>
) {
  const supabase = createClient();

  const { data: category, error } = await supabase
    .from('report_categories')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return category;
}

export async function deleteCategory(id: string) {
  const supabase = createClient();

  const { error } = await supabase.from('report_categories').delete().eq('id', id);

  if (error) throw error;
}

export async function listCategories(companyId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('report_categories')
    .select('*')
    .eq('company_id', companyId)
    .order('name');

  if (error) throw error;
  return data as ReportCategory[];
}

export async function addTemplateToCategorys(templateId: string, categoryIds: string[]) {
  const supabase = createClient();

  // Remover categorias existentes
  await supabase.from('report_template_categories').delete().eq('template_id', templateId);

  // Adicionar novas categorias
  if (categoryIds.length > 0) {
    const links = categoryIds.map(categoryId => ({
      template_id: templateId,
      category_id: categoryId,
    }));

    const { error } = await supabase.from('report_template_categories').insert(links);

    if (error) throw error;
  }
}

/**
 * Compartilhamento
 */

export async function shareTemplate(data: {
  template_id: string;
  shared_by: string;
  shared_with: string;
  permission: 'view' | 'edit' | 'execute';
}) {
  const supabase = createClient();

  const { data: share, error } = await supabase
    .from('report_template_shares')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return share;
}

export async function unshareTemplate(templateId: string, userId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('report_template_shares')
    .delete()
    .eq('template_id', templateId)
    .eq('shared_with', userId);

  if (error) throw error;
}

export async function getTemplateShares(templateId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('report_template_shares')
    .select(
      `
      *,
      shared_by_user:profiles!report_template_shares_shared_by_fkey(name, email),
      shared_with_user:profiles!report_template_shares_shared_with_fkey(name, email)
    `
    )
    .eq('template_id', templateId);

  if (error) throw error;

  return data?.map((share: any) => ({
    ...share,
    shared_by_user: share.shared_by_user?.[0] || null,
    shared_with_user: share.shared_with_user?.[0] || null,
  })) as ReportTemplateShare[];
}

export async function getSharedWithMeTemplates(userId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('report_template_shares')
    .select(
      `
      *,
      template:report_templates(
        *,
        created_by_user:profiles!report_templates_created_by_fkey(name, email)
      )
    `
    )
    .eq('shared_with', userId);

  if (error) throw error;

  return data?.map((share: any) => ({
    ...share.template,
    shared_with_me: true,
    permission: share.permission,
  })) as ReportTemplate[];
}
