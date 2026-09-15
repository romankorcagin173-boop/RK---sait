import { EnvelopeScene } from "@/components/home/EnvelopeScene";
import { BrandIntro } from "@/components/home/BrandIntro";
import { TabsShowcase } from "@/components/home/TabsShowcase";
import { ContactBlock } from "@/components/home/ContactBlock";

export default function Home() {
  return (
    <>
      <EnvelopeScene />
      <BrandIntro />
      <TabsShowcase />
      <ContactBlock />
    </>
  );
}
