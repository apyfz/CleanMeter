import { cn } from "@/lib/utils";

interface PillProps {
  title: string;
  isHorizontal: boolean;
  children: React.ReactNode;
}

export function Pill({ title, isHorizontal, children }: PillProps) {
  if (isHorizontal) {
    return (
      <div className="flex items-center gap-2 bg-black/30 rounded-full h-full min-w-[80px] px-4 py-1">
        <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">
          {title}
        </span>
        <div className="flex items-center gap-2">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 bg-black/30 rounded-lg p-3">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">
          {title}
        </span>
        <div className="flex items-center gap-2 flex-1">{children}</div>
      </div>
    </div>
  );
}
