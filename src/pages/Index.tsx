import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import adminPasswordFile from "../../admin.txt?raw";
import {
  BadgeInfo,
  Banknote,
  Check,
  CreditCard,
  Heart,
  Home,
  Image,
  Instagram,
  KeyRound,
  ListMusic,
  LogOut,
  Mail,
  Music2,
  Percent,
  Pause,
  Play,
  Search,
  ShoppingBag,
  Star,
  Upload,
  UserCircle2,
  X,
  Youtube,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type SectionId = "home" | "beats" | "drumkits" | "loops" | "artwork" | "contact" | "socials" | "terms" | "signin" | "signup" | "profile" | "checkout";
type LicenseName = "Basic Lease" | "Exclusive Lease";

type Beat = {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  tags: string[];
  imageUrl: string;
  previewUrl: string;
  purchaseUrl: string;
};

type StoreItem = {
  id: string;
  title: string;
  subtitle: string;
  section: "drumkits" | "loops" | "artwork";
  accentClass: string;
  imageUrl?: string;
  previewUrl?: string;
};

type StoreUploadDraft = {
  title: string;
  subtitle: string;
  imageUrl: string;
  previewUrl: string;
};

type ProfileTab = "edit" | "payment" | "favorites" | "playlist" | "orders" | "promotions";
type UserRole = "Artist" | "Producer" | "Consumer";
type PaymentMethod = "Bank" | "Bank Card" | "Cash App" | "PayPal" | "Apple Pay";
type StoreSectionName = "drumkits" | "loops" | "artwork";
type FeatureSectionName = "beats" | StoreSectionName;
type AdminToolKey = FeatureSectionName | "add-beat" | "add-drumkits" | "add-loops" | "add-artwork";

type ProfileForm = {
  firstName: string;
  lastName: string;
  displayName: string;
  location: string;
  role: UserRole;
  paymentMethods: PaymentMethod[];
  profilePhoto: string;
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  bankName: string;
  accountName: string;
  routingNumber: string;
  accountNumber: string;
  cashAppTag: string;
  paypalEmail: string;
};

type PaymentDetails = {
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  bankName: string;
  accountName: string;
  routingNumber: string;
  accountNumber: string;
  cashAppTag: string;
  paypalEmail: string;
};

type OrderItem = {
  id: string;
  beatId: string;
  title: string;
  license: LicenseName;
  price: number;
  purchasedAt: string;
};

type SocialLinks = {
  tiktok: string;
  instagram: string;
  twitter: string;
  youtube: string;
};

type ContactForm = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

type ContactMessage = ContactForm & {
  id: string;
  submittedAt: string;
};

type StorefrontBeatTagRow = Tables<"storefront_beat_tags">;
type ProfileRow = Tables<"profiles">;
type StorefrontUserMetadata = {
  profile?: Partial<ProfileForm>;
  favorites?: string[];
  playlist?: string[];
  orders?: OrderItem[];
  promoCodes?: string[];
  updatedAt?: string;
};

type StorefrontSiteConfig = {
  uploadedBeats: Beat[];
  storeItems: StoreItem[];
  featuredBeatIds: string[];
  featuredStoreItemIds: Record<StoreSectionName, string[]>;
  socialLinks: SocialLinks;
};

const ADMIN_PASSWORD_STORAGE_KEY = "void-admin-password";
const ADMIN_PASSWORD_LEGACY_KEY = "admin";
const BEAT_TAGS_STORAGE_KEY = "void-beat-tags";
const BEATS_STORAGE_KEY = "void-beats";
const FEATURED_BEATS_STORAGE_KEY = "void-featured-beats";
const FEATURED_STORE_ITEMS_STORAGE_KEY = "void-featured-store-items";
const PROFILE_STORAGE_KEY = "void-profile";
const FAVORITES_STORAGE_KEY = "void-favorites";
const PLAYLIST_STORAGE_KEY = "void-playlist";
const ORDERS_STORAGE_KEY = "void-orders";
const PROMO_STORAGE_KEY = "void-promo";
const STORE_ITEMS_STORAGE_KEY = "void-store-items";
const SOCIAL_LINKS_STORAGE_KEY = "void-social-links";
const CONTACT_MESSAGES_STORAGE_KEY = "void-contact-messages";
const PUBLISHED_STOREFRONT_STORAGE_KEY = "void-published-storefront";
const STOREFRONT_CONFIG_PREFIX = "__void_storefront__:";
const STOREFRONT_CONFIG_VERSION_MARKER = "::version::";
const STOREFRONT_CONFIG_CHUNK_MARKER = "::chunk::";
const STOREFRONT_CONFIG_COMPLETE_MARKER = "::complete::";
const STOREFRONT_CONFIG_CHUNK_SIZE = 48000;
const STOREFRONT_CONFIG_KEYS = {
  uploadedBeats: `${STOREFRONT_CONFIG_PREFIX}uploaded-beats`,
  storeItems: `${STOREFRONT_CONFIG_PREFIX}store-items`,
  featuredBeatIds: `${STOREFRONT_CONFIG_PREFIX}featured-beat-ids`,
  featuredStoreItemIds: `${STOREFRONT_CONFIG_PREFIX}featured-store-item-ids`,
  socialLinks: `${STOREFRONT_CONFIG_PREFIX}social-links`,
} as const;
const DEFAULT_ADMIN_PASSWORD = "admin";
const FILE_ADMIN_PASSWORD = adminPasswordFile.trim();
const PAYMENT_OPTIONS: PaymentMethod[] = ["Bank", "Bank Card", "Cash App", "PayPal", "Apple Pay"];
const LOCATION_SUGGESTIONS = [
  "Houston, Texas",
  "Austin, Texas",
  "Dallas, Texas",
  "San Antonio, Texas",
  "Atlanta, Georgia",
  "Miami, Florida",
  "Los Angeles, California",
  "New York, New York",
  "Chicago, Illinois",
  "Phoenix, Arizona",
];

const LICENSES: Record<LicenseName, number> = {
  "Basic Lease": 20,
  "Exclusive Lease": 100,
};
const DEFAULT_FEATURED_BEAT_IDS = ["6th-angel", "fake-bih", "sosa"];
const DEFAULT_FEATURED_STORE_ITEM_IDS: Record<StoreSectionName, string[]> = {
  drumkits: [],
  loops: [],
  artwork: [],
};
const DEFAULT_SOCIAL_LINKS: SocialLinks = {
  tiktok: "",
  instagram: "",
  twitter: "",
  youtube: "",
};

const publicAsset = (filename: string) => `/${encodeURIComponent(filename)}`;
const publicFolderAsset = (folder: string, filename: string) => `/${folder}/${encodeURIComponent(filename)}`;
const DEFAULT_PROFILE_FORM: ProfileForm = {
  firstName: "",
  lastName: "",
  displayName: "",
  location: "",
  role: "Consumer",
  paymentMethods: [],
  profilePhoto: "",
  cardholderName: "",
  cardNumber: "",
  expiryDate: "",
  cvv: "",
  bankName: "",
  accountName: "",
  routingNumber: "",
  accountNumber: "",
  cashAppTag: "",
  paypalEmail: "",
};

const beats: Beat[] = [
  {
    id: "vvv",
    title: "VVV",
    artist: "EJCERTIFIED",
    bpm: 146,
    tags: ["Dark", "Untagged"],
    imageUrl: publicAsset("Decided to post my graphic design work on pinterest maybe I can find my target audience here lol if you like my work please check out my IG @Ukihanee.jpg"),
    previewUrl: "/audio/vvv-146bpm-ejcertified.mp3",
    purchaseUrl: "/audio/vvv-146bpm-ejcertified.mp3",
  },
  {
    id: "fake-bih",
    title: "FAKE BIH",
    artist: "EJCERTIFIED",
    bpm: 147,
    tags: ["Hard", "Untagged"],
    imageUrl: publicAsset("disturbance.jpg"),
    previewUrl: "/audio/fake-bih-147-ejcertified.mp3",
    purchaseUrl: "/audio/fake-bih-147-ejcertified.mp3",
  },
  {
    id: "brunson-is-trash-omg",
    title: "BRUNSON IS TRASH OMG",
    artist: "EJCERTIFIED",
    bpm: 148,
    tags: ["Dark", "Aggressive"],
    imageUrl: publicAsset("download (1).jpg"),
    previewUrl: "/audio/brunson-is-trash-omg-148-ejcertified.mp3",
    purchaseUrl: "/audio/brunson-is-trash-omg-148-ejcertified.mp3",
  },
  {
    id: "die-4-u",
    title: "DIE 4 U",
    artist: "EJCERTIFIED",
    bpm: 140,
    tags: ["Melodic", "Dark"],
    imageUrl: publicAsset("download (2).jpg"),
    previewUrl: "/audio/die-4-u-140-ejcertified.mp3",
    purchaseUrl: "/audio/die-4-u-140-ejcertified.mp3",
  },
  {
    id: "same-ole-shii",
    title: "SAME OLE SHII",
    artist: "EJCERTIFIED",
    bpm: 147,
    tags: ["Hard", "Street"],
    imageUrl: publicAsset("download.jpg"),
    previewUrl: "/audio/same-ole-shii-147-ejcertified.mp3",
    purchaseUrl: "/audio/same-ole-shii-147-ejcertified.mp3",
  },
  {
    id: "sosa",
    title: "SOSA",
    artist: "EJCERTIFIED",
    bpm: 144,
    tags: ["Dark", "Bouncy"],
    imageUrl: publicAsset("Ken Carson.jpg"),
    previewUrl: "/audio/sosa-144-ejcertified.mp3",
    purchaseUrl: "/audio/sosa-144-ejcertified.mp3",
  },
  {
    id: "just-lost-100",
    title: "JUST LOST $100",
    artist: "EJCERTIFIED",
    bpm: 149,
    tags: ["Dark", "Upbeat"],
    imageUrl: publicAsset("Large Vertical Chinese Landscape Painting, Giclee Print, Pavilion Fairyland Art, Handmade Silk Hanging Scroll, Shan Shui Wall Hanging - Etsy.jpg"),
    previewUrl: "/audio/just-lost-100-149bpm-ejcertified.mp3",
    purchaseUrl: "/audio/just-lost-100-149bpm-ejcertified.mp3",
  },
  {
    id: "tats-on-my-arm",
    title: "TATS ON MY ARM",
    artist: "EJCERTIFIED",
    bpm: 152,
    tags: ["Fast", "Aggressive"],
    imageUrl: publicAsset("࿂ ໋᳝֘·⋆ 𝐐𝐈𝐒𝐇𝐎𝐎 ☆.jpg"),
    previewUrl: "/audio/tats-on-my-arm-152bpm-ejcertified.mp3",
    purchaseUrl: "/audio/tats-on-my-arm-152bpm-ejcertified.mp3",
  },
  {
    id: "6th-angel",
    title: "6TH ANGEL",
    artist: "EJCERTIFIED",
    bpm: 149,
    tags: ["Dark", "Eerie"],
    imageUrl: publicAsset("𝗬𝘂𝗻𝗷𝗶𝗻.jpg"),
    previewUrl: "/audio/6th-angel-149-ejcertified.mp3",
    purchaseUrl: "/audio/6th-angel-149-ejcertified.mp3",
  },
];

const DEFAULT_BEAT_TAGS = Object.fromEntries(beats.map((beat) => [beat.id, beat.tags])) as Record<string, string[]>;
const BEAT_IMAGE_OVERRIDES: Partial<Record<Beat["id"], string>> = {
  vvv: publicFolderAsset("covers", "cover-6th-angel.jpg"),
  "fake-bih": publicFolderAsset("covers", "cover-fake-bih-yunjin.jpg"),
  "brunson-is-trash-omg": publicFolderAsset("covers", "cover-brunson.jpg"),
  "die-4-u": publicFolderAsset("covers", "cover-die-4-u.jpg"),
  "same-ole-shii": publicFolderAsset("covers", "cover-same-ole-shii.jpg"),
  sosa: publicFolderAsset("covers", "cover-sosa.jpg"),
  "just-lost-100": publicFolderAsset("covers", "cover-just-lost-100.jpg"),
  "tats-on-my-arm": publicFolderAsset("covers", "cover-fake-bih.jpg"),
  "6th-angel": publicFolderAsset("covers", "cover-vvv.jpg"),
};
const createEmptyPaymentDetails = (): PaymentDetails => ({
  cardholderName: "",
  cardNumber: "",
  expiryDate: "",
  cvv: "",
  bankName: "",
  accountName: "",
  routingNumber: "",
  accountNumber: "",
  cashAppTag: "",
  paypalEmail: "",
});

const createEmptyStoreUploadDraft = (): StoreUploadDraft => ({
  title: "",
  subtitle: "",
  imageUrl: "",
  previewUrl: "",
});

const extractPaymentDetails = (profile: ProfileForm): PaymentDetails => ({
  cardholderName: profile.cardholderName,
  cardNumber: profile.cardNumber,
  expiryDate: profile.expiryDate,
  cvv: profile.cvv,
  bankName: profile.bankName,
  accountName: profile.accountName,
  routingNumber: profile.routingNumber,
  accountNumber: profile.accountNumber,
  cashAppTag: profile.cashAppTag,
  paypalEmail: profile.paypalEmail,
});
const normalizeTagList = (tags: string[]) =>
  Array.from(new Set(tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0)));

const buildBeatTagsFromRows = (rows: StorefrontBeatTagRow[]) => {
  const nextBeatTags = Object.fromEntries(beats.map((beat) => [beat.id, [] as string[]])) as Record<string, string[]>;

  rows.forEach((row) => {
    if (row.beat_id.startsWith(STOREFRONT_CONFIG_PREFIX)) return;
    if (!nextBeatTags[row.beat_id]) nextBeatTags[row.beat_id] = [];
    nextBeatTags[row.beat_id].push(row.tag);
  });

  return Object.fromEntries(
    Object.entries(nextBeatTags).map(([beatId, tags]) => [beatId, normalizeTagList(tags)]),
  ) as Record<string, string[]>;
};

const getBeatImageUrl = (beat: Beat) => BEAT_IMAGE_OVERRIDES[beat.id] ?? beat.imageUrl;
const normalizeStringArray = (value: unknown) =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];

const normalizePaymentMethods = (value: unknown): PaymentMethod[] =>
  normalizeStringArray(value).filter((entry): entry is PaymentMethod => PAYMENT_OPTIONS.includes(entry as PaymentMethod));

const normalizeOrders = (value: unknown): OrderItem[] =>
  Array.isArray(value)
    ? value.filter(
        (entry): entry is OrderItem =>
          typeof entry === "object" &&
          entry !== null &&
          typeof (entry as OrderItem).id === "string" &&
          typeof (entry as OrderItem).beatId === "string" &&
          typeof (entry as OrderItem).title === "string" &&
          typeof (entry as OrderItem).license === "string" &&
          typeof (entry as OrderItem).price === "number" &&
          typeof (entry as OrderItem).purchasedAt === "string",
      )
    : [];

const normalizeProfileForm = (value: unknown): ProfileForm => {
  const source =
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Partial<Record<keyof ProfileForm, unknown>>)
      : {};

  const role = source.role;
  const normalizedRole: UserRole =
    role === "Artist" || role === "Producer" || role === "Consumer" ? role : DEFAULT_PROFILE_FORM.role;

  return {
    ...DEFAULT_PROFILE_FORM,
    firstName: typeof source.firstName === "string" ? source.firstName : DEFAULT_PROFILE_FORM.firstName,
    lastName: typeof source.lastName === "string" ? source.lastName : DEFAULT_PROFILE_FORM.lastName,
    displayName: typeof source.displayName === "string" ? source.displayName : DEFAULT_PROFILE_FORM.displayName,
    location: typeof source.location === "string" ? source.location : DEFAULT_PROFILE_FORM.location,
    role: normalizedRole,
    paymentMethods: normalizePaymentMethods(source.paymentMethods),
    profilePhoto: typeof source.profilePhoto === "string" ? source.profilePhoto : DEFAULT_PROFILE_FORM.profilePhoto,
    cardholderName: typeof source.cardholderName === "string" ? source.cardholderName : DEFAULT_PROFILE_FORM.cardholderName,
    cardNumber: typeof source.cardNumber === "string" ? source.cardNumber : DEFAULT_PROFILE_FORM.cardNumber,
    expiryDate: typeof source.expiryDate === "string" ? source.expiryDate : DEFAULT_PROFILE_FORM.expiryDate,
    cvv: typeof source.cvv === "string" ? source.cvv : DEFAULT_PROFILE_FORM.cvv,
    bankName: typeof source.bankName === "string" ? source.bankName : DEFAULT_PROFILE_FORM.bankName,
    accountName: typeof source.accountName === "string" ? source.accountName : DEFAULT_PROFILE_FORM.accountName,
    routingNumber: typeof source.routingNumber === "string" ? source.routingNumber : DEFAULT_PROFILE_FORM.routingNumber,
    accountNumber: typeof source.accountNumber === "string" ? source.accountNumber : DEFAULT_PROFILE_FORM.accountNumber,
    cashAppTag: typeof source.cashAppTag === "string" ? source.cashAppTag : DEFAULT_PROFILE_FORM.cashAppTag,
    paypalEmail: typeof source.paypalEmail === "string" ? source.paypalEmail : DEFAULT_PROFILE_FORM.paypalEmail,
  };
};

const normalizeBeatArray = (value: unknown): Beat[] =>
  Array.isArray(value)
    ? value.filter(
        (entry): entry is Beat =>
          typeof entry === "object" &&
          entry !== null &&
          typeof (entry as Beat).id === "string" &&
          typeof (entry as Beat).title === "string" &&
          typeof (entry as Beat).artist === "string" &&
          typeof (entry as Beat).bpm === "number" &&
          Array.isArray((entry as Beat).tags) &&
          typeof (entry as Beat).imageUrl === "string" &&
          typeof (entry as Beat).previewUrl === "string" &&
          typeof (entry as Beat).purchaseUrl === "string",
      )
    : [];

