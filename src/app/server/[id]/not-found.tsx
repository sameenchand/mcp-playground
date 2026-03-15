import Link from "next/link";
import { buttonVariants } from "@/lib/button-variants";

export default function ServerNotFound() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-24 text-center">
      <p className="text-6xl font-bold text-muted-foreground/20 font-mono mb-6">404</p>
      <h1 className="text-2xl font-semibold text-foreground mb-2">Server not found</h1>
      <p className="text-muted-foreground mb-8">
        This server doesn&apos;t exist in the registry or may have been removed.
      </p>
      <Link href="/explore" className={buttonVariants()}>
        Browse all servers
      </Link>
    </div>
  );
}
