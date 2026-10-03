import { notFound } from "next/navigation";
import {
  AccountPageBody,
  AccountPageHeader,
} from "@/components/account/AccountPage";
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
    <AccountPageBody>
      <AccountPageHeader
        href="/mi-cuenta/banner"
        section="Portada"
        title="Portada y galería"
        description="La imagen principal que abre tu micrositio y las fotos de la galería."
      />
      <LocalUploadsNotice />
      <BannerPanel
        bannerUrl={bannerUrl}
        plan={boda.plan}
        pictures={boda.pictures.map((p) => ({
          id: p.id,
          url: p.url,
          alt: p.alt,
        }))}
      />
    </AccountPageBody>
  );
}
