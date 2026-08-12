"use client";

import Link from "next/link";
import { useT } from "@/lib/useT";

// Global footer — obsidian background, paper text, editorial columns.
export default function Footer() {
  const { t } = useT();
  return (
    <footer className="bg-obsidian text-paper w-full mt-section-gap flex flex-col md:flex-row justify-between items-start px-margin-mobile md:px-margin-desktop py-section-gap max-w-container-max mx-auto">
      <div className="mb-12 md:mb-0">
        <div className="font-headline-lg text-headline-lg text-paper mb-4">
          DASILVA BATIK
        </div>
        <p className="font-body-md text-body-md text-silver-subtle max-w-xs">
          {t("brand.tagline")}
        </p>
      </div>
      <div className="flex flex-col space-y-4">
        <Link
          href="/account"
          className="font-body-md text-body-md text-silver-subtle hover:text-bronze-accent transition-colors"
        >
          {t("footer.about")}
        </Link>
        <Link
          href="/account"
          className="font-body-md text-body-md text-silver-subtle hover:text-bronze-accent transition-colors"
        >
          {t("footer.contact")}
        </Link>
        <Link
          href="/collections"
          className="font-body-md text-body-md text-silver-subtle hover:text-bronze-accent transition-colors"
        >
          {t("footer.shipping")}
        </Link>
        <a
          href="https://wa.me/6281234567890"
          target="_blank"
          rel="noopener noreferrer"
          className="font-body-md text-body-md text-silver-subtle hover:text-bronze-accent transition-colors"
        >
          {t("footer.whatsapp")}
        </a>
      </div>
      <div className="w-full md:w-auto mt-12 md:mt-0 pt-12 md:pt-0 border-t border-graphite md:border-t-0 flex items-end h-full">
        <p className="font-body-md text-body-md text-silver-subtle opacity-60">
          {t("brand.copyright")}
        </p>
      </div>
    </footer>
  );
}
