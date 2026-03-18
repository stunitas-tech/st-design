"use client";

import { RulerDimensionLine } from "lucide-react";
import { AlphaGrid } from "./alpha-grid";
import { Token } from "./tokens";

export default function TokenValue({
    item,
    alias = false,
}: {
    item: Token;
    alias?: boolean;
}) {
    const value = item?.value?.split(" ")[0];
    const per = item?.value?.split(" ")[1];
    const perNum = per?.replace(/[()]/g, "") || "100%";
    const isPercent = perNum && perNum !== "100%";
    const isOpacity = item?.name?.includes("Opacity");
    const isColor = value?.startsWith("#");
    const isAlias = !alias && item?.alias;
    const isPixel = !isColor && !isOpacity && !isAlias;

    return (
        <div className="flex items-center gap-2">
            {isColor || isOpacity ? (
                <AlphaGrid className="inline-block size-5 shrink-0 rounded-full border border-fd-border">
                    <span
                        className="absolute left-0 top-0 w-full h-full"
                        style={{
                            backgroundColor:
                                !isPercent && !isOpacity
                                    ? value
                                    : `rgba(0, 0, 0, ${perNum})`,
                            opacity: isOpacity ? Number(value) / 10 : 1,
                        }}
                    ></span>
                </AlphaGrid>
            ) : (
                <RulerDimensionLine className="inline-block size-5 shrink-0" />
            )}
            <span className="font-mono text-xs">
                {isPixel ? Number(value) / 10 : isAlias ? item?.alias : value}
                {isPercent && ` ${per}`}
                {isOpacity && "%"}
                {isPixel && `rem (${value}px)`}
            </span>
        </div>
    );
}
