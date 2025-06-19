"use client";

import { useTheme } from "@/components/theme/ThemeProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { BarChart3, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";

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

interface GrowthChartProps {
  socialAccounts?: any[] | null;
}

export function GrowthChart({ socialAccounts }: GrowthChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [selectedView, setSelectedView] = useState<"all" | "followers" | "engagement" | "posts">("all");
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Generate mock data based on time range
  const generateMockData = useMemo(() => {
    const now = new Date();
    const dataPoints: { date: string; followers: number; engagement: number; posts: number }[] = [];

    let days: number;
    switch (timeRange) {
      case "7d": days = 7; break;
      case "30d": days = 30; break;
      case "90d": days = 90; break;
      case "1y": days = 365; break;
      default: days = 30;
    }

    // Generate data points
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Mock growth with some randomness
      const baseFollowers = 1000 + (days - i) * 10;
      const variance = Math.random() * 100 - 50;

      dataPoints.push({
        date: date.toISOString().split('T')[0],
        followers: Math.max(0, baseFollowers + variance),
        engagement: Math.max(0, (baseFollowers + variance) * 0.05 + Math.random() * 20),
        posts: Math.floor(Math.random() * 5) + 1
      });
    }

    return dataPoints;
  }, [timeRange]);

  useEffect(() => {
    setLoading(true);

    // Simulate API call delay
    const timer = setTimeout(() => {
      const labels = generateMockData.map(point => {
        const date = new Date(point.date);
        if (timeRange === "7d") {
          return date.toLocaleDateString('en-US', { weekday: 'short' });
        } else if (timeRange === "30d") {
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else {
          return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        }
      });

      // Create datasets based on selected view
      const datasets = [];

      if (selectedView === "all") {
        // Show all metrics
        datasets.push(
          // Followers dataset (primary y-axis)
          {
            label: "Followers",
            data: generateMockData.map(point => point.followers),
            borderColor: "#10B981",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "#10B981",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            yAxisID: 'y',
          },
          // Engagement Rate dataset (secondary y-axis)
          {
            label: "Engagement Rate (%)",
            data: generateMockData.map(point => point.engagement),
            borderColor: "#F59E0B",
            backgroundColor: "rgba(245, 158, 11, 0.1)",
            fill: false,
            tension: 0.4,
            pointBackgroundColor: "#F59E0B",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
            yAxisID: 'y1',
          },
          // Posts dataset (tertiary y-axis)
          {
            label: "Posts",
            data: generateMockData.map(point => point.posts),
            borderColor: "#8B5CF6",
            backgroundColor: "rgba(139, 92, 246, 0.1)",
            fill: false,
            tension: 0.4,
            pointBackgroundColor: "#8B5CF6",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
            yAxisID: 'y2',
          }
        );
      } else {
        // Show single metric
        const metricConfig = {
          followers: {
            label: "Followers",
            color: "#10B981",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            yAxisID: 'y',
            fill: true
          },
          engagement: {
            label: "Engagement Rate (%)",
            color: "#F59E0B",
            backgroundColor: "rgba(245, 158, 11, 0.1)",
            yAxisID: 'y',
            fill: true
          },
          posts: {
            label: "Posts",
            color: "#8B5CF6",
            backgroundColor: "rgba(139, 92, 246, 0.1)",
            yAxisID: 'y',
            fill: true
          }
        };

        const config = metricConfig[selectedView as keyof typeof metricConfig];
        datasets.push({
          label: config.label,
          data: generateMockData.map(point => point[selectedView as keyof typeof point]),
          borderColor: config.color,
          backgroundColor: config.backgroundColor,
          fill: config.fill,
          tension: 0.4,
          pointBackgroundColor: config.color,
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          yAxisID: config.yAxisID,
        });
      }

      setChartData({
        labels,
        datasets
      });
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [timeRange, selectedView, generateMockData]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: isDark ? "#E2E8F0" : "#0F172A",
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: isDark ? "#1A1A2E" : "#FFFFFF",
        titleColor: isDark ? "#E2E8F0" : "#0F172A",
        bodyColor: isDark ? "#E2E8F0" : "#0F172A",
        borderColor: "rgba(16, 185, 129, 0.2)",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (label.includes("Followers") || selectedView === "followers") {
                label += context.parsed.y.toLocaleString();
              } else if (label.includes("Engagement") || selectedView === "engagement") {
                label += context.parsed.y.toFixed(1) + '%';
              } else {
                label += context.parsed.y;
              }
            }
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          color: isDark ? "rgba(226, 232, 240, 0.1)" : "rgba(15, 23, 42, 0.1)",
          drawBorder: false,
        },
        ticks: {
          color: isDark ? "#E2E8F0" : "#0F172A",
          maxTicksLimit: timeRange === "7d" ? 7 : timeRange === "30d" ? 10 : 12,
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        beginAtZero: true,
        grid: {
          color: isDark ? "rgba(226, 232, 240, 0.1)" : "rgba(15, 23, 42, 0.1)",
          drawBorder: false,
        },
        ticks: {
          color: selectedView === "all" ? "#10B981" :
            selectedView === "followers" ? "#10B981" :
              selectedView === "engagement" ? "#F59E0B" : "#8B5CF6",
          callback: function (value: any) {
            if (selectedView === "engagement") {
              return value.toFixed(1) + '%';
            }
            return value.toLocaleString();
          }
        },
        title: {
          display: selectedView !== "all",
          text: selectedView === "followers" ? 'Followers' :
            selectedView === "engagement" ? 'Engagement Rate (%)' :
              selectedView === "posts" ? 'Posts' : '',
          color: selectedView === "followers" ? "#10B981" :
            selectedView === "engagement" ? "#F59E0B" : "#8B5CF6",
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      y1: {
        type: 'linear' as const,
        display: selectedView === "all",
        position: 'right' as const,
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: "#F59E0B",
          callback: function (value: any) {
            return value.toFixed(1) + '%';
          }
        },
        title: {
          display: selectedView === "all",
          text: 'Engagement Rate (%)',
          color: "#F59E0B",
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      y2: {
        type: 'linear' as const,
        display: false, // Hide this axis to avoid clutter, but data will still show
        position: 'right' as const,
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: "#8B5CF6",
        },
      },
    },
  };

  return (
    <Card className="glass-card border-emerald-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-theme-primary">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Growth Analytics
          </CardTitle>

          <div className="flex items-center gap-2">
            <Select value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    </div>
                    View All
                  </div>
                </SelectItem>
                <SelectItem value="followers">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    Followers
                  </div>
                </SelectItem>
                <SelectItem value="engagement">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    Engagement
                  </div>
                </SelectItem>
                <SelectItem value="posts">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    Posts
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7D</SelectItem>
                <SelectItem value="30d">30D</SelectItem>
                <SelectItem value="90d">90D</SelectItem>
                <SelectItem value="1y">1Y</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-80 relative">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : chartData ? (
            <Line data={chartData} options={options} />
          ) : (
            <div className="flex items-center justify-center h-full text-theme-secondary">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No data available</p>
              </div>
            </div>
          )}
        </div>

        {/* Growth Summary */}
        {chartData && !loading && (
          <div className="mt-6 space-y-4">
            {selectedView === "all" ? (
              <>
                <h3 className="text-lg font-semibold text-theme-primary">Current Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Followers Summary */}
                  <div className="p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      <span className="text-sm font-medium text-emerald-500">Followers</span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-theme-primary">
                        {generateMockData[generateMockData.length - 1]?.followers?.toLocaleString() || 0}
                      </div>
                      <div className="text-sm text-theme-secondary">
                        Peak: {Math.max(...generateMockData.map(d => d.followers)).toLocaleString()}
                      </div>
                      <div className="text-sm text-emerald-500 font-medium">
                        +{Math.round(Math.random() * 15 + 5)}% growth
                      </div>
                    </div>
                  </div>

                  {/* Engagement Summary */}
                  <div className="p-4 rounded-lg border border-orange-500/20 bg-orange-500/5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="text-sm font-medium text-orange-500">Engagement Rate</span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-theme-primary">
                        {generateMockData[generateMockData.length - 1]?.engagement?.toFixed(1) || 0}%
                      </div>
                      <div className="text-sm text-theme-secondary">
                        Peak: {Math.max(...generateMockData.map(d => d.engagement)).toFixed(1)}%
                      </div>
                      <div className="text-sm text-orange-500 font-medium">
                        +{Math.round(Math.random() * 10 + 2)}% growth
                      </div>
                    </div>
                  </div>

                  {/* Posts Summary */}
                  <div className="p-4 rounded-lg border border-purple-500/20 bg-purple-500/5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <span className="text-sm font-medium text-purple-500">Posts</span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-theme-primary">
                        {generateMockData.reduce((sum, d) => sum + d.posts, 0)}
                      </div>
                      <div className="text-sm text-theme-secondary">
                        Avg per day: {(generateMockData.reduce((sum, d) => sum + d.posts, 0) / generateMockData.length).toFixed(1)}
                      </div>
                      <div className="text-sm text-purple-500 font-medium">
                        {timeRange === "7d" ? "This week" : timeRange === "30d" ? "This month" : "This period"}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-theme-primary">
                  {selectedView === "followers" ? "Followers" :
                    selectedView === "engagement" ? "Engagement Rate" : "Posts"} Analytics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border/50">
                  <div className="text-center">
                    <div className="text-sm text-theme-secondary">Current</div>
                    <div className="text-lg font-semibold text-theme-primary">
                      {selectedView === "followers" ?
                        generateMockData[generateMockData.length - 1]?.followers?.toLocaleString() :
                        selectedView === "engagement" ?
                          generateMockData[generateMockData.length - 1]?.engagement?.toFixed(1) + "%" :
                          generateMockData.reduce((sum, d) => sum + d.posts, 0)
                      }
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-theme-secondary">Growth</div>
                    <div className="text-lg font-semibold text-emerald-500">
                      +{Math.round(Math.random() * 15 + 5)}%
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-theme-secondary">Peak</div>
                    <div className="text-lg font-semibold text-theme-primary">
                      {selectedView === "followers" ?
                        Math.max(...generateMockData.map(d => d.followers)).toLocaleString() :
                        selectedView === "engagement" ?
                          Math.max(...generateMockData.map(d => d.engagement)).toFixed(1) + "%" :
                          Math.max(...generateMockData.map(d => d.posts))
                      }
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-theme-secondary">
                      {selectedView === "posts" ? "Total" : "Avg Daily"}
                    </div>
                    <div className="text-lg font-semibold text-theme-primary">
                      {selectedView === "followers" ?
                        Math.round(generateMockData.reduce((sum, d) => sum + d.followers, 0) / generateMockData.length).toLocaleString() :
                        selectedView === "engagement" ?
                          (generateMockData.reduce((sum, d) => sum + d.engagement, 0) / generateMockData.length).toFixed(1) + "%" :
                          generateMockData.reduce((sum, d) => sum + d.posts, 0)
                      }
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
