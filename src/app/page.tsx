import Background from "@/components/layout/Background";
import ScrollProgress from "@/components/layout/ScrollProgress";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import Stats from "@/components/sections/Stats";
import Marquee from "@/components/sections/Marquee";
import Features from "@/components/sections/Features";
import Path from "@/components/sections/Path";
import CodeShowcase from "@/components/sections/CodeShowcase";
import Preview from "@/components/sections/Preview";
import Chapters from "@/components/sections/Chapters";
import Editions from "@/components/sections/Editions";
import Series from "@/components/sections/Series";
import Author from "@/components/sections/Author";

export default function Home() {
  return (
    <>
      <Background />
      <ScrollProgress />
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Marquee />
        <Features />
        <Path />
        <CodeShowcase />
        <Preview />
        <Chapters />
        <Editions />
        <Series />
        <Author />
      </main>
      <Footer />
    </>
  );
}
