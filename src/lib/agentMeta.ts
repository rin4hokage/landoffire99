import rinAvatar from "@/assets/rin-avatar.jpg";
import hinataAvatar from "@/assets/hinata-avatar.jpg";
import mikasaAvatar from "@/assets/mikasa-avatar.jpg";

export const sakuraAvatar =
  "https://static.wikia.nocookie.net/naruto/images/3/34/Sakura.png";

export const agentAvatarMap: Record<string, string> = {
  Rin: rinAvatar,
  Sakura: sakuraAvatar,
  Hinata: hinataAvatar,
  Mikasa: mikasaAvatar,
};

export const agentInitialMap: Record<string, string> = {
  Rin: "R",
  Sakura: "S",
  Hinata: "H",
  Mikasa: "M",
};
