// utils/decodeHtmlEntities.ts
export function decodeHtmlEntities(text: string | undefined): string {
    if (!text) {
        return '';
    }

    const txt = document.createElement('textarea');
    txt.innerHTML = text;
    return txt.value;
}