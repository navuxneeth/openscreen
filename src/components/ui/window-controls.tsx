import { useState, useEffect } from "react";
import { Minus, Square, X } from "lucide-react";

interface WindowControlsProps {
  className?: string;
}

export function WindowControls({ className = "" }: WindowControlsProps) {
  const [platform, setPlatform] = useState<string>("");

  useEffect(() => {
    async function getPlatform() {
      if (window.electronAPI?.getPlatform) {
        const plat = await window.electronAPI.getPlatform();
        setPlatform(plat);
      }
    }
    getPlatform();
  }, []);

  // Only show on Windows
  if (platform !== "win32") {
    return null;
  }

  const handleMinimize = () => {
    window.electronAPI?.minimizeWindow();
  };

  const handleMaximize = () => {
    window.electronAPI?.maximizeWindow();
  };

  const handleClose = () => {
    window.electronAPI?.closeWindow();
  };

  return (
    <div 
      className={`flex items-center ${className}`}
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      <button
        onClick={handleMinimize}
        className="w-11 h-8 flex items-center justify-center hover:bg-white/10 transition-colors"
        title="Minimize"
      >
        <Minus className="w-4 h-4 text-slate-300" />
      </button>
      <button
        onClick={handleMaximize}
        className="w-11 h-8 flex items-center justify-center hover:bg-white/10 transition-colors"
        title="Maximize"
      >
        <Square className="w-3 h-3 text-slate-300" />
      </button>
      <button
        onClick={handleClose}
        className="w-11 h-8 flex items-center justify-center hover:bg-red-500 transition-colors"
        title="Close"
      >
        <X className="w-4 h-4 text-slate-300" />
      </button>
    </div>
  );
}
