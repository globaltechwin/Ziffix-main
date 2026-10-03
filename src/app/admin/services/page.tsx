"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  DollarSign,
  Loader2,
  MoreHorizontal,
  Pencil,
  Star,
} from "lucide-react";

import { PageHeader } from "@/components/admin/shared/PageHeader";
import { SearchFilter } from "@/components/admin/shared/SearchFilter";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";

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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { toast } from "sonner";

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  duration: number;
  image?: string | null;
  slug?: string | null;
  isActive: boolean;
  rating: number;
  totalBookings: number;
}

const catalogCategories = [
  "Home Cleaning",
  "Bathroom Cleaning",
  "Kitchen Cleaning",
  "Sofa & Carpet Cleaning",
  "AC Service & Repair",
  "Mosquito & Safety Nets",
  "Curtain Care",
  "Solar Panel Cleaning",
  "Fan Cleaning",
  "Exhaust Fan Cleaning",
  "Home Deep Cleaning",
  "Full Home Deep Cleaning",
  "Cleaning Subscriptions",
  "Cleaning",
  "Plumbing",
  "Electrical",
  "HVAC",
  "Laundry",
  "Car Wash",
  "Pest Control",
  "Carpentry",
  "Painting",
  "Landscaping",
  "Appliance Repair",
  "Roofing",
  "Security",
  "Flooring",
  "Inspection",
  "Masonry",
];

const emptyForm = {
  name: "",
  description: "",
  category: "Home Cleaning",
  basePrice: "0",
  duration: "60",
  image: "",
};

