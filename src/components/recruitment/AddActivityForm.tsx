"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ActivityType, CandidateRating, InterviewType } from "@/types/recruitment";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { InteractiveRating } from "./RatingDisplay";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const activityFormSchema = z.object({
  type: z.enum([
    "comment",
    "interview_scheduled",
    "rating",
    "call_logged",
    "email_sent",
  ] as const),
  comment: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  rating_category: z.string().optional(),
  interview_type: z.string().optional(),
  interview_date: z.date().optional(),
  interview_time: z.string().optional(),
  interview_location: z.string().optional(),
});

type ActivityFormValues = z.infer<typeof activityFormSchema>;

interface AddActivityFormProps {
  applicationId: string;
  candidateId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AddActivityForm({
  applicationId,
  candidateId,
  onSuccess,
  onCancel,
}: AddActivityFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      type: "comment",
    },
  });

  const activityType = form.watch("type");

  async function onSubmit(data: ActivityFormValues) {
    setIsSubmitting(true);

    try {
      // Aqui você faria a chamada à API
      // const response = await fetch(`/api/recruitment/candidates/${candidateId}/activities`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     ...data,
      //     application_id: applicationId,
      //   }),
      // });

      // Simulação de sucesso
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Atividade registrada com sucesso!");
      form.reset();
      onSuccess?.();
    } catch (error) {
      toast.error("Erro ao registrar atividade");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Tipo de atividade */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Atividade</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="comment">Comentário</SelectItem>
                  <SelectItem value="interview_scheduled">Agendar Entrevista</SelectItem>
                  <SelectItem value="rating">Avaliação</SelectItem>
                  <SelectItem value="call_logged">Registrar Ligação</SelectItem>
                  <SelectItem value="email_sent">Registrar Email</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campos específicos por tipo */}
        {(activityType === "comment" ||
          activityType === "call_logged" ||
          activityType === "email_sent") && (
          <FormField
            control={form.control}
            name="comment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {activityType === "comment" && "Comentário"}
                  {activityType === "call_logged" && "Notas da Ligação"}
                  {activityType === "email_sent" && "Resumo do Email"}
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Digite aqui..."
                    className="min-h-[100px] resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {activityType === "comment" &&
                    "Adicione observações sobre o candidato"}
                  {activityType === "call_logged" &&
                    "Registre os pontos principais da conversa"}
                  {activityType === "email_sent" &&
                    "Descreva o conteúdo do email enviado"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {activityType === "rating" && (
          <>
            <FormField
              control={form.control}
              name="rating_category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria da Avaliação</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="overall">Geral</SelectItem>
                      <SelectItem value="technical">Técnica</SelectItem>
                      <SelectItem value="cultural_fit">Fit Cultural</SelectItem>
                      <SelectItem value="communication">Comunicação</SelectItem>
                      <SelectItem value="leadership">Liderança</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nota</FormLabel>
                  <FormControl>
                    <div className="py-2">
                      <InteractiveRating
                        value={field.value as CandidateRating | null}
                        onChange={field.onChange}
                        size="lg"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comentário (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Justifique sua avaliação..."
                      className="min-h-[80px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {activityType === "interview_scheduled" && (
          <>
            <FormField
              control={form.control}
              name="interview_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Entrevista</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="phone_screen">Triagem Telefônica</SelectItem>
                      <SelectItem value="technical">Técnica</SelectItem>
                      <SelectItem value="behavioral">Comportamental</SelectItem>
                      <SelectItem value="panel">Painel</SelectItem>
                      <SelectItem value="final">Final</SelectItem>
                      <SelectItem value="cultural_fit">Fit Cultural</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="interview_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ptBR })
                            ) : (
                              <span>Selecione a data</span>
                            )}
                            <CalendarIcon className="ml-auto size-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="interview_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="interview_location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Local / Link</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Endereço ou link da reunião"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Endereço físico ou link de videochamada (Google Meet, Zoom, etc)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {/* Ações */}
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Adicionar Atividade
          </Button>
        </div>
      </form>
    </Form>
  );
}