const normalizeStoreItemArray = (value: unknown): StoreItem[] =>
  Array.isArray(value)
    ? value.filter(
        (entry): entry is StoreItem =>
          typeof entry === "object" &&
          entry !== null &&
          typeof (entry as StoreItem).id === "string" &&
          typeof (entry as StoreItem).title === "string" &&
          typeof (entry as StoreItem).subtitle === "string" &&
          ((entry as StoreItem).section === "drumkits" ||
            (entry as StoreItem).section === "loops" ||
            (entry as StoreItem).section === "artwork") &&
          typeof (entry as StoreItem).accentClass === "string" &&
          (typeof (entry as StoreItem).imageUrl === "string" || typeof (entry as StoreItem).imageUrl === "undefined") &&
          (typeof (entry as StoreItem).previewUrl === "string" || typeof (entry as StoreItem).previewUrl === "undefined"),
      )
    : [];

const normalizeSocialLinks = (value: unknown): SocialLinks => {
  const source =
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Partial<Record<keyof SocialLinks, unknown>>)
      : {};

  return {
    tiktok: typeof source.tiktok === "string" ? source.tiktok : DEFAULT_SOCIAL_LINKS.tiktok,
    instagram: typeof source.instagram === "string" ? source.instagram : DEFAULT_SOCIAL_LINKS.instagram,
    twitter: typeof source.twitter === "string" ? source.twitter : DEFAULT_SOCIAL_LINKS.twitter,
    youtube: typeof source.youtube === "string" ? source.youtube : DEFAULT_SOCIAL_LINKS.youtube,
  };
};

const splitStorefrontConfigValue = (value: string) => {
  if (!value.length) return [""];

  const chunks: string[] = [];
  for (let index = 0; index < value.length; index += STOREFRONT_CONFIG_CHUNK_SIZE) {
    chunks.push(value.slice(index, index + STOREFRONT_CONFIG_CHUNK_SIZE));
  }

  return chunks;
};

const buildStorefrontConfigRows = (key: string, value: string) => {
  const version = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const chunkRows = splitStorefrontConfigValue(value).map((chunk, index) => ({
    beat_id: `${key}${STOREFRONT_CONFIG_VERSION_MARKER}${version}${STOREFRONT_CONFIG_CHUNK_MARKER}${index.toString().padStart(4, "0")}`,
    tag: chunk,
  }));

  return {
    chunkRows,
    completeRow: {
      beat_id: `${key}${STOREFRONT_CONFIG_VERSION_MARKER}${version}${STOREFRONT_CONFIG_COMPLETE_MARKER}`,
      tag: String(chunkRows.length),
    },
  };
};

const parseStorefrontConfigChunkInfo = (beatId: string, key: string) => {
  const prefix = `${key}${STOREFRONT_CONFIG_VERSION_MARKER}`;
  if (!beatId.startsWith(prefix)) return null;

  const remainder = beatId.slice(prefix.length);
  if (remainder.endsWith(STOREFRONT_CONFIG_COMPLETE_MARKER)) {
    return {
      version: remainder.slice(0, -STOREFRONT_CONFIG_COMPLETE_MARKER.length),
      type: "complete" as const,
      index: -1,
    };
  }

  const chunkMarkerIndex = remainder.indexOf(STOREFRONT_CONFIG_CHUNK_MARKER);
  if (chunkMarkerIndex === -1) return null;

  const version = remainder.slice(0, chunkMarkerIndex);
  const indexValue = remainder.slice(chunkMarkerIndex + STOREFRONT_CONFIG_CHUNK_MARKER.length);
  const index = Number.parseInt(indexValue, 10);

  if (!version || !Number.isFinite(index)) return null;

  return { version, type: "chunk" as const, index };
};

const collectStorefrontConfigEntry = (rows: StorefrontBeatTagRow[], key: string) => {
  const chunkGroups = new Map<string, { index: number; value: string }[]>();
  const completionGroups = new Map<string, number>();

  rows.forEach((row) => {
    const chunkInfo = parseStorefrontConfigChunkInfo(row.beat_id, key);
    if (!chunkInfo) return;

    if (chunkInfo.type === "complete") {
      completionGroups.set(chunkInfo.version, Number.parseInt(row.tag, 10));
      return;
    }

    const currentGroup = chunkGroups.get(chunkInfo.version) ?? [];
    currentGroup.push({ index: chunkInfo.index, value: row.tag });
    chunkGroups.set(chunkInfo.version, currentGroup);
  });

  if (chunkGroups.size > 0) {
    const latestVersion = [...chunkGroups.keys()]
      .filter((version) => {
        const chunkCount = completionGroups.get(version);
        return Number.isFinite(chunkCount) && chunkCount === chunkGroups.get(version)?.length;
      })
      .sort((left, right) => left.localeCompare(right))
      .at(-1);
    if (latestVersion) {
      return chunkGroups
        .get(latestVersion)!
        .sort((left, right) => left.index - right.index)
        .map((entry) => entry.value)
        .join("");
    }
  }

  const exactRow = rows.filter((row) => row.beat_id === key).at(-1);
  return exactRow?.tag;
};

const parseConfigJson = <T,>(value: string | undefined, parser: (source: unknown) => T): T | undefined => {
  if (!value) return undefined;
  try {
    return parser(JSON.parse(value));
  } catch {
    return undefined;
  }
};

const parseStorefrontSiteConfig = (rows: StorefrontBeatTagRow[]): Partial<StorefrontSiteConfig> => {
  return {
    uploadedBeats: parseConfigJson(collectStorefrontConfigEntry(rows, STOREFRONT_CONFIG_KEYS.uploadedBeats), normalizeBeatArray),
    storeItems: parseConfigJson(collectStorefrontConfigEntry(rows, STOREFRONT_CONFIG_KEYS.storeItems), normalizeStoreItemArray),
    featuredBeatIds: parseConfigJson(collectStorefrontConfigEntry(rows, STOREFRONT_CONFIG_KEYS.featuredBeatIds), normalizeStringArray),
    featuredStoreItemIds: parseConfigJson(
      collectStorefrontConfigEntry(rows, STOREFRONT_CONFIG_KEYS.featuredStoreItemIds),
      normalizeFeaturedStoreItems,
    ),
    socialLinks: parseConfigJson(collectStorefrontConfigEntry(rows, STOREFRONT_CONFIG_KEYS.socialLinks), normalizeSocialLinks),
  };
};

const serializeStorefrontSiteConfig = (config: StorefrontSiteConfig) => JSON.stringify(config);
const normalizeStorefrontSiteConfig = (value: unknown): StorefrontSiteConfig => {
  const source =
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Partial<Record<keyof StorefrontSiteConfig, unknown>>)
      : {};

  return {
    uploadedBeats: normalizeBeatArray(source.uploadedBeats),
    storeItems: normalizeStoreItemArray(source.storeItems),
    featuredBeatIds: normalizeStringArray(source.featuredBeatIds),
    featuredStoreItemIds: normalizeFeaturedStoreItems(source.featuredStoreItemIds),
    socialLinks: normalizeSocialLinks(source.socialLinks),
  };
};

const normalizeFeaturedStoreItems = (value: unknown): Record<StoreSectionName, string[]> => {
  const source =
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Partial<Record<StoreSectionName, unknown>>)
      : {};

  return {
    drumkits: normalizeStringArray(source.drumkits),
    loops: normalizeStringArray(source.loops),
    artwork: normalizeStringArray(source.artwork),
  };
};

const getStorefrontMetadata = (value: unknown): StorefrontUserMetadata | null => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  const nested = source.void_storefront;
  if (typeof nested !== "object" || nested === null || Array.isArray(nested)) return null;
  const storefront = nested as Record<string, unknown>;
  return {
    profile:
      typeof storefront.profile === "object" && storefront.profile !== null && !Array.isArray(storefront.profile)
        ? (storefront.profile as Partial<ProfileForm>)
        : undefined,
    favorites: normalizeStringArray(storefront.favorites),
    playlist: normalizeStringArray(storefront.playlist),
    orders: normalizeOrders(storefront.orders),
    promoCodes: normalizeStringArray(storefront.promoCodes),
    updatedAt: typeof storefront.updatedAt === "string" ? storefront.updatedAt : undefined,
  };
};

const sanitizeProfileForPersistence = (profile: ProfileForm): ProfileForm => ({
  ...profile,
  profilePhoto: "",
  cardNumber: "",
  expiryDate: "",
  cvv: "",
  routingNumber: "",
  accountNumber: "",
});

const resizeProfilePhoto = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(reader.error ?? new Error("Failed to read image."));
    reader.onload = () => {
      const source = typeof reader.result === "string" ? reader.result : "";
      if (!source || typeof document === "undefined") {
        resolve(source);
        return;
      }

      const image = document.createElement("img");
      image.onload = () => {
        const maxDimension = 640;
        const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));

        const context = canvas.getContext("2d");
        if (!context) {
          resolve(source);
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.84));
      };
      image.onerror = () => resolve(source);
      image.src = source;
    };

    reader.readAsDataURL(file);
  });

const defaultStoreItems: StoreItem[] = [];

const mainLinks: { id: SectionId; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "beats", label: "Beats", icon: Music2 },
  { id: "drumkits", label: "Drumkits", icon: ShoppingBag },
  { id: "loops", label: "Loops", icon: Heart },
  { id: "artwork", label: "Artwork", icon: Image },
  { id: "contact", label: "Contact", icon: Mail },
  { id: "socials", label: "Socials", icon: Instagram },
  { id: "terms", label: "Terms", icon: BadgeInfo },
];

const Field = ({ label }: { label: string }) => (
  <div>
    <label className="mb-2 block text-xs font-medium text-white/60">{label}</label>
    <input className="void-dashboard-input" />
  </div>
);

const InfoPanel = ({ title, body }: { title: string; body: string }) => (
  <div className="void-dashboard-panel p-6 sm:p-7">
    <h2 className="text-3xl font-bold text-white sm:text-4xl">{title}</h2>
    <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 sm:text-base">{body}</p>
  </div>
);

const LegalSection = ({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(16,16,18,0.92),rgba(9,9,10,0.98))] p-5 sm:p-6">
    <p className="text-[11px] uppercase tracking-[0.28em] text-white/40">Section {number}</p>
    <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">{title}</h2>
    <div className="mt-4 space-y-4 text-sm leading-7 text-white/72 sm:text-base">{children}</div>
  </section>
);

const SectionFrame = ({
  variant,
  children,
}: {
  variant?: "editorial" | "crimson" | "metal";
  children: React.ReactNode;
}) => (
  <div className={`void-section-surface ${variant === "crimson" ? "void-section-crimson" : variant === "metal" ? "void-section-metal" : "void-section-editorial"}`}>
    <div className="void-section-inner">{children}</div>
  </div>
);

const resolveAdminPassword = () => FILE_ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;

const AccountPanel = ({
  title,
  description,
  primary,
  secondary,
  onSecondary,
}: {
  title: string;
  description: string;
  primary: string;
  secondary: string;
  onSecondary: () => void;
}) => (
  <div className="void-dashboard-panel p-6 sm:p-7">
    <p className="text-[11px] uppercase tracking-[0.28em] text-white/40">Account</p>
    <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">{title}</h2>
    <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 sm:text-base">{description}</p>
    <div className="mt-6 flex flex-wrap gap-3">
      <Link to="/auth" className="void-dashboard-primary">
        {primary}
      </Link>
      <button type="button" onClick={onSecondary} className="void-dashboard-secondary">
        {secondary}
      </button>
    </div>
  </div>
);

