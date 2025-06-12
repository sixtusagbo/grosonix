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
  const data = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Followers Growth",
        data: [0, 0, 0, 0, 0, 0],
        borderColor: "#8B5CF6",
        backgroundColor: "rgba(139, 92, 246, 0.1)",
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
        backgroundColor: "#1A1A2E",
        titleColor: "#E2E8F0",
        bodyColor: "#E2E8F0",
        borderColor: "rgba(139, 92, 246, 0.2)",
        borderWidth: 1,
        padding: 12,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(226, 232, 240, 0.1)",
        },
        ticks: {
          color: "#E2E8F0",
        },
      },
      x: {
        grid: {
          color: "rgba(226, 232, 240, 0.1)",
        },
        ticks: {
          color: "#E2E8F0",
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
