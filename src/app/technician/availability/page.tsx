"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  CalendarDays,
  Check,
  Clock3,
  Loader2,
  RefreshCw,
  Save,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface DaySchedule {
  dayOfWeek: number;
  day: string;
  enabled: boolean;
  start: string;
  end: string;
}

const defaultSchedule: DaySchedule[] = [
  {
    dayOfWeek: 0,
    day: "Monday",
    enabled: true,
    start: "08:00",
    end: "18:00",
  },
  {
    dayOfWeek: 1,
    day: "Tuesday",
    enabled: true,
    start: "08:00",
    end: "18:00",
  },
  {
    dayOfWeek: 2,
    day: "Wednesday",
    enabled: true,
    start: "08:00",
    end: "18:00",
  },
  {
    dayOfWeek: 3,
    day: "Thursday",
    enabled: true,
    start: "08:00",
    end: "18:00",
  },
  {
    dayOfWeek: 4,
    day: "Friday",
    enabled: true,
    start: "08:00",
    end: "18:00",
  },
  {
    dayOfWeek: 5,
    day: "Saturday",
    enabled: true,
    start: "09:00",
    end: "14:00",
  },
  {
    dayOfWeek: 6,
    day: "Sunday",
    enabled: false,
    start: "00:00",
    end: "00:00",
  },
];

function cloneDefaultSchedule(): DaySchedule[] {
  return defaultSchedule.map((day) => ({ ...day }));
}

export default function TechnicianAvailabilityPage() {
  const [schedule, setSchedule] = useState<DaySchedule[]>(
    cloneDefaultSchedule(),
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadSchedule = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/technician/availability", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || `Failed to load schedule (${response.status})`,
        );
      }

      if (!Array.isArray(result.schedule)) {
        throw new Error("Invalid schedule received from server");
      }

      const serverSchedule: DaySchedule[] = result.schedule.map(
        (item: DaySchedule) => ({
          dayOfWeek: item.dayOfWeek,
          day: item.day,
          enabled: Boolean(item.enabled),
          start: item.start || "08:00",
          end: item.end || "18:00",
        }),
      );

      setSchedule(serverSchedule);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load schedule";

      console.error("Availability load error:", err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSchedule();
  }, [loadSchedule]);

  const updateDay = (
    index: number,
    field: keyof DaySchedule,
    value: boolean | string,
  ) => {
    setSchedule((current) =>
      current.map((day, currentIndex) =>
        currentIndex === index
          ? {
              ...day,
              [field]: value,
            }
          : day,
      ),
    );
  };

  const validateSchedule = () => {
    for (const day of schedule) {
      if (!day.enabled) {
        continue;
      }

      if (!day.start || !day.end) {
        return `${day.day}: start and end times are required`;
      }

      if (day.start >= day.end) {
        return `${day.day}: start time must be before end time`;
      }
    }

    return null;
  };

  const handleSave = async () => {
    const validationError = validateSchedule();

    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch("/api/technician/availability", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schedule: schedule.map((day) => ({
            dayOfWeek: day.dayOfWeek,
            enabled: day.enabled,
            start: day.start,
            end: day.end,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || `Failed to save schedule (${response.status})`,
        );
      }

      toast.success("Schedule saved successfully");

      // Reload the data from MySQL so the UI reflects the actual
      // persisted schedule instead of only the local React state.
      await loadSchedule();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save schedule";

      console.error("Availability save error:", err);
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const enabledDays = useMemo(
    () => schedule.filter((day) => day.enabled).length,
    [schedule],
  );

  const disabledDays = schedule.length - enabledDays;

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-5xl space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CalendarDays className="size-5" />
              </div>

              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  Availability
                </h1>

                <p className="text-sm text-muted-foreground sm:text-base">
                  Set your work schedule and availability
                </p>
              </div>
            </div>
          </div>

          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadSchedule()}
              disabled={loading || saving}
              className="flex-1 sm:flex-none"
            >
              <RefreshCw
                className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>

            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={loading || saving}
              className="flex-1 sm:flex-none"
            >
              {saving ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Save className="mr-2 size-4" />
              )}

              {saving ? "Saving..." : "Save Schedule"}
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Clock3 className="size-4" />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Working days
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {enabledDays} days
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <CalendarDays className="size-4" />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Days off
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {disabledDays} days
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Schedule */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex min-h-80 items-center justify-center rounded-2xl border border-border bg-card">
              <div className="flex flex-col items-center gap-3 text-center">
                <Loader2 className="size-7 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Loading your schedule...
                </p>
              </div>
            </div>
          ) : (
            schedule.map((daySchedule, index) => (
              <motion.div
                key={daySchedule.day}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.2,
                  delay: index * 0.03,
                }}
                className={`rounded-2xl border border-border bg-card p-4 transition-all sm:p-5 ${
                  !daySchedule.enabled ? "bg-muted/20" : ""
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  {/* Day information */}
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <Switch
                      checked={daySchedule.enabled}
                      onCheckedChange={(checked) =>
                        updateDay(index, "enabled", checked)
                      }
                      aria-label={`Enable ${daySchedule.day}`}
                    />

                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">
                        {daySchedule.day}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {daySchedule.enabled
                          ? `${daySchedule.start} - ${daySchedule.end}`
                          : "Day off"}
                      </p>
                    </div>
                  </div>

                  {/* Time controls */}
                  {daySchedule.enabled ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end lg:w-auto lg:min-w-[360px]">
                      <div className="min-w-0">
                        <label
                          htmlFor={`start-${daySchedule.dayOfWeek}`}
                          className="mb-1.5 block text-xs font-medium text-muted-foreground"
                        >
                          Start time
                        </label>

                        <Input
                          id={`start-${daySchedule.dayOfWeek}`}
                          type="time"
                          value={daySchedule.start}
                          onChange={(event) =>
                            updateDay(
                              index,
                              "start",
                              event.target.value,
                            )
                          }
                          className="h-10 w-full"
                        />
                      </div>

                      <span className="hidden pb-2 text-sm text-muted-foreground sm:block">
                        to
                      </span>

                      <div className="min-w-0">
                        <label
                          htmlFor={`end-${daySchedule.dayOfWeek}`}
                          className="mb-1.5 block text-xs font-medium text-muted-foreground"
                        >
                          End time
                        </label>

                        <Input
                          id={`end-${daySchedule.dayOfWeek}`}
                          type="time"
                          value={daySchedule.end}
                          onChange={(event) =>
                            updateDay(index, "end", event.target.value)
                          }
                          className="h-10 w-full"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                      <Check className="size-4" />
                      Day off
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Bottom save action for mobile */}
        {!loading && (
          <div className="sticky bottom-3 z-10 rounded-2xl border border-border bg-background/95 p-2 shadow-lg backdrop-blur sm:hidden">
            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="w-full"
            >
              {saving ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Save className="mr-2 size-4" />
              )}

              {saving ? "Saving..." : "Save Schedule"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
