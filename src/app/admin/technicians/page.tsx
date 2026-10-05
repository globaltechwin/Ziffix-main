"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Star,
  Briefcase,
  CalendarDays,
  Trash2,
} from "lucide-react";

import { PageHeader } from "@/components/admin/shared/PageHeader";
import { SearchFilter } from "@/components/admin/shared/SearchFilter";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { toast } from "sonner";

type Technician = {
  id: string;
  phone: string;
  name: string;
  role: string;
  createdAt: string;
  technicianProfile: {
    specialties: string[];
    rating: number;
    totalJobs: number;
    status: string;
    certifications: string[];
    availability: {
      dayOfWeek: number;
      isAvailable: boolean;
      startTime: string | null;
      endTime: string | null;
    }[];
  } | null;
};

type Booking = {
  id: string;
  status: string;
  service: {
    name: string;
  };
  customer?: {
    name: string | null;
  };
  technician?: {
    name: string | null;
  } | null;
};

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function AdminTechniciansPage() {
  const [data, setData] = useState<Technician[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [view, setView] = useState<Technician | null>(null);
  const [edit, setEdit] = useState<Technician | null>(null);
  const [add, setAdd] = useState(false);
  const [assign, setAssign] = useState<Technician | null>(null);

  const [selectedBooking, setSelectedBooking] = useState("");

  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);

    try {
      const [techniciansResponse, bookingsResponse] = await Promise.all([
        fetch("/api/admin/technicians", {
          cache: "no-store",
        }),
        fetch("/api/admin/bookings", {
          cache: "no-store",
        }),
      ]);

      const techniciansData = await techniciansResponse.json();
      const bookingsData = await bookingsResponse.json();

      if (!techniciansResponse.ok) {
        throw new Error(
          techniciansData.error || "Failed to load technicians"
        );
      }

      setData(techniciansData.technicians || []);
      setBookings(bookingsData.bookings || []);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load technicians"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const getSpecialties = (technician: Technician) => {
    return technician.technicianProfile?.specialties || [];
  };

  const getStatus = (technician: Technician) => {
    return technician.technicianProfile?.status || "offline";
  };

  const filtered = data.filter((technician) => {
    const query = search.toLowerCase();

    const matchesSearch =
      technician.name.toLowerCase().includes(query) ||
      getSpecialties(technician).some((specialty) =>
        specialty.toLowerCase().includes(query)
      );

    const matchesStatus =
      statusFilter === "all" ||
      getStatus(technician) === statusFilter;

    return matchesSearch && matchesStatus;
  });

  /**
   * CREATE TECHNICIAN
   */
  const addTech = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    console.log("ADD TECHNICIAN FORM SUBMITTED");

    setSaving(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get("name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const password = String(formData.get("password") || "");
    const specialtiesText = String(
      formData.get("specialties") || ""
    ).trim();

    if (!name) {
      toast.error("Please enter technician name");
      setSaving(false);
      return;
    }

    if (!phone) {
      toast.error("Please enter technician phone number");
      setSaving(false);
      return;
    }

    if (!password) {
      toast.error("Please enter technician password");
      setSaving(false);
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      setSaving(false);
      return;
    }

    if (!specialtiesText) {
      toast.error("Please enter at least one specialty");
      setSaving(false);
      return;
    }

    const specialties = specialtiesText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      console.log("Creating technician:", {
        name,
        phone,
        specialties,
      });

      const response = await fetch("/api/admin/technicians", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          password,
          specialties,
        }),
      });

      const result = await response.json().catch(() => ({}));

      console.log("Create technician response:", {
        status: response.status,
        result,
      });

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to create technician"
        );
      }

      toast.success("Technician created successfully");

      form.reset();
      setAdd(false);

      await load();
    } catch (error) {
      console.error("Create technician error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create technician"
      );
    } finally {
      setSaving(false);
    }
  };

  /**
   * EDIT TECHNICIAN
   */
  const editTech = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!edit) {
      return;
    }

    setSaving(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get("name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();

    const specialtiesText = String(
      formData.get("specialties") || ""
    ).trim();

    const specialties = specialtiesText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      const response = await fetch("/api/admin/technicians", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: edit.id,
          name,
          phone,
          specialties,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to update technician"
        );
      }

      toast.success("Technician updated successfully");

      setEdit(null);

      await load();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update technician"
      );
    } finally {
      setSaving(false);
    }
  };

  /**
   * CHANGE TECHNICIAN STATUS
   */
  const changeStatus = async (
    technician: Technician,
    status: string
  ) => {
    try {
      const response = await fetch("/api/admin/technicians", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: technician.id,
          status,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to update technician status"
        );
      }

      toast.success(`${technician.name} is ${status}`);

      await load();

      if (view?.id === technician.id) {
        setView(null);
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update technician status"
      );
    }
  };

  /**
   * DELETE TECHNICIAN
   */
  const handleDelete = async () => {
    if (!deleteId) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(
        "/api/admin/technicians",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: deleteId,
          }),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to delete technician"
        );
      }

      setData((previous) =>
        previous.filter(
          (technician) => technician.id !== deleteId
        )
      );

      if (view?.id === deleteId) {
        setView(null);
      }

      setDeleteId(null);

      toast.success("Technician deleted successfully");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete technician"
      );
    } finally {
      setDeleting(false);
    }
  };

  /**
   * ASSIGN JOB
   */
  const assignJob = async () => {
    if (!assign || !selectedBooking) {
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        "/api/admin/bookings",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookingId: selectedBooking,
            technicianId: assign.id,
            status: "confirmed",
          }),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to assign job"
        );
      }

      setAssign(null);
      setSelectedBooking("");

      toast.success(
        `Job assigned to ${assign.name}`
      );

      await load();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to assign job"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Technicians"
          description="Manage your technician workforce"
          actionLabel="Add Technician"
          onAction={() => setAdd(true)}
        />

        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  const pending = bookings.filter(
    (booking) =>
      ["pending", "confirmed"].includes(booking.status) &&
      !booking.technician
  );

  return (
    <div>
      <PageHeader
        title="Technicians"
        description="Manage your technician workforce"
        actionLabel="Add Technician"
        onAction={() => setAdd(true)}
      />

      {/* SEARCH + FILTER */}
      <div className="mb-4 flex gap-3">
        <div className="flex-1">
          <SearchFilter
            value={search}
            onChange={setSearch}
            placeholder="Search by name or specialty..."
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) =>
            value && setStatusFilter(value)
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">
              All Status
            </SelectItem>

            <SelectItem value="available">
              Available
            </SelectItem>

            <SelectItem value="busy">
              Busy
            </SelectItem>

            <SelectItem value="offline">
              Offline
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* TECHNICIAN TABLE */}
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Specialties</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="text-right">
                Jobs
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No technicians found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((technician, index) => (
                <motion.tr
                  key={technician.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    delay: index * 0.02,
                  }}
                >
                  <TableCell className="font-medium">
                    {technician.name}
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {getSpecialties(technician)
                        .slice(0, 2)
                        .map((specialty) => (
                          <span
                            key={specialty}
                            className="rounded-full bg-muted px-2 py-0.5 text-xs"
                          >
                            {specialty}
                          </span>
                        ))}
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="flex items-center gap-1">
                      <Star className="size-3.5 fill-amber-400 text-amber-400" />

                      {technician.technicianProfile?.rating ??
                        0}
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    {technician.technicianProfile
                      ?.totalJobs ?? 0}
                  </TableCell>

                  <TableCell>
                    <StatusBadge
                      status={getStatus(technician)}
                    />
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="rounded-md p-1 text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            setView(technician)
                          }
                        >
                          <Eye className="mr-2 size-4" />
                          View Profile
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() =>
                            setEdit(technician)
                          }
                        >
                          <Pencil className="mr-2 size-4" />
                          Edit
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() =>
                            setAssign(technician)
                          }
                        >
                          <Briefcase className="mr-2 size-4" />
                          Assign Job
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() =>
                            setDeleteId(technician.id)
                          }
                        >
                          <Trash2 className="mr-2 size-4" />
                          Delete Technician
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* VIEW PROFILE */}
      <Dialog
        open={!!view}
        onOpenChange={() => setView(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Technician Profile
            </DialogTitle>
          </DialogHeader>

          {view && (
            <div className="space-y-5 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground">
                    Name:
                  </span>{" "}
                  {view.name}
                </div>

                <div>
                  <span className="text-muted-foreground">
                    Phone:
                  </span>{" "}
                  {view.phone}
                </div>

                <div>
                  <span className="text-muted-foreground">
                    Rating:
                  </span>{" "}
                  {view.technicianProfile?.rating ?? 0}
                </div>

                <div>
                  <span className="text-muted-foreground">
                    Jobs:
                  </span>{" "}
                  {view.technicianProfile?.totalJobs ??
                    0}
                </div>

                <div>
                  <span className="text-muted-foreground">
                    Status:
                  </span>{" "}
                  <StatusBadge
                    status={getStatus(view)}
                  />
                </div>
              </div>

              {/* STATUS */}
              <div>
                <p className="mb-2 font-medium">
                  Change Status
                </p>

                <div className="flex flex-wrap gap-2">
                  {[
                    "available",
                    "busy",
                    "offline",
                  ].map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={
                        getStatus(view) === status
                          ? "default"
                          : "outline"
                      }
                      onClick={() =>
                        void changeStatus(
                          view,
                          status
                        )
                      }
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>

              {/* WEEKLY SCHEDULE */}
              <div>
                <p className="mb-2 flex items-center gap-2 font-medium">
                  <CalendarDays className="size-4" />
                  Weekly Schedule
                </p>

                <div className="space-y-1">
                  {days.map((day, index) => {
                    const availability =
                      view.technicianProfile?.availability.find(
                        (item) =>
                          item.dayOfWeek === index
                      );

                    return (
                      <div
                        key={day}
                        className="flex justify-between rounded-md border px-3 py-2"
                      >
                        <span>{day}</span>

                        <span className="text-muted-foreground">
                          {availability?.isAvailable
                            ? `${availability.startTime} - ${availability.endTime}`
                            : "Day off"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ADD TECHNICIAN */}
      <Dialog
        open={add}
        onOpenChange={setAdd}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add Technician
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={addTech}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="technician-name">
                Name
              </Label>

              <Input
                id="technician-name"
                name="name"
                required
                autoComplete="off"
                placeholder="Technician name"
              />
            </div>

            <div>
              <Label htmlFor="technician-phone">
                Phone
              </Label>

              <Input
                id="technician-phone"
                name="phone"
                required
                autoComplete="off"
                placeholder="Phone number"
              />
            </div>

            <div>
              <Label htmlFor="technician-password">
                Password
              </Label>

              <Input
                id="technician-password"
                name="password"
                type="password"
                minLength={6}
                required
                autoComplete="new-password"
                placeholder="Minimum 6 characters"
              />
            </div>

            <div>
              <Label htmlFor="technician-specialties">
                Specialties
              </Label>

              <Input
                id="technician-specialties"
                name="specialties"
                required
                autoComplete="off"
                placeholder="Home Cleaning, AC Service"
              />

              <p className="mt-1 text-xs text-muted-foreground">
                Separate multiple specialties with commas.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={saving}
            >
              {saving
                ? "Creating..."
                : "Create Technician"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT TECHNICIAN */}
      <Dialog
        open={!!edit}
        onOpenChange={() => setEdit(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit Technician
            </DialogTitle>
          </DialogHeader>

          {edit && (
            <form
              onSubmit={editTech}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="edit-technician-name">
                  Name
                </Label>

                <Input
                  id="edit-technician-name"
                  name="name"
                  defaultValue={edit.name}
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-technician-phone">
                  Phone
                </Label>

                <Input
                  id="edit-technician-phone"
                  name="phone"
                  defaultValue={edit.phone}
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-technician-specialties">
                  Specialties
                </Label>

                <Input
                  id="edit-technician-specialties"
                  name="specialties"
                  defaultValue={getSpecialties(
                    edit
                  ).join(", ")}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ASSIGN JOB */}
      <Dialog
        open={!!assign}
        onOpenChange={() => {
          setAssign(null);
          setSelectedBooking("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Assign Job
            </DialogTitle>
          </DialogHeader>

          {assign && (
            <div className="space-y-4">
              <div className="rounded-lg border p-3">
                <p className="font-medium">
                  {assign.name}
                </p>

                <p className="text-sm text-muted-foreground">
                  {getSpecialties(assign).join(", ")}
                </p>
              </div>

              <Select
                value={selectedBooking}
                onValueChange={(value) =>
                  setSelectedBooking(value ?? "")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an unassigned booking" />
                </SelectTrigger>

                <SelectContent>
                  {pending.length === 0 ? (
                    <SelectItem
                      value="none"
                      disabled
                    >
                      No unassigned bookings
                    </SelectItem>
                  ) : (
                    pending.map((booking) => (
                      <SelectItem
                        key={booking.id}
                        value={booking.id}
                      >
                        {booking.id} -{" "}
                        {booking.service?.name} -{" "}
                        {booking.customer?.name ||
                          "Customer"}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              <Button
                type="button"
                className="w-full"
                disabled={
                  !selectedBooking ||
                  selectedBooking === "none" ||
                  saving
                }
                onClick={() => void assignJob()}
              >
                {saving
                  ? "Assigning..."
                  : "Assign Job"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setDeleteId(null);
          }
        }}
        title="Delete Technician"
        description="Are you sure you want to delete this technician? Existing bookings will be kept, but this technician will be unassigned from them. This action cannot be undone."
        onConfirm={handleDelete}
        confirmLabel={
          deleting
            ? "Deleting..."
            : "Delete Technician"
        }
      />
    </div>
  );
}
