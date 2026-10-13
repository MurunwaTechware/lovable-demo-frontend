import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/journey")({
  beforeLoad: () => {
    throw redirect({ to: "/stylist" });
  },
});
