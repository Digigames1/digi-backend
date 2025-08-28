const LANG_MAP = {
  EN: 'en',
  UA: 'uk',
  PL: 'pl',
  DE: 'de',
};

export async function translateText(text, lang = 'EN') {
  if (!text) return '';
  const code = LANG_MAP[String(lang).toUpperCase()] || 'en';
  if (code === 'en') return text;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${code}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const data = await res.json();
    return data?.[0]?.[0]?.[0] || text;
  } catch (e) {
    console.warn('Translation failed', e.message);
    return text;
  }
}

export default { translateText };
