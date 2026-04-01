import clsx from "clsx";
import * as React from "react";

// 1. 필요한 타입 정의 (버튼의 생김새 결정)
export interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost";
    size?: "sm" | "md" | "lg";
    loading?: boolean;
    fullWidth?: boolean;
}

export const ActionButton = React.forwardRef<
    HTMLButtonElement,
    ActionButtonProps
>(
    (
        {
            variant = "primary",
            size = "md",
            loading = false,
            fullWidth = false,
            className,
            children,
            disabled,
            ...props
        },
        ref,
    ) => {
        // 2. 클래스네임 조립 (나중에 CSS로 디자인 잡기 편하게)
        const rootClassName = clsx(
            "my-button", // 기본 클래스
            `my-button--${variant}`,
            `my-button--${size}`,
            {
                "my-button--loading": loading,
                "my-button--full-width": fullWidth,
            },
            className,
        );

        return (
            <button
                ref={ref}
                className={rootClassName}
                disabled={disabled || loading} // 로딩 중에도 클릭 방지
                {...props}
            >
                {/* 로딩 상태일 때 텍스트 숨기거나 스피너 보여주는 로직 추가 가능 */}
                {loading ? <span className="spinner">⌛</span> : children}
            </button>
        );
    },
);

ActionButton.displayName = "ActionButton";
