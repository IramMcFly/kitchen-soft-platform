import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Roles from "./components/Roles";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-orange-100 selection:text-orange-900">
      <Navbar />
      <Hero />
      <Features />
      <Roles />
      <Footer />
    </div>
  );
}
