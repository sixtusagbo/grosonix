// web/src/components/ai/PlatformContentPreview.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlatformContent } from "@/types/ai";
import { formatPlatformName, getPlatformColor, getPlatformIcon } from "@/lib/api/ai-client";
import { cn } from "@/lib/utils";

interface PlatformContentPreviewProps {
  adaptation: PlatformContent;
  className?: string;
}

export function PlatformContentPreview({ adaptation, className }: PlatformContentPreviewProps) {
  const { platform, content, hashtags, character_count, optimized } = adaptation;

  const renderTwitterPreview = () => (
    <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{getPlatformIcon(platform)}</span>
        <span className="font-semibold text-blue-400">{formatPlatformName(platform)}</span>
        {optimized && <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">Optimized</Badge>}
      </div>
      <p className="text-theme-primary text-sm leading-relaxed whitespace-pre-line mb-3">
        {content}
      </p>
      {hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {hashtags.map((tag, idx) => (
            <span key={idx} className="text-blue-300 text-xs">
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="text-xs text-theme-muted mt-2">
        {character_count} characters
      </div>
    </div>
  );

  const renderInstagramPreview = () => (
    <div className="p-4 bg-pink-500/10 rounded-lg border border-pink-500/20">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{getPlatformIcon(platform)}</span>
        <span className="font-semibold text-pink-400">{formatPlatformName(platform)}</span>
        {optimized && <Badge variant="secondary" className="bg-pink-500/20 text-pink-400">Optimized</Badge>}
      </div>
      <div className="w-full h-40 bg-gray-700 rounded-md mb-3 flex items-center justify-center text-theme-muted text-sm">
        [Image Placeholder]
      </div>
      <p className="text-theme-primary text-sm leading-relaxed whitespace-pre-line mb-3">
        {content}
      </p>
      {hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {hashtags.map((tag, idx) => (
            <span key={idx} className="text-pink-300 text-xs">
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="text-xs text-theme-muted mt-2">
        {character_count} characters
      </div>
    </div>
  );

  const renderLinkedInPreview = () => (
    <div className="p-4 bg-blue-600/10 rounded-lg border border-blue-600/20">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{getPlatformIcon(platform)}</span>
        <span className="font-semibold text-blue-600">{formatPlatformName(platform)}</span>
        {optimized && <Badge variant="secondary" className="bg-blue-600/20 text-blue-600">Optimized</Badge>}
      </div>
      <p className="text-theme-primary text-sm leading-relaxed whitespace-pre-line mb-3">
        {content}
      </p>
      {hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {hashtags.map((tag, idx) => (
            <span key={idx} className="text-blue-500 text-xs">
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="text-xs text-theme-muted mt-2">
        {character_count} characters
      </div>
    </div>
  );

  const renderPreview = () => {
    switch (platform) {
      case "twitter":
        return renderTwitterPreview();
      case "instagram":
        return renderInstagramPreview();
      case "linkedin":
        return renderLinkedInPreview();
      default:
        return null;
    }
  };

  return (
    <Card className={cn("glass-card border-emerald-500/20", className)}>
      <CardContent className="p-4">
        <h3 className={cn("text-lg font-semibold mb-3", getPlatformColor(platform))}>
          {formatPlatformName(platform)} Preview
        </h3>
        {renderPreview()}
      </CardContent>
    </Card>
  );
}
