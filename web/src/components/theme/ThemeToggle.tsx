'use client';

import { useTheme } from './ThemeProvider';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'system':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getThemeLabel = (themeValue: string) => {
    switch (themeValue) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
      default:
        return 'System';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 px-0 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all duration-200"
        >
          {getIcon()}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="glass-card border-emerald-500/20 bg-slate-surface-800/90 backdrop-blur-xl"
      >
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className={`flex items-center gap-2 cursor-pointer hover:bg-emerald-500/10 ${
            theme === 'light' ? 'bg-emerald-500/20 text-emerald-400' : 'text-silver'
          }`}
        >
          <Sun className="h-4 w-4" />
          <span>Light</span>
          {theme === 'light' && (
            <div className="ml-auto h-2 w-2 rounded-full bg-emerald-400" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-2 cursor-pointer hover:bg-emerald-500/10 ${
            theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'text-silver'
          }`}
        >
          <Moon className="h-4 w-4" />
          <span>Dark</span>
          {theme === 'dark' && (
            <div className="ml-auto h-2 w-2 rounded-full bg-emerald-400" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className={`flex items-center gap-2 cursor-pointer hover:bg-emerald-500/10 ${
            theme === 'system' ? 'bg-emerald-500/20 text-emerald-400' : 'text-silver'
          }`}
        >
          <Monitor className="h-4 w-4" />
          <span>System</span>
          {theme === 'system' && (
            <div className="ml-auto h-2 w-2 rounded-full bg-emerald-400" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ThemeToggleCompact() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const cycleTheme = () => {
    const themes = ['system', 'light', 'dark'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex] as any);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={cycleTheme}
      className="h-9 w-9 px-0 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all duration-200 glow-emerald"
    >
      {theme === 'light' && <Sun className="h-4 w-4" />}
      {theme === 'dark' && <Moon className="h-4 w-4" />}
      {theme === 'system' && <Monitor className="h-4 w-4" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
