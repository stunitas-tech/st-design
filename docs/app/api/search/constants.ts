import type { TagItem } from "fumadocs-ui/contexts/search";

export const TAGS = {
    design: { name: "Dangi", value: "dangi" },
    gongsoop: { name: "Gongsoop", value: "gongsoop" },
} as const satisfies Record<string, TagItem>;
