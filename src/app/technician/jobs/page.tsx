"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { motion } from "motion/react";
import {
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  PlayCircle,
  XCircle,
  Eye,
  Loader2,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { SearchFilter } from "@/components/admin/shared/SearchFilter";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type JobStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

type ApiBooking = {
  id: string;
  status: string;
  scheduledDate: string;
  scheduledTime: string;
  address: string;
  notes?: string | null;
  totalAmount?: number | null;

  // Current technician jobs API response
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  amount?: number | null;

  customer?: {
    id?: string;
    name?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;

  user_booking_customerIdTouser?: {
    id?: string;
    name?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;

  service?: {
    id?: string;
    name?: string | null;
    title?: string | null;
    category?: string | null;
  } | null;

  // The API already returns these fields directly
  serviceName?: string | null;
  serviceType?: string | null;
};

type Job = {
  id: string;
  status: JobStatus;
  serviceName: string;
  serviceType: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  scheduledDate: string;
  scheduledTime: string;
  address: string;
  amount: number;
  notes?: string;
};

const tabs = ["All", "Pending", "In Progress", "Completed"] as const;

function normalizeStatus(status: string): JobStatus {
  if (
    status === "pending" ||
    status === "confirmed" ||
    status === "in_progress" ||
    status === "completed" ||
    status === "cancelled"
  ) {
    return status;
  }

  // Older/mock data used "accepted". The database uses "confirmed".
  if (status === "accepted") return "confirmed";

  return "pending";
}

function displayStatus(status: JobStatus): string {
  // Keep the existing technician UI terminology.
  if (status === "confirmed") return "accepted";
  return status;
}

function getCustomer(booking: ApiBooking) {
  return (
    booking.customer ??
    booking.user_booking_customerIdTouser ??
    null
  );
}

function mapBookingToJob(booking: ApiBooking): Job {
  const customer =
    booking.customer ??
    booking.user_booking_customerIdTouser ??
    null;

  return {
    id: booking.id,

    status: normalizeStatus(booking.status),

    serviceName:
      booking.serviceName ||
      booking.service?.name ||
      booking.service?.title ||
      "Service",

    serviceType:
      booking.serviceType ||
      booking.service?.category ||
      "Home Service",

    customerName:
      booking.customerName ||
      customer?.name ||
      customer?.phone ||
      "Unknown customer",

    customerPhone:
      booking.customerPhone ||
      customer?.phone ||
      "Not available",

    customerEmail:
      booking.customerEmail ||
      customer?.email ||
      undefined,

    scheduledDate: booking.scheduledDate,

    scheduledTime: booking.scheduledTime,

    address:
      booking.address ||
      "Address not available",

    amount: Number(
      booking.amount ??
      booking.totalAmount ??
      0
    ),

    notes:
      booking.notes ||
      undefined,
  };
}

async function readJsonResponse(response: Response) {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Server returned invalid JSON (${response.status}). Please check the terminal for the API error.`
    );
  }
}

export default function TechnicianJobsPage() {
  const [data, setData] = useState<Job[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] =
    useState<(typeof tabs)[number]>("All");
  const [viewJob, setViewJob] =
  useState<Job | null>(null);

const [cancelId, setCancelId] =
  useState<string | null>(null);

const [openingBookingId, setOpeningBookingId] =
  useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/technician/jobs", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const payload = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to load technician jobs");
      }

      const bookings = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.jobs)
          ? payload.jobs
          : Array.isArray(payload?.bookings)
            ? payload.bookings
            : [];

      setData(bookings.map(mapBookingToJob));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load jobs";
      setError(message);
      setData([]);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
  void loadJobs();
}, [loadJobs]);

useEffect(() => {
  if (typeof window === "undefined") {
    return;
  }

  const params = new URLSearchParams(
    window.location.search
  );

  const bookingId = params.get("booking");

  if (bookingId) {
    setOpeningBookingId(bookingId);
  }
}, []);

useEffect(() => {
  if (loading || !openingBookingId || data.length === 0) {
    return;
  }

  const matchingJob = data.find(
    (job) => job.id === openingBookingId
  );

  if (matchingJob) {
    setViewJob(matchingJob);
  } else {
    toast.error(
      "The requested booking was not found in your assigned jobs."
    );
  }

  setOpeningBookingId(null);
}, [data, loading, openingBookingId]);
  

  const filtered = useMemo(() => {
    return data.filter((job) => {
      const q = search.trim().toLowerCase();

      const matchesSearch =
        !q ||
        job.id.toLowerCase().includes(q) ||
        job.serviceName.toLowerCase().includes(q) ||
        job.customerName.toLowerCase().includes(q) ||
        job.customerPhone.toLowerCase().includes(q);

      if (activeTab === "All") return matchesSearch;

      if (activeTab === "Pending") {
        return matchesSearch && job.status === "pending";
      }

      if (activeTab === "In Progress") {
        return matchesSearch && job.status === "in_progress";
      }

      return matchesSearch && job.status === "completed";
    });
  }, [data, search, activeTab]);

  const updateStatus = async (jobId: string, newStatus: JobStatus) => {
    const currentJob = data.find((job) => job.id === jobId);
    if (!currentJob) return;

    // Database workflow:
    // pending -> confirmed -> in_progress -> completed
    // pending/confirmed/in_progress -> cancelled
    if (currentJob.status === "completed") {
      toast.error("Completed jobs cannot be moved back to another status.");
      return;
    }

    setUpdatingId(jobId);

    try {
      const response = await fetch("/api/technician/jobs", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          bookingId: jobId,
          status: newStatus,
          id: jobId,
        }),
      });

      const payload = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          payload?.error || "Failed to update the booking status"
        );
      }

      const returnedBooking =
        payload?.booking ||
        payload?.job ||
        payload?.data ||
        (payload?.id ? payload : null);

      if (returnedBooking?.id) {
        const updatedJob = mapBookingToJob(returnedBooking);
        setData((prev) =>
          prev.map((job) => (job.id === jobId ? updatedJob : job))
        );

        if (viewJob?.id === jobId) {
          setViewJob(updatedJob);
        }
      } else {
        setData((prev) =>
          prev.map((job) =>
            job.id === jobId ? { ...job, status: newStatus } : job
          )
        );

        if (viewJob?.id === jobId) {
          setViewJob((job) =>
            job ? { ...job, status: newStatus } : job
          );
        }
      }

      const labels: Record<string, string> = {
        confirmed: "accepted",
        in_progress: "started",
        completed: "completed",
        cancelled: "cancelled",
      };

      toast.success(`Job ${labels[newStatus] || newStatus}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update job";
      toast.error(message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancel = async () => {
    if (!cancelId) return;

    await updateStatus(cancelId, "cancelled");
    setCancelId(null);
  };

  const getActionLabel = (status: JobStatus) => {
    if (status === "pending") return "Accept";
    if (status === "confirmed") return "Start Job";
    if (status === "in_progress") return "Complete";
    return "";
  };

  return (
    <div className="w-full">
      <PageHeader
        title="My Jobs"
        description="View and manage your assigned jobs"
      />

      <SearchFilter
        value={search}
        onChange={setSearch}
        placeholder="Search by job ID, service, or customer..."
      />

      <div className="mb-4 flex w-full gap-1 overflow-x-auto rounded-xl border border-border bg-muted p-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`min-w-[100px] flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading your jobs...
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <p className="font-medium text-foreground">No jobs found.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Assigned bookings will appear here automatically.
              </p>
            </div>
          ) : (
            filtered.map((job, i) => {
              const isUpdating = updatingId === job.id;
              const actionLabel = getActionLabel(job.status);

              return (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-foreground">
                          {job.serviceName}
                        </h3>
                        <StatusBadge status={displayStatus(job.status)} />
                      </div>

                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {job.serviceType} &middot; {job.id}
                      </p>
                    </div>

                    <p className="text-lg font-bold text-foreground">
                      ₹{job.amount.toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
                    <span className="flex min-w-0 items-start gap-1">
                      <Clock className="mt-0.5 size-3.5 shrink-0" />
                      <span>
                        {new Date(job.scheduledDate).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )}{" "}
                        at {job.scheduledTime}
                      </span>
                    </span>

                    <span className="flex min-w-0 items-start gap-1">
                      <MapPin className="mt-0.5 size-3.5 shrink-0" />
                      <span className="break-words">{job.address}</span>
                    </span>

                    <span className="flex min-w-0 items-center gap-1">
                      <Phone className="size-3.5 shrink-0" />
                      <span className="truncate">{job.customerName}</span>
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewJob(job)}
                    >
                      <Eye className="mr-1 size-3.5" />
                      View Details
                    </Button>

                    {job.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          disabled={isUpdating}
                          onClick={() => updateStatus(job.id, "confirmed")}
                        >
                          {isUpdating ? (
                            <Loader2 className="mr-1 size-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-1 size-3.5" />
                          )}
                          Accept
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isUpdating}
                          className="text-destructive hover:text-destructive"
                          onClick={() => setCancelId(job.id)}
                        >
                          <XCircle className="mr-1 size-3.5" />
                          Decline
                        </Button>
                      </>
                    )}

                    {job.status === "confirmed" && (
                      <Button
                        size="sm"
                        disabled={isUpdating}
                        onClick={() => updateStatus(job.id, "in_progress")}
                      >
                        {isUpdating ? (
                          <Loader2 className="mr-1 size-3.5 animate-spin" />
                        ) : (
                          <PlayCircle className="mr-1 size-3.5" />
                        )}
                        Start Job
                      </Button>
                    )}

                    {job.status === "in_progress" && (
                      <Button
                        size="sm"
                        disabled={isUpdating}
                        onClick={() => updateStatus(job.id, "completed")}
                      >
                        {isUpdating ? (
                          <Loader2 className="mr-1 size-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="mr-1 size-3.5" />
                        )}
                        Complete
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      <Dialog
        open={!!viewJob}
        onOpenChange={(open) => {
          if (!open) setViewJob(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
          </DialogHeader>

          {viewJob && (
            <div className="space-y-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl bg-muted p-4">
                <div>
                  <p className="font-semibold text-foreground">
                    {viewJob.serviceName}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {viewJob.serviceType} · {viewJob.id}
                  </p>
                </div>

                <StatusBadge status={displayStatus(viewJob.status)} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">Customer:</span>
                  <p className="font-medium text-foreground">
                    {viewJob.customerName}
                  </p>
                </div>

                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <p className="font-medium text-foreground">
                    {viewJob.customerPhone}
                  </p>
                </div>

                {viewJob.customerEmail && (
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground">Email:</span>
                    <p className="break-all font-medium text-foreground">
                      {viewJob.customerEmail}
                    </p>
                  </div>
                )}

                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <p className="font-medium text-foreground">
                    {new Date(viewJob.scheduledDate).toLocaleDateString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }
                    )}
                  </p>
                </div>

                <div>
                  <span className="text-muted-foreground">Time:</span>
                  <p className="font-medium text-foreground">
                    {viewJob.scheduledTime}
                  </p>
                </div>

                <div>
                  <span className="text-muted-foreground">Amount:</span>
                  <p className="font-semibold text-foreground">
                    ₹{viewJob.amount.toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-muted-foreground">Address:</span>
                  <p className="mt-1 flex gap-1 font-medium text-foreground">
                    <MapPin className="mt-0.5 size-4 shrink-0" />
                    <span>{viewJob.address}</span>
                  </p>
                </div>
              </div>

              {viewJob.notes && (
                <div className="rounded-lg bg-muted p-3">
                  <span className="text-muted-foreground">Notes:</span>
                  <p className="mt-1 text-foreground">{viewJob.notes}</p>
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
                {viewJob.status === "pending" && (
                  <>
                    <Button
                      variant="outline"
                      disabled={updatingId === viewJob.id}
                      onClick={() => {
                        setCancelId(viewJob.id);
                        setViewJob(null);
                      }}
                    >
                      <XCircle className="mr-1 size-4" />
                      Decline
                    </Button>
                    <Button
                      disabled={updatingId === viewJob.id}
                      onClick={() =>
                        updateStatus(viewJob.id, "confirmed")
                      }
                    >
                      <CheckCircle2 className="mr-1 size-4" />
                      Accept
                    </Button>
                  </>
                )}

                {viewJob.status === "confirmed" && (
                  <Button
                    disabled={updatingId === viewJob.id}
                    onClick={() =>
                      updateStatus(viewJob.id, "in_progress")
                    }
                  >
                    <PlayCircle className="mr-1 size-4" />
                    Start Job
                  </Button>
                )}

                {viewJob.status === "in_progress" && (
                  <Button
                    disabled={updatingId === viewJob.id}
                    onClick={() =>
                      updateStatus(viewJob.id, "completed")
                    }
                  >
                    <CheckCircle2 className="mr-1 size-4" />
                    Complete Job
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!cancelId}
        onOpenChange={(open) => {
          if (!open) setCancelId(null);
        }}
        title="Decline Job"
        description="Are you sure you want to decline this job? This will cancel the booking for this technician."
        onConfirm={handleCancel}
        confirmLabel="Decline"
      />
    </div>
  );
}
