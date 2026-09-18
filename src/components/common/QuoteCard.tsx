import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMotivationalQuote } from "@/hooks/useMotivationalQuote";

export default function QuoteCard({ className }: { className?: string }) {
  const { quote } = useMotivationalQuote();
  if (!quote) return null;
  return (
    <Card
      dir="rtl"
      className={cn(
        "p-4 bg-gradient-card border-primary/20 flex items-center justify-center gap-3 text-center",
        className
      )}
    >
      <div className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-primary flex-shrink-0">
        <Sparkles className="h-4.5 w-4.5 h-[18px] w-[18px] text-white" />
      </div>
      <p className="font-display font-bold text-base md:text-lg text-foreground">{quote}</p>
    </Card>
  );
}
