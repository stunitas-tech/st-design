import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { RootProvider } from "fumadocs-ui/provider/next";
import { Geist, Inter } from "next/font/google";
import "./global.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const inter = Inter({
    subsets: ["latin"],
});

export default async function Layout({ children }: LayoutProps<"/">) {
    return (
        <html
            lang="ko"
            className={cn(inter.className, "font-sans", geist.variable)}
            suppressHydrationWarning
        >
            <body className="flex flex-col min-h-screen">
                <RootProvider>
                    <TooltipProvider>{children}</TooltipProvider>
                </RootProvider>
            </body>
        </html>
    );
}
