// src/lib/brand-logos.ts
//
// Brand → website domain, used to fetch a logo at runtime.
//
// The browser requests the logo straight from free, keyless logo services
// (icon.horse, then Google favicons as a backup), so no logo files live in
// this repo and nothing is downloaded at build time. When no logo loads, the
// <BrandLogo> component falls back to the brand's product photo, so a card is
// never blank.
//
// HOW TO IMPROVE COVERAGE
//   When a brand falls back to a photo and you want its real logo, add one
//   line to DOMAINS below: its name (lowercased) -> its website domain.

// Normalise a brand name so "adidas Originals", "ADIDAS originals " and
// "Adidas  Originals" all map to the same key.
export function brandKey(name: string) {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

// Known brand domains. Keys are brandKey(name). Extend freely.
const DOMAINS: Record<string, string> = {
  // International
  "adidas": "adidas.com",
  "adidas originals": "adidas.com",
  "adidas performance": "adidas.com",
  "nike": "nike.com",
  "puma": "puma.com",
  "new balance": "newbalance.com",
  "converse": "converse.com",
  "vans": "vans.com",
  "reebok": "reebok.com",
  "asics": "asics.com",
  "under armour": "underarmour.com",
  "the north face": "thenorthface.com",
  "levi's": "levi.com",
  "levis": "levi.com",
  "h&m": "hm.com",
  "mango": "mango.com",
  "cotton on": "cottonon.com",
  "co body": "cottonon.com",
  "zara": "zara.com",
  "guess": "guess.com",
  "tommy hilfiger": "tommy.com",
  "calvin klein": "calvinklein.com",
  "polo": "polo.co.za",
  "lacoste": "lacoste.com",
  "superdry": "superdry.com",
  "jack & jones": "jackjones.com",
  "vero moda": "veromoda.com",
  "only": "only.com",
  "only & sons": "onlyandsons.com",
  "fila": "fila.com",
  "ellesse": "ellesse.com",
  "champion": "champion.com",
  "crocs": "crocs.com",
  "havaianas": "havaianas.com",
  "birkenstock": "birkenstock.com",
  "dr martens": "drmartens.com",
  "timberland": "timberland.com",
  "ben sherman": "bensherman.com",
  "boohoo": "boohoo.com",
  "boohooman": "boohooman.com",
  "factorie": "factorie.com",
  "typo": "typo.com",
  "quiksilver": "quiksilver.com",
  "roxy": "roxy.com",
  "billabong": "billabong.com",
  "rip curl": "ripcurl.com",
  "emporio armani": "armani.com",
  "diesel": "diesel.com",
  "steve madden": "stevemadden.com",
  "aldo": "aldoshoes.com",
  "skechers": "skechers.com",
  "hi-tec": "hi-tec.com",
  "boss": "hugoboss.com",
  "hugo": "hugoboss.com",
  "g-star": "g-star.com",
  "replay": "replay.it",
  "rvca": "rvca.com",
  "oakley": "oakley.com",
  "kappa": "kappa.com",
  "jeep": "jeep.com",
  "lee cooper": "leecooper.com",
  "french connection": "frenchconnection.com",
  "forever new": "forevernew.com.au",
  "guess jeans": "guess.com",
  "pringle of scotland": "pringlescotland.com",
  "prettylittlething": "prettylittlething.com",
  "trendyol": "trendyol.com",
  "isabel london": "isabellondon.com",
  "soviet": "soviet.co.za",
  "cutty": "cutty.co.za",
  "jockey": "jockey.com",
  "new look": "newlook.com",

  // South African
  "superbalist.com": "superbalist.com",
  "superbalist": "superbalist.com",
  "s.p.c.c": "spcc.co.za",
  "spcc": "spcc.co.za",
  "fp45 by s.p.c.c": "spcc.co.za",
  "jonathan d": "jonathand.co.za",
  "american swiss": "americanswiss.co.za",
  "sissy boy": "sissyboy.co.za",
  "the fix": "thefix.co.za",
  "mr price": "mrp.com",
  "stella morgan": "stellamorgan.co.za",
  "bogart man": "bogartman.co.za",
  "brave soul": "bravesoul.co.uk",
  "galxboy": "galxboy.com",
  "dailyfriday": "dailyfriday.com",
  "dorina": "dorina.co",
  "glamorous": "glamorous.com",
  // Brands where we're unsure of the real domain are left out on purpose, so
  // they fall back to their own product photo rather than show a wrong logo.
  // Add a line here once you know the domain.
};

/** The website domain for a brand, or null if we don't know it. */
export function brandDomain(name: string | null | undefined): string | null {
  if (!name) return null;
  return DOMAINS[brandKey(name)] ?? null;
}

/**
 * Logo image URL for a brand, or null when we don't know its domain.
 *
 * We use Google's favicon service. It's keyless, always reachable, and —
 * unlike icon.horse, which returns a generic globe image (a 200, not an error)
 * when it has nothing — it returns the brand's real icon or a clean blank, so
 * our onError fallback to the product photo works reliably. 128px is the
 * largest size it offers; sharp enough on these tiles.
 *
 * To swap in a higher-res logo service later, only this function changes.
 */
export function brandLogoUrl(name: string | null | undefined): string | null {
  const domain = brandDomain(name);
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}
