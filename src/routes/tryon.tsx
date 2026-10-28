import { createFileRoute, redirect } from "@tanstack/react-router";

// The old try-on page (person photo plus top, bottom, headwear and eyewear blocks) is gone: try-on now
// happens from a product's page ("Try it on", components/ProductTryOn.tsx), using its category.
// Old links and bookmarks to /tryon land on the brands page instead.
export const Route = createFileRoute("/tryon")({
  beforeLoad: () => {
    throw redirect({ to: "/stores", replace: true });
  },
});
