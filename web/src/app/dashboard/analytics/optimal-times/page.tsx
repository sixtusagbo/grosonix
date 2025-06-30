"use client";

import { OptimalPostingTimeDashboard } from '@/components/analytics/OptimalPostingTimeDashboard';

export const dynamic = 'force-dynamic';

export default function OptimalTimesPage() {
  return (
    <div className="container mx-auto py-8">
      <OptimalPostingTimeDashboard />
    </div>
  );
}