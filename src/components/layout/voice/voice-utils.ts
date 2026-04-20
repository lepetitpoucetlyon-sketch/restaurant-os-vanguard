// @ts-nocheck
const SAFE_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

export function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export function sanitizeHref(href: string): string | null {
    const trimmedHref = href.trim();
    if (!trimmedHref) return null;
    if (trimmedHref.startsWith("/")) return trimmedHref;

    try {
        const parsedUrl = new URL(trimmedHref);
        return SAFE_LINK_PROTOCOLS.has(parsedUrl.protocol) ? parsedUrl.toString() : null;
    } catch {
        return null;
    }
}

export function formatAssistantText(text: string): string {
    if (!text) return "";

    const safeText = escapeHtml(text).replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        (_match, label: string, href: string) => {
            const safeHref = sanitizeHref(href);
            if (!safeHref) return label;

            const externalLinkAttributes = safeHref.startsWith("http")
                ? ' target="_blank" rel="noopener noreferrer"'
                : "";

            return `<a href="${escapeHtml(safeHref)}"${externalLinkAttributes} class="text-accent-gold underline font-black cursor-pointer hover:text-accent-gold/80 transition-colors">${label}</a>`;
        }
    ).replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-white">$1</strong>');

    const lines = safeText.split(/\r?\n/);
    const htmlParts: string[] = [];
    let activeList: "ul" | "ol" | null = null;

    const closeList = () => {
        if (activeList) {
            htmlParts.push(activeList === "ul" ? "</ul>" : "</ol>");
            activeList = null;
        }
    };

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
            closeList();
            continue;
        }

        const unorderedMatch = trimmedLine.match(/^- (.+)$/);
        if (unorderedMatch) {
            if (activeList !== "ul") {
                closeList();
                htmlParts.push('<ul class="my-2 space-y-1">');
                activeList = "ul";
            }
            htmlParts.push(`<li class="ml-4 list-disc">${unorderedMatch[1]}</li>`);
            continue;
        }

        const orderedMatch = trimmedLine.match(/^\d+\.\s+(.+)$/);
        if (orderedMatch) {
            if (activeList !== "ol") {
                closeList();
                htmlParts.push('<ol class="my-2 space-y-1">');
                activeList = "ol";
            }
            htmlParts.push(`<li class="ml-4 list-decimal">${orderedMatch[1]}</li>`);
            continue;
        }

        closeList();
        htmlParts.push(`<p class="my-2">${trimmedLine}</p>`);
    }

    closeList();
    return htmlParts.join("");
}
