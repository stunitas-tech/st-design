import { rehypeCodeDefaultOptions } from "fumadocs-core/mdx-plugins";
import { remarkMdxFiles } from "fumadocs-core/mdx-plugins/remark-mdx-files";
import { fileGenerator, remarkDocGen } from "fumadocs-docgen";
import {
    defineConfig,
    defineDocs,
    frontmatterSchema,
    metaSchema,
} from "fumadocs-mdx/config";
import { transformerTwoslash } from "fumadocs-twoslash";

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

export const react = defineDocs({
    dir: "content/react", // content/react 폴더를 감시합니다.
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
        rehypeCodeOptions: {
            themes: {
                light: "github-light",
                dark: "github-dark",
            },
            transformers: [
                ...(rehypeCodeDefaultOptions.transformers ?? []),
                transformerTwoslash(),
            ],
            // important: Shiki doesn't support lazy loading languages for codeblocks in Twoslash popups
            // make sure to define them first (e.g. the common ones)
            langs: ["js", "jsx", "ts", "tsx"],
        },
        remarkPlugins: [
            [remarkDocGen, { generators: [fileGenerator()] }],
            remarkMdxFiles,
        ],
    },
});
