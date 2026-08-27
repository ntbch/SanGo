/**
 * Biểu đồ hỗn hợp CHỈ-ĐỌC dùng chung: cột doanh thu (trục trái) + đường lượt
 * đặt (trục phải), vẽ theo chuỗi ngày đã gộp. Dùng ở tổng quan owner/admin
 * và trang Thống kê nền tảng — không thao tác dữ liệu.
 */
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from 'chart.js';
import type { ReactElement } from 'react';
import { Chart } from 'react-chartjs-2';

import { useChartTheme } from '../theme/use-chart-theme';
import { formatReviewDate, formatVnd } from '../../features/public/format';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
);

/** Một điểm chuỗi ngày sau khi gộp (shape giống series /owner/analytics). */
export interface RevenueBookingsPoint {
  date: string;
  bookings: number;
  revenue: number;
}

/** Nhãn trục x gọn: YYYY-MM-DD -> d/m. */
function axisDateLabel(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return date;
  return String(Number(match[3])) + '/' + String(Number(match[2]));
}

/** Nén số tiền cho trục y: 1200000 -> '1,2tr' · 45000 -> '45k'. */
function compactMoney(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return (Math.round((value / 1_000_000) * 10) / 10).toString().replace('.', ',') + 'tr';
  }
  if (Math.abs(value) >= 1000) return Math.round(value / 1000) + 'k';
  return String(Math.round(value));
}

export function RevenueBookingsChart(options: {
  series: ReadonlyArray<RevenueBookingsPoint>;
  testId?: string;
}): ReactElement {
  const { series, testId } = options;
  const chartTheme = useChartTheme();

  // Mixed bar+line: ChartData<'bar'> không mô tả được dataset 'line' nên ép kiểu tại đây.
  const data = {
    labels: series.map((point) => axisDateLabel(point.date)),
    datasets: [
      {
        type: 'bar',
        label: 'Doanh thu',
        data: series.map((point) => point.revenue),
        backgroundColor: chartTheme.revenueBackground,
        hoverBackgroundColor: chartTheme.revenue,
        borderRadius: 4,
        maxBarThickness: 16,
        yAxisID: 'y',
      },
      {
        type: 'line',
        label: 'Lượt đặt',
        data: series.map((point) => point.bookings),
        borderColor: chartTheme.bookings,
        backgroundColor: chartTheme.bookingsBackground,
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: chartTheme.bookings,
        tension: 0.35,
        yAxisID: 'y1',
      },
    ],
  } as unknown as ChartData<'bar'>;

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: {
        ticks: { color: chartTheme.mutedText, maxTicksLimit: 12, maxRotation: 0, autoSkip: true },
        grid: { display: false },
      },
      y: {
        position: 'left',
        ticks: { color: chartTheme.mutedText, callback: (value) => compactMoney(Number(value)) },
        grid: { color: chartTheme.grid },
      },
      y1: {
        position: 'right',
        ticks: { color: chartTheme.mutedText, precision: 0 },
        grid: { drawOnChartArea: false },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: chartTheme.text,
          usePointStyle: true,
          boxWidth: 8,
          font: { family: 'Plus Jakarta Sans', size: 12, weight: 600 },
        },
      },
      tooltip: {
        backgroundColor: chartTheme.tooltipBg,
        titleColor: chartTheme.text,
        bodyColor: chartTheme.text,
        borderColor: chartTheme.tooltipBorder,
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
        callbacks: {
          title: (items) => {
            const point = series[items[0]?.dataIndex ?? -1];
            return point ? formatReviewDate(point.date) : (items[0]?.label ?? '');
          },
          label: (item) =>
            item.datasetIndex === 0
              ? 'Doanh thu: ' + formatVnd(Number(item.raw))
              : 'Lượt đặt: ' + String(item.raw),
        },
      },
    },
  };

  return (
    <div className="h-72" data-testid={testId}>
      <Chart type="bar" data={data} options={chartOptions} />
    </div>
  );
}
