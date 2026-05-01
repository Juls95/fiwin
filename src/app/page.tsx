import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Features } from "@/components/sections/Features";
import { Security } from "@/components/sections/Security";
import { FAQ } from "@/components/sections/FAQ";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <Security />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
