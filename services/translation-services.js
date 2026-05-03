const translate = require("translate-google");

async function translateText(text, targetLanguage) {
    if (!text || !text.trim()) {
        return {
            translatedText: "",
            detectedLanguage: null
        };
    }

    const translatedText = await translate(text, {
        to: targetLanguage
    });

    return {
        translatedText,
        detectedLanguage: null
    };
}

module.exports = {
    translateText
};