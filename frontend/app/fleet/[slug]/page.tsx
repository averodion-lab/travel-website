import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CamperDetail from "@/components/CamperDetail";
import Header from "@/components/Header";
import { api, ApiError, type Camper } from "@/lib/api";
import { PREVIEW_TRAILER } from "@/lib/preview";

async function loadCamper(slug: string): Promise<Camper | null> {
  try {
    return (await api<{ camper: Camper }>(`/api/campers/${encodeURIComponent(slug)}`)).camper;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

/** Pages built ahead of time (all of them in the static preview build). */
export async function generateStaticParams() {
  try {
    const { campers } = await api<{ campers: Camper[] }>("/api/campers");
    if (campers.length) return campers.map((c) => ({ slug: c.slug }));
  } catch {
    // API not running during the build: fall back to the built-in trailer.
  }
  return [{ slug: PREVIEW_TRAILER.slug }];
}

export async function generateMetadata({ params }: PageProps<"/fleet/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const camper = await loadCamper(slug).catch(() => null);
  if (!camper) return { title: "Camper" };
  return { title: camper.name, description: camper.tagline ?? camper.description ?? undefined };
}

async function Detail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const camper = await loadCamper(slug);
  if (!camper) notFound();
  return <CamperDetail camper={camper} />;
}

export default function CamperPage({ params }: PageProps<"/fleet/[slug]">) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-5 pb-28 pt-10 sm:px-8">
        <Suspense fallback={<div className="h-[40rem] animate-pulse bg-sand/60" />}>
          <Detail params={params} />
        </Suspense>
      </main>
    </>
  );
}
