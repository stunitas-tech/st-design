import { clsx, type ClassValue } from "clsx";
import { HTMLAttributes, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// div의 기본 속성들을 상속받도록 정의합니다.
interface AlphaGridProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
    size?: number;
}

export function AlphaGrid({
    children,
    className,
    size = 4,
    style, // 외부에서 들어오는 style
    ...props // 나머지 div 속성들 (id, onClick 등)
}: AlphaGridProps) {
    // 내부 격자 스타일 정의
    const gridConfig = {
        backgroundSize: `${size * 2}px ${size * 2}px`,
        backgroundPosition: `0 0, 0 ${size}px, ${size}px -${size}px, -${size}px 0px`,
        backgroundImage: `
            linear-gradient(45deg, var(--grid-color) 25%, transparent 25%), 
            linear-gradient(-45deg, var(--grid-color) 25%, transparent 25%), 
            linear-gradient(45deg, transparent 75%, var(--grid-color) 75%), 
            linear-gradient(-45deg, transparent 75%, var(--grid-color) 75%)
        `,
    };

    return (
        <div
            className={cn(
                "relative overflow-hidden border border-fd-border",
                "[--grid-color:#eeeeee] dark:[--grid-color:#555]",
                className,
            )}
            // 외부에서 받은 style과 내부 격자 설정을 합칩니다.
            style={{ ...gridConfig, ...style }}
            {...props}
        >
            {children}
        </div>
    );
}
