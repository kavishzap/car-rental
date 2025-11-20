import { Metadata } from "next";
import { CompanyDetailsForm } from "@/components/company/CompanyDetailsForm";

export const metadata: Metadata = {
  title: "Company Details",
  description: "Manage your company information and rental terms.",
};

export default function CompanyDetailsPage() {
  return (
    <div className="p-6 md:p-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Company Details</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Update the details used across invoices, contracts, and customer documents.
        </p>
      </div>

      <CompanyDetailsForm />
    </div>
  );
}
