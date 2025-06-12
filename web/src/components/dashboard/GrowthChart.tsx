"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { useTheme } from "@/components/theme/ThemeProvider";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function GrowthChart() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const data = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Followers Growth",
        data: [0, 0, 0, 0, 0, 0],
        borderColor: "#10B981", // emerald-500
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDark ? "#1A1A2E" : "#FFFFFF",
        titleColor: isDark ? "#E2E8F0" : "#0F172A",
        bodyColor: isDark ? "#E2E8F0" : "#0F172A",
        borderColor: "rgba(16, 185, 129, 0.2)",
        borderWidth: 1,
        padding: 12,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: isDark ? "rgba(226, 232, 240, 0.1)" : "rgba(15, 23, 42, 0.1)",
        },
        ticks: {
          color: isDark ? "#E2E8F0" : "#0F172A",
        },
      },
      x: {
        grid: {
          color: isDark ? "rgba(226, 232, 240, 0.1)" : "rgba(15, 23, 42, 0.1)",
        },
        ticks: {
          color: isDark ? "#E2E8F0" : "#0F172A",
        },
      },
    },
  };

  return (
    <div className="glass-card p-6">
      <h2 className="text-xl font-semibold text-text-primary mb-6">
        Growth Trends
      </h2>
      <Line data={data} options={options} />
    </div>
  );
}
