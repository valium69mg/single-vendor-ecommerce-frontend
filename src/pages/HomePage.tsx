// pages/HomePage.tsx
import Navbar from "@/components/navbar/Navbar";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* products grid goes here */}
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © 2026 ShopName
      </footer>
    </div>
  );
}