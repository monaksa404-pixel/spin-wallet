export type OfferSlotId = "offer1" | "offer2" | "offer3" | "offer4" | "offer5";

export type OfferSlotDef = {
  id: OfferSlotId;
  imageFile: string;
  depositButtonLabel: string;
  /** TanStack Router path */
  href: "/deposit/gift-card" | "/deposit/bank";
  /** Deep-link preset for gift-card flow */
  giftBrandId?: string;
};

/** Visual order: Razer hero first, then Al Rajhi, iTunes, PUBG, STC */
export const OFFER_SLOTS_ORDERED: OfferSlotDef[] = [
  { id: "offer5", imageFile: "offer5.png", depositButtonLabel: "Deposit Now Razer Gold", href: "/deposit/gift-card", giftBrandId: "razer_gold" },
  { id: "offer1", imageFile: "offer1.png", depositButtonLabel: "Deposit Al Rajhi Bank", href: "/deposit/bank" },
  { id: "offer2", imageFile: "offer2.png", depositButtonLabel: "Deposit Now iTunes", href: "/deposit/gift-card", giftBrandId: "itunes" },
  { id: "offer3", imageFile: "offer3.png", depositButtonLabel: "Deposit Now Pubg", href: "/deposit/gift-card", giftBrandId: "pubg" },
  { id: "offer4", imageFile: "offer4.png", depositButtonLabel: "Deposit Now STC", href: "/deposit/gift-card", giftBrandId: "stc_pay" },
];

export function offerImageSrc(file: string): string {
  return `/images/${encodeURIComponent(file)}`;
}
