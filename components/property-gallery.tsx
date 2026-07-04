"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, Expand } from "lucide-react";

type PropertyGalleryProps = {
  images: string[];
  title: string;
};

export function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const gallery = images.length ? images : ["/placeholder-property.svg"];
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => (i + delta + gallery.length) % gallery.length);
    },
    [gallery.length]
  );

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowLeft") go(1);
      if (e.key === "ArrowRight") go(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, go]);

  return (
    <>
      <div className="space-y-3">
        <div
          className="radius-photo group relative aspect-[16/10] overflow-hidden border border-line bg-canvas shadow-sm touch-pan-y"
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current == null || gallery.length < 2) return;
            const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
            if (Math.abs(dx) > 40) go(dx > 0 ? -1 : 1);
            touchStartX.current = null;
          }}
        >
          <Image
            key={gallery[index]}
            src={gallery[index]}
            alt={`${title} — تصویر ${index + 1}`}
            fill
            className="animate-fade-in-fast object-cover"
            sizes="(max-width: 1024px) 100vw, 70vw"
            priority
          />
          {gallery.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition group-hover:opacity-100 md:opacity-100"
                aria-label="تصویر قبلی"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition group-hover:opacity-100 md:opacity-100"
                aria-label="تصویر بعدی"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setLightbox(true)}
            className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-lg bg-black/55 px-3 py-1.5 text-xs text-white backdrop-blur-sm"
          >
            <Expand className="h-4 w-4" />
            نمایش بزرگ
          </button>
          <span className="absolute bottom-3 right-3 rounded-lg bg-black/55 px-2 py-1 text-xs text-white">
            {index + 1} / {gallery.length}
          </span>
        </div>

        {gallery.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-thin">
            {gallery.map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => setIndex(i)}
                className={`relative h-16 w-24 shrink-0 snap-start overflow-hidden rounded-lg border-2 transition ${
                  i === index ? "border-ink" : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <Image src={src} alt="" fill className="object-cover" sizes="96px" />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            className="absolute left-4 top-4 rounded-full bg-white/10 p-2 text-white"
            onClick={() => setLightbox(false)}
            aria-label="بستن"
          >
            <X className="h-6 w-6" />
          </button>
          <button
            type="button"
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
          >
            <ChevronRight className="h-8 w-8" />
          </button>
          <button
            type="button"
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <div
            className="relative h-[min(85vh,720px)] w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              key={gallery[index]}
              src={gallery[index]}
              alt={title}
              fill
              className="animate-fade-in-fast object-contain"
              sizes="100vw"
            />
          </div>
          <p className="absolute bottom-6 text-sm text-white/80">
            {index + 1} از {gallery.length}
          </p>
        </div>
      )}
    </>
  );
}
