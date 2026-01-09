import { createClient } from "@/lib/supabase/server"
import Header from "@/components/header"
import Hero from "@/components/hero"
import Features from "@/components/features"
import PathSection from "@/components/path-section"
import Testimonials from "@/components/testimonials"
import CTA from "@/components/cta"
import Footer from "@/components/footer"

export default async function Home() {
  const supabase = await createClient()

  // Fetch features and testimonials from Supabase
  const [featuresData, testimonialsData] = await Promise.all([
    supabase.from("features").select("*").order("order_index", { ascending: true }),
    supabase.from("testimonials").select("*"),
  ])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header />
      <Hero />
      <Features features={featuresData.data || []} />
      <PathSection />
      <Testimonials testimonials={testimonialsData.data || []} />
      <CTA />
      <Footer />
    </div>
  )
}
