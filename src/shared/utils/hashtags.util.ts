export function extractHashtags(text: string): string[] {
    if (!text) return [];
    const matches = text.match(/#[\w]+/g);
    return matches ? matches.map((tag) => tag.slice(1)) : [];
}
export function normalizeHashtag(tag: string): string {
    return tag.toLowerCase().trim();
}
