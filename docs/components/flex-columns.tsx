import clsx from "clsx";
import type { ReactNode } from "react";

type FlexColumnsProps = {
    children: ReactNode;
    className?: string;
};

type FlexColumnProps = {
    children: ReactNode;
    className?: string;
};

/** Notion multi-column layout — stacks on mobile, equal flex columns from md up */
export function FlexColumns({ children, className }: FlexColumnsProps) {
    return (
        <div
            className={clsx(
                "my-[2em] block w-full gap-4 md:flex md:items-start md:gap-4 not-prose",
                className,
            )}
        >
            {children}
        </div>
    );
}

export function FlexColumn({ children, className }: FlexColumnProps) {
    return (
        <div
            className={clsx(
                "min-w-0 w-full flex-1 [&>figure]:my-0 [&>ul]:list-disc [&>ul]:pl-8 [&>ol]:list-decimal [&>ol]:pl-8",
                className,
            )}
        >
            {children}
        </div>
    );
}
