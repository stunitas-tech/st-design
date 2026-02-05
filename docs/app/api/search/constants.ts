import type { TagItem } from "fumadocs-ui/contexts/search";

export const TAGS = {
    design: { name: "Design", value: "design" },
    gongsoop: { name: "Gongsoop", value: "gongsoop" },
} as const satisfies Record<string, TagItem>;
