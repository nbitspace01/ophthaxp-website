import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fetchAllDoctorsFromBackend,
  fetchCoursesFromBackend,
  fetchDoctorsFromBackend,
  publicDoctor,
  publicProgram,
  selectDisplayDoctors,
} from "@/lib/courses";
import { buildMetadata, SITE_NAME, SITE_URL, jsonLdHtml } from "@/lib/seo";
import { LEGAL } from "@/lib/legal";
import { DoctorDetailClient } from "./DoctorDetailClient";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const doctors = await fetchDoctorsFromBackend();
  return doctors.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const doctors = await fetchAllDoctorsFromBackend();
  const d = doctors.find((x) => x.slug === params.slug);
  if (!d) return buildMetadata({ title: "Mentor not found" });

  const descSnippet = ((d.description ?? d.bio) || "").slice(0, 200);
  const ogImage = d.doctorImage ?? d.imageUrl;
  const pageUrl = `${SITE_URL}/legends/${d.slug}`;

  const base = buildMetadata({
    title: `${d.name} — ${d.title}`,
    description: descSnippet,
    alternates: { canonical: `/legends/${d.slug}` },
  });

  return {
    ...base,
    openGraph: {
      type: "profile",
      url: pageUrl,
      siteName: SITE_NAME,
      title: `${d.name} — ${d.title} · Legends of Medicine`,
      description: descSnippet,
      locale: "en_IN",
      images: ogImage
        ? [{ url: ogImage, width: 1200, height: 630, alt: d.name }]
        : [{ url: "/og.jpg", width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${d.name} — ${d.title} · Legends of Medicine`,
      description: descSnippet,
      images: ogImage ? [ogImage] : ["/og.jpg"],
    },
  };
}

export default async function DoctorDetailPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { specialty?: string };
}) {
  // Looked up in the unfiltered list so a Legend switched off the index is
  // still reachable by the link someone already has, but only active Legends
  // are offered as somewhere to go next.
  const doctors = await fetchAllDoctorsFromBackend();
  const d = doctors.find((x) => x.slug === params.slug);
  if (!d) notFound();
  const others = selectDisplayDoctors(doctors.filter((x) => x.id !== d.id));
  // The Legend's own programmes, matched the same way the home rail does:
  // the course row points at the doctor by slug or by row id.
  const programs = (await fetchCoursesFromBackend()).filter(
    (p) => p.doctorSlug && (String(p.doctorSlug) === d.slug || String(p.doctorSlug) === String(d.id)),
  );

  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: d.name,
    jobTitle: d.title,
    description: d.bio,
    image: d.imageUrl,
    url: `${SITE_URL}/legends/${d.slug}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: d.city,
      addressCountry: "IN",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(personLd) }}
      />
      <DoctorDetailClient
        doctor={publicDoctor(d)}
        otherDoctors={others.map(publicDoctor)}
        programs={programs.map(publicProgram)}
        fromSpecialty={searchParams?.specialty}
        supportEmail={LEGAL.supportEmail}
      />
    </>
  );
}
