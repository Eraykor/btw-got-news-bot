const { SlashCommandBuilder } = require("discord.js");
const { setUserTranslationLanguage } = require("../services/config-services");

const supportedLanguages = {
    af: ["af", "afrikaans"],
    sq: ["sq", "albanian"],
    ar: ["ar", "arabic"],
    hy: ["hy", "armenian"],
    az: ["az", "azerbaijani"],
    eu: ["eu", "basque"],
    be: ["be", "belarusian"],
    bn: ["bn", "bengali"],
    bs: ["bs", "bosnian"],
    bg: ["bg", "bulgarian"],
    ca: ["ca", "catalan"],
    zh: ["zh", "chinese"],
    "zh-cn": ["zh-cn", "chinese simplified", "simplified chinese"],
    "zh-tw": ["zh-tw", "chinese traditional", "traditional chinese"],
    hr: ["hr", "croatian"],
    cs: ["cs", "czech"],
    da: ["da", "danish"],
    nl: ["nl", "dutch"],
    en: ["en", "english"],
    eo: ["eo", "esperanto"],
    et: ["et", "estonian"],
    tl: ["tl", "filipino", "tagalog"],
    fi: ["fi", "finnish"],
    fr: ["fr", "french"],
    gl: ["gl", "galician"],
    ka: ["ka", "georgian"],
    de: ["de", "german"],
    el: ["el", "greek"],
    gu: ["gu", "gujarati"],
    ht: ["ht", "haitian creole"],
    iw: ["iw", "hebrew"],
    hi: ["hi", "hindi"],
    hu: ["hu", "hungarian"],
    is: ["is", "icelandic"],
    id: ["id", "indonesian"],
    ga: ["ga", "irish"],
    it: ["it", "italian"],
    ja: ["ja", "japanese"],
    kn: ["kn", "kannada"],
    ko: ["ko", "korean"],
    la: ["la", "latin"],
    lv: ["lv", "latvian"],
    lt: ["lt", "lithuanian"],
    mk: ["mk", "macedonian"],
    ms: ["ms", "malay"],
    mt: ["mt", "maltese"],
    no: ["no", "norwegian"],
    fa: ["fa", "persian", "farsi"],
    pl: ["pl", "polish"],
    pt: ["pt", "portuguese"],
    ro: ["ro", "romanian"],
    ru: ["ru", "russian"],
    sr: ["sr", "serbian"],
    sk: ["sk", "slovak"],
    sl: ["sl", "slovenian"],
    es: ["es", "spanish"],
    sw: ["sw", "swahili"],
    sv: ["sv", "swedish"],
    ta: ["ta", "tamil"],
    te: ["te", "telugu"],
    th: ["th", "thai"],
    tr: ["tr", "turkish"],
    uk: ["uk", "ukrainian"],
    ur: ["ur", "urdu"],
    vi: ["vi", "vietnamese"],
    cy: ["cy", "welsh"]
};

function resolveLanguageCode(input) {
    if (!input) {
        return null;
    }

    const normalizedInput = input.trim().toLowerCase();

    for (const [languageCode, aliases] of Object.entries(supportedLanguages)) {
        if (aliases.includes(normalizedInput)) {
            return languageCode;
        }
    }

    return null;
}

function buildSupportedLanguageHelp() {
    return [
        "af, sq, ar, hy, az, eu, be, bn, bs, bg, ca, zh, zh-cn, zh-tw, hr, cs, da, nl, en, eo, et, tl, fi, fr, gl, ka, de, el, gu, ht, iw, hi, hu, is, id, ga, it, ja, kn, ko, la, lv, lt, mk, ms, mt, no, fa, pl, pt, ro, ru, sr, sk, sl, es, sw, sv, ta, te, th, tr, uk, ur, vi, cy"
    ].join("\n");
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("set-translation-language")
        .setDescription("Set your personal target language for message translations.")
        .addStringOption((option) =>
            option
                .setName("language")
                .setDescription("Language code or name, for example: fr, english, russian, turkish")
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });

        const rawLanguage = interaction.options.getString("language");
        const languageCode = resolveLanguageCode(rawLanguage);

        if (!languageCode) {
            await interaction.editReply({
                content: [
                    "❌ Unsupported language.",
                    "",
                    "Use a language code or a language name.",
                    "Examples: `fr`, `en`, `ru`, `tr`, `japanese`, `german`, `arabic`.",
                    "",
                    "**Supported codes:**",
                    buildSupportedLanguageHelp()
                ].join("\n")
            });
            return;
        }

        await setUserTranslationLanguage(interaction.user.id, languageCode);

        await interaction.editReply({
            content: `✅ Your translation language has been set to \`${languageCode}\`.`
        });
    }
};