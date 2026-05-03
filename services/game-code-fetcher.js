const axios = require("axios");
const cheerio = require("cheerio");

const DDG_HTML_URL = "https://html.duckduckgo.com/html/";
const SEARCH_QUERIES = [
    'site:facebook.com/GOTWinterIsComingBrowser/posts "Gift Code:"',
    'site:facebook.com/GOTWinterIsComingBrowser/posts "Expires:" "Gift Code:"',
    'site:facebook.com/GOTWinterIsComingBrowser/posts "Valid until:" "Gift Code:"'
];

function normalizeWhitespace(value) {
    if (!value) {
        return "";
    }

    return value
        .replace(/\u00a0/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function extractGiftCode(text) {
    if (!text) {
        return null;
    }

    const patterns = [
        /gift\s*code\s*[:\-]\s*([A-Z0-9]{6,20})/i,
        /new\s+gift\s*code\s*[:\-]\s*([A-Z0-9]{6,20})/i,
        /\b([A-Z0-9]{8,20})\b(?=.*(?:expires?|valid until|expiry))/i
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);

        if (match && match[1]) {
            return match[1].toUpperCase();
        }
    }

    return null;
}

function extractExpiry(text) {
    if (!text) {
        return null;
    }

    const patterns = [
        /expires?\s*[:\-]?\s*([^.]+(?:\d{4})?)/i,
        /valid\s+until\s*[:\-]?\s*([^.]+(?:\d{4})?)/i,
        /expiry\s*date\s*[:\-]?\s*([^.]+(?:\d{4})?)/i,
        /redemption\s+deadline\s*[:\-]?\s*([^.]+(?:\d{4})?)/i
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);

        if (match && match[1]) {
            return normalizeWhitespace(match[1]);
        }
    }

    return null;
}

function extractPublishedDate(text) {
    if (!text) {
        return null;
    }

    const match = text.match(
        /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z.]*\s+\d{1,2}(?:st|nd|rd|th)?[,]?\s+\d{4}\b/i
    );

    if (!match) {
        return null;
    }

    return normalizeWhitespace(match[0]);
}

function decodeDuckDuckGoResultUrl(rawHref) {
    if (!rawHref) {
        return null;
    }

    if (rawHref.startsWith("http://") || rawHref.startsWith("https://")) {
        return rawHref;
    }

    if (!rawHref.startsWith("/l/?")) {
        return rawHref;
    }

    try {
        const parsedUrl = new URL(`https://html.duckduckgo.com${rawHref}`);
        const uddg = parsedUrl.searchParams.get("uddg");

        if (!uddg) {
            return null;
        }

        return decodeURIComponent(uddg);
    } catch (error) {
        return null;
    }
}

async function fetchDuckDuckGoResults(searchQuery) {
    const response = await axios.post(
        DDG_HTML_URL,
        new URLSearchParams({
            q: searchQuery
        }).toString(),
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.9"
            }
        }
    );

    console.log("=== DDG DEBUG START ===");
    console.log("Query:", searchQuery);
    console.log("Status:", response.status);
    console.log("HTML length:", response.data.length);

    const $ = cheerio.load(response.data);

    console.log("Page title:", $("title").first().text().trim());
    console.log("Result count (.result):", $(".result").length);
    console.log("Result count (.web-result):", $(".web-result").length);
    console.log("Result count (.result.results_links):", $(".result.results_links").length);

    const firstLinks = [];
    $("a").each((index, element) => {
        if (firstLinks.length >= 12) {
            return false;
        }

        const href = $(element).attr("href");
        const text = normalizeWhitespace($(element).text());

        if (href || text) {
            firstLinks.push({ href, text });
        }
    });

    console.log("First links:", firstLinks);

    const results = [];

    $(".result, .web-result").each((index, element) => {
        const titleElement = $(element).find(".result__title a, .result-title a").first();
        const rawHref = titleElement.attr("href");
        const link = decodeDuckDuckGoResultUrl(rawHref);
        const title = normalizeWhitespace(titleElement.text());

        const snippetCandidates = [
            normalizeWhitespace($(element).find(".result__snippet").first().text()),
            normalizeWhitespace($(element).find(".result-snippet").first().text()),
            normalizeWhitespace($(element).text())
        ];

        const snippet = snippetCandidates.find((value) => value.length > 0) || "";
        const combinedText = normalizeWhitespace(`${title} ${snippet}`);

        const resultDebug = {
            rawHref,
            link,
            title,
            snippet,
            extractedCode: extractGiftCode(combinedText),
            extractedExpiry: extractExpiry(combinedText),
            extractedPublishedDate: extractPublishedDate(combinedText)
        };

        console.log("Result item:", resultDebug);

        results.push({
            title,
            link,
            snippet,
            combinedText
        });
    });

    console.log("=== DDG DEBUG END ===");

    return results;
}

async function fetchLatestGameCodes() {
    const codeItems = [];
    const seenLinks = new Set();
    const seenCodes = new Set();

    for (const searchQuery of SEARCH_QUERIES) {
        let results = [];

        try {
            results = await fetchDuckDuckGoResults(searchQuery);
        } catch (error) {
            console.error("DuckDuckGo query failed:", searchQuery, error.message);
            continue;
        }

        for (const result of results) {
            if (!result.link) {
                continue;
            }

            if (!result.link.includes("facebook.com/GOTWinterIsComingBrowser/posts/")) {
                continue;
            }

            const code = extractGiftCode(result.combinedText);

            if (!code) {
                continue;
            }

            if (seenLinks.has(result.link) || seenCodes.has(code)) {
                continue;
            }

            seenLinks.add(result.link);
            seenCodes.add(code);

            codeItems.push({
                code,
                link: result.link,
                publishedAt: extractPublishedDate(result.combinedText),
                expiresAt: extractExpiry(result.combinedText),
                sourceText: result.combinedText
            });
        }
    }

    console.log("Final extracted codes:", codeItems);

    return codeItems.slice(0, 10);
}

module.exports = {
    fetchLatestGameCodes
};