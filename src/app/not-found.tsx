import Link from "next/link";

export default function NotFound() {
  return (
    <div className="pt-[160px] min-h-[70vh] max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center flex flex-col items-center gap-6">
      <h1 className="font-display-lg text-display-lg text-obsidian">404</h1>
      <p className="font-body-md text-body-md text-on-surface-variant">
        The piece you are looking for could not be found.
      </p>
      <Link
        href="/collections"
        className="bg-obsidian text-paper font-label-caps text-label-caps px-10 py-4 hover:bg-graphite"
      >
        EXPLORE COLLECTION
      </Link>
    </div>
  );
}
