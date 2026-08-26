/** Dialog tạo giải mới (OWNER/ADMIN) — điều hướng sang chi tiết sau khi tạo. */
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import type { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';

import { Button } from '../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../components/ui/form';
import { Input } from '../../../components/ui/input';
import { useToast } from '../../../components/ui/use-toast';
import { friendlyApiMessage } from '../../../lib/api/api-error';
import { useCreateTournament } from '../queries';
import { createTournamentFormSchema, type CreateTournamentFormValues } from '../schemas';



export function CreateTournamentDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}): ReactElement {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createMutation = useCreateTournament();

  const form = useForm<CreateTournamentFormValues>({
    resolver: zodResolver(createTournamentFormSchema),
    defaultValues: { name: '', description: '', sportType: 'FOOTBALL5' },
  });

  async function onSubmit(values: CreateTournamentFormValues): Promise<void> {
    try {
      const tour = await createMutation.mutateAsync({
        name: values.name,
        description: values.description || undefined,
        sportType: values.sportType,
      });
      toast({ title: 'Đã tạo giải đấu', description: 'Mời các captain đăng ký đội.' });
      onOpenChange(false);
      form.reset();
      navigate('/tournaments/' + tour.id);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Tạo giải thất bại',
        description: friendlyApiMessage(err),
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle>Tạo giải đấu</DialogTitle>
          <DialogDescription>
            Giải 8 đội loại trực tiếp — khóa đăng ký sẽ tự sinh bảng đấu.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên giải</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: SanGo Open 2026" {...field} />
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
                      <optgroup label="Bóng đá">
                        <option value="FOOTBALL5">Bóng đá 5</option>
                        <option value="FOOTBALL7">Bóng đá 7</option>
                      </optgroup>
                      <option value="PICKLEBALL">Pickleball</option>
                      <option value="BADMINTON">Cầu lông</option>
                      <option value="TENNIS">Tennis</option>
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
                  <FormLabel>Mô tả (tuỳ chọn)</FormLabel>
                  <FormControl>
                    <textarea
                      rows={3}
                      className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none"
                      placeholder="Giải bóng đá khai mạc..."
                      {...field}
                    />
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
              {createMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              Tạo giải
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
