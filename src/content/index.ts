import { rewrite, createSession } from "./rewriter";
import emojiRegex from "emoji-regex";
const SENTENCE_DELIMITER = /([。！？!?]+|(?:\r\n|\r|\n)+)/g;
let sessionRef: Rewriter | null = null;
let translateMode = localStorage.getItem('translationMode');

interface EmojiPosition {
    emoji: string;
    index: number;
}

function extractEmojisWithPositions(text: string): { textWithoutEmojis: string; emojis: EmojiPosition[] } {
    const emojis: EmojiPosition[] = [];
    let match;
    const regex = emojiRegex();
    
    while ((match = regex.exec(text)) !== null) {
        emojis.push({
            emoji: match[0],
            index: match.index
        });
    }
    
    const textWithoutEmojis = text.replace(emojiRegex(), '');
    return { textWithoutEmojis, emojis };
}

function restoreEmojis(text: string, emojis: EmojiPosition[], originalLength: number): string {
    if (emojis.length === 0) return text;
    
    // 元のテキスト長と変換後のテキスト長の比率を計算
    const ratio = text.length / (originalLength - emojis.reduce((sum, e) => sum + e.emoji.length, 0));
    
    let result = text;
    // 後ろから挿入していくことで、インデックスのずれを防ぐ
    for (let i = emojis.length - 1; i >= 0; i--) {
        const emojiPos = emojis[i];
        // 元の位置を変換後のテキストの位置に変換
        const adjustedIndex = Math.round(emojiPos.index * ratio);
        const insertPos = Math.min(adjustedIndex, result.length);
        result = result.slice(0, insertPos) + emojiPos.emoji + result.slice(insertPos);
    }
    
    return result;
}

const disallowedParentTags = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "TEXTAREA",
    "TITLE",
]);

function shouldSkipTextNode(node: Text): boolean {
    const parent = node.parentElement;
    if (!parent) return true;
    if (disallowedParentTags.has(parent.tagName)) return true;
    if (parent instanceof HTMLElement && parent.isContentEditable) return true;

    const content = node.textContent;
    if (!content) return true;
    if (!content.trim()) return true;

    return false;
}

async function rewriteText(original: string): Promise<string> {
    const parts = original.split(SENTENCE_DELIMITER);
    if (parts.length === 0) return original;

    let rewritten = "";

    for (let i = 0; i < parts.length; i += 2) {
        const sentence = parts[i] ?? "";
        const delimiter = parts[i + 1] ?? "";

        if (!sentence) {
            rewritten += delimiter;
            continue;
        }

        const trimmed = sentence.trimEnd();
        const trailingWhitespace = sentence.slice(trimmed.length);
        
        // 絵文字を位置情報と共に抽出
        const { textWithoutEmojis, emojis } = extractEmojisWithPositions(trimmed);
        
        // 絵文字を除いたテキストが空の場合はそのまま返す
        if (!textWithoutEmojis.trim()) {
            rewritten += trimmed + trailingWhitespace + delimiter;
            continue;
        }
        
        // 絵文字を除いたテキストを変換
        let result: string = "";
        await rewrite(textWithoutEmojis, sessionRef!, translateMode).then((res) => { 
            if (typeof res === "string") result = res;
        });
        
        // 変換後のテキストに絵文字を元の位置に復元
        const restoredText = restoreEmojis(result, emojis, trimmed.length);
        
        rewritten += restoredText + trailingWhitespace + delimiter;
    }

    return rewritten;
}

async function processTextNode(node: Text): Promise<void> {
    if (shouldSkipTextNode(node)) return;

    const current = node.textContent ?? "";
    const rewritten = await rewriteText(current);

    if (current !== rewritten) {
        node.textContent = rewritten;
    }
}

function traverse(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
        processTextNode(node as Text);
        return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        if (disallowedParentTags.has(element.tagName)) return;
        if (element instanceof HTMLElement && element.isContentEditable) return;

        for (const child of Array.from(element.childNodes)) {
            traverse(child);
        }
        return;
    }

    if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
        for (const child of Array.from(node.childNodes)) {
            traverse(child);
        }
    }
}

function observeMutations(root: Node): void {
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === "characterData") {
                processTextNode(mutation.target as Text);
                continue;
            }

            for (const added of mutation.addedNodes) {
                traverse(added);
            }
        }
    });

    observer.observe(root, {
        characterData: true,
        childList: true,
        subtree: true,
    });
}

async function start(): Promise<void> {
    const root = document.body ?? document.documentElement;
    console.log("root:", root);
    if (!root) return;
    
    sessionRef = await createSession(translateMode);
    traverse(root);
    observeMutations(root);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => void start(), { once: true });
} else {
    void start();
}
