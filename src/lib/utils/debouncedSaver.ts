type SaveFunction<T> = (payload: T) => Promise<void>;

type DebouncedSaver<T> = {
  requestSave: (payload: T) => void;
  cancel: () => void;
};

export const createDebouncedSaver = <T>(
  saveFn: SaveFunction<T>,
  delayMs = 800
): DebouncedSaver<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let inFlight = false;
  let queuedPayload: T | null = null;

  const schedule = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
      void runSave();
    }, delayMs);
  };

  const runSave = async () => {
    if (inFlight) {
      return;
    }

    inFlight = true;

    try {
      while (queuedPayload !== null) {
        const payload = queuedPayload;
        queuedPayload = null;
        await saveFn(payload);
      }
    } finally {
      inFlight = false;
    }
  };

  const requestSave = (payload: T) => {
    queuedPayload = payload;
    if (inFlight) {
      return;
    }
    schedule();
  };

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    queuedPayload = null;
  };

  return { requestSave, cancel };
};
