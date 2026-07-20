import { notFound } from "next/navigation";
import { BannerPanel } from "@/components/account/BannerPanel";
import { LocalUploadsNotice } from "@/components/account/LocalUploadsNotice";
import { getOwnedBoda } from "@/lib/account/require-boda";

export default async function MiCuentaBannerPage() {
  const boda = await getOwnedBoda();
  if (!boda) {
    notFound();
  }

  const banner = boda.banner as { image?: { url?: string } } | null;
  const bannerUrl = banner?.image?.url ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-xl font-semibold sm:text-2xl text-stone-800">
          Banner y galería
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          Imagen principal del encabezado y fotos de la galería.
        </p>
      </div>
      <LocalUploadsNotice />
      <BannerPanel
        bannerUrl={bannerUrl}
        featuredUrl={boda.featuredImageUrl ?? ""}
        pictures={boda.pictures.map((p) => ({
          id: p.id,
          url: p.url,
          alt: p.alt,
        }))}
      />
    </div>
  );
}
