import Link from "next/link";
import Header from "@/components/Header";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-5 py-32 text-center">
        <p className="eyebrow text-clay">Page not found</p>
        <h1 className="mt-4 font-display text-6xl">This trail ends here.</h1>
        <Link href="/" className="btn btn-primary mt-10">Back to home</Link>
      </main>
    </>
  );
}
