import { SearchX, Search } from 'lucide-react';
import { type FormEvent, type ReactElement, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Skeleton } from '../../../components/ui/skeleton';

import { FilterSidebar, type VenueSort } from '../components/filter-sidebar';
import { VenueCard } from '../components/venue-card';
import { useVenues } from '../queries';

function SkeletonGrid(): ReactElement {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden>
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <div key={index} className="space-y-3 rounded-xl border p-0">
          <Skeleton className="aspect-[16/10] w-full rounded-b-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface VenuesPageProps {
  /** Tiêu đề hero — trang chủ nhúng lại trang này ở chế độ rút gọn. */
  compact?: boolean;
}

/** Trang danh sách sân: hero tìm kiếm + sidebar lọc + lưới kết quả phân trang. */
export function VenuesPage({ compact = false }: VenuesPageProps): ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const sportTypeParam = searchParams.get('sportType') ?? undefined;
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  // Sắp xếp theo giá làm phía client (backend t5 mới hỗ trợ q/sportType/page);
  // khi API thêm sort param sẽ chuyển thẳng xuống query.
  const [sort, setSort] = useState<VenueSort>('newest');
  const [draftQ, setDraftQ] = useState(q);

  const query = useVenues({ q: q === '' ? undefined : q, sportType: sportTypeParam, page });
  const data = query.data;

  const items = [...(data?.items ?? [])].sort((a, b) => {
    const priceOf = (v: typeof a) =>
      Math.min(...v.courts.map((c) => c.defaultPricePerSlot), Number.MAX_SAFE_INTEGER);
    if (sort === 'price-asc') return priceOf(a) - priceOf(b);
    if (sort === 'price-desc') return priceOf(b) - priceOf(a);
    return 0; // newest: giữ thứ tự server (createdAt desc)
  });

  function applyFilters(next: { q?: string; sportType?: string; page?: number }): void {
    const params = new URLSearchParams();
    if (next.q) params.set('q', next.q);
    if (next.sportType) params.set('sportType', next.sportType);
    params.set('page', String(next.page ?? 1));
    setSearchParams(params);
  }

  function onHeroSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    applyFilters({ q: draftQ.trim() || undefined, sportType: sportTypeParam });
  }

  return (
    <div className={compact ? 'space-y-6' : 'mx-auto w-full max-w-6xl space-y-6 px-4 py-8'}>
      {!compact ? (
        <section className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 p-6 text-white sm:p-10">
          <h1 className="text-2xl font-bold sm:text-3xl">Tìm sân thể thao gần bạn</h1>
          <form onSubmit={onHeroSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Input
              value={draftQ}
              onChange={(event) => setDraftQ(event.target.value)}
              placeholder="Tên sân hoặc khu vực, vd: Gò Vấp"
              aria-label="Từ khoá tìm kiếm"
              className="border-transparent bg-white text-foreground sm:flex-1"
            />
            <Button type="submit" variant="secondary" className="sm:w-auto">
              <Search className="size-4" aria-hidden />
              Tìm sân
            </Button>
          </form>
        </section>
      ) : null}

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="lg:w-56 lg:shrink-0">
          <FilterSidebar
            sportType={sportTypeParam}
            sort={sort}
            onSportTypeChange={(value) => applyFilters({ q, sportType: value })}
            onSortChange={setSort}
          />
        </div>

        <section className="min-w-0 flex-1 space-y-4">
          <header className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">
              Kết quả{data !== undefined ? ` (${data.total} sân)` : ''}
            </h2>
          </header>

          {query.isPending ? <SkeletonGrid /> : null}
          {query.isError ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
            >
              Không tải được danh sách sân. Vui lòng thử lại.
            </p>
          ) : null}
          {data !== undefined && items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
              <SearchX className="size-10 text-muted-foreground/60" aria-hidden />
              <div>
                <p className="font-medium">Không tìm thấy sân phù hợp</p>
                <p className="text-sm text-muted-foreground">
                  Thử bỏ bớt bộ lọc hoặc đổi từ khoá khác.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDraftQ('');
                  applyFilters({});
                }}
              >
                Xoá bộ lọc
              </Button>
            </div>
          ) : null}
          {items.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((venue) => (
                  <VenueCard key={venue.id} venue={venue} />
                ))}
              </div>
              {data !== undefined && data.pages > 1 ? (
                <nav
                  className="flex items-center justify-center gap-3 pt-2"
                  aria-label="Phân trang"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => applyFilters({ q, sportType: sportTypeParam, page: page - 1 })}
                  >
                    Trang trước
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Trang {data.page}/{data.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data !== undefined && page >= data.pages}
                    onClick={() => applyFilters({ q, sportType: sportTypeParam, page: page + 1 })}
                  >
                    Trang sau
                  </Button>
                </nav>
              ) : null}
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
