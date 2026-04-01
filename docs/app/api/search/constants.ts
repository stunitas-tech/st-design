import type { TagItem } from "fumadocs-ui/contexts/search";

export const TAGS = {
    design: { name: "Docs", value: "docs" },
    react: { name: "React", value: "react" },
    // gongsoop: { name: "Gongsoop", value: "gongsoop" },
} as const satisfies Record<string, TagItem>;
