import type { PlatformId } from "./platforms";

export interface AnalyzedProduct {
  name: string;
  category: string;
  usps: string[];
  audienceSegments: AudienceSegment[];
  pricePositioning: string;
  emotionalTriggers: string[];
  differentiators: string[];
  summary: string;
}

export interface AudienceSegment {
  label: string;
  description: string;
  painPoints: string[];
}

export interface CopyVariant {
  id: "A" | "B" | "C";
  title: string;
  body: string;
  tags: string[];
  hook: string;
  cta: string;
  engagementScore: number;
  postingTime: string;
}

export interface PlatformContent {
  platformId: PlatformId;
  platformName: string;
  variants: CopyVariant[];
}

export interface SellingPack {
  product: AnalyzedProduct;
  platforms: PlatformContent[];
  generatedAt: string;
}
