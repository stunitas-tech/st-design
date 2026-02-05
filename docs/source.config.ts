import { fileGenerator, remarkDocGen } from "fumadocs-docgen";
import {
    defineConfig,
    defineDocs,
    frontmatterSchema,
    metaSchema,
} from "fumadocs-mdx/config";

// You can customise Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
    dir: "content/docs",
    docs: {
        schema: frontmatterSchema,
        postprocess: {
            includeProcessedMarkdown: true,
        },
    },
    meta: {
        schema: metaSchema,
    },
});

export const gongsoop = defineDocs({
    dir: "content/gongsoop", // content/gongsoop 폴더를 감시합니다.
    docs: {
        schema: frontmatterSchema,
        postprocess: {
            includeProcessedMarkdown: true,
        },
    },
    meta: {
        schema: metaSchema,
    },
});

export default defineConfig({
    mdxOptions: {
        remarkPlugins: [[remarkDocGen, { generators: [fileGenerator()] }]],
    },
});
