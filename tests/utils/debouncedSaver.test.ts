import { afterEach, describe, expect, it, vi } from "vitest";

import { createDebouncedSaver } from "../../src/lib/utils/debouncedSaver";

describe("createDebouncedSaver", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("debounces rapid calls into one save", async () => {
    vi.useFakeTimers();
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const { requestSave } = createDebouncedSaver(saveFn, 100);

    requestSave("first");
    requestSave("second");
    requestSave("third");

    await vi.advanceTimersByTimeAsync(100);

    expect(saveFn).toHaveBeenCalledTimes(1);
    expect(saveFn).toHaveBeenCalledWith("third");
  });

  it("queues another save when edits arrive during save", async () => {
    vi.useFakeTimers();
    let resolveSave: (() => void) | null = null;
    const saveFn = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        })
    );
    const { requestSave } = createDebouncedSaver(saveFn, 10);

    requestSave("first");
    await vi.advanceTimersByTimeAsync(10);
    expect(saveFn).toHaveBeenCalledTimes(1);

    requestSave("second");
    expect(saveFn).toHaveBeenCalledTimes(1);

    resolveSave?.();
    await vi.runAllTimersAsync();

    expect(saveFn).toHaveBeenCalledTimes(2);
    expect(saveFn).toHaveBeenLastCalledWith("second");
  });
});
