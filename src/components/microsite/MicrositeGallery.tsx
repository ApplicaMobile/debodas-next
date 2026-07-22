"use client";

import { useCallback, useEffect, useId, useState } from "react";

export interface GalleryPicture {
  url: string;
  alt?: string;
}

interface MicrositeGalleryProps {
  pictures: GalleryPicture[];
  titleClass?: string;
}

export function MicrositeGallery({
  pictures,
  titleClass,
}: MicrositeGalleryProps) {
  const titleId = useId();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const close = useCallback(() => setActiveIndex(null), []);

  const showPrev = useCallback(() => {
    setActiveIndex((current) => {
      if (current === null || pictures.length === 0) return current;
      return (current - 1 + pictures.length) % pictures.length;
    });
  }, [pictures.length]);

  const showNext = useCallback(() => {
    setActiveIndex((current) => {
      if (current === null || pictures.length === 0) return current;
      return (current + 1) % pictures.length;
    });
  }, [pictures.length]);

  useEffect(() => {
    if (activeIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") showPrev();
      if (event.key === "ArrowRight") showNext();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, close, showNext, showPrev]);

  if (pictures.length === 0) return null;

  const active = activeIndex !== null ? pictures[activeIndex] : null;

  return (
    <div className="mx-auto max-w-5xl px-6">
      <h2 id={titleId} className={titleClass ?? "microsite-section__title theme-heading"}>
        Fotos
      </h2>
      <div className="microsite-gallery mt-10" role="list" aria-labelledby={titleId}>
        {pictures.map((picture, index) => (
          <button
            key={`${picture.url}-${index}`}
            type="button"
            role="listitem"
            className="microsite-gallery__item"
            onClick={() => setActiveIndex(index)}
            aria-label={`Ver foto ${index + 1} de ${pictures.length}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={picture.url}
              alt={picture.alt || `Foto ${index + 1} de la boda`}
              loading="lazy"
              className="microsite-gallery__thumb"
            />
          </button>
        ))}
      </div>

      {active && activeIndex !== null ? (
        <div
          className="microsite-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Galería de fotos"
          onClick={close}
        >
          <button
            type="button"
            className="microsite-lightbox__close"
            onClick={close}
            aria-label="Cerrar"
          >
            ×
          </button>
          {pictures.length > 1 ? (
            <>
              <button
                type="button"
                className="microsite-lightbox__nav microsite-lightbox__nav--prev"
                onClick={(event) => {
                  event.stopPropagation();
                  showPrev();
                }}
                aria-label="Foto anterior"
              >
                ‹
              </button>
              <button
                type="button"
                className="microsite-lightbox__nav microsite-lightbox__nav--next"
                onClick={(event) => {
                  event.stopPropagation();
                  showNext();
                }}
                aria-label="Foto siguiente"
              >
                ›
              </button>
            </>
          ) : null}
          <figure
            className="microsite-lightbox__figure"
            onClick={(event) => event.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.url}
              alt={active.alt || `Foto ${activeIndex + 1} de la boda`}
              className="microsite-lightbox__image"
            />
            <figcaption className="microsite-lightbox__caption">
              {activeIndex + 1} / {pictures.length}
            </figcaption>
          </figure>
        </div>
      ) : null}
    </div>
  );
}
