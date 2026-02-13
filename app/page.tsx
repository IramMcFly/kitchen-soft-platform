import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Pricing from "./components/Pricing";
import Roles from "./components/Roles";
import Footer from "./components/Footer";
import { Suspense } from 'react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-orange-100 selection:text-orange-900">
      <Navbar />
      <Hero />
      <Suspense fallback={<div className="py-20 text-center">Cargando precios...</div>}>
        <Pricing />
      </Suspense>
      <Features />
      <Roles />
      <Footer />
    </div>
  );
}