const StoreSection = ({
  title,
  items,
  favorites,
  toggleFavorite,
  queueIds,
  toggleQueue,
  adminUnlocked,
  section,
  featuredIds,
  onToggleFeatured,
  featuredManagerOpen,
  onToggleFeaturedManager,
  uploadOpen,
  onToggleUploadManager,
  uploadDraft,
  onUploadDraftChange,
  onUploadFile,
  onSubmitUpload,
}: {
  title: string;
  items: StoreItem[];
  favorites: string[];
  toggleFavorite: (itemId: string) => void;
  queueIds: string[];
  toggleQueue: (item: StoreItem) => void;
  adminUnlocked: boolean;
  section: "drumkits" | "loops" | "artwork";
  featuredIds: string[];
  onToggleFeatured: (itemId: string) => void;
  featuredManagerOpen: boolean;
  onToggleFeaturedManager: () => void;
  uploadOpen: boolean;
  onToggleUploadManager: () => void;
  uploadDraft: StoreUploadDraft;
  onUploadDraftChange: (field: keyof StoreUploadDraft, value: string) => void;
  onUploadFile: (field: "imageUrl" | "previewUrl", event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmitUpload: () => void;
}) => (
  <div className="space-y-4">
    <div className="void-store-pagehead void-store-pagehead-centered void-store-pagehead-floating">
      <div>
        <h1 className="void-store-page-title void-store-page-title-beats">{title}</h1>
        <p className="void-store-page-subtitle">by ejcertified</p>
      </div>
      {adminUnlocked ? (
        <div className="void-store-page-actions flex-wrap justify-center">
          <button type="button" onClick={onToggleUploadManager} className="inline-flex items-center gap-2 rounded-full bg-[#ff8a63] px-4 py-3 text-sm font-semibold text-white">
            <Upload size={16} />
            Add {title}
          </button>
          <button type="button" onClick={onToggleFeaturedManager} className="void-store-pill-button">
            {featuredIds.length ? `Change Featured ${title}` : `Add Featured ${title}`}
          </button>
        </div>
      ) : null}
    </div>
    {adminUnlocked && uploadOpen ? (
      <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,18,22,0.96),rgba(10,10,12,0.98))] p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">{title} Title</label>
            <input
              value={uploadDraft.title}
              onChange={(event) => onUploadDraftChange("title", event.target.value)}
              className="void-dashboard-input"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Subtitle</label>
            <input
              value={uploadDraft.subtitle}
              onChange={(event) => onUploadDraftChange("subtitle", event.target.value)}
              placeholder="by ejcertified"
              className="void-dashboard-input"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">JPEG / Cover Image</label>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white/8 px-4 py-3 text-sm text-white/72">
              <Upload size={15} />
              {uploadDraft.imageUrl ? "Image selected" : "Upload image"}
              <input type="file" accept="image/*" onChange={(event) => onUploadFile("imageUrl", event)} className="hidden" />
            </label>
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">
              {section === "artwork" ? "Optional Preview Audio" : "Optional Audio / Preview"}
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white/8 px-4 py-3 text-sm text-white/72">
              <Upload size={15} />
              {uploadDraft.previewUrl ? "Audio selected" : "Upload audio"}
              <input type="file" accept="audio/*" onChange={(event) => onUploadFile("previewUrl", event)} className="hidden" />
            </label>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={onSubmitUpload} className="void-dashboard-primary">
            Add {title}
          </button>
          <button type="button" onClick={onToggleUploadManager} className="void-store-pill-button">
            Close
          </button>
        </div>
      </div>
    ) : null}
    {adminUnlocked && featuredManagerOpen ? (
      <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,18,22,0.96),rgba(10,10,12,0.98))] p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#ffb59b]">Admin Featured {title}</p>
            <p className="mt-2 text-sm text-white/58">Select up to 3 {title.toLowerCase()} to show on the homepage.</p>
          </div>
          <span className="rounded-full bg-white/8 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-white/55">
            {featuredIds.length}/3 selected
          </span>
        </div>
        {items.length ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <button
                key={`${section}-featured-${item.id}`}
                type="button"
                onClick={() => onToggleFeatured(item.id)}
                className={`rounded-2xl border px-4 py-3 text-left text-sm ${
                  featuredIds.includes(item.id)
                    ? "border-[#ff8a63]/60 bg-[#ff8a63]/12 text-white"
                    : "border-white/8 bg-white/[0.03] text-white/72"
                }`}
              >
                <span className="block font-semibold">{item.title}</span>
                <span className="mt-1 block text-xs text-white/48">{featuredIds.includes(item.id) ? "Featured on homepage" : "Click to feature"}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-5 text-sm text-white/56">
            Upload {title.toLowerCase()} first, then choose which ones should be featured on the homepage.
          </div>
        )}
      </div>
    ) : null}
    {items.length === 0 ? (
      <div className="void-dashboard-panel p-6 text-sm text-white/60">No {title.toLowerCase()} uploaded yet.</div>
    ) : (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">
        {items.map((item) => (
          <div key={item.id} className="void-dashboard-card void-product-card">
            {item.imageUrl ? (
              <div className="void-product-media overflow-hidden rounded-[14px]">
                <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className={`void-dashboard-cover ${item.accentClass}`} />
            )}
            <div className="mt-2.5">
              <p className="text-sm font-semibold text-white">{item.title}</p>
              <p className="mt-1.5 text-xs leading-5 text-white/45">{item.subtitle}</p>
              {adminUnlocked ? (
                <button
                  type="button"
                  onClick={() => onToggleFeatured(item.id)}
                  className={`mt-2 inline-flex rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] ${
                    featuredIds.includes(item.id) ? "bg-[#ff8a63] text-white" : "bg-white/8 text-white/60"
                  }`}
                >
                  {featuredIds.includes(item.id) ? "Featured" : "Add To Featured"}
                </button>
              ) : null}
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <select className="void-dashboard-select w-full min-w-0">
                <option>Basic Lease - $20</option>
                <option>Exclusive Lease - $100</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => toggleFavorite(item.id)}
                  className={`void-product-pill ${favorites.includes(item.id) ? "bg-[#ff8a63] text-white" : "bg-white/8 text-white/70"}`}
                >
                  <Heart size={14} fill={favorites.includes(item.id) ? "currentColor" : "none"} />
                  Favorite
                </button>
                {item.section === "loops" ? (
                  <button
                    type="button"
                    onClick={() => toggleQueue(item)}
                    className={`void-product-pill ${queueIds.includes(item.id) ? "bg-white text-black" : "bg-white/8 text-white/70"}`}
                  >
                    <ListMusic size={14} />
                    Up Next
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewTimerRef = useRef<number | null>(null);
  const queueItemsRef = useRef<StoreItem[]>([]);
  const allBeatsRef = useRef<Beat[]>(beats);
  const [activeSection, setActiveSection] = useState<SectionId>("home");
  const [selectedBeatId, setSelectedBeatId] = useState(beats[0].id);
  const [uploadedBeats, setUploadedBeats] = useState<Beat[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPreviewBeatId, setCurrentPreviewBeatId] = useState<string | null>(null);
  const [previewProgress, setPreviewProgress] = useState<Record<string, number>>({});
  const [licenseSelections, setLicenseSelections] = useState<Record<string, LicenseName>>(
    Object.fromEntries(beats.map((beat) => [beat.id, "Basic Lease"])) as Record<string, LicenseName>,
  );
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({
    vvv: 0,
    "fake-bih": 0,
    "brunson-is-trash-omg": 0,
    "die-4-u": 0,
    "same-ole-shii": 0,
    sosa: 0,
    "just-lost-100": 0,
    "tats-on-my-arm": 0,
    "6th-angel": 0,
    "kit-1": 0,
    "kit-2": 0,
    "loop-1": 0,
    "loop-2": 0,
    "art-1": 0,
    "art-2": 0,
  });
  const [likedItems, setLikedItems] = useState<Record<string, boolean>>({});
  const [cartItems, setCartItems] = useState<{ beatId: string; license: LicenseName; price: number; audioUrl: string }[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [beatTags, setBeatTags] = useState<Record<string, string[]>>(DEFAULT_BEAT_TAGS);
  const [tagDrafts, setTagDrafts] = useState<Record<string, string>>({});
  const [activeTagFilter, setActiveTagFilter] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileTab, setProfileTab] = useState<ProfileTab>("edit");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>("Bank Card");
  const [checkoutForm, setCheckoutForm] = useState<PaymentDetails>(createEmptyPaymentDetails());
  const [profileForm, setProfileForm] = useState<ProfileForm>(DEFAULT_PROFILE_FORM);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [playlist, setPlaylist] = useState<string[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [checkoutPromoCode, setCheckoutPromoCode] = useState("");
  const [profilePromoCode, setProfilePromoCode] = useState("");
  const [savedPromoCodes, setSavedPromoCodes] = useState<string[]>([]);
  const [locationQuery, setLocationQuery] = useState("");
  const [storeItems, setStoreItems] = useState<StoreItem[]>(defaultStoreItems);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(DEFAULT_SOCIAL_LINKS);
  const [contactForm, setContactForm] = useState<ContactForm>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [queueItems, setQueueItems] = useState<StoreItem[]>([]);
  const [userStateLoaded, setUserStateLoaded] = useState(false);
  const [storefrontConfigLoaded, setStorefrontConfigLoaded] = useState(false);
  const [storefrontSaveState, setStorefrontSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const userStateSaveTimerRef = useRef<number | null>(null);
  const storefrontConfigFingerprintRef = useRef("");
  const [accountProfile, setAccountProfile] = useState<ProfileRow | null>(null);
  const [featuredBeatIds, setFeaturedBeatIds] = useState<string[]>(DEFAULT_FEATURED_BEAT_IDS);
  const [featuredStoreItemIds, setFeaturedStoreItemIds] = useState<Record<StoreSectionName, string[]>>(DEFAULT_FEATURED_STORE_ITEM_IDS);
  const [adminToolOpen, setAdminToolOpen] = useState<Record<AdminToolKey, boolean>>({
    "add-beat": false,
    "add-drumkits": false,
    "add-loops": false,
    "add-artwork": false,
    beats: false,
    drumkits: false,
    loops: false,
    artwork: false,
  });
  const [beatUploadDraft, setBeatUploadDraft] = useState({
    title: "",
    bpm: "",
    tags: "",
    imageUrl: "",
    audioUrl: "",
  });
  const [storeUploadDrafts, setStoreUploadDrafts] = useState<Record<StoreSectionName, StoreUploadDraft>>({
    drumkits: createEmptyStoreUploadDraft(),
    loops: createEmptyStoreUploadDraft(),
    artwork: createEmptyStoreUploadDraft(),
  });

  const allBeats = useMemo(() => [...beats, ...uploadedBeats], [uploadedBeats]);
  const storefrontConfigSnapshot = useMemo(
    () =>
      serializeStorefrontSiteConfig({
        uploadedBeats,
        storeItems,
        featuredBeatIds,
        featuredStoreItemIds,
        socialLinks,
      }),
    [featuredBeatIds, featuredStoreItemIds, socialLinks, storeItems, uploadedBeats],
  );
  const storefrontConfigDirty = storefrontConfigLoaded && storefrontConfigSnapshot !== storefrontConfigFingerprintRef.current;

  useEffect(() => {
    queueItemsRef.current = queueItems;
  }, [queueItems]);

  useEffect(() => {
    allBeatsRef.current = allBeats;
  }, [allBeats]);

  const syncBeatTagsToCache = (nextBeatTags: Record<string, string[]>) => {
    setBeatTags(nextBeatTags);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(BEAT_TAGS_STORAGE_KEY, JSON.stringify(nextBeatTags));
    }
  };

  const createAccountMetadataPayload = () => {
    const existingMetadata =
      typeof user?.user_metadata === "object" && user.user_metadata !== null && !Array.isArray(user.user_metadata)
        ? (user.user_metadata as Record<string, unknown>)
        : {};

    return {
      ...existingMetadata,
      display_name: profileForm.displayName || existingMetadata.display_name || user?.email?.split("@")[0] || "VOID user",
      void_storefront: {
        profile: sanitizeProfileForPersistence(profileForm),
        favorites,
        playlist,
        orders,
        promoCodes: savedPromoCodes,
        updatedAt: new Date().toISOString(),
      },
    };
  };

  const filteredBeats = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allBeats.filter((beat) => {
      const currentTags = beatTags[beat.id] ?? beat.tags;
      const queryMatch =
        query.length === 0 ||
        beat.title.toLowerCase().includes(query) ||
        beat.artist.toLowerCase().includes(query) ||
        currentTags.some((tag) => tag.toLowerCase().includes(query));
      const tagMatch =
        activeTagFilter.length === 0 ||
        currentTags.some((tag) => tag.toLowerCase() === activeTagFilter.toLowerCase());
      return queryMatch && tagMatch;
    });
  }, [activeTagFilter, allBeats, beatTags, searchQuery]);

  const allBeatTags = useMemo(
    () =>
      Array.from(
        new Set(
          Object.values(beatTags).flatMap((tags) => tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0)),
        ),
      ),
    [beatTags],
  );

  useEffect(() => {
    if (activeTagFilter && !allBeatTags.some((tag) => tag.toLowerCase() === activeTagFilter.toLowerCase())) {
      setActiveTagFilter("");
    }
  }, [activeTagFilter, allBeatTags]);

  const selectedBeat =
    filteredBeats.find((beat) => beat.id === selectedBeatId) ??
    allBeats.find((beat) => beat.id === selectedBeatId) ??
    allBeats[0];

  const featuredHomeBeats = featuredBeatIds
    .map((beatId) => allBeats.find((beat) => beat.id === beatId))
    .filter((beat): beat is Beat => Boolean(beat));

  const selectedLicense = licenseSelections[selectedBeat.id] ?? "Basic Lease";
  const selectedPrice = LICENSES[selectedLicense];
  const selectedBeatImage = getBeatImageUrl(selectedBeat);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price, 0);
  const queueBeats = cartItems.map((item) => allBeats.find((beat) => beat.id === item.beatId)).filter(Boolean) as Beat[];
  const featuredStoreItems = useMemo(
    () =>
      ({
        drumkits: featuredStoreItemIds.drumkits
          .map((itemId) => storeItems.find((item) => item.id === itemId && item.section === "drumkits"))
          .filter((item): item is StoreItem => Boolean(item))
          .slice(0, 3),
        loops: featuredStoreItemIds.loops
          .map((itemId) => storeItems.find((item) => item.id === itemId && item.section === "loops"))
          .filter((item): item is StoreItem => Boolean(item))
          .slice(0, 3),
        artwork: featuredStoreItemIds.artwork
          .map((itemId) => storeItems.find((item) => item.id === itemId && item.section === "artwork"))
          .filter((item): item is StoreItem => Boolean(item))
          .slice(0, 3),
      }) satisfies Record<StoreSectionName, StoreItem[]>,
    [featuredStoreItemIds, storeItems],
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const resolvedAdminPassword = resolveAdminPassword();

      window.localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, resolvedAdminPassword);

      const storedBeatTags = window.localStorage.getItem(BEAT_TAGS_STORAGE_KEY);
      if (storedBeatTags) {
        try {
          const parsed = JSON.parse(storedBeatTags) as Record<string, string[]>;
          syncBeatTagsToCache({
            ...DEFAULT_BEAT_TAGS,
            ...Object.fromEntries(
              Object.entries(parsed).map(([beatId, tags]) => [
                beatId,
                Array.isArray(tags)
                  ? normalizeTagList(tags.filter((tag): tag is string => typeof tag === "string"))
                  : DEFAULT_BEAT_TAGS[beatId] ?? [],
              ]),
            ),
          });
        } catch {
          window.localStorage.removeItem(BEAT_TAGS_STORAGE_KEY);
        }
      }

      const storedProfile = window.localStorage.getItem(PROFILE_STORAGE_KEY);
      if (storedProfile) {
        try {
          const parsedProfile = { ...profileForm, ...JSON.parse(storedProfile) };
          setProfileForm(parsedProfile);
          setLocationQuery(parsedProfile.location ?? "");
        } catch {
          window.localStorage.removeItem(PROFILE_STORAGE_KEY);
        }
      }

      const storedFavorites = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (storedFavorites) {
        try {
          const parsed = JSON.parse(storedFavorites);
          if (Array.isArray(parsed)) setFavorites(parsed);
        } catch {
          window.localStorage.removeItem(FAVORITES_STORAGE_KEY);
        }
      }

      const storedPlaylist = window.localStorage.getItem(PLAYLIST_STORAGE_KEY);
      if (storedPlaylist) {
        try {
          const parsed = JSON.parse(storedPlaylist);
          if (Array.isArray(parsed)) setPlaylist(parsed);
        } catch {
          window.localStorage.removeItem(PLAYLIST_STORAGE_KEY);
        }
      }

      const storedOrders = window.localStorage.getItem(ORDERS_STORAGE_KEY);
      if (storedOrders) {
        try {
          const parsed = JSON.parse(storedOrders);
          if (Array.isArray(parsed)) setOrders(parsed);
        } catch {
          window.localStorage.removeItem(ORDERS_STORAGE_KEY);
        }
      }

      const storedPromos = window.localStorage.getItem(PROMO_STORAGE_KEY);
      if (storedPromos) {
        try {
          const parsed = JSON.parse(storedPromos);
          if (Array.isArray(parsed)) setSavedPromoCodes(parsed);
        } catch {
          window.localStorage.removeItem(PROMO_STORAGE_KEY);
        }
      }

      const storedContactMessages = window.localStorage.getItem(CONTACT_MESSAGES_STORAGE_KEY);
      if (storedContactMessages) {
        try {
          const parsed = JSON.parse(storedContactMessages);
          if (Array.isArray(parsed)) {
            setContactMessages(
              parsed.filter(
                (message): message is ContactMessage =>
                  typeof message === "object" &&
                  message !== null &&
                  typeof message.id === "string" &&
                  typeof message.name === "string" &&
                  typeof message.email === "string" &&
                  typeof message.subject === "string" &&
                  typeof message.message === "string" &&
                  typeof message.submittedAt === "string",
              ),
            );
          }
        } catch {
          window.localStorage.removeItem(CONTACT_MESSAGES_STORAGE_KEY);
        }
      }
    }

    return () => {
      if (previewTimerRef.current) window.clearInterval(previewTimerRef.current);
      if (audioRef.current) {
        audioRef.current.onended = null;
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const seedDefaultBeatTags = async () => {
      const seedRows = Object.entries(DEFAULT_BEAT_TAGS).flatMap(([beatId, tags]) =>
        normalizeTagList(tags).map((tag) => ({ beat_id: beatId, tag })),
      );

      if (!seedRows.length) return;

      await supabase.from("storefront_beat_tags").upsert(seedRows, {
        onConflict: "beat_id,tag",
        ignoreDuplicates: true,
      });
    };

    const loadStorefrontRowsFromSupabase = async () => {
      const { data, error } = await supabase
        .from("storefront_beat_tags")
        .select("id, beat_id, tag, created_at")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Failed to load storefront beat tags from Supabase.", error);
        if (isActive) setStorefrontConfigLoaded(true);
        return;
      }

      if (!isActive) return;

      if (!data.length) {
        syncBeatTagsToCache(DEFAULT_BEAT_TAGS);
        await seedDefaultBeatTags();
        setUploadedBeats([]);
        setStoreItems(defaultStoreItems);
        setFeaturedBeatIds(DEFAULT_FEATURED_BEAT_IDS);
        setFeaturedStoreItemIds(DEFAULT_FEATURED_STORE_ITEM_IDS);
        setSocialLinks(DEFAULT_SOCIAL_LINKS);
        storefrontConfigFingerprintRef.current = serializeStorefrontSiteConfig({
          uploadedBeats: [],
          storeItems: defaultStoreItems,
          featuredBeatIds: DEFAULT_FEATURED_BEAT_IDS,
          featuredStoreItemIds: DEFAULT_FEATURED_STORE_ITEM_IDS,
          socialLinks: DEFAULT_SOCIAL_LINKS,
        });
        setStorefrontConfigLoaded(true);
        return;
      }

      syncBeatTagsToCache(buildBeatTagsFromRows(data));

      try {
        const siteConfig = parseStorefrontSiteConfig(data);
        const nextConfig: StorefrontSiteConfig = {
          uploadedBeats: siteConfig.uploadedBeats ?? [],
          storeItems: siteConfig.storeItems ?? defaultStoreItems,
          featuredBeatIds:
            siteConfig.featuredBeatIds && siteConfig.featuredBeatIds.length > 0
              ? siteConfig.featuredBeatIds
              : DEFAULT_FEATURED_BEAT_IDS,
          featuredStoreItemIds: siteConfig.featuredStoreItemIds ?? DEFAULT_FEATURED_STORE_ITEM_IDS,
          socialLinks: siteConfig.socialLinks ?? DEFAULT_SOCIAL_LINKS,
        };

        setUploadedBeats(nextConfig.uploadedBeats);
        setStoreItems(nextConfig.storeItems);
        setFeaturedBeatIds(nextConfig.featuredBeatIds);
        setFeaturedStoreItemIds(nextConfig.featuredStoreItemIds);
        setSocialLinks(nextConfig.socialLinks);
        storefrontConfigFingerprintRef.current = serializeStorefrontSiteConfig(nextConfig);

        if (typeof window !== "undefined") {
          window.localStorage.setItem(PUBLISHED_STOREFRONT_STORAGE_KEY, serializeStorefrontSiteConfig(nextConfig));
        }
      } catch (configError) {
        console.error("Failed to parse shared storefront config from Supabase.", configError);
      } finally {
        setStorefrontConfigLoaded(true);
      }
    };

    void loadStorefrontRowsFromSupabase();

    const channel = supabase
      .channel("storefront-beat-tags")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "storefront_beat_tags" },
        () => {
          void loadStorefrontRowsFromSupabase();
        },
      )
      .subscribe();

    return () => {
      isActive = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadAccountState = async () => {
      if (!user) {
        setAccountProfile(null);
        setUserStateLoaded(true);
        return;
      }

      setUserStateLoaded(false);

      const storefrontMetadata = getStorefrontMetadata(user.user_metadata);
      const nextProfile = storefrontMetadata ? normalizeProfileForm(storefrontMetadata.profile) : profileForm;

      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, username, display_name, avatar_url, created_at, updated_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!isActive) return;

      if (error) {
        console.error("Failed to load profile row from Supabase.", error);
      } else {
        setAccountProfile(data ?? null);
      }

      const profileDisplayName =
        data?.display_name ??
        (typeof user.user_metadata?.display_name === "string" ? user.user_metadata.display_name : nextProfile.displayName);
      const profilePhoto = data?.avatar_url ?? nextProfile.profilePhoto;

      const resolvedProfile = normalizeProfileForm({
        ...(storefrontMetadata ? nextProfile : profileForm),
        displayName: profileDisplayName,
        profilePhoto,
      });

      setProfileForm(resolvedProfile);
      setLocationQuery(resolvedProfile.location);
      setSelectedPaymentMethod(resolvedProfile.paymentMethods[0] ?? "Bank Card");

      if (storefrontMetadata) {
        setFavorites(storefrontMetadata.favorites ?? []);
        setPlaylist(storefrontMetadata.playlist ?? []);
        setOrders(storefrontMetadata.orders ?? []);
        setSavedPromoCodes(storefrontMetadata.promoCodes ?? []);
      }

      setUserStateLoaded(true);
    };

    void loadAccountState();

    return () => {
      isActive = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileForm));
    }
  }, [profileForm]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    }
  }, [favorites]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify(playlist));
    }
  }, [playlist]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    }
  }, [orders]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(savedPromoCodes));
    }
  }, [savedPromoCodes]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CONTACT_MESSAGES_STORAGE_KEY, JSON.stringify(contactMessages));
    }
  }, [contactMessages]);

  useEffect(() => {
    if (!adminUnlocked) {
      setStorefrontSaveState("idle");
      return;
    }

    if (storefrontConfigDirty && storefrontSaveState !== "saving") {
      setStorefrontSaveState("idle");
    }
  }, [adminUnlocked, storefrontConfigDirty, storefrontSaveState]);

  useEffect(() => {
    if (!user || !userStateLoaded || typeof window === "undefined") return;

    if (userStateSaveTimerRef.current) {
      window.clearTimeout(userStateSaveTimerRef.current);
    }

    userStateSaveTimerRef.current = window.setTimeout(async () => {
      const usernameBase =
        (typeof user.user_metadata?.username === "string" ? user.user_metadata.username : "") ||
        user.email?.split("@")[0] ||
        "void-user";
      const username =
        accountProfile?.username ||
        `${usernameBase.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "void-user"}-${user.id.slice(0, 8)}`;

      const [authResult, profileResult] = await Promise.all([
        supabase.auth.updateUser({
          data: createAccountMetadataPayload(),
        }),
        supabase
          .from("profiles")
          .upsert(
            {
              user_id: user.id,
              username,
              display_name: profileForm.displayName || null,
              avatar_url: profileForm.profilePhoto || null,
            },
            { onConflict: "user_id" },
          )
          .select("id, user_id, username, display_name, avatar_url, created_at, updated_at")
          .maybeSingle(),
      ]);

      if (authResult.error) {
        console.error("Failed to save storefront account metadata to Supabase.", authResult.error);
      }

      if (profileResult.error) {
        console.error("Failed to save storefront profile row to Supabase.", profileResult.error);
      } else if (profileResult.data) {
        setAccountProfile(profileResult.data);
      }
    }, 300);

    return () => {
      if (userStateSaveTimerRef.current) {
        window.clearTimeout(userStateSaveTimerRef.current);
      }
    };
  }, [accountProfile?.username, favorites, orders, playlist, profileForm, savedPromoCodes, user?.id, userStateLoaded]);

  const openAuth = (mode: "signin" | "signup") => {
    setActiveSection(mode);
    navigate("/auth");
  };

  const saveStorefrontChanges = async () => {
    if (!adminUnlocked) return;

    setStorefrontSaveState("saving");
    const publishedConfig: StorefrontSiteConfig = {
      uploadedBeats,
      storeItems,
      featuredBeatIds,
      featuredStoreItemIds,
      socialLinks,
    };

    const configRows = [
      buildStorefrontConfigRows(STOREFRONT_CONFIG_KEYS.featuredBeatIds, JSON.stringify(featuredBeatIds)),
      buildStorefrontConfigRows(STOREFRONT_CONFIG_KEYS.featuredStoreItemIds, JSON.stringify(featuredStoreItemIds)),
      buildStorefrontConfigRows(STOREFRONT_CONFIG_KEYS.socialLinks, JSON.stringify(socialLinks)),
      buildStorefrontConfigRows(STOREFRONT_CONFIG_KEYS.uploadedBeats, JSON.stringify(uploadedBeats)),
      buildStorefrontConfigRows(STOREFRONT_CONFIG_KEYS.storeItems, JSON.stringify(storeItems)),
    ];

    for (const rowGroup of configRows) {
      const { error: chunkError } = await supabase.from("storefront_beat_tags").insert(rowGroup.chunkRows);

      if (chunkError) {
        console.error("Failed to save shared storefront config chunks to Supabase.", chunkError);
        setStorefrontSaveState("error");
        return;
      }

      const { error: completeError } = await supabase.from("storefront_beat_tags").insert(rowGroup.completeRow);

      if (completeError) {
        console.error("Failed to finalize shared storefront config in Supabase.", completeError);
        setStorefrontSaveState("error");
        return;
      }
    }

    storefrontConfigFingerprintRef.current = storefrontConfigSnapshot;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PUBLISHED_STOREFRONT_STORAGE_KEY, serializeStorefrontSiteConfig(publishedConfig));
    }

    setStorefrontSaveState("saved");
  };

  const toggleFavorite = (itemId: string) => {
    setFavorites((current) => (current.includes(itemId) ? current.filter((entry) => entry !== itemId) : [...current, itemId]));
  };

  const togglePlaylist = (beatId: string) => {
    setPlaylist((current) => (current.includes(beatId) ? current.filter((entry) => entry !== beatId) : [...current, beatId]));
  };

  const toggleUpNextBeat = (beat: Beat) => {
    setQueueItems((current) =>
      current.some((item) => item.id === beat.id)
        ? current.filter((item) => item.id !== beat.id)
        : [...current, { id: beat.id, title: beat.title, subtitle: beat.artist, section: "loops", accentClass: "void-dashboard-cover", previewUrl: beat.previewUrl, imageUrl: getBeatImageUrl(beat) }]
    );
  };

  const toggleUpNextItem = (item: StoreItem) => {
    setQueueItems((current) => (current.some((entry) => entry.id === item.id) ? current.filter((entry) => entry.id !== item.id) : [...current, item]));
  };

  const savePaymentMethod = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    setProfileForm((current) => ({
      ...current,
      paymentMethods: current.paymentMethods.includes(method) ? current.paymentMethods : [...current.paymentMethods, method],
    }));
  };

  const selectCheckoutPaymentMethod = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
  };

  const applyPromoCode = (source: "checkout" | "profile") => {
    const code = (source === "checkout" ? checkoutPromoCode : profilePromoCode).trim();
    if (!code) return;
    setSavedPromoCodes((current) => (current.includes(code) ? current : [...current, code]));
    if (source === "checkout") setCheckoutPromoCode("");
    if (source === "profile") setProfilePromoCode("");
  };

  const handleProfilePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    try {
      const result = await resizeProfilePhoto(file);
      setProfileForm((current) => ({ ...current, profilePhoto: result }));
    } catch (error) {
      console.error("Failed to process profile photo.", error);
    } finally {
      event.target.value = "";
    }
  };

  const openExternalConnect = (url: string) => {
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const unlockAdmin = () => {
    if (typeof window === "undefined") return;
    const savedPassword = resolveAdminPassword();
    const enteredPassword = window.prompt("Enter admin password");
    if (!enteredPassword) return;
    if (enteredPassword.trim() === savedPassword) {
      window.localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, savedPassword);
      setAdminUnlocked(true);
      return;
    }
    window.alert("Incorrect admin password.");
  };

  const addTagToBeat = async (beatId: string) => {
    if (!adminUnlocked) return;
    const nextTag = (tagDrafts[beatId] ?? "").trim();
    if (!nextTag) return;

    const currentBeatTags = beatTags[beatId] ?? DEFAULT_BEAT_TAGS[beatId] ?? [];
    if (currentBeatTags.some((tag) => tag.toLowerCase() === nextTag.toLowerCase())) {
      return;
    }

    const nextBeatTags = {
      ...beatTags,
      [beatId]: [...currentBeatTags, nextTag],
    };

    syncBeatTagsToCache(nextBeatTags);

    setTagDrafts((current) => ({ ...current, [beatId]: "" }));

    const { error } = await supabase.from("storefront_beat_tags").upsert(
      {
        beat_id: beatId,
        tag: nextTag,
      },
      {
        onConflict: "beat_id,tag",
        ignoreDuplicates: true,
      },
    );

    if (error) {
      console.error("Failed to save storefront beat tag to Supabase.", error);
    }
  };

  const removeTagFromBeat = async (beatId: string, tagToRemove: string) => {
    if (!adminUnlocked) return;
    syncBeatTagsToCache({
      ...beatTags,
      [beatId]: (beatTags[beatId] ?? DEFAULT_BEAT_TAGS[beatId] ?? []).filter((tag) => tag !== tagToRemove),
    });

    const { error } = await supabase
      .from("storefront_beat_tags")
      .delete()
      .eq("beat_id", beatId)
      .eq("tag", tagToRemove);

    if (error) {
      console.error("Failed to remove storefront beat tag from Supabase.", error);
    }
  };

  const renderBeatTagFilters = (justifyClass = "") =>
    allBeatTags.length > 0 ? (
      <div className={`void-store-tagbar ${justifyClass}`.trim()}>
        <button
          type="button"
          onClick={() => setActiveTagFilter("")}
          className={`void-store-tag ${activeTagFilter.length === 0 ? "is-active" : ""}`}
        >
          All
        </button>
        {allBeatTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setActiveTagFilter((current) => (current.toLowerCase() === tag.toLowerCase() ? "" : tag))}
            className={`void-store-tag ${activeTagFilter.toLowerCase() === tag.toLowerCase() ? "is-active" : ""}`}
          >
            {tag}
          </button>
        ))}
      </div>
    ) : null;

  const toggleLike = (itemId: string) => {
    setLikedItems((current) => {
      const nextLiked = !current[itemId];
      setLikeCounts((counts) => ({
        ...counts,
        [itemId]: Math.max(0, (counts[itemId] ?? 0) + (nextLiked ? 1 : -1)),
      }));
      return { ...current, [itemId]: nextLiked };
    });
  };

  const clearPreviewTimer = () => {
    if (previewTimerRef.current) {
      window.clearInterval(previewTimerRef.current);
      previewTimerRef.current = null;
    }
  };

  const getNextQueuedBeat = (currentBeatId: string) => {
    const queuedBeats = queueItemsRef.current
      .map((item) => allBeatsRef.current.find((beat) => beat.id === item.id))
      .filter((beat): beat is Beat => Boolean(beat));
    const currentIndex = queuedBeats.findIndex((beat) => beat.id === currentBeatId);
    if (currentIndex === -1) return null;
    return queuedBeats[currentIndex + 1] ?? null;
  };

  const stopPreview = (options?: { resetBeatId?: string }) => {
    clearPreviewTimer();
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (options?.resetBeatId) {
      setPreviewProgress((state) => ({ ...state, [options.resetBeatId as string]: 0 }));
    }
    setCurrentPreviewBeatId(null);
  };

  const finishPreview = (beatId: string) => {
    clearPreviewTimer();
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setPreviewProgress((state) => ({ ...state, [beatId]: 0 }));
    setCurrentPreviewBeatId(null);

    const nextBeat = getNextQueuedBeat(beatId);
    if (nextBeat) {
      setSelectedBeatId(nextBeat.id);
      window.setTimeout(() => {
        void playPreview(nextBeat);
      }, 0);
    }
  };

  const playPreview = async (beat: Beat) => {
    if (currentPreviewBeatId === beat.id) {
      stopPreview({ resetBeatId: beat.id });
      return;
    }

    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;
    const previousBeatId = currentPreviewBeatId;

    clearPreviewTimer();
    audio.onended = null;
    audio.pause();
    audio.src = beat.previewUrl;
    audio.currentTime = 0;
    if (previousBeatId) {
      setPreviewProgress((state) => ({ ...state, [previousBeatId]: 0 }));
    }

    audio.onended = () => {
      finishPreview(beat.id);
    };

    try {
      await audio.play();
      setCurrentPreviewBeatId(beat.id);
      previewTimerRef.current = window.setInterval(() => {
        const current = Math.min(audio.currentTime, 30);
        setPreviewProgress((state) => ({ ...state, [beat.id]: (current / 30) * 100 }));
        if (audio.currentTime >= 30) {
          finishPreview(beat.id);
        }
      }, 200);
    } catch {
      stopPreview({ resetBeatId: beat.id });
    }
  };

  const syncCheckoutFromProfile = () => {
    setCheckoutForm(extractPaymentDetails(profileForm));
  };

  const addToCart = (beat: Beat) => {
    if (!user) {
      openAuth("signin");
      return;
    }
    const license = licenseSelections[beat.id] ?? "Basic Lease";
    setCartItems((current) => {
      const nextItem = { beatId: beat.id, license, price: LICENSES[license], audioUrl: beat.purchaseUrl };
      const filtered = current.filter((item) => item.beatId !== beat.id);
      return [...filtered, nextItem];
    });
    setCartOpen(true);
  };

  const proceedToCheckout = () => {
    if (!cartItems.length) return;
    if (!user) {
      openAuth("signin");
      return;
    }
    syncCheckoutFromProfile();
    setCartOpen(false);
    setActiveSection("checkout");
  };

  const handleQueuePlay = (beat: Beat) => {
    setSelectedBeatId(beat.id);
    void playPreview(beat);
  };

  const handleCheckout = () => {
    if (!cartItems.length) return;
    const purchasedItems: OrderItem[] = cartItems.map((item, index) => ({
      id: `${item.beatId}-${Date.now()}-${index}`,
      beatId: item.beatId,
      title: allBeats.find((beat) => beat.id === item.beatId)?.title ?? item.beatId,
      license: item.license,
      price: item.price,
      purchasedAt: new Date().toISOString(),
    }));
    setOrders((current) => [...purchasedItems, ...current]);
    setCartItems([]);
    setCartOpen(false);
    setActiveSection("profile");
    setProfileTab("orders");
  };

  const handleStoreUploadFile = (section: StoreSectionName, field: "imageUrl" | "previewUrl", event: React.ChangeEvent<HTMLInputElement>) => {
    if (!adminUnlocked) return;
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setStoreUploadDrafts((current) => ({
        ...current,
        [section]: {
          ...current[section],
          [field]: result,
        },
      }));
      event.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const submitStoreUpload = (section: StoreSectionName) => {
    if (!adminUnlocked) return;

    const draft = storeUploadDrafts[section];
    const title = draft.title.trim();
    const subtitle = draft.subtitle.trim();

    if (!title || !draft.imageUrl) {
      if (typeof window !== "undefined") {
        window.alert("Add a title and product image before uploading.");
      }
      return;
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    setStoreItems((current) => [
      ...current,
      {
        id: `${section}-${slug || "item"}-${Date.now()}`,
        title,
        subtitle: subtitle || "by ejcertified",
        section,
        accentClass: "void-dashboard-cover-alt",
        imageUrl: draft.imageUrl,
        previewUrl: draft.previewUrl || undefined,
      },
    ]);

    setStoreUploadDrafts((current) => ({
      ...current,
      [section]: createEmptyStoreUploadDraft(),
    }));
    setAdminToolOpen((current) => ({ ...current, [`add-${section}` as AdminToolKey]: false }));
  };

  const toggleAdminTool = (tool: AdminToolKey) => {
    setAdminToolOpen((current) => ({ ...current, [tool]: !current[tool] }));
  };

  const toggleFeaturedBeat = (beatId: string) => {
    if (!adminUnlocked) return;
    setFeaturedBeatIds((current) => {
      if (current.includes(beatId)) return current.filter((entry) => entry !== beatId);
      if (current.length >= 3) return [...current.slice(1), beatId];
      return [...current, beatId];
    });
  };

  const toggleFeaturedStoreItem = (section: StoreSectionName, itemId: string) => {
    if (!adminUnlocked) return;
    setFeaturedStoreItemIds((current) => {
      const sectionIds = current[section];
      const nextSectionIds = sectionIds.includes(itemId)
        ? sectionIds.filter((entry) => entry !== itemId)
        : sectionIds.length >= 3
          ? [...sectionIds.slice(1), itemId]
          : [...sectionIds, itemId];

      return {
        ...current,
        [section]: nextSectionIds,
      };
    });
  };

  const handleBeatUploadFile = (field: "imageUrl" | "audioUrl", event: React.ChangeEvent<HTMLInputElement>) => {
    if (!adminUnlocked) return;
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setBeatUploadDraft((current) => ({ ...current, [field]: result }));
      event.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const updateStoreUploadDraft = (section: StoreSectionName, field: keyof StoreUploadDraft, value: string) => {
    setStoreUploadDrafts((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
  };

  const submitBeatUpload = () => {
    if (!adminUnlocked) return;

    const title = beatUploadDraft.title.trim();
    const bpm = Number(beatUploadDraft.bpm);
    const parsedTags = normalizeTagList(
      beatUploadDraft.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    );

    if (!title || !Number.isFinite(bpm) || bpm <= 0 || !beatUploadDraft.audioUrl) {
      if (typeof window !== "undefined") {
        window.alert("Add a title, valid BPM, and audio file before uploading the beat.");
      }
      return;
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const beatId = `${slug || "beat"}-${Date.now()}`;

    const nextBeat: Beat = {
      id: beatId,
      title: title.toUpperCase(),
      artist: "EJCERTIFIED",
      bpm,
      tags: parsedTags,
      imageUrl: beatUploadDraft.imageUrl,
      previewUrl: beatUploadDraft.audioUrl,
      purchaseUrl: beatUploadDraft.audioUrl,
    };

    setUploadedBeats((current) => [...current, nextBeat]);
    setLicenseSelections((current) => ({ ...current, [beatId]: "Basic Lease" }));
    if (parsedTags.length > 0) {
      syncBeatTagsToCache({
        ...beatTags,
        [beatId]: parsedTags,
      });
    }
    setBeatUploadDraft({
      title: "",
      bpm: "",
      tags: "",
      imageUrl: "",
      audioUrl: "",
    });
    setAdminToolOpen((current) => ({ ...current, "add-beat": false }));
  };

  const submitContact = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextMessage = {
      name: contactForm.name.trim(),
      email: contactForm.email.trim(),
      subject: contactForm.subject.trim(),
      message: contactForm.message.trim(),
    };

    if (!nextMessage.name || !nextMessage.email || !nextMessage.subject || !nextMessage.message) {
      if (typeof window !== "undefined") {
        window.alert("Please fill out your name, email, subject, and message before sending.");
      }
      return;
    }

    setContactMessages((current) => [
      {
        id: `contact-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        submittedAt: new Date().toISOString(),
        ...nextMessage,
      },
      ...current,
    ]);

    setContactForm({
      name: "",
      email: "",
      subject: "",
      message: "",
    });

    if (typeof window !== "undefined") {
      window.alert("Message sent.");
    }
  };

  const renderBeatGrid = (items: Beat[]) => (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: 0.08,
          },
        },
      }}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5"
    >
      {items.map((beat) => {
        const selected = licenseSelections[beat.id] ?? "Basic Lease";
        const price = LICENSES[selected];
        const isPlaying = currentPreviewBeatId === beat.id;
        const secondsRemaining = isPlaying ? Math.max(0, 30 - Math.floor(((previewProgress[beat.id] ?? 0) / 100) * 30)) : null;
        const beatCardTags = beatTags[beat.id] ?? beat.tags;
        const beatImage = getBeatImageUrl(beat);
        return (
          <motion.button
            key={beat.id}
            type="button"
            onClick={() => setSelectedBeatId(beat.id)}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className={`void-dashboard-card void-product-card flex h-full flex-col text-left ${selectedBeat.id === beat.id ? "ring-2 ring-[#ff9f7e]/70" : ""}`}
          >
            {beatImage ? (
              <div className="void-product-media overflow-hidden rounded-[14px]">
                <img src={beatImage} alt={beat.title} className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="void-dashboard-cover" />
            )}
            <div className="mt-2.5">
              <p className="text-[21px] font-semibold text-white">{beat.title}</p>
              <p className="mt-1 text-[17px] text-white/55">{beat.artist}</p>
              <p className="mt-1.5 text-[16px] uppercase tracking-[0.18em] text-white/45">{beat.bpm} BPM</p>
              {beatCardTags.length > 0 ? (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {beatCardTags.map((tag) => (
                    <span key={`${beat.id}-${tag}`} className="rounded-full bg-white/8 px-2.5 py-1 text-[15px] uppercase tracking-[0.18em] text-white/68">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
              {adminUnlocked ? (
                <div className="mt-3 rounded-[16px] border border-[#ff9f7e]/20 bg-[#171214]/88 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-[#ffb59b]">Admin Tags</p>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-white/38">{beatCardTags.length} total</span>
                  </div>
                  <div className="mt-2.5 flex gap-2">
                    <input
                      value={tagDrafts[beat.id] ?? ""}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => setTagDrafts((current) => ({ ...current, [beat.id]: event.target.value }))}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          event.stopPropagation();
                          addTagToBeat(beat.id);
                        }
                      }}
                      placeholder="Add tag"
                      className="void-dashboard-input min-w-0 text-xs"
                    />
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        addTagToBeat(beat.id);
                      }}
                      className="rounded-full bg-[#ff8a63] px-3 py-2 text-[11px] font-semibold text-white shadow-[0_10px_24px_rgba(255,138,99,0.24)]"
                    >
                      Add
                    </button>
                  </div>
                  {beatCardTags.length > 0 ? (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {beatCardTags.map((tag) => (
                        <button
                          key={`${beat.id}-remove-${tag}`}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            removeTagFromBeat(beat.id, tag);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.16em] text-white/76"
                        >
                          <span>{tag}</span>
                          <X size={12} />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2.5 text-[11px] text-white/48">No tags on this beat yet.</p>
                  )}
                </div>
              ) : null}
            </div>
            <div className="mt-3">
              <div className="h-1.5 rounded-full bg-white/10">
                <div className="h-full rounded-full bg-[#ff8a63]" style={{ width: `${previewProgress[beat.id] ?? 0}%` }} />
              </div>
              {isPlaying ? (
                <div className="mt-2 text-[11px] uppercase tracking-[0.2em] text-white/48">{secondsRemaining}s remaining</div>
              ) : null}
            </div>
            <div className="mt-auto space-y-2.5 pt-3">
              <div className="grid grid-cols-[40px_repeat(3,minmax(0,1fr))] gap-2">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    void playPreview(beat);
                  }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/15"
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleFavorite(beat.id);
                  }}
                  className={`void-product-pill ${favorites.includes(beat.id) ? "bg-[#ff8a63] text-white" : "bg-white/8 text-white/70"}`}
                >
                  <Heart size={14} fill={favorites.includes(beat.id) ? "currentColor" : "none"} />
                  Favorite
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    togglePlaylist(beat.id);
                  }}
                  className={`void-product-pill ${playlist.includes(beat.id) ? "bg-white text-black" : "bg-white/8 text-white/70"}`}
                >
                  <ListMusic size={14} />
                  Playlist
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleUpNextBeat(beat);
                  }}
                  className={`void-product-pill ${queueItems.some((item) => item.id === beat.id) ? "bg-white text-black" : "bg-white/8 text-white/70"}`}
                >
                  <ListMusic size={14} />
                  Queue
                </button>
              </div>
              <select
                value={selected}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) =>
                  setLicenseSelections((current) => ({ ...current, [beat.id]: event.target.value as LicenseName }))
                }
                className="void-dashboard-select w-full min-w-0"
              >
                <option value="Basic Lease">Basic Lease - $20</option>
                <option value="Exclusive Lease">Exclusive Lease - $100</option>
              </select>
              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
                <span className="text-sm font-semibold text-white">${price}</span>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    addToCart(beat);
                  }}
                  className="inline-flex w-full items-center justify-center rounded-full bg-[#ff9f7e] px-3 py-2 text-[11px] font-semibold text-white"
                >
                  {user ? "Buy" : "Sign In To Buy"}
                </button>
              </div>
            </div>
          </motion.button>
        );
      })}
    </motion.div>
  );

  const renderFavoriteBeatRow = (beat: Beat) => {
    const selected = licenseSelections[beat.id] ?? "Basic Lease";
    const price = LICENSES[selected];
    const isPlaying = currentPreviewBeatId === beat.id;
    const beatImage = getBeatImageUrl(beat);

    return (
      <motion.div
        key={beat.id}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(24,24,29,0.96),rgba(17,17,22,0.98))] p-5 text-white shadow-[0_30px_80px_rgba(0,0,0,0.24)]"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
          <div className="relative h-32 w-full overflow-hidden rounded-[22px] lg:w-32 lg:min-w-32">
            {beatImage ? (
              <img src={beatImage} alt={beat.title} className="h-full w-full object-cover" />
            ) : (
              <div className="void-dashboard-cover h-full w-full" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-2xl font-semibold text-white">{beat.title}</p>
                <p className="mt-1 text-sm text-white/55">{beat.artist}</p>
                <div className="mt-3 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/55">
                  {beat.bpm} BPM
                </div>
              </div>
              <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black">${price}</div>
            </div>
            <div className="mt-5 h-2 rounded-full bg-white/8">
              <div className="h-full rounded-full bg-[#ff8a63]" style={{ width: `${previewProgress[beat.id] ?? 0}%` }} />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void playPreview(beat)}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm text-white"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                {isPlaying ? "Pause" : "Play"}
              </button>
              <button
                type="button"
                onClick={() => toggleFavorite(beat.id)}
                className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#ff8a63,#ff6f67)] px-5 py-3 text-sm text-white shadow-[0_14px_34px_rgba(255,138,99,0.22)]"
              >
                <Heart size={16} fill="currentColor" />
                Favorite
              </button>
              <select
                value={selected}
                onChange={(event) =>
                  setLicenseSelections((current) => ({ ...current, [beat.id]: event.target.value as LicenseName }))
                }
                className="void-dashboard-select min-w-[240px] max-w-[280px]"
              >
                <option value="Basic Lease">Basic Lease - $20</option>
                <option value="Exclusive Lease">Exclusive Lease - $100</option>
              </select>
              <button
                type="button"
                onClick={() => addToCart(beat)}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black"
              >
                Buy
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderStorePreviewGrid = (
    section: "drumkits" | "loops" | "artwork",
    title: string,
  ) => {
    const items = featuredStoreItems[section];

    return (
      <section className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">{title}</h2>
          </div>
          <button type="button" onClick={() => setActiveSection(section)} className="void-store-pill-button">
            Browse {title.replace("Featured ", "")}
          </button>
        </div>
        {items.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(section)}
                className="void-dashboard-card void-product-card flex h-full flex-col text-left"
              >
                {item.imageUrl ? (
                  <div className="void-product-media overflow-hidden rounded-[14px]">
                    <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className={`void-dashboard-cover ${item.accentClass}`} />
                )}
                <div className="mt-2.5">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-white/55">{item.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-[28px] bg-[linear-gradient(180deg,rgba(18,18,22,0.92),rgba(10,10,12,0.98))] px-6 py-12 text-center">
            <p className="text-xl font-semibold text-white/40">
              Coming Soon
            </p>
          </div>
        )}
      </section>
    );
  };

  const renderBeatUploadManager = () =>
    adminUnlocked && adminToolOpen["add-beat"] ? (
      <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,18,22,0.96),rgba(10,10,12,0.98))] p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Beat Title</label>
            <input value={beatUploadDraft.title} onChange={(event) => setBeatUploadDraft((current) => ({ ...current, title: event.target.value }))} className="void-dashboard-input" />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">BPM</label>
            <input value={beatUploadDraft.bpm} onChange={(event) => setBeatUploadDraft((current) => ({ ...current, bpm: event.target.value }))} className="void-dashboard-input" />
          </div>
          <div className="lg:col-span-2">
            <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Tags</label>
            <input value={beatUploadDraft.tags} onChange={(event) => setBeatUploadDraft((current) => ({ ...current, tags: event.target.value }))} placeholder="dark, melodic, eerie" className="void-dashboard-input" />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Cover Image</label>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white/8 px-4 py-3 text-sm text-white/72">
              <Upload size={15} />
              {beatUploadDraft.imageUrl ? "Image selected" : "Upload image"}
              <input type="file" accept="image/*" onChange={(event) => handleBeatUploadFile("imageUrl", event)} className="hidden" />
            </label>
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Beat Audio</label>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white/8 px-4 py-3 text-sm text-white/72">
              <Upload size={15} />
              {beatUploadDraft.audioUrl ? "Audio selected" : "Upload audio"}
              <input type="file" accept="audio/*" onChange={(event) => handleBeatUploadFile("audioUrl", event)} className="hidden" />
            </label>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={submitBeatUpload} className="void-dashboard-primary">Add Beat</button>
          <button type="button" onClick={() => setAdminToolOpen((current) => ({ ...current, "add-beat": false }))} className="void-store-pill-button">Close</button>
        </div>
      </div>
    ) : null;

  const renderFeaturedBeatManager = () =>
    adminUnlocked && adminToolOpen.beats ? (
      <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,18,22,0.96),rgba(10,10,12,0.98))] p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#ffb59b]">Admin Featured Beats</p>
            <p className="mt-2 text-sm text-white/58">Select up to 3 beats to feature on the homepage.</p>
          </div>
          <span className="rounded-full bg-white/8 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-white/55">
            {featuredBeatIds.length}/3 selected
          </span>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {allBeats.map((beat) => (
            <button
              key={`featured-beat-${beat.id}`}
              type="button"
              onClick={() => toggleFeaturedBeat(beat.id)}
              className={`rounded-2xl border px-4 py-3 text-left text-sm ${
                featuredBeatIds.includes(beat.id)
                  ? "border-[#ff8a63]/60 bg-[#ff8a63]/12 text-white"
                  : "border-white/8 bg-white/[0.03] text-white/72"
              }`}
            >
              <span className="block font-semibold">{beat.title}</span>
              <span className="mt-1 block text-xs text-white/48">{featuredBeatIds.includes(beat.id) ? "Featured on homepage" : "Click to feature"}</span>
            </button>
          ))}
        </div>
      </div>
    ) : null;

  const renderPaymentMethodManager = (mode: "profile" | "checkout") => {
    const isCheckout = mode === "checkout";
    const paymentDetails = isCheckout ? checkoutForm : extractPaymentDetails(profileForm);
    const updatePaymentDetails = (updates: Partial<PaymentDetails>) => {
      if (isCheckout) {
        setCheckoutForm((current) => ({ ...current, ...updates }));
      } else {
        setProfileForm((current) => ({ ...current, ...updates }));
      }
    };

    return (
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{isCheckout ? "Checkout Payment Options" : "Saved Payment Info"}</h3>
          <p className="mt-1 text-sm text-white/55">
            {isCheckout
              ? "Choose how you want to pay for this order. Saved payment info in your profile is optional and only helps speed up future checkouts."
              : "Save payment methods here for quicker checkouts when you come back to the site."}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {PAYMENT_OPTIONS.map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => (isCheckout ? selectCheckoutPaymentMethod(method) : savePaymentMethod(method))}
              className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left ${selectedPaymentMethod === method ? "border-[#ff8a63]/60 bg-white/8 text-white" : "border-white/8 bg-[#141418] text-white/72"}`}
            >
              <span className="inline-flex items-center gap-3">
                {method === "Cash App" ? <Banknote size={16} /> : <CreditCard size={16} />}
                {method}
              </span>
              {selectedPaymentMethod === method ? <Check size={16} /> : null}
            </button>
          ))}
        </div>
        {!isCheckout && profileForm.paymentMethods.length ? (
          <div className="flex flex-wrap gap-2">
            {profileForm.paymentMethods.map((method) => (
              <span key={method} className="rounded-full bg-white/8 px-3 py-2 text-xs uppercase tracking-[0.18em] text-white/68">
                {method}
              </span>
            ))}
          </div>
        ) : null}
        {selectedPaymentMethod === "Bank Card" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Cardholder Name</label>
              <input value={paymentDetails.cardholderName} onChange={(event) => updatePaymentDetails({ cardholderName: event.target.value })} className="void-dashboard-input" />
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Card Number</label>
              <input value={paymentDetails.cardNumber} onChange={(event) => updatePaymentDetails({ cardNumber: event.target.value })} className="void-dashboard-input" />
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Expiry Date</label>
              <input value={paymentDetails.expiryDate} onChange={(event) => updatePaymentDetails({ expiryDate: event.target.value })} placeholder="MM/YY" className="void-dashboard-input" />
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">CVV</label>
              <input value={paymentDetails.cvv} onChange={(event) => updatePaymentDetails({ cvv: event.target.value })} className="void-dashboard-input" />
            </div>
          </div>
        ) : null}
        {selectedPaymentMethod === "Bank" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Bank Name</label>
              <input value={paymentDetails.bankName} onChange={(event) => updatePaymentDetails({ bankName: event.target.value })} className="void-dashboard-input" />
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Account Name</label>
              <input value={paymentDetails.accountName} onChange={(event) => updatePaymentDetails({ accountName: event.target.value })} className="void-dashboard-input" />
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Routing Number</label>
              <input value={paymentDetails.routingNumber} onChange={(event) => updatePaymentDetails({ routingNumber: event.target.value })} className="void-dashboard-input" />
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Account Number</label>
              <input value={paymentDetails.accountNumber} onChange={(event) => updatePaymentDetails({ accountNumber: event.target.value })} className="void-dashboard-input" />
            </div>
          </div>
        ) : null}
        {selectedPaymentMethod === "Cash App" ? (
          <div className="space-y-3 rounded-2xl border border-white/8 bg-[#141418] p-4">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Cash App Tag</label>
              <input value={paymentDetails.cashAppTag} onChange={(event) => updatePaymentDetails({ cashAppTag: event.target.value })} placeholder="$yourcashtag" className="void-dashboard-input" />
            </div>
            <button type="button" onClick={() => openExternalConnect("https://cash.app/")} className="void-dashboard-primary">{isCheckout ? "Pay With Cash App" : "Connect Cash App"}</button>
          </div>
        ) : null}
        {selectedPaymentMethod === "PayPal" ? (
          <div className="space-y-3 rounded-2xl border border-white/8 bg-[#141418] p-4">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">PayPal Email</label>
              <input value={paymentDetails.paypalEmail} onChange={(event) => updatePaymentDetails({ paypalEmail: event.target.value })} className="void-dashboard-input" />
            </div>
            <button type="button" onClick={() => openExternalConnect("https://www.paypal.com/signin")} className="void-dashboard-primary">{isCheckout ? "Continue With PayPal" : "Connect PayPal"}</button>
          </div>
        ) : null}
        {selectedPaymentMethod === "Apple Pay" ? (
          <div className="space-y-3 rounded-2xl border border-white/8 bg-[#141418] p-4">
            <p className="text-sm text-white/65">
              {isCheckout ? "Use Apple Pay to continue this purchase through Apple's payment flow." : "Save Apple Pay as a quick option for future checkouts."}
            </p>
            <button type="button" onClick={() => openExternalConnect("https://applepaydemo.apple.com/")} className="void-dashboard-primary">{isCheckout ? "Continue With Apple Pay" : "Connect Apple Pay"}</button>
          </div>
        ) : null}
      </div>
    );
  };

  const renderCheckoutPage = () => (
    <section className="space-y-6">
      <div className="void-store-pagehead void-store-pagehead-centered">
        <div>
          <h1 className="void-store-page-title void-store-page-title-beats">Checkout</h1>
          <p className="void-store-page-subtitle">by ejcertified</p>
        </div>
      </div>
      {cartItems.length === 0 ? (
        <div className="void-dashboard-panel p-6 sm:p-7">
          <h3 className="text-xl font-semibold text-white">Your checkout is empty</h3>
          <p className="mt-2 text-sm leading-6 text-white/60">Pick a beat and press Buy to open it here.</p>
          <div className="mt-5">
            <button type="button" onClick={() => setActiveSection("beats")} className="void-dashboard-primary">Browse Beats</button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
          <div className="void-dashboard-panel p-6 sm:p-7">
            {renderPaymentMethodManager("checkout")}
          </div>
          <div className="void-dashboard-panel p-6 sm:p-7">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/40">Order Summary</p>
            <h3 className="mt-3 text-2xl font-semibold text-white">Review Your Order</h3>
            <div className="mt-5 space-y-3">
              {cartItems.map((item, index) => {
                const beat = allBeats.find((entry) => entry.id === item.beatId);
                return (
                  <div key={`${item.beatId}-${index}`} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{beat?.title ?? item.beatId}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">{item.license}</p>
                      </div>
                      <span className="text-sm font-semibold text-white">${item.price}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 space-y-2">
              <label className="block text-xs uppercase tracking-[0.18em] text-white/45">Promo Code</label>
              <div className="flex gap-2">
                <input
                  value={checkoutPromoCode}
                  onChange={(event) => setCheckoutPromoCode(event.target.value)}
                  placeholder="Enter promo code"
                  className="void-dashboard-input min-w-0"
                />
                <button type="button" onClick={() => applyPromoCode("checkout")} className="void-dashboard-secondary">
                  Apply
                </button>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-white">
              <span>Total</span>
              <span className="text-xl font-semibold">${cartTotal}</span>
            </div>
            <button type="button" onClick={handleCheckout} className="void-dashboard-primary mt-5 w-full justify-center">
              Complete Purchase
            </button>
          </div>
        </div>
      )}
    </section>
  );

  const renderProfileTabContent = () => {
    if (profileTab === "edit") {
      return (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Edit Profile</h3>
            <p className="mt-1 text-sm text-white/55">Update your profile photo, name, location, and account type.</p>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-white/8 bg-[#141418] p-4">
            <label className="group flex cursor-pointer items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-white/10 text-white/60 ring-1 ring-white/8 transition group-hover:ring-[#ff8a63]/55">
                {profileForm.profilePhoto ? (
                  <img src={profileForm.profilePhoto} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <UserCircle2 size={40} />
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">Click profile photo to upload</p>
                <p className="text-xs text-white/45">JPG, JPEG, PNG, and other image files supported.</p>
              </div>
              <input type="file" accept="image/*" onChange={handleProfilePhotoChange} className="hidden" />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">First Name</label>
              <input value={profileForm.firstName} onChange={(event) => setProfileForm((current) => ({ ...current, firstName: event.target.value }))} className="void-dashboard-input" />
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Last Name</label>
              <input value={profileForm.lastName} onChange={(event) => setProfileForm((current) => ({ ...current, lastName: event.target.value }))} className="void-dashboard-input" />
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Display Name</label>
              <input value={profileForm.displayName} onChange={(event) => setProfileForm((current) => ({ ...current, displayName: event.target.value }))} className="void-dashboard-input" />
            </div>
            <div className="relative">
              <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Location</label>
              <input
                value={locationQuery}
                onChange={(event) => {
                  const value = event.target.value;
                  setLocationQuery(value);
                  setProfileForm((current) => ({ ...current, location: value }));
                }}
                placeholder="City, State"
                className="void-dashboard-input"
              />
              {filteredLocations.length > 0 ? (
                <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 rounded-2xl border border-white/10 bg-[#121216] p-2 shadow-2xl">
                  {filteredLocations.map((location) => (
                    <button
                      key={location}
                      type="button"
                      onClick={() => {
                        setLocationQuery(location);
                        setProfileForm((current) => ({ ...current, location }));
                      }}
                      className="block w-full rounded-xl px-3 py-2 text-left text-sm text-white/78 transition hover:bg-white/8"
                    >
                      {location}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Account Type</label>
            <select value={profileForm.role} onChange={(event) => setProfileForm((current) => ({ ...current, role: event.target.value as UserRole }))} className="void-dashboard-select">
              <option value="Artist">Artist</option>
              <option value="Producer">Producer</option>
              <option value="Consumer">Consumer</option>
            </select>
          </div>
          {user ? (
            <button type="button" onClick={() => void signOut()} className="void-dashboard-secondary">
              <LogOut size={16} />
              Sign out
            </button>
          ) : null}
        </div>
      );
    }

    if (profileTab === "payment") {
      return renderPaymentMethodManager("profile");
    }

    if (profileTab === "favorites") {
      return (
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-white">Favorites</h3>
            <p className="mt-1 text-sm text-white/55">All products you marked as favorites live here.</p>
          </div>
          {favoriteProducts.length ? favoriteProducts.map((item) => (
            "artist" in item ? renderFavoriteBeatRow(item) : (
              <div key={item.id} className="rounded-2xl border border-white/8 bg-[#141418] p-4 text-white">
                <p className="font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-white/55">{item.section}</p>
              </div>
            )
          )) : <p className="text-sm text-white/55">No favorites saved yet.</p>}
        </div>
      );
    }

    if (profileTab === "playlist") {
      return (
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-white">My Playlist</h3>
            <p className="mt-1 text-sm text-white/55">Your saved beat playlist sits here by itself.</p>
          </div>
          {playlistBeats.length ? playlistBeats.map((beat) => (
            <button key={beat.id} type="button" onClick={() => handleQueuePlay(beat)} className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-[#141418] p-4 text-left text-white">
              <span>
                <p className="font-semibold">{beat.title}</p>
                <p className="mt-1 text-sm text-white/55">{beat.artist}</p>
              </span>
              <Play size={16} />
            </button>
          )) : <p className="text-sm text-white/55">No beats in your playlist yet.</p>}
        </div>
      );
    }

    if (profileTab === "orders") {
      return (
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-white">Purchased Orders</h3>
            <p className="mt-1 text-sm text-white/55">Every completed purchase will show up here.</p>
          </div>
          {orders.length ? orders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-white/8 bg-[#141418] p-4 text-white">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{order.title}</p>
                  <p className="mt-1 text-sm text-white/55">{order.license}</p>
                </div>
                <span>${order.price}</span>
              </div>
              <p className="mt-2 text-xs text-white/45">{new Date(order.purchasedAt).toLocaleString()}</p>
            </div>
          )) : <p className="text-sm text-white/55">No purchases yet.</p>}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-white">Promotions</h3>
          <p className="mt-1 text-sm text-white/55">No promo codes are active right now, but you can save codes here for later use.</p>
        </div>
        <div className="flex gap-2">
          <input value={profilePromoCode} onChange={(event) => setProfilePromoCode(event.target.value)} placeholder="Enter promo code" className="void-dashboard-input min-w-0" />
          <button type="button" onClick={() => applyPromoCode("profile")} className="void-dashboard-secondary">Save</button>
        </div>
        {savedPromoCodes.length ? (
          <div className="flex flex-wrap gap-2">
            {savedPromoCodes.map((code) => (
              <span key={code} className="rounded-full bg-white/8 px-3 py-2 text-xs text-white/76">{code}</span>
            ))}
          </div>
        ) : null}
      </div>
    );
  };

  const renderProfilePage = () => (
    <section className="space-y-6">
      <div className="void-store-pagehead">
        <div>
          <h1 className="void-store-page-title">Your Profile</h1>
          <p className="void-store-page-copy">
            Manage profile details, payment options, favorites, playlists, purchases, and promo codes in one place.
          </p>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="space-y-2 rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(16,16,18,0.92),rgba(9,9,10,0.98))] p-4">
          {profileTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setProfileTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left ${profileTab === tab.id ? "bg-[#ff8a63] text-white" : "bg-white/6 text-white/72"}`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
        <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(16,16,18,0.92),rgba(9,9,10,0.98))] p-5 sm:p-6">
          {renderProfileTabContent()}
        </div>
      </div>
    </section>
  );

  const renderMainContent = () => {
    if (activeSection === "profile") {
      return renderProfilePage();
    }

    if (activeSection === "checkout") {
      return renderCheckoutPage();
    }

    if (activeSection === "drumkits") {
      return <StoreSection title="Drumkits" items={storeItems.filter((item) => item.section === "drumkits")} favorites={favorites} toggleFavorite={toggleFavorite} queueIds={queueItems.map((item) => item.id)} toggleQueue={toggleUpNextItem} adminUnlocked={adminUnlocked} section="drumkits" featuredIds={featuredStoreItemIds.drumkits} onToggleFeatured={(itemId) => toggleFeaturedStoreItem("drumkits", itemId)} featuredManagerOpen={adminToolOpen.drumkits} onToggleFeaturedManager={() => toggleAdminTool("drumkits")} uploadOpen={adminToolOpen["add-drumkits"]} onToggleUploadManager={() => toggleAdminTool("add-drumkits")} uploadDraft={storeUploadDrafts.drumkits} onUploadDraftChange={(field, value) => updateStoreUploadDraft("drumkits", field, value)} onUploadFile={(field, event) => handleStoreUploadFile("drumkits", field, event)} onSubmitUpload={() => submitStoreUpload("drumkits")} />;
    }

    if (activeSection === "loops") {
      return <StoreSection title="Loops" items={storeItems.filter((item) => item.section === "loops")} favorites={favorites} toggleFavorite={toggleFavorite} queueIds={queueItems.map((item) => item.id)} toggleQueue={toggleUpNextItem} adminUnlocked={adminUnlocked} section="loops" featuredIds={featuredStoreItemIds.loops} onToggleFeatured={(itemId) => toggleFeaturedStoreItem("loops", itemId)} featuredManagerOpen={adminToolOpen.loops} onToggleFeaturedManager={() => toggleAdminTool("loops")} uploadOpen={adminToolOpen["add-loops"]} onToggleUploadManager={() => toggleAdminTool("add-loops")} uploadDraft={storeUploadDrafts.loops} onUploadDraftChange={(field, value) => updateStoreUploadDraft("loops", field, value)} onUploadFile={(field, event) => handleStoreUploadFile("loops", field, event)} onSubmitUpload={() => submitStoreUpload("loops")} />;
    }

    if (activeSection === "artwork") {
      return <StoreSection title="Artwork" items={storeItems.filter((item) => item.section === "artwork")} favorites={favorites} toggleFavorite={toggleFavorite} queueIds={queueItems.map((item) => item.id)} toggleQueue={toggleUpNextItem} adminUnlocked={adminUnlocked} section="artwork" featuredIds={featuredStoreItemIds.artwork} onToggleFeatured={(itemId) => toggleFeaturedStoreItem("artwork", itemId)} featuredManagerOpen={adminToolOpen.artwork} onToggleFeaturedManager={() => toggleAdminTool("artwork")} uploadOpen={adminToolOpen["add-artwork"]} onToggleUploadManager={() => toggleAdminTool("add-artwork")} uploadDraft={storeUploadDrafts.artwork} onUploadDraftChange={(field, value) => updateStoreUploadDraft("artwork", field, value)} onUploadFile={(field, event) => handleStoreUploadFile("artwork", field, event)} onSubmitUpload={() => submitStoreUpload("artwork")} />;
    }

    if (activeSection === "contact") {
      return (
        <SectionFrame variant="editorial">
          <div className="space-y-6">
            <div className="void-dashboard-panel p-6 sm:p-7">
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/40">Contact</p>
              <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Reach Out</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/62">
                Use the form below to send questions, collab requests, or support messages directly through the site.
              </p>
              <form onSubmit={submitContact} className="mt-6 grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-white/60">Your Name</label>
                    <input
                      value={contactForm.name}
                      onChange={(event) => setContactForm((current) => ({ ...current, name: event.target.value }))}
                      className="void-dashboard-input"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-medium text-white/60">Email</label>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(event) => setContactForm((current) => ({ ...current, email: event.target.value }))}
                      className="void-dashboard-input"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium text-white/60">Subject</label>
                  <input
                    value={contactForm.subject}
                    onChange={(event) => setContactForm((current) => ({ ...current, subject: event.target.value }))}
                    className="void-dashboard-input"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium text-white/60">Message</label>
                  <textarea
                    value={contactForm.message}
                    onChange={(event) => setContactForm((current) => ({ ...current, message: event.target.value }))}
                    className="void-dashboard-textarea"
                  />
                </div>
                <div>
                  <button type="submit" className="void-dashboard-primary">Send Message</button>
                </div>
              </form>
            </div>

            {adminUnlocked ? (
              <div className="void-dashboard-panel p-6 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-[#ffb59b]">Admin Inbox</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">Contact Messages</h3>
                    <p className="mt-2 text-sm leading-6 text-white/60">
                      Messages from the contact page only appear here when admin mode is unlocked.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-2 text-xs uppercase tracking-[0.18em] text-white/62">
                    <Mail size={14} />
                    {contactMessages.length} message{contactMessages.length === 1 ? "" : "s"}
                  </div>
                </div>

                {contactMessages.length ? (
                  <div className="mt-6 grid gap-3">
                    {contactMessages.map((message) => (
                      <div key={message.id} className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-white">{message.subject}</p>
                            <p className="mt-1 text-sm text-white/62">
                              {message.name} · {message.email}
                            </p>
                          </div>
                          <span className="text-xs uppercase tracking-[0.18em] text-white/40">
                            {new Date(message.submittedAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-white/72">{message.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-[22px] border border-white/8 bg-white/[0.03] p-4 text-sm text-white/60">
                    No contact messages yet.
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </SectionFrame>
      );
    }

    if (activeSection === "socials") {
      return (
        <SectionFrame variant="crimson">
          <div className="space-y-5">
            <InfoPanel title="Stay Connected" body="Follow VOID across social platforms for drops, visuals, previews, and updates." />
            {adminUnlocked ? (
              <div className="void-dashboard-panel grid gap-4 p-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">TikTok</label>
                <input value={socialLinks.tiktok} onChange={(event) => setSocialLinks((current) => ({ ...current, tiktok: event.target.value }))} className="void-dashboard-input" />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Instagram</label>
                <input value={socialLinks.instagram} onChange={(event) => setSocialLinks((current) => ({ ...current, instagram: event.target.value }))} className="void-dashboard-input" />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Twitter / X</label>
                <input value={socialLinks.twitter} onChange={(event) => setSocialLinks((current) => ({ ...current, twitter: event.target.value }))} className="void-dashboard-input" />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">YouTube</label>
                <input value={socialLinks.youtube} onChange={(event) => setSocialLinks((current) => ({ ...current, youtube: event.target.value }))} className="void-dashboard-input" />
              </div>
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "TikTok", url: socialLinks.tiktok, icon: Music2 },
              { label: "Instagram", url: socialLinks.instagram, icon: Instagram },
              { label: "Twitter / X", url: socialLinks.twitter, icon: BadgeInfo },
              { label: "YouTube", url: socialLinks.youtube, icon: Youtube },
            ].map((social) => {
              const Icon = social.icon;
              return (
                <a key={social.label} href={social.url || undefined} target="_blank" rel="noreferrer" className={`void-dashboard-card ${social.url ? "" : "pointer-events-none opacity-55"}`}>
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-white/8 p-3 text-white"><Icon size={18} /></div>
                    <div>
                      <p className="font-semibold text-white">{social.label}</p>
                      <p className="mt-1 text-xs text-white/50">{social.url || "Link not set yet"}</p>
                    </div>
                  </div>
                </a>
              );
              })}
            </div>
          </div>
        </SectionFrame>
      );
    }

    if (activeSection === "terms") {
      return (
        <section className="space-y-6">
          <div className="void-store-pagehead">
            <div>
              <h1 className="void-store-page-title">Terms of Service</h1>
              <p className="void-store-page-copy">
                Effective Date: March 27, 2026. These terms are tailored to the current VOID storefront, license types, and purchase flow.
              </p>
            </div>
          </div>

          <LegalSection number="1" title="Acceptance of Terms">
            <p>
              By accessing, browsing, purchasing from, or otherwise using VOID and any related pages, storefront tools, and digital downloads
              (collectively, the &quot;Service&quot;), you agree to these Terms of Service and any policies referenced within them. If you do not
              agree, do not use the Service.
            </p>
            <p>
              VOID may update these Terms from time to time. Continued use of the Service after changes are posted means you accept the updated
              Terms.
            </p>
          </LegalSection>

          <LegalSection number="2" title="Accounts, Eligibility, and Access">
            <ul className="list-disc space-y-2 pl-5">
              <li>You may only use the Service and make purchases if you are legally permitted to do so in your jurisdiction. If you are under the age required by law, you must use the Service with parent or legal guardian authorization.</li>
              <li>You agree to provide accurate account, contact, and payment information if you create an account or make a purchase.</li>
              <li>You are responsible for maintaining the security of your login credentials and activity on your account.</li>
              <li>VOID may suspend or terminate access for fraud, abuse, chargeback misuse, unlawful conduct, or breach of these Terms.</li>
            </ul>
          </LegalSection>

          <LegalSection number="3" title="License Types and Usage Rights">
            <div className="space-y-5">
              <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                <h3 className="text-lg font-semibold text-white">3.1 Basic Lease — $20</h3>
                <ul className="mt-3 list-disc space-y-2 pl-5">
                  <li>Delivered in MP3 format unless otherwise stated on the product page.</li>
                  <li>Non-exclusive license only. The beat remains owned by VOID / ejcertified.</li>
                  <li>Commercial release is allowed up to 50,000 total streams across audio and video combined.</li>
                  <li>Up to 1,000 paid downloads or equivalent unit sales.</li>
                  <li>Term: 2 years from the date of purchase.</li>
                  <li>The license is non-transferable and may only be used by the purchaser unless written permission is granted.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                <h3 className="text-lg font-semibold text-white">3.2 Exclusive License — $100</h3>
                <ul className="mt-3 list-disc space-y-2 pl-5">
                  <li>Exclusive rights are transferred for the purchased beat after payment is completed.</li>
                  <li>The beat is removed from future public sale by VOID after the exclusive transaction is finalized.</li>
                  <li>Unlimited commercial exploitation, streams, performances, and derivative release usage are allowed.</li>
                  <li>The exclusive buyer may modify, arrange, and commercially exploit the beat without the non-exclusive credit requirement.</li>
                  <li>Unless otherwise stated in writing, exclusive rights apply to the purchased composition and release use, not the VOID brand or site assets.</li>
                </ul>
              </div>
            </div>
          </LegalSection>

          <LegalSection number="4" title="Credit and Attribution Requirements">
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#ff8a63]/28 bg-[#1a1412] p-4">
                <h3 className="text-lg font-semibold text-white">4.1 Non-Exclusive Credit Requirement</h3>
                <p className="mt-3">
                  Any song released under a Basic Lease must visibly credit the producer as <strong>“Prod. ejcertified”</strong>,
                  <strong>“Produced by ejcertified”</strong>, or an equivalent clearly visible credit in the title, metadata, description,
                  artwork, liner notes, or other public release information.
                </p>
                <ul className="mt-3 list-disc space-y-2 pl-5">
                  <li>Credit may appear in the title or in clearly visible release metadata.</li>
                  <li>For video uploads, include producer credit in the description and/or on-screen when appropriate.</li>
                  <li>For streaming platform releases, include ejcertified in metadata wherever the platform allows.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                <h3 className="text-lg font-semibold text-white">4.2 Exclusive Credit</h3>
                <p className="mt-3">
                  Credit is optional for exclusive buyers. If credit is used, preferred forms are <strong>“Prod. ejcertified”</strong> or
                  <strong>“Produced by ejcertified.”</strong>
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                <h3 className="text-lg font-semibold text-white">4.3 Failure to Credit</h3>
                <p className="mt-3">
                  Failure to provide required credit on a non-exclusive release is a material breach of license and may result in license
                  revocation, takedown requests, account restriction, and enforcement action.
                </p>
              </div>
            </div>
          </LegalSection>

          <LegalSection number="5" title="Prohibited Uses">
            <ul className="list-disc space-y-2 pl-5">
              <li>You may not resell, sublicense, redistribute, trade, gift, or share beats, stems, loops, or downloaded files as standalone products.</li>
              <li>You may not claim authorship or ownership of the original beat on non-exclusive licenses.</li>
              <li>You may not turn VOID beats into sample packs, drum kits, loop packs, or beat packs for resale.</li>
              <li>You may not extract isolated drums, melodies, or elements from a non-exclusive beat to reuse in other productions as new source material.</li>
              <li>You may not use the Service or purchased material for unlawful, hateful, defamatory, or infringing content.</li>
              <li>You may not transfer a license to another party without written approval from VOID.</li>
            </ul>
          </LegalSection>

          <LegalSection number="6" title="Publishing, Royalties, and Ownership">
            <ul className="list-disc space-y-2 pl-5">
              <li>For non-exclusive licenses, VOID / ejcertified retains producer rights and producer royalty interests in the underlying beat.</li>
              <li>You retain rights in your newly created top-line performance and lyrics, subject to the producer rights retained in the beat.</li>
              <li>For exclusive purchases, the buyer receives 100% of publishing and master rights in the licensed release use, subject to any written custom agreement.</li>
              <li>Nothing in these Terms transfers ownership of the VOID brand, site design, logos, or unrelated intellectual property.</li>
            </ul>
          </LegalSection>

          <LegalSection number="7" title="Payments, Delivery, and Refunds">
            <ul className="list-disc space-y-2 pl-5">
              <li>All prices are listed in USD unless otherwise stated.</li>
              <li>Payments may be processed through third-party services such as card processors, PayPal, Cash App, Apple Pay, or other supported platforms.</li>
              <li>Because beats and digital products are delivered immediately, all sales are final once the file or license has been delivered.</li>
              <li>No refunds are offered for change of mind, misunderstanding of license terms, or unused purchases.</li>
              <li>If there is a duplicate charge, broken download, or delivery failure, contact VOID promptly through the site contact method for review.</li>
              <li>Frivolous chargebacks or fraudulent disputes may result in account termination and license cancellation.</li>
            </ul>
          </LegalSection>

          <LegalSection number="8" title="DMCA and Copyright Protection">
            <ul className="list-disc space-y-2 pl-5">
              <li>VOID respects copyright and expects users to do the same.</li>
              <li>If you believe content on the Service infringes your copyright, submit a DMCA-compliant notice through the VOID contact channel or designated support method.</li>
              <li>False or bad-faith takedown notices may expose the sender to legal liability.</li>
              <li>VOID may remove or disable access to allegedly infringing content while investigating claims.</li>
            </ul>
          </LegalSection>

          <LegalSection number="9" title="Content Standards">
            <p>You agree not to use VOID products in connection with content that is illegal or that intentionally promotes:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>hateful or discriminatory conduct,</li>
              <li>violent criminal activity,</li>
              <li>fraud, impersonation, or deceptive abuse of third-party rights,</li>
              <li>copyright infringement, plagiarism, or defamation.</li>
            </ul>
          </LegalSection>

          <LegalSection number="10" title="Disclaimers and Limitation of Liability">
            <p>
              The Service and all digital products are provided <strong>“as is”</strong> and <strong>“as available.”</strong> VOID makes no warranty
              that the site, files, or payment systems will always be uninterrupted, error-free, or fit for your particular business or release needs.
            </p>
            <p>
              To the fullest extent allowed by law, VOID will not be liable for indirect, incidental, special, consequential, or punitive damages.
              Any direct liability is limited to the amount paid for the specific product or license at issue.
            </p>
          </LegalSection>

          <LegalSection number="11" title="Indemnification">
            <p>
              You agree to defend, indemnify, and hold harmless VOID, ejcertified, and related operators from claims, losses, damages, liabilities,
              and expenses arising from your releases, your use of the Service, your violation of these Terms, or your violation of third-party rights.
            </p>
          </LegalSection>

          <LegalSection number="12" title="Governing Law and Dispute Resolution">
            <ul className="list-disc space-y-2 pl-5">
              <li>These Terms are governed by the laws of the state and local jurisdiction where VOID / ejcertified principally operates, unless applicable law requires otherwise.</li>
              <li>Before filing a formal claim, both sides agree to attempt good-faith resolution through direct written notice.</li>
              <li>If a dispute cannot be resolved informally, it may be submitted to binding individual arbitration instead of court, except where the law does not permit arbitration or where small claims court is allowed.</li>
              <li>Class actions and jury trials are waived to the fullest extent permitted by law.</li>
            </ul>
          </LegalSection>

          <LegalSection number="13" title="General Terms">
            <ul className="list-disc space-y-2 pl-5">
              <li>If one provision of these Terms is found unenforceable, the remaining provisions remain in effect.</li>
              <li>VOID&apos;s failure to enforce any provision is not a waiver of that provision.</li>
              <li>These Terms, together with any posted policies and product-specific license details, form the full agreement between you and VOID regarding the Service.</li>
            </ul>
          </LegalSection>

          <LegalSection number="14" title="Contact">
            <p>
              For support, delivery issues, copyright notices, or general questions, use the VOID contact page or the support method listed on the site.
            </p>
            <p>
              Last Updated: March 27, 2026
            </p>
          </LegalSection>
        </section>
      );
    }

    if (activeSection === "signin" || activeSection === "signup") {
      return (
        <AccountPanel
          title={activeSection === "signin" ? "Sign In" : "Create Account"}
          description="Sign-in is only needed for purchasing. The store stays open for browsing, previewing, and liking beats."
          primary={activeSection === "signin" ? "Open Sign In" : "Open Sign Up"}
          secondary={activeSection === "signin" ? "Need an account?" : "Already have an account?"}
          onSecondary={() => setActiveSection(activeSection === "signin" ? "signup" : "signin")}
        />
      );
    }

      if (activeSection === "beats") {
        return (
          <section className="space-y-6">
            <div className="void-store-pagehead void-store-pagehead-centered void-store-pagehead-floating">
              <div className="void-store-pagehead-content">
                <h1 className="void-store-page-title void-store-page-title-beats">Beats</h1>
                <p className="void-store-page-subtitle">by ejcertified</p>
              </div>
              <div className="void-store-page-actions void-store-pagehead-content flex-wrap justify-center">
                {adminUnlocked ? (
                  <>
                    <button type="button" onClick={() => toggleAdminTool("add-beat")} className="void-store-pill-button">
                      Add Beat
                    </button>
                    <button type="button" onClick={() => toggleAdminTool("beats")} className="void-store-pill-button">
                      {featuredBeatIds.length ? "Change Featured Beats" : "Add Featured Beats"}
                    </button>
                  </>
                ) : null}
                <button type="button" onClick={() => setQueueOpen(true)} className="void-store-pagehead-button-dark">
                  Queue {combinedQueue.length}
                </button>
                <button type="button" onClick={() => setCartOpen(true)} className="void-store-pagehead-button-dark">
                  Cart ${cartTotal}
                </button>
              </div>
            </div>
            {renderBeatUploadManager()}
            {renderFeaturedBeatManager()}
            {renderBeatTagFilters()}
            {renderBeatGrid(filteredBeats)}
          </section>
        );
      }

      return (
      <div className="space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="void-store-hero"
        >
          <div className="void-store-hero-media">
          </div>
          <div className="void-store-hero-overlay" />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.45, ease: "easeOut" }}
            className="void-store-hero-copy"
          >
            <h1 className="void-store-hero-title">Void Archive</h1>
            <div className="void-store-hero-grid">
              <div className="void-store-hero-column">
                <div className="void-store-counter-card">
                  <span className="void-store-counter-label">Beats</span>
                  <span className="void-store-counter-value">{allBeats.length}</span>
                </div>
                <button type="button" onClick={() => setActiveSection("beats")} className="void-store-hero-button w-full">Browse Beats</button>
              </div>
              <div className="void-store-hero-column">
                <div className="void-store-counter-card">
                  <span className="void-store-counter-label">Drumkits</span>
                  <span className="void-store-counter-value">{storeItems.filter((item) => item.section === "drumkits").length}</span>
                </div>
                <button type="button" onClick={() => setActiveSection("drumkits")} className="void-store-hero-button w-full">Browse Drumkits</button>
              </div>
              <div className="void-store-hero-column">
                <div className="void-store-counter-card">
                  <span className="void-store-counter-label">Loops</span>
                  <span className="void-store-counter-value">{storeItems.filter((item) => item.section === "loops").length}</span>
                </div>
                <button type="button" onClick={() => setActiveSection("loops")} className="void-store-hero-button w-full">Browse Loops</button>
              </div>
              <div className="void-store-hero-column">
                <div className="void-store-counter-card">
                  <span className="void-store-counter-label">Artwork</span>
                  <span className="void-store-counter-value">{storeItems.filter((item) => item.section === "artwork").length}</span>
                </div>
                <button type="button" onClick={() => setActiveSection("artwork")} className="void-store-hero-button w-full">Browse Artwork</button>
              </div>
            </div>
          </motion.div>
        </motion.section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white sm:text-3xl">Featured Beats</h2>
            </div>
            {renderBeatTagFilters("md:justify-end")}
          </div>
          {renderBeatGrid(featuredHomeBeats)}
        </section>

        {renderStorePreviewGrid("drumkits", "Featured Drumkits")}
        {renderStorePreviewGrid("loops", "Featured Loops")}
        {renderStorePreviewGrid("artwork", "Featured Artwork")}
      </div>
    );
  };

  const favoriteProducts = [...allBeats, ...storeItems].filter((item) => favorites.includes(item.id));
  const playlistBeats = allBeats.filter((beat) => playlist.includes(beat.id));
  const combinedQueue = [...queueItems, ...cartItems.map((item) => {
    const matchedBeat = allBeats.find((beat) => beat.id === item.beatId);
    return {
      id: `${item.beatId}-${item.license}`,
      title: matchedBeat?.title ?? item.beatId,
      subtitle: item.license,
      section: "loops" as const,
      accentClass: "void-dashboard-cover",
      previewUrl: matchedBeat?.previewUrl,
      imageUrl: matchedBeat ? getBeatImageUrl(matchedBeat) : undefined,
    };
  })];
  const filteredLocations = locationQuery.trim().length === 0
    ? []
    : LOCATION_SUGGESTIONS.filter((location) => location.toLowerCase().includes(locationQuery.toLowerCase())).slice(0, 6);
  const profileTabs: { id: ProfileTab; label: string; icon: typeof CreditCard }[] = [
    { id: "edit", label: "Edit Profile", icon: UserCircle2 },
    { id: "payment", label: "Payment Info", icon: CreditCard },
    { id: "favorites", label: "Favorites", icon: Heart },
    { id: "playlist", label: "My Playlist", icon: ListMusic },
    { id: "orders", label: "My Orders", icon: ShoppingBag },
    { id: "promotions", label: "Promotions", icon: Percent },
  ];
  const primaryNavLinks = mainLinks.filter((item) =>
    ["home", "beats", "drumkits", "loops", "artwork", "contact"].includes(item.id),
  );
  const footerLinks = mainLinks.filter((item) => ["socials", "terms"].includes(item.id));

  return (
    <div className="void-store-shell">
      <div className="void-store-backdrop" aria-hidden="true" />
      <AnimatePresence>
        {profileOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close profile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProfileOpen(false)}
              className="fixed inset-0 z-40 bg-black/72"
            />
            <motion.aside
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              className="fixed inset-4 z-50 flex flex-col rounded-[26px] border border-white/10 bg-[#0b0b0e] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.72)]"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-white/45">Profile</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">{profileForm.displayName || user?.email || "Your Profile"}</h2>
                  <p className="mt-1 text-sm text-white/55">{profileForm.role}</p>
                </div>
                <button type="button" onClick={() => setProfileOpen(false)} className="rounded-full bg-white/10 p-2 text-white">
                  <X size={16} />
                </button>
              </div>
              <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
                <div className="space-y-2 border-b border-white/10 pb-4 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5">
                  {profileTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setProfileTab(tab.id)}
                        className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left ${profileTab === tab.id ? "bg-[#ff8a63] text-white" : "bg-white/6 text-white/72"}`}
                      >
                        <Icon size={16} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="min-h-0 overflow-y-auto pr-1">
                  <div className="space-y-4">
                    {profileTab === "edit" ? (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white">Edit Profile</h3>
                          <p className="mt-1 text-sm text-white/55">Update your profile photo, name, location, and account type.</p>
                        </div>
                        <div className="flex items-center gap-4 rounded-2xl border border-white/8 bg-[#141418] p-4">
                          <label className="group flex cursor-pointer items-center gap-4">
                            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-white/10 text-white/60 ring-1 ring-white/8 transition group-hover:ring-[#ff8a63]/55">
                              {profileForm.profilePhoto ? (
                                <img src={profileForm.profilePhoto} alt="Profile" className="h-full w-full object-cover" />
                              ) : (
                                <UserCircle2 size={40} />
                              )}
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-white">Click profile photo to upload</p>
                              <p className="text-xs text-white/45">JPG, JPEG, PNG, and other image files supported.</p>
                            </div>
                            <input type="file" accept="image/*" onChange={handleProfilePhotoChange} className="hidden" />
                          </label>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">First Name</label>
                            <input value={profileForm.firstName} onChange={(event) => setProfileForm((current) => ({ ...current, firstName: event.target.value }))} className="void-dashboard-input" />
                          </div>
                          <div>
                            <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Last Name</label>
                            <input value={profileForm.lastName} onChange={(event) => setProfileForm((current) => ({ ...current, lastName: event.target.value }))} className="void-dashboard-input" />
                          </div>
                          <div>
                            <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Display Name</label>
                            <input value={profileForm.displayName} onChange={(event) => setProfileForm((current) => ({ ...current, displayName: event.target.value }))} className="void-dashboard-input" />
                          </div>
                          <div className="relative">
                            <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Location</label>
                            <input
                              value={locationQuery}
                              onChange={(event) => {
                                const value = event.target.value;
                                setLocationQuery(value);
                                setProfileForm((current) => ({ ...current, location: value }));
                              }}
                              placeholder="City, State"
                              className="void-dashboard-input"
                            />
                            {filteredLocations.length > 0 ? (
                              <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 rounded-2xl border border-white/10 bg-[#121216] p-2 shadow-2xl">
                                {filteredLocations.map((location) => (
                                  <button
                                    key={location}
                                    type="button"
                                    onClick={() => {
                                      setLocationQuery(location);
                                      setProfileForm((current) => ({ ...current, location }));
                                    }}
                                    className="block w-full rounded-xl px-3 py-2 text-left text-sm text-white/78 transition hover:bg-white/8"
                                  >
                                    {location}
                                  </button>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>
                        <div>
                          <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Account Type</label>
                          <select value={profileForm.role} onChange={(event) => setProfileForm((current) => ({ ...current, role: event.target.value as UserRole }))} className="void-dashboard-select">
                            <option value="Artist">Artist</option>
                            <option value="Producer">Producer</option>
                            <option value="Consumer">Consumer</option>
                          </select>
                        </div>
                      </div>
                    ) : null}

                    {profileTab === "payment" ? (
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-lg font-semibold text-white">Payment Info</h3>
                          <p className="mt-1 text-sm text-white/55">Pick a payment option first. The matching form or connect action will appear below.</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          {PAYMENT_OPTIONS.map((method) => (
                            <button
                              key={method}
                              type="button"
                              onClick={() => togglePaymentMethod(method)}
                              className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left ${selectedPaymentMethod === method ? "border-[#ff8a63]/60 bg-white/8 text-white" : "border-white/8 bg-[#141418] text-white/72"}`}
                            >
                              <span className="inline-flex items-center gap-3">
                                {method === "Cash App" ? <Banknote size={16} /> : <CreditCard size={16} />}
                                {method}
                              </span>
                              {selectedPaymentMethod === method ? <Check size={16} /> : null}
                            </button>
                          ))}
                        </div>
                        {selectedPaymentMethod === "Bank Card" ? (
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Cardholder Name</label>
                              <input value={profileForm.cardholderName} onChange={(event) => setProfileForm((current) => ({ ...current, cardholderName: event.target.value }))} className="void-dashboard-input" />
                            </div>
                            <div>
                              <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Card Number</label>
                              <input value={profileForm.cardNumber} onChange={(event) => setProfileForm((current) => ({ ...current, cardNumber: event.target.value }))} className="void-dashboard-input" />
                            </div>
                            <div>
                              <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Expiry Date</label>
                              <input value={profileForm.expiryDate} onChange={(event) => setProfileForm((current) => ({ ...current, expiryDate: event.target.value }))} placeholder="MM/YY" className="void-dashboard-input" />
                            </div>
                            <div>
                              <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">CVV</label>
                              <input value={profileForm.cvv} onChange={(event) => setProfileForm((current) => ({ ...current, cvv: event.target.value }))} className="void-dashboard-input" />
                            </div>
                          </div>
                        ) : null}
                        {selectedPaymentMethod === "Bank" ? (
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Bank Name</label>
                              <input value={profileForm.bankName} onChange={(event) => setProfileForm((current) => ({ ...current, bankName: event.target.value }))} className="void-dashboard-input" />
                            </div>
                            <div>
                              <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Account Name</label>
                              <input value={profileForm.accountName} onChange={(event) => setProfileForm((current) => ({ ...current, accountName: event.target.value }))} className="void-dashboard-input" />
                            </div>
                            <div>
                              <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Routing Number</label>
                              <input value={profileForm.routingNumber} onChange={(event) => setProfileForm((current) => ({ ...current, routingNumber: event.target.value }))} className="void-dashboard-input" />
                            </div>
                            <div>
                              <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Account Number</label>
                              <input value={profileForm.accountNumber} onChange={(event) => setProfileForm((current) => ({ ...current, accountNumber: event.target.value }))} className="void-dashboard-input" />
                            </div>
                          </div>
                        ) : null}
                        {selectedPaymentMethod === "Cash App" ? (
                          <div className="space-y-3 rounded-2xl border border-white/8 bg-[#141418] p-4">
                            <div>
                              <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">Cash App Tag</label>
                              <input value={profileForm.cashAppTag} onChange={(event) => setProfileForm((current) => ({ ...current, cashAppTag: event.target.value }))} placeholder="$yourcashtag" className="void-dashboard-input" />
                            </div>
                            <button type="button" onClick={() => openExternalConnect("https://cash.app/")} className="void-dashboard-primary">Connect Cash App</button>
                          </div>
                        ) : null}
                        {selectedPaymentMethod === "PayPal" ? (
                          <div className="space-y-3 rounded-2xl border border-white/8 bg-[#141418] p-4">
                            <div>
                              <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/45">PayPal Email</label>
                              <input value={profileForm.paypalEmail} onChange={(event) => setProfileForm((current) => ({ ...current, paypalEmail: event.target.value }))} className="void-dashboard-input" />
                            </div>
                            <button type="button" onClick={() => openExternalConnect("https://www.paypal.com/signin")} className="void-dashboard-primary">Connect PayPal</button>
                          </div>
                        ) : null}
                        {selectedPaymentMethod === "Apple Pay" ? (
                          <div className="space-y-3 rounded-2xl border border-white/8 bg-[#141418] p-4">
                            <p className="text-sm text-white/65">Use Apple Pay connection to continue setup on Apple’s side.</p>
                            <button type="button" onClick={() => openExternalConnect("https://applepaydemo.apple.com/")} className="void-dashboard-primary">Connect Apple Pay</button>
                          </div>
                        ) : null}
                        <div className="space-y-3 pt-2">
                          <h3 className="text-lg font-semibold text-white">Enabled Payment Methods</h3>
                          {PAYMENT_OPTIONS.map((method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => togglePaymentMethod(method)}
                            className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 ${profileForm.paymentMethods.includes(method) ? "border-[#ff8a63]/50 bg-white/8 text-white" : "border-white/8 bg-[#141418] text-white/72"}`}
                          >
                            <span className="inline-flex items-center gap-3">
                              {method === "Cash App" ? <Banknote size={16} /> : <CreditCard size={16} />}
                              {method}
                            </span>
                            {profileForm.paymentMethods.includes(method) ? <Check size={16} /> : null}
                          </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {profileTab === "favorites" ? (
                        <div className="space-y-3">
                          <div>
                            <h3 className="text-lg font-semibold text-white">Favorites</h3>
                            <p className="mt-1 text-sm text-white/55">All products you marked as favorites live here.</p>
                          </div>
                          {favoriteProducts.length ? favoriteProducts.map((item) => (
                            "artist" in item ? renderFavoriteBeatRow(item) : (
                              <div key={item.id} className="rounded-2xl border border-white/8 bg-[#141418] p-4 text-white">
                                <p className="font-semibold">{item.title}</p>
                                <p className="mt-1 text-sm text-white/55">{item.section}</p>
                              </div>
                            )
                          )) : <p className="text-sm text-white/55">No favorites saved yet.</p>}
                        </div>
                      ) : null}

                    {profileTab === "playlist" ? (
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-lg font-semibold text-white">My Playlist</h3>
                          <p className="mt-1 text-sm text-white/55">Your saved beat playlist sits here by itself.</p>
                        </div>
                        {playlistBeats.length ? playlistBeats.map((beat) => (
                          <button key={beat.id} type="button" onClick={() => handleQueuePlay(beat)} className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-[#141418] p-4 text-left text-white">
                            <span>
                              <p className="font-semibold">{beat.title}</p>
                              <p className="mt-1 text-sm text-white/55">{beat.artist}</p>
                            </span>
                            <Play size={16} />
                          </button>
                        )) : <p className="text-sm text-white/55">No beats in your playlist yet.</p>}
                      </div>
                    ) : null}

                    {profileTab === "orders" ? (
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-lg font-semibold text-white">Purchased Orders</h3>
                          <p className="mt-1 text-sm text-white/55">Every completed purchase will show up here.</p>
                        </div>
                        {orders.length ? orders.map((order) => (
                          <div key={order.id} className="rounded-2xl border border-white/8 bg-[#141418] p-4 text-white">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-semibold">{order.title}</p>
                                <p className="mt-1 text-sm text-white/55">{order.license}</p>
                              </div>
                              <span>${order.price}</span>
                            </div>
                            <p className="mt-2 text-xs text-white/45">{new Date(order.purchasedAt).toLocaleString()}</p>
                          </div>
                        )) : <p className="text-sm text-white/55">No purchases yet.</p>}
                      </div>
                    ) : null}

                    {profileTab === "promotions" ? (
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-lg font-semibold text-white">Promotions</h3>
                          <p className="mt-1 text-sm text-white/55">No promo codes are active right now, but you can save codes here for later use.</p>
                        </div>
                        <div className="flex gap-2">
                          <input value={profilePromoCode} onChange={(event) => setProfilePromoCode(event.target.value)} placeholder="Enter promo code" className="void-dashboard-input min-w-0" />
                          <button type="button" onClick={() => applyPromoCode("profile")} className="void-dashboard-secondary">Save</button>
                        </div>
                        {savedPromoCodes.length ? (
                          <div className="flex flex-wrap gap-2">
                            {savedPromoCodes.map((code) => (
                              <span key={code} className="rounded-full bg-white/8 px-3 py-2 text-xs text-white/76">{code}</span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
        {cartOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close cart"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              className="fixed inset-0 z-40 bg-black/72"
            />
            <motion.aside
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              className="fixed inset-y-4 right-4 z-50 flex w-[min(92vw,380px)] flex-col rounded-[26px] border border-white/10 bg-[#0b0b0e] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.72)] void-store-cart-drawer"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Cart</h3>
                <button type="button" onClick={() => setCartOpen(false)} className="rounded-full bg-white/10 p-2 text-white">
                  <X size={16} />
                </button>
              </div>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                {cartItems.length === 0 ? (
                  <div className="rounded-2xl border border-white/8 bg-[#151519] p-4 text-sm text-white/70">Your cart is empty.</div>
                ) : (
                  cartItems.map((item, index) => {
                    const beat = allBeats.find((entry) => entry.id === item.beatId);
                    return (
                      <div key={`${item.beatId}-${index}`} className="rounded-2xl border border-white/8 bg-[#151519] p-4">
                        <p className="font-medium text-white">{beat?.title}</p>
                        <p className="mt-1 text-sm text-white/60">{item.license}</p>
                        <p className="mt-1 text-xs text-white/45">Full beat file included after purchase</p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-white">${item.price}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setCartItems((current) => current.filter((_, currentIndex) => currentIndex !== index))
                            }
                            className="text-xs text-white/55"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="mt-5 border-t border-white/10 pt-4">
                <div className="mb-4 space-y-2">
                  <label className="block text-xs uppercase tracking-[0.2em] text-white/45">Promo Code</label>
                  <div className="flex gap-2">
                    <input
                      value={checkoutPromoCode}
                      onChange={(event) => setCheckoutPromoCode(event.target.value)}
                      placeholder="Enter promo code"
                      className="void-dashboard-input min-w-0"
                    />
                    <button type="button" onClick={() => applyPromoCode("checkout")} className="void-dashboard-secondary">
                      Apply
                    </button>
                  </div>
                </div>
                <div className="mb-4 flex items-center justify-between text-white">
                  <span>Total</span>
                  <span>${cartTotal}</span>
                </div>
                <button type="button" onClick={proceedToCheckout} className="void-dashboard-primary w-full justify-center">Checkout</button>
              </div>
            </motion.aside>
          </>
        )}
        {queueOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close queue"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQueueOpen(false)}
              className="fixed inset-0 z-40 bg-black/72"
            />
            <motion.aside
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              className="fixed inset-y-4 right-4 z-50 flex w-[min(92vw,420px)] flex-col rounded-[26px] border border-white/10 bg-[#0b0b0e] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.72)]"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Play Queue</h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/40">Preview order</p>
                </div>
                <button type="button" onClick={() => setQueueOpen(false)} className="rounded-full bg-white/10 p-2 text-white">
                  <X size={16} />
                </button>
              </div>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                {(combinedQueue.length > 0
                  ? combinedQueue
                  : [{ id: selectedBeat.id, title: selectedBeat.title, subtitle: selectedBeat.artist, section: "loops" as const, accentClass: "void-dashboard-cover", previewUrl: selectedBeat.previewUrl, imageUrl: getBeatImageUrl(selectedBeat) }]
                ).map((beat, index) => (
                  <div
                    key={`${beat.id}-${index}`}
                    className={`rounded-2xl border px-3 py-3 transition ${selectedBeat.id === beat.id ? "border-[#ff9f7e]/50 bg-white/8" : "border-white/6 bg-white/[0.03]"}`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const matchedBeat = allBeats.find((entry) => entry.id === beat.id);
                          if (matchedBeat) handleQueuePlay(matchedBeat);
                        }}
                        className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#ffb48f] to-[#5d5d5d] text-white"
                      >
                        {beat.imageUrl ? (
                          <img src={beat.imageUrl} alt={beat.title} className="absolute inset-0 h-full w-full object-cover" />
                        ) : null}
                        <span className="relative z-[1] rounded-full bg-black/35 p-1.5">
                          {currentPreviewBeatId === beat.id ? <Pause size={18} /> : <Play size={18} />}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const matchedBeat = allBeats.find((entry) => entry.id === beat.id);
                          if (matchedBeat) setSelectedBeatId(matchedBeat.id);
                        }}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="truncate text-sm font-medium text-white">{beat.title}</p>
                        <p className="truncate text-xs text-white/55">{beat.subtitle}</p>
                        {currentPreviewBeatId === beat.id && allBeats.some((entry) => entry.id === beat.id) ? (
                          <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/45">
                            {Math.max(0, 30 - Math.floor(((previewProgress[beat.id] ?? 0) / 100) * 30))}s remaining
                          </p>
                        ) : null}
                      </button>
                      <span className="text-sm font-semibold text-white">
                        {allBeats.some((entry) => entry.id === beat.id) ? `$${LICENSES[licenseSelections[beat.id] ?? "Basic Lease"]}` : "Queued"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                <button type="button" onClick={() => setCartOpen(true)} className="void-dashboard-secondary">
                  Open Cart
                </button>
                <button type="button" onClick={() => setQueueOpen(false)} className="void-dashboard-primary">
                  Done
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="mx-auto min-h-screen max-w-[1520px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="void-store-frame">
          <header className="void-store-header">
            <button type="button" onClick={() => setActiveSection("home")} className="text-left">
              <span className="void-brandword block text-[2.5rem] leading-none text-white">VOID</span>
              <span className="mt-1 block text-[0.65rem] uppercase tracking-[0.28em] text-white/52">by ejcertified</span>
            </button>

            <nav className="void-store-nav">
              {primaryNavLinks.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`void-store-navlink ${activeSection === item.id ? "is-active" : ""}`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="void-store-searchslot">
              <label className="void-store-search">
                <Search size={16} />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search beats, tags, artists"
                  className="w-full bg-transparent text-[19px] text-white outline-none placeholder:text-white/42"
                />
              </label>
            </div>

            <div className="void-store-toolbar">
              <button type="button" onClick={() => setActiveSection("terms")} className="void-store-headerlink">
                <span>TOS</span>
              </button>
              <button type="button" onClick={() => setCartOpen(true)} className="void-store-headerlink">
                <ShoppingBag size={16} />
                <span>Cart ${cartTotal}</span>
              </button>
              {user ? (
                <button type="button" onClick={() => { setActiveSection("profile"); setProfileTab("edit"); }} className="void-store-headerlink">
                  <span>{profileForm.displayName || "Profile"}</span>
                </button>
              ) : (
                <button type="button" onClick={() => openAuth("signin")} className="void-store-headerlink">Sign in</button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (user) {
                    setActiveSection("profile");
                    setProfileTab("edit");
                  } else {
                    openAuth("signin");
                  }
                }}
                className="void-store-avatarbutton"
                aria-label={user ? "Open profile" : "Open sign in"}
              >
                {profileForm.profilePhoto ? (
                  <img src={profileForm.profilePhoto} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <UserCircle2 size={20} />
                )}
              </button>
            </div>
          </header>

          {adminUnlocked ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="void-store-admin-banner"
            >
              <div className="void-store-admin-indicator">
                <motion.span
                  animate={{ opacity: [0.55, 1, 0.55], scale: [1, 1.08, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  className="void-store-admin-indicator-dot"
                />
                <KeyRound size={15} />
                <span>Admin Mode</span>
              </div>
              <div className="void-store-admin-banner-actions">
                <span className={`void-store-admin-status ${storefrontSaveState === "error" ? "is-error" : storefrontConfigDirty ? "is-dirty" : storefrontSaveState === "saved" ? "is-saved" : ""}`}>
                  {storefrontSaveState === "saving"
                    ? "Saving..."
                    : storefrontSaveState === "error"
                      ? "Save failed"
                      : storefrontConfigDirty
                        ? "Unsaved changes"
                        : storefrontSaveState === "saved"
                          ? "Saved to all devices"
                          : "No unsaved changes"}
                </span>
                <button
                  type="button"
                  onClick={() => void saveStorefrontChanges()}
                  disabled={!storefrontConfigDirty || storefrontSaveState === "saving"}
                  className={`void-dashboard-primary ${!storefrontConfigDirty || storefrontSaveState === "saving" ? "opacity-60" : ""}`}
                >
                  {storefrontSaveState === "saving" ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </motion.div>
          ) : null}

          <main className="void-store-main">
            {renderMainContent()}
          </main>

            <footer className="void-store-footer">
              <p className="void-store-eyebrow void-store-footer-brand">VOID</p>
              <div className="void-store-footer-links">
                {footerLinks.map((item) => (
                  <button key={item.id} type="button" onClick={() => setActiveSection(item.id)} className="void-store-footer-link">
                    {item.label}
                  </button>
                ))}
                {socialLinks.instagram ? (
                  <a href={socialLinks.instagram} target="_blank" rel="noreferrer" className="void-store-footer-link">Instagram</a>
                ) : null}
                {socialLinks.youtube ? (
                  <a href={socialLinks.youtube} target="_blank" rel="noreferrer" className="void-store-footer-link">YouTube</a>
                ) : null}
                <button type="button" onClick={unlockAdmin} className="void-store-footer-link">
                  Admin
                </button>
              </div>
            </footer>
        </div>

        <AnimatePresence>
          {currentPreviewBeatId ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="void-store-player"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-2xl bg-gradient-to-br from-[#ffb48f] to-[#5d5d5d]">
                  {selectedBeatImage ? (
                    <img src={selectedBeatImage} alt={selectedBeat.title} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{selectedBeat.title}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/46">{selectedBeat.artist}</p>
                </div>
              </div>
              <div className="hidden min-w-[220px] flex-1 items-center gap-3 sm:flex">
                <button type="button" onClick={() => void playPreview(selectedBeat)} className="rounded-full bg-white/10 p-3 text-white">
                  {currentPreviewBeatId === selectedBeat.id ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <div className="h-1.5 flex-1 rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[#ff8a63]" style={{ width: `${previewProgress[selectedBeat.id] ?? 0}%` }} />
                </div>
                <span className="text-xs uppercase tracking-[0.18em] text-white/42">
                  {Math.max(0, 30 - Math.floor(((previewProgress[selectedBeat.id] ?? 0) / 100) * 30))}s
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setQueueOpen(true)} className="void-store-iconpill">Queue</button>
                <button type="button" onClick={() => addToCart(selectedBeat)} className="void-dashboard-primary">
                  Buy ${selectedPrice}
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Index;
