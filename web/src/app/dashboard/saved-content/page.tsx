"use client";

import { SavedContentList } from "@/components/ai/SavedContentList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export const dynamic = 'force-dynamic';

export default function SavedContentPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card p-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-emerald-500" />
          <div>
            <h1 className="text-2xl font-bold text-theme-primary mb-1">
              Saved Content Library
            </h1>
            <p className="text-theme-secondary">
              Access and manage all your saved content in one place
            </p>
          </div>
        </div>
      </Card>

      {/* Saved Content List */}
      <SavedContentList showHeader={true} />
    </div>
  );
}