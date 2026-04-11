import { useEffect } from "react";
import { Disc3, Drum, Home, Layers, Mail, Music2, Palette, ShoppingBag, User } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

export type CommandPaletteBeat = {
  id: string;
  title: string;
  artist?: string;
  bpm?: number;
  tags?: string[];
};

export type CommandPaletteStoreItem = {
  id: string;
  title: string;
  subtitle?: string;
  section: "drumkits" | "loops" | "artwork";
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  beats: CommandPaletteBeat[];
  storeItems: CommandPaletteStoreItem[];
  onNavigate: (section: string) => void;
  onPickBeat: (id: string) => void;
  onPickStoreItem: (id: string, section: "drumkits" | "loops" | "artwork") => void;
  onOpenCart: () => void;
  onOpenAuth: () => void;
  isSignedIn: boolean;
};

/**
 * VOID command palette — Cmd+K (or Ctrl+K) opens it.
 *
 * Searches across:
 *  - Site navigation (Home, Beats, Drumkits, Loops, Community Art, Contact)
 *  - Beats by title, artist, BPM, tags
 *  - Drumkits / Loops / Artwork by title and subtitle
 *  - Quick actions (Open Cart, Sign In)
 *
 * Listens for the global Cmd+K / Ctrl+K shortcut and toggles itself.
 * Parent passes onNavigate / onPickBeat / etc. callbacks to wire results
 * back into the page state.
 */
export const VoidCommandPalette = ({
  open,
  onOpenChange,
  beats,
  storeItems,
  onNavigate,
  onPickBeat,
  onPickStoreItem,
  onOpenCart,
  onOpenAuth,
  isSignedIn,
}: Props) => {
  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  const close = () => onOpenChange(false);

  const drumkits = storeItems.filter((item) => item.section === "drumkits");
  const loops = storeItems.filter((item) => item.section === "loops");
  const artwork = storeItems.filter((item) => item.section === "artwork");

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search beats, kits, sections..." />
      <CommandList className="max-h-[440px]">
        <CommandEmpty>No matches found.</CommandEmpty>

        <CommandGroup heading="Navigate">
          <CommandItem
            onSelect={() => {
              onNavigate("home");
              close();
            }}
          >
            <Home />
            <span>Home</span>
            <CommandShortcut>H</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onNavigate("beats");
              close();
            }}
          >
            <Music2 />
            <span>Beats</span>
            <CommandShortcut>B</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onNavigate("drumkits");
              close();
            }}
          >
            <Drum />
            <span>Drumkits</span>
            <CommandShortcut>D</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onNavigate("loops");
              close();
            }}
          >
            <Layers />
            <span>Loops</span>
            <CommandShortcut>L</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onNavigate("artwork");
              close();
            }}
          >
            <Palette />
            <span>Community Art</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              onNavigate("contact");
              close();
            }}
          >
            <Mail />
            <span>Contact</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Actions">
          <CommandItem
            onSelect={() => {
              onOpenCart();
              close();
            }}
          >
            <ShoppingBag />
            <span>Open Cart</span>
          </CommandItem>
          {!isSignedIn ? (
            <CommandItem
              onSelect={() => {
                onOpenAuth();
                close();
              }}
            >
              <User />
              <span>Sign In</span>
            </CommandItem>
          ) : (
            <CommandItem
              onSelect={() => {
                onNavigate("profile");
                close();
              }}
            >
              <User />
              <span>Open Profile</span>
            </CommandItem>
          )}
        </CommandGroup>

        {beats.length > 0 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Beats">
              {beats.slice(0, 30).map((beat) => (
                <CommandItem
                  key={beat.id}
                  // Build a search keyword string from all the metadata so cmdk
                  // matches against artist/bpm/tags too, not just title
                  value={[beat.title, beat.artist ?? "", `bpm ${beat.bpm ?? ""}`, ...(beat.tags ?? [])].join(" ")}
                  onSelect={() => {
                    onPickBeat(beat.id);
                    close();
                  }}
                >
                  <Disc3 />
                  <span className="flex-1 truncate">{beat.title}</span>
                  {beat.bpm ? (
                    <CommandShortcut>{beat.bpm} BPM</CommandShortcut>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}

        {drumkits.length > 0 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Drumkits">
              {drumkits.slice(0, 15).map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.title} ${item.subtitle ?? ""}`}
                  onSelect={() => {
                    onPickStoreItem(item.id, "drumkits");
                    close();
                  }}
                >
                  <Drum />
                  <span className="flex-1 truncate">{item.title}</span>
                  {item.subtitle ? (
                    <CommandShortcut>{item.subtitle}</CommandShortcut>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}

        {loops.length > 0 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Loops">
              {loops.slice(0, 15).map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.title} ${item.subtitle ?? ""}`}
                  onSelect={() => {
                    onPickStoreItem(item.id, "loops");
                    close();
                  }}
                >
                  <Layers />
                  <span className="flex-1 truncate">{item.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}

        {artwork.length > 0 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Community Art">
              {artwork.slice(0, 15).map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.title} ${item.subtitle ?? ""}`}
                  onSelect={() => {
                    onPickStoreItem(item.id, "artwork");
                    close();
                  }}
                >
                  <Palette />
                  <span className="flex-1 truncate">{item.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
};
