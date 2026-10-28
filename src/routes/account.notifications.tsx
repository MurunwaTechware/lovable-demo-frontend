import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";

import { Badge, PageTitle, Panel } from "@/components/AccountUI";

// Placeholder: the settings themselves come later.
export const Route = createFileRoute("/account/notifications")({
  head: () => ({ meta: [{ title: "Notification settings · Mannequin AI" }] }),
  component: NotificationsPage,
});

const PLANNED = [
  ["Order updates", "When an order ships, is out for delivery or arrives."],
  ["Returns and refunds", "When a store approves a return or your refund goes through."],
  ["Sales from stores you follow", "A heads-up when a store you subscribe to starts a sale."],
  ["Weekly digest", "One email with the best deals from your stores, instead of one per store."],
  ["Price drops", "When something on your wishlist gets cheaper."],
] as const;

function NotificationsPage() {
  return (
    <div className="space-y-6">
      <PageTitle
        title="Notification settings"
        description="Choose what we tell you about, and whether it's by email or push."
      />
      <Panel
        title="Coming soon"
        action={<Badge tone="plum">In the works</Badge>}
        description="You'll be able to turn each of these on or off here."
      >
        <ul className="divide-y divide-border">
          {PLANNED.map(([title, text]) => (
            <li key={title} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <Bell className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <div className="text-sm font-medium">{title}</div>
                <div className="text-sm text-muted-foreground">{text}</div>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
