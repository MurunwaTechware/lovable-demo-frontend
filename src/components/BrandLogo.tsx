// src/components/BrandLogo.tsx
//
// A Bash-style brand tile: a clean light card with the brand's logo centred.
// The logo comes from Google's favicon service (by domain). If it can't load,
// OR Google has no real favicon and returns its generic globe, the card falls
// back to the brand's product photo, then to the brand name as text — so every
// card looks intentional and none ever show a meaningless globe or a blank.

import { useState } from "react";
import { brandLogoUrl } from "@/lib/brand-logos";

type Tier = "logo" | "photo" | "text";

export function BrandLogo({
  name,
  photo,
  className = "",
}: {
  name: string;
  photo?: string | null;        // the brand's product cover image (fallback)
  className?: string;
}) {
  const logo = brandLogoUrl(name);
  const [tier, setTier] = useState<Tier>(logo ? "logo" : photo ? "photo" : "text");

  const demote = () => setTier(photo ? "photo" : "text");

  // When Google has no favicon for a domain it still returns a 200 — a tiny
  // generic globe, intrinsically 16px even though we asked for 128. A real
  // favicon comes back larger. So: if what loaded is <= 16px wide, it's the
  // globe → treat it as "no logo" and drop to the photo.
  const onLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (e.currentTarget.naturalWidth <= 16) demote();
  };

  if (tier === "logo" && logo) {
    return (
      <div className={`relative grid place-items-center bg-[#f3f3f3] ${className}`}>
        <img
          src={logo}
          alt={name}
          loading="lazy"
          onError={demote}
          onLoad={onLoad}
          // favicon is up to 128px; cap it so it reads as a centred logo mark
          className="h-14 w-14 sm:h-16 sm:w-16 object-contain"
        />
      </div>
    );
  }

  if (tier === "photo" && photo) {
    return (
      <div className={`relative overflow-hidden bg-secondary ${className}`}>
        <img
          src={photo}
          alt={name}
          loading="lazy"
          onError={() => setTier("text")}
          className="h-full w-full object-cover object-top transition duration-700 group-hover:scale-105"
        />
      </div>
    );
  }

  return (
    <div className={`relative grid place-items-center bg-[#f3f3f3] ${className}`}>
      <span className="font-display text-xl sm:text-2xl text-center px-4 text-foreground/80">{name}</span>
    </div>
  );
}
