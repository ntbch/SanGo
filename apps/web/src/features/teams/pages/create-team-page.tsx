/** Trang 'Tạo đội mới' (F1) — form RHF + Zod, người tạo tự động là CAPTAIN. */
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Trophy } from 'lucide-react';
import type { ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../components/ui/form';
import { Input } from '../../../components/ui/input';
import { toast } from '../../../components/ui/use-toast';
import { friendlyApiMessage } from '../../../lib/api/api-error';
import { useCreateTeam } from '../queries';
import { createTeamFormSchema, type CreateTeamFormValues } from '../schemas';

const SPORT_OPTIONS = [
  { value: 'PICKLEBALL', label: 'Pickleball' },
  { value: 'BADMINTON', label: 'Cầu lông' },
  { value: 'TENNIS', label: 'Tennis' },
  { value: 'FOOTBALL5', label: 'Bóng đá 5' },
  { value: 'FOOTBALL7', label: 'Bóng đá 7' },
];

export function CreateTeamPage(): ReactElement {
  const navigate = useNavigate();
  const createMutation = useCreateTeam();

  const form = useForm<CreateTeamFormValues>({
    resolver: zodResolver(createTeamFormSchema),
    defaultValues: {
      name: '',
      logoUrl: '',
      description: '',
      sportType: 'PICKLEBALL',
    },
  });

  function onSubmit(values: CreateTeamFormValues): void {
    createMutation.mutate(
      {
        name: values.name,
        logoUrl: values.logoUrl || undefined,
        description: values.description || undefined,
        sportType: values.sportType,
      },
      {
        onSuccess: (team) => {
          toast({
            title: 'Tạo đội thành công',
            description: 'Bạn là Đội trưởng của ' + team.name + '.',
          });
          navigate('/dashboard/teams/' + team.id);
        },
        onError: (err) =>
          toast({
            variant: 'destructive',
            title: 'Tạo đội thất bại',
            description: friendlyApiMessage(err),
          }),
      },
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="-ml-2 gap-1 text-xs text-muted-foreground"
      >
        <Link to="/dashboard/teams">
          <ArrowLeft className="size-3.5" aria-hidden /> Quay lại danh sách đội
        </Link>
      </Button>

      <Card className="rounded-xl border-border/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15">
              <Trophy className="size-5 text-primary" aria-hidden />
            </div>
            <CardTitle className="text-lg">Tạo đội thể thao mới</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên đội</FormLabel>
                    <FormControl>
                      <Input placeholder="VD: Dragon Pickleball Club" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sportType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Môn thể thao</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none"
                        {...field}
                      >
                        {SPORT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô tả đội (tuỳ chọn)</FormLabel>
                    <FormControl>
                      <Input placeholder="Khung giờ sinh hoạt, trình độ, mục tiêu..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Logo (tuỳ chọn)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full rounded-lg font-bold"
              >
                {createMutation.isPending ? 'Đang tạo...' : 'Tạo đội'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
