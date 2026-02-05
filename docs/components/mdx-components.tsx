import { TokenReference } from "@/components/token-reference";
import clsx from "clsx";
import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import { File, Files, Folder } from "fumadocs-ui/components/files";
import { ImageZoom } from "fumadocs-ui/components/image-zoom";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { TypeTable } from "fumadocs-ui/components/type-table";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { ComponentExample } from "./component-example";
import { MdxExample } from "./mdx-example";

export const mdxComponents: MDXComponents = {
    ...defaultMdxComponents,

    img: ({ className, ...rest }) => (
        <ImageZoom
            className={clsx(
                className,
                "bg-palette-gray-100 dark:bg-palette-gray-900 rounded-r2 overflow-hidden",
            )}
            {...rest}
        />
    ),

    // Layout
    Grid: ({ children }) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-2 md:items-start my-[2em] [&>figure]:my-0 not-prose [&>ul]:list-disc [&>ul]:p-2.5 [&>ul]:pl-8">
            {children}
        </div>
    ),

    // Components
    Tab,
    Tabs,
    Step,
    Steps,
    File,
    Folder,
    Files,
    Accordion,
    Accordions,
    CodeBlock,
    Pre,
    TypeTable,
    ComponentExample,
    MdxExample,
    TokenReference,

    // Icons for MDX

    // Guidelines
    ImageZoom,

    FigmaImage: () => null,
};
