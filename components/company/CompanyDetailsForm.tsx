"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  getCompanyDetails,
  updateCompanyDetails,
  createCompanyDetails,
} from "@/lib/services/company";
import { ImageIcon, Upload, Trash2 } from "lucide-react";

export function CompanyDetailsForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    brn: "",
    whatsapp_num: "",
    tel: "",
    terms: "",
    logo: "", // Base64 or data URL
  });

  // Helper: build a usable src for <img />
  const logoSrc =
    form.logo && form.logo.length > 0
      ? form.logo.startsWith("data:") || form.logo.startsWith("http")
        ? form.logo
        : `data:image/png;base64,${form.logo}` // handle raw base64 from DB
      : "";

  // Load existing data on mount
  useEffect(() => {
    async function load() {
      const res = await getCompanyDetails();
      if (res) {
        setForm({
          name: res.name,
          email: res.email,
          brn: res.brn,
          whatsapp_num: res.whatsapp_num || "",
          tel: res.tel || "",
          terms: res.terms || "",
          logo: res.logo || "", // make sure your API returns `logo`
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      // This will be a data URL: data:image/png;base64,...
      setForm((prev) => ({
        ...prev,
        logo: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleClearLogo = () => {
    setForm((prev) => ({ ...prev, logo: "" }));
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const existing = await getCompanyDetails();

      if (existing) {
        await updateCompanyDetails(existing.id, form);
      } else {
        await createCompanyDetails(form);
      }

      toast({
        title: "Saved",
        description: "Company details have been updated successfully.",
      });
    } catch (e: any) {
      toast({
        title: "Save failed",
        description: e?.message ?? "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[200px] text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Company Details</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* LOGO SECTION */}
        <div className="space-y-3">
          <Label>Company Logo</Label>

          <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-4 items-center">
            {/* Preview */}
            <div className="flex flex-col items-center gap-2">
              <div className="h-24 w-24 rounded-full border bg-muted flex items-center justify-center overflow-hidden">
                {logoSrc ? (
                  <img
                    src={logoSrc}
                    alt="Company Logo"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>

              {logoSrc && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearLogo}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              )}
            </div>

            {/* Upload control */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    document.getElementById("company-logo-input")?.click()
                  }
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Logo
                </Button>
                <span className="text-xs text-muted-foreground">
                  PNG / JPG, max ~2MB
                </span>
              </div>

              <Input
                id="company-logo-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
          </div>
        </div>

        {/* OTHER FIELDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* NAME */}
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          {/* EMAIL */}
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          {/* BRN */}
          <div className="space-y-2">
            <Label>BRN</Label>
            <Input
              value={form.brn}
              onChange={(e) => setForm({ ...form, brn: e.target.value })}
              required
            />
          </div>

          {/* WhatsApp Number */}
          <div className="space-y-2">
            <Label>WhatsApp Number</Label>
            <Input
              placeholder="+230 5xxxxxxx"
              value={form.whatsapp_num}
              onChange={(e) =>
                setForm({ ...form, whatsapp_num: e.target.value })
              }
            />
          </div>

          {/* Telephone */}
          <div className="space-y-2">
            <Label>Telephone</Label>
            <Input
              placeholder="e.g. 211xxxx"
              value={form.tel}
              onChange={(e) => setForm({ ...form, tel: e.target.value })}
            />
          </div>

          {/* Terms & Conditions */}
          <div className="space-y-2 md:col-span-2">
            <Label>Terms & Conditions</Label>
            <Textarea
              rows={6}
              value={form.terms}
              onChange={(e) => setForm({ ...form, terms: e.target.value })}
            />
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div className="pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
