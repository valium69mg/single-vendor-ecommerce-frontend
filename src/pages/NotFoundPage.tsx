import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/navbar/Navbar";

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <Navbar />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <h1 className="font-store-heading text-4xl text-stone-900">
          {t("notFound.title")}
        </h1>
        <p className="mt-4 font-store-body text-sm text-stone-500">
          {t("notFound.body")}
        </p>
        <Link
          to="/"
          className="mt-8 rounded-none bg-amber-700 px-6 py-3 font-store-body text-sm text-white transition-colors hover:bg-amber-600"
        >
          {t("notFound.cta")}
        </Link>
      </main>
    </div>
  );
}
