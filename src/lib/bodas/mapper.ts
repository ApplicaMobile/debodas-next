import type {
  Boda,
  BodaCouple,
  BodaEvent,
  BodaGift,
  BodaOptions,
} from "@/types/boda";
import type {
  Boda as BodaRow,
  FaqItem,
  Gift,
  Picture,
  ScheduleItem,
} from "@prisma/client";

type BodaWithRelations = BodaRow & {
  gifts: Gift[];
  pictures: Picture[];
  scheduleItems: ScheduleItem[];
  faqItems: FaqItem[];
};

export function mapBodaFromDb(row: BodaWithRelations): Boda {
  const couple = row.couple as BodaCouple;
  const event = row.event as BodaEvent;
  const banner = row.banner as Record<string, unknown>;
  const options = row.options as BodaOptions;
  const misc = row.misc as Record<string, unknown>;

  const gifts: BodaGift[] = row.gifts
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((gift) => ({
      title: gift.title,
      price: Number(gift.price),
      quantity: gift.quantity,
      ...(gift.imageUrl ? { image: { url: gift.imageUrl } } : {}),
    }));

  const pictures = row.pictures
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((picture) => ({
      url: picture.url,
      alt: picture.alt ?? undefined,
    }));

  const schedule = row.scheduleItems
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({
      time: item.time,
      title: item.title,
      description: item.description ?? undefined,
    }));

  const faq_items = row.faqItems
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({
      question: item.question,
      answer: item.answer,
    }));

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    plan: row.plan,
    microsite_theme: row.micrositeTheme,
    couple,
    event,
    banner,
    options,
    misc,
    gifts_list: {
      ...(row.giftsListTitle ? { title: row.giftsListTitle } : {}),
      gifts,
    },
    pictures,
    schedule,
    faq_items,
    featured_image: row.featuredImageUrl
      ? { url: row.featuredImageUrl }
      : null,
  };
}
