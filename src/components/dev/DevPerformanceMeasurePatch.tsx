"use client";

import { useEffect } from "react";

/**
 * Next.js + Turbopack (dev only) can call performance.measure() with a
 * negative timestamp when a Server Component aborts via redirect()/notFound().
 * That throws an overlay even though the app flow succeeded.
 * https://github.com/vercel/next.js/issues/86060
 */
export function DevPerformanceMeasurePatch() {
  useEffect(() => {
    const original = performance.measure.bind(performance);
    performance.measure = ((...args: Parameters<typeof performance.measure>) => {
      try {
        return original(...args);
      } catch (error) {
        if (
          error instanceof Error &&
          /negative time stamp|cannot be negative/i.test(error.message)
        ) {
          return undefined as unknown as PerformanceMeasure;
        }
        throw error;
      }
    }) as typeof performance.measure;

    return () => {
      performance.measure = original;
    };
  }, []);

  return null;
}