export default function AdminServicesPage() {
  const [data, setData] = useState<Service[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editService, setEditService] = useState<Service | null>(null);
  const [priceService, setPriceService] = useState<Service | null>(null);

  const [addOpen, setAddOpen] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [price, setPrice] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchServices = async () => {
      try {
        const response = await fetch("/api/admin/services");

        if (!response.ok) {
          throw new Error("Failed to load services");
        }

        const payload = await response.json();

        if (!cancelled) {
          setData(payload.services || []);
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to load services:", error);

        if (!cancelled) {
          setData([]);
          setLoading(false);
        }
      }
    };

    void fetchServices();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) {
      return data;
    }

    return data.filter(
      (service) =>
        service.name.toLowerCase().includes(q) ||
        service.category.toLowerCase().includes(q) ||
        service.description.toLowerCase().includes(q),
    );
  }, [data, search]);

  const openAdd = () => {
    setForm(emptyForm);
    setAddOpen(true);
  };

  const openEdit = (service: Service) => {
    setForm({
      name: service.name,
      description: service.description,
      category: service.category,
      basePrice: String(service.basePrice),
      duration: String(service.duration),
      image: service.image || "",
    });

    setEditService(service);
  };

  const openPriceEditor = (service: Service) => {
    setPrice(String(service.basePrice > 0 ? service.basePrice : ""));
    setPriceService(service);
  };

  const handleAdd = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const numericPrice = Number(form.basePrice);

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      toast.error("Please enter a price greater than ₹0");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/admin/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          basePrice: numericPrice,
          duration: Number(form.duration),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload.error || "Failed to add service",
        );
      }

      setData((current) => [
        payload.service,
        ...current,
      ]);

      setAddOpen(false);

      toast.success("Service added successfully");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to add service",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!editService) {
      return;
    }

    const numericPrice = Number(form.basePrice);

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      toast.error("Please enter a price greater than ₹0");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/admin/services", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId: editService.id,
          ...form,
          basePrice: numericPrice,
          duration: Number(form.duration),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload.error || "Failed to update service",
        );
      }

      setData((current) =>
        current.map((service) =>
          service.id === editService.id
            ? payload.service
            : service,
        ),
      );

      setEditService(null);

      toast.success("Service updated successfully");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update service",
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePriceUpdate = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!priceService) {
      return;
    }

    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      toast.error("Please enter a price greater than ₹0");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/admin/services", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId: priceService.id,
          basePrice: numericPrice,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload.error || "Failed to update price",
        );
      }

      setData((current) =>
        current.map((service) =>
          service.id === priceService.id
            ? payload.service
            : service,
        ),
      );

      setPriceService(null);

      toast.success(
        `${priceService.name} price updated to ₹${Math.round(
          numericPrice,
        )}`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update price",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (service: Service) => {
    try {
      const response = await fetch("/api/admin/services", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId: service.id,
          isActive: !service.isActive,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload.error || "Failed to update status",
        );
      }

      setData((current) =>
        current.map((entry) =>
          entry.id === service.id
            ? payload.service
            : entry,
        ),
      );

      toast.success(
        service.isActive
          ? "Service deactivated"
          : "Service activated",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update status",
      );
    }
  };

  const formContent = (
    onSubmit: (
      event: React.FormEvent<HTMLFormElement>,
    ) => void,
  ) => (
    <form
      onSubmit={onSubmit}
      className="space-y-4"
    >
      <div>
        <Label>Name</Label>

        <Input
          value={form.name}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              name: event.target.value,
            }))
          }
          required
        />
      </div>

      <div>
        <Label>Category</Label>

        <select
          value={form.category}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              category: event.target.value,
            }))
          }
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {catalogCategories.map((category) => (
            <option
              key={category}
              value={category}
            >
              {category}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label>Description</Label>

        <Textarea
          value={form.description}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Price (₹)</Label>

          <Input
            type="number"
            min="1"
            step="1"
            value={form.basePrice}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                basePrice: event.target.value,
              }))
            }
            placeholder="Example: 799"
            required
          />

          <p className="mt-1 text-xs text-muted-foreground">
            Enter the customer-facing service price.
          </p>
        </div>

        <div>
          <Label>Duration (min)</Label>

          <Input
            type="number"
            min="0"
            value={form.duration}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                duration: event.target.value,
              }))
            }
            required
          />
        </div>
      </div>

      <div>
        <Label>Image URL (optional)</Label>

        <Input
          value={form.image}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              image: event.target.value,
            }))
          }
          placeholder="https://..."
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={saving}
      >
        {saving && (
          <Loader2 className="mr-2 size-4 animate-spin" />
        )}

        {editService
          ? "Save Changes"
          : "Add Service"}
      </Button>
    </form>
  );

  return (
    <div>
      <PageHeader
        title="Services"
        description="Manage your complete service catalog, prices and availability."
        actionLabel="Add Service"
        onAction={openAdd}
      />

      <SearchFilter
        value={search}
        onChange={setSearch}
        placeholder="Search by name, category or description..."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span>
          {data.length} total services
        </span>

        <span>·</span>

        <span>
          {data.filter(
            (service) => service.isActive,
          ).length}{" "}
          active
        </span>

        <span>·</span>

        <span>
          {data.filter(
            (service) => service.basePrice > 0,
          ).length}{" "}
          priced
        </span>

        {data.some(
          (service) => service.basePrice <= 0,
        ) && (
          <>
            <span>·</span>

            <span className="font-medium text-amber-600">
              {
                data.filter(
                  (service) => service.basePrice <= 0,
                ).length
              }{" "}
              need pricing
            </span>
          </>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>

              <TableHead>Category</TableHead>

              <TableHead className="text-right">
                Price
              </TableHead>

              <TableHead className="text-right">
                Duration
              </TableHead>

              <TableHead>
                Rating
              </TableHead>

              <TableHead className="text-right">
                Bookings
              </TableHead>

              <TableHead>
                Status
              </TableHead>

              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-32 text-center"
                >
                  <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  No services found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((service, index) => (
                <motion.tr
                  key={service.id}
                  initial={{
                    opacity: 0,
                    y: 4,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: index * 0.01,
                  }}
                  className="border-b last:border-0"
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {service.name}
                      </p>

                      <p className="max-w-sm truncate text-xs text-muted-foreground">
                        {service.description}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="rounded-full bg-muted px-2 py-1 text-xs">
                      {service.category}
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    {service.basePrice > 0 ? (
                      <button
                        type="button"
                        onClick={() =>
                          openPriceEditor(service)
                        }
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-semibold text-primary transition hover:bg-primary/10"
                        title="Click to change price"
                      >
                        <DollarSign className="size-3.5" />
                        ₹
                        {service.basePrice.toLocaleString(
                          "en-IN",
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          openPriceEditor(service)
                        }
                        className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                        title="Set service price"
                      >
                        Set price
                      </button>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    {service.duration > 0
                      ? `${service.duration} min`
                      : "Varies"}
                  </TableCell>

                  <TableCell>
                    <span className="flex items-center gap-1 text-sm">
                      <Star className="size-3.5 fill-amber-400 text-amber-400" />

                      {service.rating || "New"}
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    {service.totalBookings}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={service.isActive}
                        onCheckedChange={() =>
                          toggleActive(service)
                        }
                      />

                      <StatusBadge
                        status={
                          service.isActive
                            ? "active"
                            : "inactive"
                        }
                      />
                    </div>
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="rounded-md p-1 text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            openPriceEditor(service)
                          }
                        >
                          <DollarSign className="mr-2 size-4" />
                          Set Price
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() =>
                            openEdit(service)
                          }
                        >
                          <Pencil className="mr-2 size-4" />
                          Edit Service
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

      {/* Add Service */}
      <Dialog
        open={addOpen}
        onOpenChange={setAddOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add Service
            </DialogTitle>
          </DialogHeader>

          {formContent(handleAdd)}
        </DialogContent>
      </Dialog>

      {/* Edit Service */}
      <Dialog
        open={!!editService}
        onOpenChange={() =>
          setEditService(null)
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit Service
            </DialogTitle>
          </DialogHeader>

          {formContent(handleEdit)}
        </DialogContent>
      </Dialog>

      {/* Set Price */}
      <Dialog
        open={!!priceService}
        onOpenChange={() =>
          setPriceService(null)
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Set Service Price
            </DialogTitle>
          </DialogHeader>

          {priceService && (
            <form
              onSubmit={handlePriceUpdate}
              className="space-y-5"
            >
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">
                  Service
                </p>

                <p className="mt-1 text-lg font-semibold">
                  {priceService.name}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {priceService.category}
                </p>
              </div>

              <div>
                <Label htmlFor="service-price">
                  Service Price (₹)
                </Label>

                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-muted-foreground">
                    ₹
                  </span>

                  <Input
                    id="service-price"
                    type="number"
                    min="1"
                    step="1"
                    value={price}
                    onChange={(event) =>
                      setPrice(event.target.value)
                    }
                    className="pl-8 text-lg font-semibold"
                    placeholder="799"
                    autoFocus
                    required
                  />
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  This price will be displayed to customers
                  throughout the service catalog.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() =>
                    setPriceService(null)
                  }
                  disabled={saving}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  className="flex-1"
                  disabled={
                    saving ||
                    !price ||
                    Number(price) <= 0
                  }
                >
                  {saving && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}

                  Save Price
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}