import type { Metadata } from "next";
import { DoctorsPageClient } from "./DoctorsPageClient";
import { buildMetadata } from "@/lib/seo";
import { fetchDoctorsFromBackend, publicDoctor, selectDisplayDoctors } from "@/lib/courses";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Mentors",
  description:
    "Meet the senior ophthalmologists who lead Legends of Medicine cohorts — pioneers in cataract, retina, glaucoma, cornea, paediatric and refractive surgery.",
  alternates: { canonical: "/legends" },
});

export default async function DoctorsIndexPage() {
  // Featured Legends first (the admin's "Featured" switch), same rule as the home page.
  const doctors = selectDisplayDoctors(await fetchDoctorsFromBackend());
  // Without the Legends' private contact fields: the page never shows them.
  return <DoctorsPageClient doctors={doctors.map(publicDoctor)} />;
}
