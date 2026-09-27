import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
  type ChartData,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { formatVND } from '../../../lib/utils';
import type { SportType } from '../api/owner-api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface RevenueTrendChartProps {
  series: Array<{ date: string; revenueVnd: number; bookings: number }>;
  isDark?: boolean;
}

export function RevenueTrendAreaChart({ series, isDark = true }: RevenueTrendChartProps): React.ReactElement {
  const labels = series.map((s) => {
    const parts = s.date.split('-');
    return `${parts[2]}/${parts[1]}`;
  });

  const revenueData = series.map((s) => s.revenueVnd);
  const bookingsData = series.map((s) => s.bookings);

  const data: ChartData<'line'> = {
    labels,
    datasets: [
      {
        type: 'line' as const,
        label: 'Doanh Thu (VND)',
        data: revenueData,
        borderColor: '#10B981',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, isDark ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.25)');
          gradient.addColorStop(1, isDark ? 'rgba(16, 185, 129, 0.0)' : 'rgba(16, 185, 129, 0.0)');
          return gradient;
        },
        fill: true,
        tension: 0.38,
        pointBackgroundColor: '#10B981',
        pointBorderColor: isDark ? '#0f172a' : '#ffffff',
        pointBorderWidth: 2,
        pointRadius: series.length > 20 ? 2 : 4,
        pointHoverRadius: 6,
        yAxisID: 'yRevenue',
      },
      {
        type: 'line' as const,
        label: 'Số Lượt Đặt',
        data: bookingsData,
        borderColor: '#38BDF8',
        backgroundColor: 'transparent',
        borderDash: [4, 4],
        tension: 0.35,
        pointBackgroundColor: '#38BDF8',
        pointBorderColor: isDark ? '#0f172a' : '#ffffff',
        pointBorderWidth: 2,
        pointRadius: series.length > 20 ? 1 : 3,
        pointHoverRadius: 5,
        yAxisID: 'yBookings',
      },
    ],
  };

  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          color: textColor,
          boxWidth: 12,
          boxHeight: 12,
          borderRadius: 3,
          useBorderRadius: true,
          font: {
            size: 11,
            weight: 'bold',
          },
        },
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDark ? '#f8fafc' : '#0f172a',
        bodyColor: isDark ? '#cbd5e1' : '#334155',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
        callbacks: {
          label: (context) => {
            if (context.dataset.yAxisID === 'yRevenue') {
              return ` Doanh thu: ${formatVND(context.parsed.y ?? 0)}`;
            }
            return ` Số ca đặt: ${context.parsed.y ?? 0} đơn`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: gridColor,
        },
        ticks: {
          color: textColor,
          font: {
            size: 10,
            family: 'monospace',
          },
          maxRotation: 0,
        },
      },
      yRevenue: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: {
          color: gridColor,
        },
        ticks: {
          color: textColor,
          font: {
            size: 10,
          },
          callback: (val) => {
            const num = Number(val);
            if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
            if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
            return num.toString();
          },
        },
      },
      yBookings: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: textColor,
          font: {
            size: 10,
          },
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="w-full h-full min-h-[260px]">
      <Line data={data} options={options} />
    </div>
  );
}


interface CourtPerformanceDoughnutProps {
  topCourts: Array<{
    courtName: string;
    revenueVnd: number;
    bookings: number;
    sportType?: SportType;
  }>;
  isDark?: boolean;
}

export function CourtPerformanceDoughnut({
  topCourts,
  isDark = true,
}: CourtPerformanceDoughnutProps): React.ReactElement {
  const labels = topCourts.map((c) => c.courtName);
  const dataValues = topCourts.map((c) => c.revenueVnd);

  const colors = [
    '#10B981', // Emerald
    '#0EA5E9', // Sky
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
  ];

  const data: ChartData<'doughnut'> = {
    labels,
    datasets: [
      {
        data: dataValues.length > 0 ? dataValues : [1],
        backgroundColor: dataValues.length > 0 ? colors.slice(0, dataValues.length) : ['rgba(148, 163, 184, 0.3)'],
        borderColor: isDark ? '#0f172a' : '#ffffff',
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: isDark ? '#94a3b8' : '#64748b',
          boxWidth: 10,
          boxHeight: 10,
          borderRadius: 3,
          useBorderRadius: true,
          font: {
            size: 10,
            weight: 'bold',
          },
        },
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDark ? '#f8fafc' : '#0f172a',
        bodyColor: isDark ? '#cbd5e1' : '#334155',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 8,
        callbacks: {
          label: (context) => {
            if (dataValues.length === 0) return ' Chưa có dữ liệu';
            return ` ${context.label}: ${formatVND(context.parsed)}`;
          },
        },
      },
    },
  };

  return (
    <div className="w-full h-full min-h-[200px] flex items-center justify-center relative">
      <Doughnut data={data} options={options} />
    </div>
  );
}
