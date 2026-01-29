/**
 * Container para widgets do dashboard com dados reais do Supabase
 * Fase 3 - Integração Supabase
 */

'use client';

import * as React from 'react';
import { BirthdaysWidget } from './birthdays-widget';
import { AbsentTodayWidget } from './absent-today-widget';
import { getWeeklyBirthdays } from '@/lib/supabase/queries/birthdays';
import { getTodayAbsences } from '@/lib/supabase/queries/absences';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function WidgetsContainer() {
  const [birthdays, setBirthdays] = React.useState<any[]>([]);
  const [absentees, setAbsentees] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadWidgetData() {
      try {
        setLoading(true);

        // Buscar dados em paralelo
        const [birthdaysData, absencesData] = await Promise.all([
          getWeeklyBirthdays(),
          getTodayAbsences(),
        ]);

        setBirthdays(birthdaysData);

        // Converter absences para formato do widget
        const formattedAbsentees = absencesData.map((absence) => ({
          id: absence.id,
          name: absence.name,
          photo_url: absence.photo_url,
          initials: absence.initials,
          reason: absence.type,
          reason_label: absence.type_label,
        }));

        setAbsentees(formattedAbsentees);
      } catch (error) {
        console.error('Erro ao carregar dados dos widgets:', error);
      } finally {
        setLoading(false);
      }
    }

    loadWidgetData();
  }, []);

  if (loading) {
    return (
      <>
        <Card className="transition-all duration-300 hover:shadow-lg">
          <CardContent className="flex items-center justify-center h-[200px]">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="transition-all duration-300 hover:shadow-lg">
          <CardContent className="flex items-center justify-center h-[200px]">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <BirthdaysWidget birthdays={birthdays} />
      <AbsentTodayWidget absentees={absentees} />
    </>
  );
}
