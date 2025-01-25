import { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Balancer from "react-wrap-balancer";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight, Box, Sparkles, Wand2 } from "lucide-react";

interface FeatureCardProps {
  feature: {
    title: ReactNode;
    category: string;
    imageUrl: string;
    color: string;
    glowColor: string;
    href: string;
    icon: ReactNode;
    description: string;
  };
  index: number;
  isHovered: boolean;
  totalCards: number;
}

function FeatureCard({ feature, index, isHovered, totalCards }: FeatureCardProps) {
  const { title, category, imageUrl, color, glowColor, href, icon, description } = feature;

  // Calculate stacked position when not hovered
  const stackOffset = 6; // Increased offset for larger cards
  const baseTransform = {
    x: 0,
    y: index * -stackOffset,
    rotate: -1 + (index * 1), // Reduced rotation for better stacking
    scale: 1 - (index * 0.01), // Reduced scale difference
  };

  // Calculate fanned position when hovered
  const fanAngle = 12; // Reduced angle for smoother fan
  const fanSpread = 400; // Increased spread for larger cards
  const middleIndex = Math.floor(totalCards / 2);
  const relativeIndex = index - middleIndex;
  const fanTransform = {
    x: relativeIndex * fanSpread,
    y: Math.abs(relativeIndex) * 30,
    rotate: relativeIndex * fanAngle,
    scale: 1,
  };

  return (
    <motion.div
      className="absolute origin-bottom"
      initial={baseTransform}
      animate={isHovered ? fanTransform : baseTransform}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
      style={{ zIndex: isHovered ? totalCards - index : index }}
    >
      <Link href={href}>
        <div
          className={cn(
            "w-[400px] h-[600px] rounded-3xl relative overflow-hidden group cursor-pointer", // Increased size and rounded corners
            "transition-all duration-300",
            isHovered && "hover:scale-105"
          )}
        >
          {/* Shine Effect */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100"
            initial={{ x: "-100%" }}
            whileHover={{ x: "100%" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            style={{
              background: `linear-gradient(90deg, transparent, ${color}20, transparent)`,
            }}
          />

          {/* Glow Effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div
              className="absolute inset-0 blur-3xl" // Increased blur
              style={{ backgroundColor: glowColor, opacity: 0.3 }}
            />
          </div>

          {/* Image and Overlay */}
          <div className="absolute inset-0">
            <img
              src={imageUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to top, 
                  rgba(0,0,0,0.95), 
                  rgba(0,0,0,0.8) 30%,
                  ${glowColor}20 60%,
                  transparent
                )`
              }}
            />
          </div>

          {/* Content */}
          <div className="relative h-full flex flex-col justify-end p-8 gap-6"> {/* Increased padding and gap */}
            {/* Category Badge */}
            <div
              className="inline-flex w-fit items-center gap-3 rounded-xl px-4 py-2.5 text-base font-medium" // Increased size
              style={{
                backgroundColor: `${color}15`,
                border: `1px solid ${color}30`,
                color: color,
              }}
            >
              {icon}
              <span>{category}</span>
            </div>

            {/* Title and Description */}
            <div
              className="rounded-xl backdrop-blur-sm p-6 space-y-4 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100" // Increased padding and spacing
              style={{
                backgroundColor: 'rgba(0,0,0,0.3)',
                borderLeft: `3px solid ${color}`, // Thicker border
              }}
            >
              <h3 className="text-2xl font-bold text-white"> {/* Increased font size */}
                {title}
              </h3>
              <p className="text-base text-white/70 line-clamp-3"> {/* Increased font size and lines */}
                {description}
              </p>

              {/* Action Button */}
              <div
                className="flex items-center gap-3 text-base mt-6 transition-colors" // Increased size and spacing
                style={{ color }}
              >
                <span>Explore Now</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>

          {/* Hover Border Effect */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ border: `2px solid ${color}30` }} // Thicker border
          />
        </div>
      </Link>
    </motion.div>
  );
}

export default function FeaturesSection() {
  const [isHovered, setIsHovered] = useState(false);

  const features = [
    {
      category: "Gacha NFT",
      imageUrl: "https://res.cloudinary.com/dlotuochc/image/upload/v1737633257/Mysteria/Summon_Rare_NFTs_from_Mystical_Chests_krtidq.jpg",
      title: "Summon Rare NFTs from Mystical Chests",
      description: "Open mystical chests to discover and collect rare NFTs with unique powers and abilities. Each chest contains a chance to obtain legendary items that can turn the tide of battle.",
      color: "rgb(56, 209, 222)", // mysteria-cyan
      glowColor: "rgba(56, 209, 222, 0.5)",
      href: "/gacha",
      icon: <Box className="w-5 h-5" />, // Increased icon size
    },
    {
      category: "NFT Upgrade",
      title: "Enhance & Fuse Your NFT Collection",
      description: "Upgrade your NFTs to unlock their true potential and create powerful legendary items. Combine multiple NFTs to forge even stronger artifacts with unique abilities and enhanced stats.",
      imageUrl: "https://res.cloudinary.com/dlotuochc/image/upload/v1737633371/Mysteria/upgrade_nft_eewq7o.jpg",
      color: "rgb(98, 145, 255)", // mysteria-blue
      glowColor: "rgba(98, 145, 255, 0.5)",
      href: "/upgrade",
      icon: <Wand2 className="w-5 h-5" />, // Increased icon size
    },
    {
      category: "Legendary NFTs",
      title: "Discover Powerful Legendary Items",
      description: "Collect and trade legendary NFTs with unique attributes and special abilities. Each legendary item has its own lore, special effects, and can dramatically change your gameplay experience.",
      imageUrl: "https://res.cloudinary.com/dlotuochc/image/upload/v1737633537/Mysteria/Discover_Powerful_Legendary_Items_fgx6yj.jpg",
      color: "rgb(150, 91, 249)", // mysteria-purple
      glowColor: "rgba(150, 91, 249, 0.5)",
      href: "/shop",
      icon: <Sparkles className="w-5 h-5" />, // Increased icon size
    },
  ];

  return (
    <section className="relative flex w-full flex-col items-center gap-12 py-32 overflow-hidden"> {/* Increased vertical spacing */}
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(22,189,202,0.1)_0%,rgba(0,0,0,0)_100%)]" />
        <div className="absolute inset-0 dot-grid opacity-30" />
      </div>

      <motion.header
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex max-w-3xl flex-col items-center gap-6 text-center px-4" // Increased width and gap
      >
        <h2 className="text-5xl font-bold bg-gradient-mysteria bg-clip-text text-transparent"> {/* Increased font size */}
          Mystical Features
        </h2>
        <Balancer className="text-xl text-white/60"> {/* Increased font size */}
          Experience the thrill of NFT gacha, upgrade your collection, and discover legendary treasures in our mystical realm.
        </Balancer>
      </motion.header>

      <div className="w-full max-w-[1600px] mx-auto px-4"> {/* Increased max width */}
        <div
          className="relative h-[700px] flex items-center justify-center py-16" // Increased height
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <AnimatePresence>
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.category}
                feature={feature}
                index={index}
                isHovered={isHovered}
                totalCards={features.length}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}