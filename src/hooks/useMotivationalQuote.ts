import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const FALLBACK = [
  "توكل على الله فهو حسبك",
  "واصل، أنت لها",
  "من جدّ وجد",
  "الصبر مفتاح الفرج",
  "كل يوم خطوة تقربك من النجاح",
];

let cache: string[] | null = null;
let inflight: Promise<string[]> | null = null;

async function loadQuotes(): Promise<string[]> {
  if (cache) return cache;
  if (!inflight) {
    inflight = (async () => {
      try {
        const { data } = await supabase
          .from("motivational_quotes" as any)
          .select("text")
          .eq("is_active", true);
        const list = ((data as any[]) || []).map(r => r.text).filter(Boolean);
        cache = list.length ? list : FALLBACK;
      } catch {
        cache = FALLBACK;
      }
      return cache;
    })();
  }
  return inflight;
}

function pick(list: string[], prev: string | null) {
  if (list.length === 0) return "";
  if (list.length === 1) return list[0];
  let q = prev;
  while (q === prev) q = list[Math.floor(Math.random() * list.length)];
  return q as string;
}

export function useMotivationalQuote() {
  const [quote, setQuote] = useState<string>(() => pick(FALLBACK, null));
  const listRef = useRef<string[]>(FALLBACK);
  const lastRef = useRef<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadQuotes().then(list => {
      if (!alive) return;
      listRef.current = list;
      const q = pick(list, lastRef.current);
      lastRef.current = q;
      setQuote(q);
    });
    return () => { alive = false; };
  }, []);

  const next = useCallback(() => {
    const q = pick(listRef.current, lastRef.current);
    lastRef.current = q;
    setQuote(q);
    return q;
  }, []);

  return { quote, next };
}
