"use client";

import { table } from "@sanity/table";
import { visionTool } from "@sanity/vision";
// import * as changeCase from "change-case";
import { defineConfig } from "sanity";
// import {
//     defineDocuments,
//     defineLocations,
//     presentationTool,
// } from "sanity/presentation";
import { structureTool } from "sanity/structure";
import { apiVersion, dataset, projectId } from "./sanity-studio/env";
import { schema } from "./sanity-studio/schemaTypes";
import { structure } from "./sanity-studio/structure";

export default defineConfig({
    projectId,
    dataset,
    schema,
    basePath: "/admin",
    plugins: [
        structureTool({ structure }),
        // presentationTool({
        //     previewUrl: {},
        //     resolve: {
        //         // TODO: add design guidelines to mainDocuments
        //         mainDocuments: defineDocuments([
        //             {
        //                 route: "/blog/:slug",
        //                 filter: `_type == "blog" && slug.current == $slug`,
        //             },
        //         ]),
        //         locations: {
        //             contents: defineLocations({
        //                 select: {
        //                     title: "title",
        //                 },
        //                 resolve: (doc) => ({
        //                     locations: [
        //                         {
        //                             title: doc?.title || "Untitled",
        //                             href: `/docs/components/${changeCase.kebabCase(doc?.title)}`,
        //                         },
        //                     ],
        //                 }),
        //             }),
        //             blog: defineLocations({
        //                 select: {
        //                     slug: "slug",
        //                     title: "title",
        //                 },
        //                 resolve: (doc) => ({
        //                     locations: [
        //                         {
        //                             title: doc?.title || "Untitled",
        //                             href: `/blog?slug=${doc?.slug.current}`,
        //                         },
        //                     ],
        //                 }),
        //             }),
        //         },
        //     },
        // }),
        table(),
        // Vision is for querying with GROQ from inside the Studio
        // https://www.sanity.io/docs/the-vision-plugin
        visionTool({
            defaultApiVersion: apiVersion,
            defaultDataset: dataset,
        }),
    ],
});
