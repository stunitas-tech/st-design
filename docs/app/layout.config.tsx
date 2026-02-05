import { docsSource, gongsoopSource } from "@/lib/source";
import clsx from "clsx";
import type { DocsLayoutProps } from "fumadocs-ui/layouts/notebook";
import { File } from "lucide-react";
import type { PropsWithChildren } from "react";

function SidebarTabIconContainer({
    children,
    className,
}: PropsWithChildren<{ className?: string }>) {
    return (
        <div
            className={clsx(
                className,
                "[&_svg]:size-full rounded-lg size-full text-(--tab-color) max-md:bg-(--tab-color)/10 max-md:border max-md:p-1.5",
            )}
        >
            {children}
        </div>
    );
}

/**
 * Shared layout configurations
 *
 * you can configure layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */

export const baseOptions: Omit<DocsLayoutProps, "tree"> = {
    githubUrl: "https://github.com/stunitas-tech/st-design",
    sidebar: {
        tabs: [
            {
                title: "Docs",
                description: "단기 앱을 위한 디자인 언어",
                url: "/docs",
                icon: (
                    <SidebarTabIconContainer className="[--tab-color:var(--design-color)]">
                        <File />
                    </SidebarTabIconContainer>
                ),
            },
            {
                title: "Gongsoop",
                description: "공숲을 위한 디자인 언어",
                url: "/gongsoop",
                icon: (
                    <SidebarTabIconContainer className="[--tab-color:var(--design-color)]">
                        <File />
                    </SidebarTabIconContainer>
                ),
            },
        ],
    },
    tabMode: "navbar",
    nav: {
        mode: "top",
        url: "/docs",
        title: (
            <div className="flex gap-2 justify-center items-center">
                <svg
                    width="128"
                    height="84"
                    viewBox="0 0 128 84"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    role="presentation"
                    className="text-black dark:text-white shrink-0 w-7 h-auto"
                >
                    <path
                        d="M65.6541 46.552C63.1332 59.1099 51.0421 68.1665 37.3636 65.8323C27.7001 64.1983 19.7171 56.589 17.7564 46.9721C14.4418 31.1463 26.4396 17.2345 41.7052 17.2345C50.7152 17.2345 58.5582 22.0896 62.8064 29.2789C66.1677 24.4705 70.556 20.4089 75.6445 17.4212C67.9417 6.63722 55.1969 -0.271893 40.8649 0.0082096C18.9702 0.428364 0.623341 18.635 0.0164492 40.5297C-0.637127 64.105 18.2699 83.4322 41.7052 83.4322C61.9661 83.4322 78.8657 68.9602 82.6471 49.7732C84.0476 42.7706 90.7701 37.6353 98.4263 38.8958C104.028 39.8294 108.65 44.3577 109.63 49.9598C111.171 58.643 104.495 66.2058 96.0921 66.2058C91.5638 66.2058 87.5489 64.0117 85.028 60.6504C82.6471 66.1124 79.2392 71.0609 75.0376 75.2158C80.2662 80.0709 87.1755 83.1054 94.785 83.4322C111.871 84.1324 126.763 70.0805 127.044 52.9942C127.324 35.6745 113.365 21.5294 96.0921 21.5294C81.0132 21.4827 68.4085 32.2667 65.6541 46.552Z"
                        fill="currentColor"
                    />
                </svg>
                <div>ST Design</div>
            </div>
        ),
    },
};

export const docsOptions: DocsLayoutProps = {
    ...baseOptions,
    tree: docsSource.pageTree,

    // tree: await source.getTransformedPageTree(),
};

export const gongsoopOptions: DocsLayoutProps = {
    ...baseOptions,
    tree: gongsoopSource.pageTree,
    // tree: await source.getTransformedPageTree(),
};
