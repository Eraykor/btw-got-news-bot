const { chromium } = require("playwright");

const FACEBOOK_PAGE_URL = "https://www.facebook.com/GOTWinterIsComingBrowser/";

function normalizeWhitespace(value) {
    if (!value) {
        return "";
    }

    return value
        .replace(/\u00a0/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function decodeFacebookEscapes(value) {
    if (!value) {
        return "";
    }

    return value
        .replace(/\\n/g, "\n")
        .replace(/\\"/g, "\"")
        .replace(/\\\\/g, "\\")
        .replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
            return String.fromCharCode(parseInt(hex, 16));
        });
}

function cleanSnippet(value) {
    return normalizeWhitespace(decodeFacebookEscapes(value));
}

function formatDate(date) {
    const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const day = String(date.getDate()).padStart(2, "0");
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    return `${month} ${day}, ${year}`;
}

function convertRelativePostDateToAbsolute(text) {
    if (!text) {
        return null;
    }

    const match = text.match(/\b(\d+)\s*(m|h|d|w)\b/i);

    if (!match) {
        return null;
    }

    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    const date = new Date();

    if (unit === "m" || unit === "h") {
        return formatDate(date);
    }

    if (unit === "d") {
        date.setDate(date.getDate() - amount);
        return formatDate(date);
    }

    if (unit === "w") {
        date.setDate(date.getDate() - (amount * 7));
        return formatDate(date);
    }

    return null;
}

function extractExpiry(text) {
    if (!text) {
        return null;
    }

    const decodedText = cleanSnippet(text);

    const patterns = [
        /expires?\s*:\s*([^\n]+)/i,
        /valid\s+until\s*:\s*([^\n]+)/i,
        /expiry\s*date\s*:\s*([^\n]+)/i
    ];

    for (const pattern of patterns) {
        const match = decodedText.match(pattern);

        if (!match || !match[1]) {
            continue;
        }

        let expiryValue = normalizeWhitespace(match[1]);

        expiryValue = expiryValue
            .split("How to Redeem")[0]
            .split("Redeem Code")[0]
            .split("Thank you for")[0]
            .split("#")[0]
            .trim();

        expiryValue = expiryValue.replace(/[📜🎁💖⚔️]+/g, "").trim();

        return expiryValue;
    }

    return null;
}

function extractVisiblePostDate(text) {
    if (!text) {
        return null;
    }

    const relativeTextMatch = text.match(/\b\d+\s*(?:m|h|d|w)\b/i);

    if (!relativeTextMatch) {
        return null;
    }

    return convertRelativePostDateToAbsolute(relativeTextMatch[0]);
}

function isLikelyCode(value) {
    if (!value) {
        return false;
    }

    if (!/^[A-Z0-9]{8,20}$/.test(value)) {
        return false;
    }

    return /[A-Z]/.test(value) && /\d/.test(value);
}

function extractGiftCodeBlocks(pageText) {
    const blocks = [];

    const explicitPatterns = [
        /gift\s*code[^A-Z0-9]{0,30}(?:\\n|\n|\s)*([A-Z0-9]{8,20})/gi,
        /gift\s*code\s*:\s*([A-Z0-9]{8,20})/gi
    ];

    for (const pattern of explicitPatterns) {
        let match;

        while ((match = pattern.exec(pageText)) !== null) {
            const code = match[1].toUpperCase();

            if (!isLikelyCode(code)) {
                continue;
            }

            const startIndex = Math.max(0, match.index - 400);
            const endIndex = Math.min(pageText.length, match.index + 900);
            const blockText = pageText.slice(startIndex, endIndex);

            blocks.push({
                code,
                blockText
            });
        }
    }

    return blocks;
}

async function clickVisibleText(page, labels) {
    for (const label of labels) {
        try {
            const locator = page.getByText(label, { exact: false }).first();

            if (await locator.isVisible({ timeout: 1500 })) {
                await locator.click({ timeout: 2000 });
                await page.waitForTimeout(1500);
                console.log(`Clicked "${label}"`);
                return true;
            }
        } catch (error) {
        }
    }

    return false;
}

async function handleCookies(page) {
    const clicked = await clickVisibleText(page, [
        "Decline optional cookies",
        "Allow all cookies",
        "Accept all",
        "Autoriser tous les cookies",
        "Tout accepter"
    ]);

    if (!clicked) {
        console.log("No cookie button clicked");
    }
}

async function clickSeeMore(page) {
    try {
        const candidateLocators = await page.locator('span[dir="auto"], div[role="button"]').all();

        for (const locator of candidateLocators.slice(0, 80)) {
            try {
                const text = (await locator.innerText().catch(() => "")).trim();

                if (text.toLowerCase() !== "see more") {
                    continue;
                }

                if (!(await locator.isVisible())) {
                    continue;
                }

                const box = await locator.boundingBox();

                if (!box) {
                    continue;
                }

                if (box.y < 300 || box.y > 1800) {
                    continue;
                }

                await locator.click({ timeout: 2000, force: true });
                await page.waitForTimeout(2000);
                console.log(`Clicked post See more at y=${box.y}`);
                return true;
            } catch (error) {
            }
        }
    } catch (error) {
    }

    console.log("No post 'See more' button clicked");
    return false;
}

async function fetchLatestGameCodes() {
    const browser = await chromium.launch({
        headless: true
    });

    const context = await browser.newContext({
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
        locale: "en-US",
        viewport: {
            width: 1440,
            height: 2200
        }
    });

    const page = await context.newPage();

    try {
        await page.goto(FACEBOOK_PAGE_URL, {
            waitUntil: "domcontentloaded",
            timeout: 30000
        });

        await page.waitForTimeout(3000);
        await handleCookies(page);

        const beforeText = normalizeWhitespace(await page.locator("body").innerText());
        const visiblePostDate = extractVisiblePostDate(beforeText);

        console.log("=== FACEBOOK BEFORE SEE MORE ===");
        console.log("Page title:", await page.title());
        console.log("Body length:", beforeText.length);
        console.log("Body preview:", beforeText.slice(0, 2500));
        console.log("Visible post date:", visiblePostDate);

        await clickSeeMore(page);

        const htmlAfterSeeMore = await page.content();
        const normalizedHtml = normalizeWhitespace(htmlAfterSeeMore);

        console.log("=== FACEBOOK AFTER SEE MORE ===");
        console.log("HTML length:", normalizedHtml.length);
        console.log("HTML preview:", normalizedHtml.slice(0, 5000));

        const rawBlocks = extractGiftCodeBlocks(normalizedHtml);
        console.log("Raw candidate blocks:", rawBlocks.slice(0, 10));

        const codeItems = [];
        const seenCodes = new Set();

        for (const rawBlock of rawBlocks) {
            if (seenCodes.has(rawBlock.code)) {
                continue;
            }

            seenCodes.add(rawBlock.code);

            codeItems.push({
                code: rawBlock.code,
                link: FACEBOOK_PAGE_URL,
                publishedAt: visiblePostDate,
                expiresAt: extractExpiry(rawBlock.blockText),
                sourceText: cleanSnippet(rawBlock.blockText)
            });
        }

        console.log("Final extracted codes from Facebook Playwright:", codeItems);

        return codeItems.slice(0, 10);
    } finally {
        try {
            await context.close();
        } catch (error) {
        }

        try {
            await browser.close();
        } catch (error) {
        }
    }
}

module.exports = {
    fetchLatestGameCodes
};