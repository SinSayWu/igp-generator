"use client";

import AdminOverview from "@/components/Dashboard/AdminOverview"
import { useEffect, useState } from "react";
import { CourseCatalogItem } from "@/components/Dashboard/types";

export default function AdminDashboard({ userId }: { userId: string }) {
  const [courseCatalog, setCourseCatalog] = useState<CourseCatalogItem[]>([]);

  useEffect(() => {
    async function fetchCatalog() {
      // We can fetch this via a simple route or keep it empty for now if not needed for the profile view
      // But for consistency, let's just make it a client component that renders AdminOverview
    }
    fetchCatalog();
  }, []);

  return (
    <div className="p-6">
       <AdminOverview userId={userId} courseCatalog={courseCatalog} />
    </div>
  )
}