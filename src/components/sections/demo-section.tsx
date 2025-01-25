"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Star } from "lucide-react";

export function DemoSection() {
  return (
    <section id="demo" className="py-20">
      <div className="container mx-auto px-4">
        <div
          data-aos="fade-up"
          data-aos-duration="1000"
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-mysteria bg-clip-text text-transparent">
            Try Your Luck <span className="text-xs"> (  ͡° ͜ʖ ͡° Phần này em ny thêm vô sau nha)</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience the thrill of our NFT gacha system with a free demo pull
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div
            data-aos="fade-right"
            data-aos-duration="1000"
            className="h-full"
          >
            <Card className="p-8 backdrop-blur-lg bg-card/50 border-mysteria-cyan/20 h-full">
              <h3 className="text-2xl font-bold mb-4">Demo Gacha Pull</h3>
              <p className="text-muted-foreground mb-6">
                Try our gacha system with a free pull! Experience the excitement of revealing rare NFTs.
              </p>
              <div className="space-y-4">
                <Button className="w-full gradient-button rounded-full">
                  <Star className="mr-2 h-5 w-5" /> Single Pull
                </Button>
                <Button className="w-full gradient-button rounded-full">
                  <Sparkles className="mr-2 h-5 w-5" /> Multi Pull (x10)
                </Button>
              </div>
            </Card>
          </div>

          <div
            data-aos="fade-left"
            data-aos-duration="1000"
            className="h-full"
          >
            <div className="space-y-4">
              {[
                { rarity: "Common", color: "gray", chance: "45%" },
                { rarity: "Uncommon", color: "green", chance: "30%" },
                { rarity: "Rare", color: "blue", chance: "15%" },
                { rarity: "Epic", color: "purple", chance: "8%" },
                { rarity: "Legendary", color: "yellow", chance: "2%" },
              ].map((tier, index) => (
                <div
                  key={index}
                  data-aos="fade-left"
                  data-aos-delay={index * 100}
                  className="w-full flex items-center justify-between px-6 py-3 bg-card/50 backdrop-blur-sm rounded-lg border border-primary/10 transition-all duration-300 hover:border-mysteria-cyan/20"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full bg-${tier.color}-400`} />
                    <span className={`font-semibold text-${tier.color}-400`}>
                      {tier.rarity}
                    </span>
                  </div>
                  <span className="text-muted-foreground font-medium">
                    {tier.chance}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}