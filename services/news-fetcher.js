const axios = require("axios");
const cheerio = require("cheerio");

const BASE_URL = "https://got.gtarcade.com";
const GAME_NEWS_URL = "https://got.gtarcade.com/en/news.html";
const EVENT_NEWS_URL = "https://got.gtarcade.com/en/events.html";

function toAbsoluteUrl(url) {
    if (!url) {
        return null;
    }

    if (url.startsWith("http")) {
        return url;
    }

    if (url.startsWith("//")) {
        return `https:${url}`;
    }

    if (url.startsWith("/")) {
        return `${BASE_URL}${url}`;
    }

    return `${BASE_URL}/${url}`;
}

function extractBackgroundImage(styleValue) {
    if (!styleValue) {
        return null;
    }

    const match = styleValue.match(/url\((['"]?)(.*?)\1\)/i);

    if (!match || !match[2]) {
        return null;
    }

    return match[2];
}

function isLikelyContentLink(href) {
    if (!href) {
        return false;
    }

    return (
        href.includes("/news/")
        || href.includes("/events/")
        || href.includes("/updates/")
        || href.includes("/strategy/")
    );
}

function normalizeWhitespace(value) {
    if (!value) {
        return "";
    }

    return value
        .replace(/\u00a0/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

async function fetchDateFromArticlePage(articleUrl) {
    const response = await axios.get(articleUrl, {
        headers: {
            "User-Agent": "Mozilla/5.0"
        }
    });

    const $ = cheerio.load(response.data);
    const bodyText = $("body").text().replace(/\s+/g, " ").trim();

    const textDateMatch = bodyText.match(
        /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}\b/
    );

    if (textDateMatch) {
        return textDateMatch[0];
    }

    return null;
}

async function fetchContentFromListingPage(listingUrl) {
    const response = await axios.get(listingUrl, {
        headers: {
            "User-Agent": "Mozilla/5.0"
        }
    });

    const $ = cheerio.load(response.data);
    const contentItems = [];
    const seenLinks = new Set();

    $("a").each((index, element) => {
        const href = $(element).attr("href");
        const text = normalizeWhitespace($(element).text());

        if (!isLikelyContentLink(href)) {
            return;
        }

        const absoluteLink = toAbsoluteUrl(href);

        if (!absoluteLink || seenLinks.has(absoluteLink)) {
            return;
        }

        const articleContainer = $(element).closest(
            "li, .item, .news-item, .list-item, .post, .article, .news_box, .newsBox, .box"
        );

        const title =
            text
            || normalizeWhitespace(articleContainer.find("h3, h4, .title").first().text());

        const date = normalizeWhitespace(
            articleContainer.find(".time, .date, .article-time, .news-time, .news-date, time").first().text()
        );

        const summary = normalizeWhitespace(articleContainer.find("p").first().text());

        const imageElement = articleContainer.find("img").first();

        const imageFromImg =
            imageElement.attr("src")
            || imageElement.attr("data-src")
            || imageElement.attr("data-original")
            || null;

        const imageFromBackground = extractBackgroundImage(
            articleContainer.find("[style*='background']").first().attr("style")
        );

        const image = imageFromImg || imageFromBackground || null;

        if (!title) {
            return;
        }

        seenLinks.add(absoluteLink);

        contentItems.push({
            title,
            link: absoluteLink,
            date,
            summary,
            image: toAbsoluteUrl(image)
        });
    });

    for (const contentItem of contentItems) {
        if (!contentItem.date) {
            contentItem.date = await fetchDateFromArticlePage(contentItem.link);
        }
    }

    return contentItems.slice(0, 10);
}

async function fetchLatestNews() {
    return fetchContentFromListingPage(GAME_NEWS_URL);
}

async function fetchLatestEventNews() {
    return fetchContentFromListingPage(EVENT_NEWS_URL);
}

module.exports = {
    fetchLatestNews,
    fetchLatestEventNews
};