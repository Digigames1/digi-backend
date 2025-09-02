// src/models/index.mjs
// Імпортуємо моделі для side-effect, щоби вони зареєструвались у mongoose.models
import "./CuratedCatalog.mjs";
import "./BambooDump.mjs";

// опціонально: експорт назв — корисно для дебагу
export default ["CuratedCatalog", "BambooDump"];
