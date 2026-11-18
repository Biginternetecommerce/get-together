"use client";
import { ReactNode, useEffect, useRef, useState } from "react";
import { hasWebGL2 } from "@/lib/webgl";

/** Mounts WebGL children only while the parent element is within ~2 viewports of the screen (keeps live WebGL contexts low).
 *  If this device cannot create a WebGL2 context at all, renders the 2D `fallback` artwork instead, so nothing is ever blank. */
export default function Lazy3D({ children, fallback, margin = "220% 0px" }: { children: ReactNode; fallback?: ReactNode; margin?: string }) {
  const ref = useRef<HTMLElement>(null);
  const [on, setOn] = useState(false);
  const [sup, setSup] = useState<boolean | null>(null);
  useEffect(() => { setSup(hasWebGL2()); }, []);
  useEffect(() => {
    const p = ref.current?.parentElement; if (!p) return;
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { rootMargin: margin });
    io.observe(p); return () => io.disconnect();
  }, [margin]);
  return <><i ref={ref} hidden aria-hidden />{sup === false ? fallback : sup && on ? children : null}</>;
}
