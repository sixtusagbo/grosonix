"use client";

import { useState } from "react";
import { StatsGrid } from "./StatsGrid";
import { GrowthChart } from "./GrowthChart";
import { PlatformSelector } from "./PlatformSelector";
import { PlatformFilter } from "@/lib/social";

interface DashboardMetricsProps {
  socialAccounts: any[] | null;
}

export function DashboardMetrics({ socialAccounts }: DashboardMetricsProps) {
  const [selectedPlatform, setSelectedPlatform] =
    useState<PlatformFilter>("overview");

  const connectedPlatforms =
    socialAccounts?.map((account) => account.platform) || [];

  return (
    <div className="space-y-6">
      {/* Platform Selector */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              Analytics Dashboard
            </h2>
            <p className="text-text-secondary text-sm">
              Real-time metrics from your connected social media accounts
            </p>
          </div>
          <PlatformSelector
            selectedPlatform={selectedPlatform}
            onPlatformChange={setSelectedPlatform}
            connectedPlatforms={connectedPlatforms}
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <StatsGrid
        socialAccounts={socialAccounts}
        selectedPlatform={selectedPlatform}
      />

      {/* Growth Chart */}
      <GrowthChart />
    </div>
  );
}
