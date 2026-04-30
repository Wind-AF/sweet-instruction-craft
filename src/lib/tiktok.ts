/* TikTok Pixel helper (client-side) */
declare global {
  interface Window {
    ttq?: {
      track: (event: string, params?: Record<string, unknown>, options?: { event_id?: string }) => void;
      identify: (params: Record<string, unknown>) => void;
      page: () => void;
    };
  }
}

export const ttqTrack = (
  event: string,
  params?: Record<string, unknown>,
  eventId?: string,
) => {
  try {
    if (typeof window === "undefined" || !window.ttq) return;
    if (eventId) {
      window.ttq.track(event, params, { event_id: eventId });
    } else {
      window.ttq.track(event, params);
    }
  } catch (_e) {
    /* noop */
  }
};

export const newEventId = () =>
  `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;