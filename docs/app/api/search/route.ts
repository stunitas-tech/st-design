import { TAGS } from "@/app/api/search/constants";
import { tokenize } from "@/components/search/tokenizer";
import { docsSource, gongsoopSource } from "@/lib/source";
import { AdvancedIndex, createSearchAPI } from "fumadocs-core/search/server";

// it should be cached forever
export const revalidate = false;

export const { staticGET: GET } = createSearchAPI("advanced", {
    indexes: () =>
        Promise.all([
            ...docsSource.getPages().map(async (page) => {
                return {
                    id: page.url,
                    title: page.data.title,
                    description: page.data.description,
                    structuredData: page.data.structuredData,
                    tag: TAGS.design.value,
                    url: page.url,
                } satisfies AdvancedIndex;
            }),
            ...gongsoopSource.getPages().map(async (page) => {
                // const { structuredData } = await page.data.load();

                return {
                    id: page.url,
                    title: page.data.title,
                    description: page.data.description,
                    structuredData: page.data.structuredData,
                    tag: TAGS.gongsoop.value,
                    url: page.url,
                } satisfies AdvancedIndex;
            }),
        ]),
    tokenizer: {
        language: "english",
        tokenize,
    },
});
