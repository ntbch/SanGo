import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactElement } from 'react';

import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { usePricingRules, useSavePricingRules } from '../queries';
import { friendlyApiMessage } from '../../../lib/api/api-error';
import type { CourtRow, PricingRule } from '../types';

interface PricingEditorProps {
  venueId?: string;
  courts: CourtRow[];
}

interface DraftRow {
  dayType: 'WEEKDAY' | 'WEEKEND';
  startHour: number;
  endHour: number;
  price: string;
}

function ruleToDraft(rule: PricingRule): DraftRow {
  return {
    dayType: rule.dayType,
    startHour: Math.floor(rule.startMinute / 60),
    endHour: Math.ceil(rule.endMinute / 60),
    price: String(rule.pricePerSlot),
  };
}

function draftToRule(row: DraftRow): PricingRule | undefined {
  const price = Number(row.price);
  if (row.price.trim() === '' || !Number.isFinite(price) || row.endHour <= row.startHour)
    return undefined;
  return {
    dayType: row.dayType,
    startMinute: row.startHour * 60,
    endMinute: row.endHour * 60,
    pricePerSlot: Math.round(price),
  };
}

/** Editor bảng giá dạng bảng khung giờ × loại ngày — lưu REPLACE-ALL. */
export function PricingEditor({ courts }: PricingEditorProps): ReactElement {
  const [courtId, setCourtId] = useState(courts[0]?.id ?? '');
  useEffect(() => {
    if (!courts.some((court) => court.id === courtId)) setCourtId(courts[0]?.id ?? '');
  }, [courts, courtId]);

  const rulesQuery = usePricingRules(courtId === '' ? undefined : courtId);
  const saveMutation = useSavePricingRules(courtId);
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (rulesQuery.data !== undefined) setDrafts(rulesQuery.data.rules.map(ruleToDraft));
  }, [rulesQuery.data]);

  const grouped = useMemo(
    () => ({
      WEEKDAY: drafts.filter((row) => row.dayType === 'WEEKDAY'),
      WEEKEND: drafts.filter((row) => row.dayType === 'WEEKEND'),
    }),
    [drafts],
  );

  function updateRow(index: number, patch: Partial<DraftRow>): void {
    setDrafts((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function save(): Promise<void> {
    const rules = drafts.map(draftToRule).filter((rule) => rule !== undefined);
    await saveMutation.mutateAsync(rules);
    setSavedAt(Date.now());
  }

  function renderColumn(dayType: 'WEEKDAY' | 'WEEKEND', heading: string): ReactElement {
    return (
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          ${heading}
        </p>
        {grouped[dayType].length === 0 ? (
          <p className="rounded-md border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
            Trống — dùng giá mặc định của sân con.
          </p>
        ) : null}
        {grouped[dayType].map((row) => {
          const globalIndex = drafts.indexOf(row);
          return (
            <div key={dayType + '-' + globalIndex} className="flex items-center gap-1.5">
              <Input
                aria-label="Giờ bắt đầu"
                type="number"
                min={0}
                max={24}
                className="h-8 w-16"
                value={row.startHour}
                onChange={(event) =>
                  updateRow(globalIndex, { startHour: Number(event.target.value) })
                }
              />
              <span className="text-xs text-muted-foreground">–</span>
              <Input
                aria-label="Giờ kết thúc"
                type="number"
                min={0}
                max={24}
                className="h-8 w-16"
                value={row.endHour}
                onChange={(event) =>
                  updateRow(globalIndex, { endHour: Number(event.target.value) })
                }
              />
              <Input
                aria-label="Giá VND"
                inputMode="numeric"
                placeholder="150000"
                className="h-8 flex-1"
                value={row.price}
                onChange={(event) => updateRow(globalIndex, { price: event.target.value })}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Xoá khung giờ"
                onClick={() => setDrafts((current) => current.filter((_, i) => i !== globalIndex))}
              >
                <Trash2 className="size-3.5 text-destructive" />
              </Button>
            </div>
          );
        })}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full border-dashed"
          onClick={() =>
            setDrafts((current) => [...current, { dayType, startHour: 6, endHour: 12, price: '' }])
          }
        >
          <Plus className="size-3.5" aria-hidden /> Thêm khung giờ
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle className="text-base">Bảng giá theo khung giờ</CardTitle>
        <div className="space-y-1.5">
          <Label htmlFor="pricing-court">Sân con</Label>
          <select
            id="pricing-court"
            value={courtId}
            onChange={(event) => setCourtId(event.target.value)}
            className="h-9 w-full max-w-xs rounded-md border border-input bg-background px-2 text-sm"
          >
            {courts.map((court) => (
              <option key={court.id} value={court.id}>
                {court.name}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          {renderColumn('WEEKDAY', 'Ngày thường (T2\u2013T5)')}
          {renderColumn('WEEKEND', 'Cuối tuần (T6\u2013CN)')}
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Ô trống = dùng giá mặc định của sân con. Lưu sẽ THAY THẾ toàn bộ quy tắc hiện có.
          </p>
          <Button
            onClick={() => {
              void save();
            }}
            disabled={saveMutation.isPending || courtId === ''}
          >
            {saveMutation.isPending ? 'Đang lưu…' : 'Lưu bảng giá'}
          </Button>
        </div>
        {savedAt !== null && !saveMutation.isPending && !saveMutation.isError ? (
          <p role="status" className="text-xs font-medium text-primary">
            Đã lưu bảng giá.
          </p>
        ) : null}
        {saveMutation.isError ? (
          <p role="alert" className="text-xs text-destructive">
            {friendlyApiMessage(saveMutation.error)}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
