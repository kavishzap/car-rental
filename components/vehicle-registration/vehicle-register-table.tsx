"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Save, X } from "lucide-react";
import type { VehicleRegister } from "@/lib/types";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Swal from "sweetalert2";

type VehicleRegisterTableProps = {
  vehicles: VehicleRegister[];
  loading: boolean;
  onSave: (vehicle: VehicleRegister) => Promise<void>;
  onDelete: (vehicle: VehicleRegister) => Promise<void>;
};

type EditableVehicle = VehicleRegister & {
  isNew?: boolean;
  isEditing?: boolean;
};

const parseDateOnly = (dateStr: string | null | undefined): Date | undefined => {
  if (!dateStr) return undefined;
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (isNaN(date.getTime())) return undefined;
  return date;
};

export function VehicleRegisterTable({
  vehicles,
  loading,
  onSave,
  onDelete,
}: VehicleRegisterTableProps) {
  const [editableVehicles, setEditableVehicles] = useState<EditableVehicle[]>([]);
  const [editingCell, setEditingCell] = useState<{
    rowId: string;
    field: keyof VehicleRegister;
  } | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  useEffect(() => {
    setEditableVehicles(
      vehicles.map((v) => ({
        ...v,
        isEditing: false,
      }))
    );
  }, [vehicles]);

  const handleAddRow = () => {
    const newVehicle: EditableVehicle = {
      id: `new-${Date.now()}`,
      plateNo: "",
      vehicleName: null,
      model: null,
      color: null,
      psvLicenseNo: null,
      psvExpiry: null,
      fitnessExpiry: null,
      discNo: null,
      mvlExpiry: null,
      insurancePolicyNo: null,
      insuranceStartDate: null,
      insuranceEndDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isNew: true,
      isEditing: true,
    };
    setEditableVehicles([newVehicle, ...editableVehicles]);
    setEditingCell({ rowId: newVehicle.id, field: "plateNo" });
  };

  const handleCellClick = (rowId: string, field: keyof VehicleRegister) => {
    setEditingCell({ rowId, field });
    const vehicle = editableVehicles.find((v) => v.id === rowId);
    if (vehicle) {
      setEditValues({
        ...editValues,
        [`${rowId}-${field}`]: vehicle[field]?.toString() || "",
      });
    }
  };

  const handleCellChange = (rowId: string, field: keyof VehicleRegister, value: string) => {
    setEditValues({
      ...editValues,
      [`${rowId}-${field}`]: value,
    });
  };

  const handleCellBlur = async (rowId: string, field: keyof VehicleRegister) => {
    const key = `${rowId}-${field}`;
    const value = editValues[key] || "";
    
    const updatedVehicles = editableVehicles.map((v) => {
      if (v.id === rowId) {
        return {
          ...v,
          [field]: value.trim() || null,
        };
      }
      return v;
    });
    
    const updatedVehicle = updatedVehicles.find(v => v.id === rowId);
    
    if (updatedVehicle) {
      setEditableVehicles(updatedVehicles);
      
      // Auto-save if it's not a new row
      if (!updatedVehicle.isNew) {
        try {
          await onSave(updatedVehicle);
        } catch (err) {
          // Error handled in parent
        }
      }
    }
    
    setEditingCell(null);
  };

  const handleSaveRow = async (vehicle: EditableVehicle) => {
    try {
      await onSave(vehicle);
    } catch (err) {
      // Error handling is done in parent
    }
  };

  const handleDeleteRow = async (vehicle: EditableVehicle) => {
    if (vehicle.isNew) {
      setEditableVehicles(editableVehicles.filter((v) => v.id !== vehicle.id));
      return;
    }

    const res = await Swal.fire({
      title: "Delete vehicle registration?",
      html: `This will permanently remove <b>${vehicle.plateNo}</b>.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
      reverseButtons: true,
      focusCancel: true,
    });

    if (res.isConfirmed) {
      try {
        await onDelete(vehicle);
      } catch (err) {
        // Error handling is done in parent
      }
    }
  };

  const handleDateSelect = async (
    rowId: string,
    field: "psvExpiry" | "fitnessExpiry" | "mvlExpiry" | "insuranceStartDate" | "insuranceEndDate",
    date: Date | undefined
  ) => {
    const value = date ? format(date, "yyyy-MM-dd") : "";
    handleCellChange(rowId, field, value);
    
    const updatedVehicles = editableVehicles.map((v) => {
      if (v.id === rowId) {
        return {
          ...v,
          [field]: value || null,
        };
      }
      return v;
    });
    
    setEditableVehicles(updatedVehicles);
    setEditingCell(null);
    
    // Auto-save if it's not a new row
    const updatedVehicle = updatedVehicles.find(v => v.id === rowId);
    if (updatedVehicle && !updatedVehicle.isNew) {
      try {
        await onSave(updatedVehicle);
      } catch (err) {
        // Error handled in parent
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed ml-5 mr-5">
        <div className="text-center">
          <p className="text-lg font-medium">Loading vehicle registrations…</p>
        </div>
      </div>
    );
  }

  const columns: Array<{
    key: keyof VehicleRegister;
    label: string;
    width?: string;
    isDate?: boolean;
  }> = [
    { key: "plateNo", label: "Plate #", width: "120px" },
    { key: "vehicleName", label: "Name", width: "120px" },
    { key: "model", label: "Model", width: "120px" },
    { key: "color", label: "Color", width: "100px" },
    { key: "psvLicenseNo", label: "PSV License #", width: "130px" },
    { key: "psvExpiry", label: "PSV Exp.", width: "120px", isDate: true },
    { key: "fitnessExpiry", label: "Fitness Exp.", width: "120px", isDate: true },
    { key: "discNo", label: "Disc #", width: "100px" },
    { key: "mvlExpiry", label: "MVL Exp.", width: "120px", isDate: true },
    { key: "insurancePolicyNo", label: "No. Police d'Assurance", width: "180px" },
    { key: "insuranceStartDate", label: "Start Date", width: "120px", isDate: true },
    { key: "insuranceEndDate", label: "End Date", width: "120px", isDate: true },
  ];

  return (
    <div className="rounded-lg border mx-2 sm:mx-5 overflow-x-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 border-b">
        <h2 className="text-lg font-semibold">Vehicle Registrations</h2>
        <Button onClick={handleAddRow} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Row
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} style={{ width: col.width, minWidth: col.width }}>
                {col.label}
              </TableHead>
            ))}
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {editableVehicles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + 1} className="text-center py-8 text-muted-foreground">
                No vehicle registrations. Click "Add Row" to add one.
              </TableCell>
            </TableRow>
          ) : (
            editableVehicles.map((vehicle) => {
              const isEditing = editingCell?.rowId === vehicle.id;
              const currentField = editingCell?.field;

              return (
                <TableRow key={vehicle.id} className={vehicle.isNew ? "bg-muted/30" : ""}>
                  {columns.map((col) => {
                    const value = vehicle[col.key]?.toString() || "";
                    const cellKey = `${vehicle.id}-${col.key}`;
                    const isEditingThisCell = isEditing && currentField === col.key;
                    const editValue = editValues[cellKey] ?? value;

                    if (col.isDate) {
                      const dateValue = parseDateOnly(vehicle[col.key] as string | null);
                      return (
                        <TableCell
                          key={col.key}
                          className="p-1"
                          onClick={() => handleCellClick(vehicle.id, col.key)}
                        >
                          {isEditingThisCell ? (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full h-8 justify-start text-left font-normal",
                                    !dateValue && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-3 w-3" />
                                  {dateValue ? format(dateValue, "PPP") : "Pick date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={dateValue}
                                  onSelect={(date) =>
                                    handleDateSelect(
                                      vehicle.id,
                                      col.key as any,
                                      date
                                    )
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          ) : (
                            <div className="px-2 py-1 min-h-[32px] flex items-center cursor-pointer hover:bg-muted rounded">
                              {dateValue ? format(dateValue, "PPP") : ""}
                            </div>
                          )}
                        </TableCell>
                      );
                    }

                    return (
                      <TableCell
                        key={col.key}
                        className="p-1"
                        onClick={() => !isEditingThisCell && handleCellClick(vehicle.id, col.key)}
                      >
                        {isEditingThisCell ? (
                          <Input
                            value={editValue}
                            onChange={(e) => handleCellChange(vehicle.id, col.key, e.target.value)}
                            onBlur={() => handleCellBlur(vehicle.id, col.key)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleCellBlur(vehicle.id, col.key);
                              }
                              if (e.key === "Escape") {
                                setEditingCell(null);
                              }
                            }}
                            className="h-8"
                            autoFocus
                          />
                        ) : (
                          <div className="px-2 py-1 min-h-[32px] flex items-center cursor-pointer hover:bg-muted rounded">
                            {value}
                          </div>
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell className="p-1">
                    <div className="flex items-center gap-1">
                      {vehicle.isNew && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={async () => {
                            try {
                              await handleSaveRow(vehicle);
                            } catch (err) {
                              // Error handled in parent
                            }
                          }}
                          title="Save new row"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteRow(vehicle)}
                        title="Delete row"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

