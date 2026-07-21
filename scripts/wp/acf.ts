/**
 * Helpers to read ACF-style flat postmeta from a WordPress dump.
 */
import { readFileSync } from "fs";
import { join } from "path";

export type MetaMap = Map<string, string>;

const LOST_CHARS = ["á", "é", "í", "ó", "ú", "ñ", "ü"] as const;
const SPANISH_WORDS = new Set(
  readFileSync(
    join(process.cwd(), "node_modules", "dictionary-es", "index.dic"),
    "utf8",
  )
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.split("/")[0]?.trim().toLocaleLowerCase("es"))
    .filter(Boolean),
);

const EXACT_REPAIRS: Record<string, string> = {
  "acompa?arlos": "acompañarlos",
  "acompa?e": "acompañe",
  "acompa?": "acompañó",
  "acompa?ando": "acompañando",
  "acompa?arnos": "acompañarnos",
  "acompa?arte": "acompañarte",
  "acompa?en": "acompañen",
  "acompa?ante": "acompañante",
  "acompa?arlas": "acompañarlas",
  "acompa?a": "acompaña",
  "acompa?ada": "acompañada",
  "acompa?an": "acompañan",
  "acompa?andose": "acompañándose",
  "acompa?arse": "acompañarse",
  "acompa?aste": "acompañaste",
  "alegr?as": "alegrías",
  "as?": "así",
  "as?mismo": "asimismo",
  "cari?os": "cariños",
  "comenz?": "comenzó",
  "encant?": "encantó",
  "estar?": "estará",
  "est?": "está",
  "habr?": "habrá",
  "m?s": "más",
  "much?simas": "muchísimas",
  "much?sima": "muchísima",
  "much?simo": "muchísimo",
  "peque?a": "pequeña",
  "peque?as": "pequeñas",
  "peque?o": "pequeño",
  "ser?": "será",
  "so?ada": "soñada",
  "so?ado": "soñado",
  "so?ados": "soñados",
  "so?ando": "soñando",
  "so?aron": "soñaron",
  "sue?en": "sueñen",
  "sue?o": "sueño",
  "sue?os": "sueños",
  "viv?": "viví",
  "alegr?a": "alegría",
  "cari?o": "cariño",
  "n?rdico": "nórdico",
  "rom?ntica": "romántica",
  "b?squeda": "búsqueda",
  "cap?tulo": "capítulo",
  "cap?tulos": "capítulos",
  "el?ctrico": "eléctrico",
  "el?ctrica": "eléctrica",
  "l?mpara": "lámpara",
  "s?banas": "sábanas",
  "s?bado": "sábado",
  "tur?stico": "turístico",
  "tem?tica": "temática",
  "cer?mica": "cerámica",
  "dep?sito": "depósito",
  "dise?o": "diseño",
  "espect?culo": "espectáculo",
  "fr?o": "frío",
  "galer?a": "galería",
  "grifer?as": "griferías",
  "pen?nsula": "península",
  "porte?a": "porteña",
  "r?gida": "rígida",
  "c?tricos": "cítricos",
  "n?rdica": "nórdica",
  "bud?nera": "budinera",
  "fre?dora": "freidora",
  "met?lico": "metálico",
  "autom?tico": "automático",
  "fot?grafo": "fotógrafo",
  "fot?grafa": "fotógrafa",
  "ra?l": "raúl",
  "sof?a": "sofía",
  "tom?s": "tomás",
  "mat?as": "matías",
  "m?nica": "mónica",
  "nicol?s": "nicolás",
  "in?s": "inés",
  "luc?a": "lucía",
  "roc?o": "rocío",
  "ver?nica": "verónica",
  "anal?a": "analía",
  "d?bora": "débora",
  "estefan?a": "estefanía",
  "fel?citas": "felícitas",
  "f?tima": "fátima",
  "iv?n": "iván",
  "jes?s": "jesús",
  "jerem?as": "jeremías",
  "noem?": "noemí",
  "salom?": "salomé",
  "tob?as": "tobías",
  "gonz?lez": "gonzález",
  "fern?ndez": "fernández",
  "g?mez": "gómez",
  "garc?a": "garcía",
  "rodr?guez": "rodríguez",
  "s?nchez": "sánchez",
  "mu?oz": "muñoz",
  "m?ndez": "méndez",
  "l?pez": "lópez",
  "c?ceres": "cáceres",
  "guti?rrez": "gutiérrez",
  "m?rquez": "márquez",
  "p?rez": "pérez",
  "gim?nez": "giménez",
  "pe?a": "peña",
  "ben?tez": "benítez",
  "dom?nguez": "domínguez",
  "ram?rez": "ramírez",
  "v?zquez": "vázquez",
  "n??ez": "núñez",
  "nu?ez": "núñez",
  "n?nez": "núñez",
  "villafa?e": "villafañe",
  "acu?a": "acuña",
  "ib??ez": "ibáñez",
  "iba?ez": "ibáñez",
  "pi?eyro": "piñeyro",
  "pi?ero": "piñero",
  "pati?o": "patiño",
  "trivi?o": "triviño",
  "sope?a": "sopeña",
  "monta?a": "montaña",
  "ludue?a": "ludueña",
  "ca?ete": "cañete",
  "caba?es": "cabañes",
  "bra?as": "brañas",
  "fari?as": "fariñas",
  "fari?a": "fariña",
  "salda?a": "saldaña",
  "oca?a": "ocaña",
  "ordu?a": "orduña",
  "vi?uela": "viñuela",
  "r?os": "ríos",
  "r?o": "río",
  "d?az": "díaz",
  "dar?o": "darío",
  "el?as": "elías",
  "h?ctor": "héctor",
  "c?sar": "césar",
  "ad?n": "adán",
  "c?rdoba": "córdoba",
  "b?silica": "basílica",
  "bas?lica": "basílica",
  "m?quina": "máquina",
  "m?ximo": "máximo",
  "mi?rcoles": "miércoles",
  "t?ctil": "táctil",
  "pr?stamo": "préstamo",
  "quiz?s": "quizás",
  "pa?s": "país",
  "bah?a": "bahía",
  "energ?a": "energía",
  "fotograf?a": "fotografía",
  "lencer?a": "lencería",
  "librer?a": "librería",
  "empat?a": "empatía",
  "cercan?a": "cercanía",
  "valent?a": "valentía",
  "desaf?o": "desafío",
  "desaf?os": "desafíos",
  "di?logo": "diálogo",
  "vac?o": "vacío",
  "gu?a": "guía",
  "m?o": "mío",
  "m?a": "mía",
  "t?a": "tía",
  "t?o": "tío",
  "t?os": "tíos",
  "a?n": "aún",
  "adem?s": "además",
  "trav?s": "través",
  "ojal?": "ojalá",
  "ac?": "acá",
  "ah?": "ahí",
  "caf?": "café",
  "pap?": "papá",
  "mam?": "mamá",
  "s?": "sí",
  "s?lo": "sólo",
  "pr?ximos": "próximos",
  "i?aki": "iñaki",
  "mi?o": "miño",
  "d?vila": "dávila",
  "antu?a": "antuña",
  "s?enz": "sáenz",
  "aut?noma": "autónoma",
  "c?cere": "cácere",
  "c?mplices": "cómplices",
  "d?avola": "d'avola",
  "e?sen": "essen",
  "g?rriz": "górriz",
  "gu?e": "guíe",
  "incre?ble": "increíble",
  "incre?bles": "increíbles",
  "m?gica": "mágica",
  "m?gicos": "mágicos",
  "mu?iz": "muñiz",
  "a?adiendo": "añadiendo",
  "arga?araz": "argañaraz",
  "bell?sima": "bellísima",
  "berm?dez": "bermúdez",
  "c?ntaros": "cántaros",
  "c?spedes": "céspedes",
  "cas?ndose": "casándose",
  "cetr?ngolo": "cetrángolo",
  "conf?o": "confío",
  "conoc?s": "conocés",
  "conoci?ramos": "conociéramos",
  "cont?ndoles": "contándoles",
  "contin?en": "continúen",
  "coss?o": "cossío",
  "cu?dense": "cuídense",
  "d?alessandro": "d'alessandro",
  "d?amelio": "d'amelio",
  "d?arminio": "d'arminio",
  "disfr?tense": "disfrútense",
  "divi?rtanse": "diviértanse",
  "due?os": "dueños",
  "echag?e": "echagüe",
  "eclesiast?s": "eclesiastés",
  "encantar?a": "encantaría",
  "energ?as": "energías",
  "espi?o": "espiño",
  "est?fano": "estéfano",
  "est?vez": "estévez",
  "fel?z": "feliz",
  "florec?a": "florecía",
  "fr?as": "frías",
  "garc?s": "garcés",
  "grisol?a": "grisolía",
  "gui?az?": "guiñazú",
  "gui?azu": "guiñazú",
  "gui?os": "guiños",
  "gui?zu": "guiñazú",
  "gustar?a": "gustaría",
  "h?hn": "höhn",
  "hermos?sima": "hermosísima",
  "j?sica": "jésica",
  "kr?hling": "kröhling",
  "lan?s": "lanús",
  "lind?sima": "lindísima",
  "lind?simo": "lindísimo",
  "m?ller": "müller",
  "m?ralos": "míralos",
  "magn?fica": "magnífica",
  "mant?ngalos": "manténgalos",
  "manti?an": "mantiñán",
  "n?stor": "néstor",
  "o?farrell": "o'farrell",
  "or?e": "orúe",
  "oto?os": "otoños",
  "p?senla": "pásenla",
  "part?cipes": "partícipes",
  "pesta?as": "pestañas",
  "pir?mides": "pirámides",
  "prop?sitos": "propósitos",
  "quer?a": "quería",
  "qui?ranse": "quiéranse",
  "r?an": "rían",
  "r?ente": "ríente",
  "r?mulo": "rómulo",
  "reencontr?ramos": "reencontráramos",
  "reflex?loga": "reflexóloga",
  "regal?ndoles": "regalándoles",
  "rodi?o": "rodiño",
  "sol?s": "solís",
  "teggnolog?a": "tecnología",
  "ten?s": "tenés",
  "tr?mites": "trámites",
  "transmit?an": "transmitían",
  "tub?o": "tubío",
  "v?squez": "vásquez",
  "verg?s": "vergés",
  "vi?ndolos": "viéndolos",
  "viv?an": "vivían",
  "i?a": "iña",
  "b?squenla": "búsquenla",
  "alegr?ss": "alegrías",
  "b?ck": "böck",
  "carr?re": "carrère",
  "desd?nuna": "desdénUna",
  "erm?cora": "ermácora",
  "felicidadesm?a": "felicidadesMía",
  "grel?s": "grelés",
  "invitaci?n": "invitación",
  "m?rtola": "mértola",
  "pi?eior": "piñeiro",
  "imp?rtate": "importante",
  "ka?esky": "kanesky",
  "est?n": "están",
  "rompi?": "rompió",
  "cambi?": "cambió",
  "naci?": "nació",
  "aqu?": "aquí",
  "catamar?n": "catamarán",
  "dami?n": "damián",
  "luj?n": "luján",
  "rub?n": "rubén",
  "sill?n": "sillón",
  "gast?n": "gastón",
  "tutankam?n": "tutankamón",
  "valent?n": "valentín",
  "aar?n": "aarón",
  "beltr?n": "beltrán",
  "chach?n": "chachín",
  "fiest?n": "fiestón",
  "mar?n": "marín",
  "plum?n": "plumón",
  "ail?n": "ailén",
  "arc?n": "arcón",
  "construir?n": "construirán",
  "deber?n": "deberán",
  "demi?n": "demián",
  "jun?n": "junín",
  "leguizam?n": "leguizamón",
  "mail?n": "mailén",
  "pascual?n": "pascualín",
  "per?n": "perón",
  "poch?n": "pochón",
  "recibir?n": "recibirán",
  "rom?n": "román",
  "saf?n": "safón",
  "serv?n": "serván",
  "sober?n": "soberón",
  "tendr?n": "tendrán",
  // Future / preterite with trailing lost accent
  "dividir?": "dividirá",
  "eliminar?": "eliminará",
  "dejar?": "dejará",
  "llevar?": "llevará",
  "marcar?": "marcará",
  "brindar?": "brindará",
  "present?": "presentó",
  "vendr?": "vendrá",
  "lleg?": "llegó",
  "mont?": "montó",
  "anim?": "animó",
  "toc?": "tocó",
  "form?": "formó",
  "sali?": "salió",
  "envolvi?": "envolvió",
  "invit?": "invitó",
  "apreci?": "apreció",
  "celebr?": "celebró",
  "disfrut?": "disfrutó",
};

/** Visible Spanish words written without their accent (no "?" left). */
const MISSING_ACCENTS: Record<string, string> = {
  codigo: "código",
  automaticamente: "automáticamente",
  basilica: "basílica",
  numero: "número",
  numeros: "números",
  pagina: "página",
  musica: "música",
  telefonico: "telefónico",
  telefonica: "telefónica",
  electronico: "electrónico",
  electronica: "electrónica",
  fisico: "físico",
  fisica: "física",
  publico: "público",
  publica: "pública",
  unico: "único",
  unica: "única",
  basico: "básico",
  basica: "básica",
  tipico: "típico",
  tipica: "típica",
  clasico: "clásico",
  clasica: "clásica",
  romantico: "romántico",
  romantica: "romántica",
  magico: "mágico",
  magica: "mágica",
  facil: "fácil",
  dificil: "difícil",
  rapido: "rápido",
  rapida: "rápida",
  tambien: "también",
  despues: "después",
  aqui: "aquí",
  alli: "allí",
  ahi: "ahí",
  asi: "así",
  senora: "señora",
  senor: "señor",
  ninos: "niños",
  nino: "niño",
  nina: "niña",
  ninas: "niñas",
  companero: "compañero",
  companera: "compañera",
  espanol: "español",
  espana: "españa",
  manana: "mañana",
};

function preserveCase(source: string, replacement: string): string {
  if (source === source.toUpperCase()) {
    return replacement.toUpperCase();
  }
  if (
    source[0] === source[0]?.toUpperCase() &&
    source[0] !== source[0]?.toLowerCase()
  ) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

function repairTokenFromDictionary(token: string): string {
  const lower = token.toLocaleLowerCase("es");
  const exact = EXACT_REPAIRS[lower];
  if (exact) {
    return preserveCase(token, exact);
  }
  // Infinitive + trailing ?: dividir? → dividirá (mid-sentence future)
  if (/^[\p{L}]{2,}(?:ar|er|ir)\?$/iu.test(token)) {
    const verb = lower.slice(0, -1);
    return preserveCase(token, `${verb}á`);
  }
  if (!/\p{L}\?\p{L}/u.test(token)) {
    return token;
  }
  const candidates = LOST_CHARS.map((char) => lower.replace("?", char)).filter(
    (word) => SPANISH_WORDS.has(word),
  );
  if (candidates.length === 1) {
    return preserveCase(token, candidates[0]);
  }
  return token;
}

function repairMissingAccentWords(input: string): string {
  return input.replace(/[\p{L}]+/gu, (token) => {
    const lower = token.toLocaleLowerCase("es");
    const fix = MISSING_ACCENTS[lower];
    return fix ? preserveCase(token, fix) : token;
  });
}

export function rowsToMeta(
  rows: Array<{ meta_key: string; meta_value: string | null }>,
): MetaMap {
  const map: MetaMap = new Map();
  for (const row of rows) {
    if (!row.meta_key.startsWith("_")) {
      map.set(row.meta_key, row.meta_value ?? "");
    }
  }
  return map;
}

export function metaGet(meta: MetaMap, key: string, fallback = ""): string {
  return repairSpanishLostAccents((meta.get(key) ?? fallback).trim());
}

/**
 * Hostinger dump replaced many UTF-8 accents with literal "?".
 * Also recovers common Spanish words written without their tilde.
 */
export function repairSpanishLostAccents(input: string): string {
  if (!input) {
    return input;
  }

  let s = repairMissingAccentWords(input);

  if (!s.includes("?")) {
    return s;
  }

  // Opening ¿ when "?" starts a question word
  s = s.replace(/(^|[\s(\[])\?([A-Za-zÁÉÍÓÚÑáéíóúñ])/g, "$1¿$2");
  s = s
    .replace(/acompa\?\?ndolos/gi, "acompañándolos")
    .replace(/acompa\?\?ndose/gi, "acompañándose")
    .replace(/gui\?az\?/gi, "Guiñazú")
    .replace(/d\?avola/gi, "D'Avola")
    .replace(/o\?farrell/gi, "O'Farrell");
  s = s.replace(/[\p{L}]*\?[\p{L}]*/gu, repairTokenFromDictionary);

  const pairs: Array<[RegExp, string]> = [
    [/ci\?n/gi, "ción"],
    [/si\?n/gi, "sión"],
    [/ti\?n/gi, "tión"],
    [/xi\?n/gi, "xión"],
    [/gi\?n/gi, "gión"],
    [/a\?os/gi, "años"],
    [/a\?o(?![a-z])/gi, "año"],
    [/ni\?os/gi, "niños"],
    [/ni\?o(?![a-z])/gi, "niño"],
    [/espa\?a/gi, "españa"],
    [/ma\?ana/gi, "mañana"],
    [/compa\?ero/gi, "compañero"],
    [/compa\?era/gi, "compañera"],
    [/se\?or/gi, "señor"],
    [/se\?ora/gi, "señora"],
    [/drag\?n/gi, "dragón"],
    [/jard\?n/gi, "jardín"],
    [/t\?cnicas/gi, "técnicas"],
    [/t\?cnica/gi, "técnica"],
    [/a\?reo/gi, "aéreo"],
    [/a\?rea/gi, "aérea"],
    [/sesi\?n/gi, "sesión"],
    [/m\?sica/gi, "música"],
    [/fotograf\?a/gi, "fotografía"],
    [/fotograf\?as/gi, "fotografías"],
    [/d\?a(?![a-z])/gi, "día"],
    [/d\?as/gi, "días"],
    [/men\?/gi, "menú"],
    [/c\?digo/gi, "código"],
    [/n\?mero/gi, "número"],
    [/n\?meros/gi, "números"],
    [/tel\?fono/gi, "teléfono"],
    [/direcci\?n/gi, "dirección"],
    [/ubicaci\?n/gi, "ubicación"],
    [/decoraci\?n/gi, "decoración"],
    [/invitaci\?n/gi, "invitación"],
    [/invitaci\?nes/gi, "invitaciones"],
    [/confirmaci\?n/gi, "confirmación"],
    [/finalizaci\?n/gi, "finalización"],
    [/informaci\?n/gi, "información"],
    [/organizaci\?n/gi, "organización"],
    [/celebraci\?n/gi, "celebración"],
    [/recepci\?n/gi, "recepción"],
    [/ceremonia\?/gi, "ceremonia"],
    [/cu\?l/gi, "cuál"],
    [/cu\?ndo/gi, "cuándo"],
    [/c\?mo/gi, "cómo"],
    [/d\?nde/gi, "dónde"],
    [/qu\?/gi, "qué"],
    [/qui\?n/gi, "quién"],
    [/qui\?nes/gi, "quiénes"],
    [/tambi\?n/gi, "también"],
    [/despu\?s/gi, "después"],
    [/aqu\?/gi, "aquí"],
    [/all\?/gi, "allí"],
    [/f\?cil/gi, "fácil"],
    [/dif\?cil/gi, "difícil"],
    [/r\?pido/gi, "rápido"],
    [/p\?gina/gi, "página"],
    [/cr\?dito/gi, "crédito"],
    [/d\?bito/gi, "débito"],
    [/agust\?n/gi, "agustín"],
    [/jer\?nimo/gi, "jerónimo"],
    [/mar\?a/gi, "maría"],
    [/jos\?/gi, "josé"],
    [/andr\?s/gi, "andrés"],
    [/mart\?n/gi, "martín"],
    [/hern\?n/gi, "hernán"],
    [/ram\?n/gi, "ramón"],
    [/le\?n/gi, "león"],
    [/bel\?n/gi, "belén"],
    [/miri\?m/gi, "miriam"],
  ];

  for (const [re, replacement] of pairs) {
    s = s.replace(re, (match) => {
      // Preserve original casing of first letter when possible
      if (match[0] === match[0].toUpperCase() && match[0] !== match[0].toLowerCase()) {
        return replacement.charAt(0).toUpperCase() + replacement.slice(1);
      }
      if (match === match.toUpperCase()) {
        return replacement.toUpperCase();
      }
      return replacement;
    });
  }

  s = s.replace(/[\p{L}]*\?[\p{L}]*/gu, repairTokenFromDictionary);

  return s;
}

export function metaInt(meta: MetaMap, key: string, fallback = 0): number {
  const raw = metaGet(meta, key);
  if (!raw) {
    return fallback;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function metaBool(meta: MetaMap, key: string): boolean {
  const raw = metaGet(meta, key).toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

/** Read ACF repeater rows: `{prefix}_{i}_{field}` with count at `{prefix}`. */
export function readRepeater(
  meta: MetaMap,
  prefix: string,
  fields: string[],
): Array<Record<string, string>> {
  const count = metaInt(meta, prefix, 0);
  const rows: Array<Record<string, string>> = [];

  for (let i = 0; i < count; i += 1) {
    const row: Record<string, string> = {};
    let hasAny = false;
    for (const field of fields) {
      const value = metaGet(meta, `${prefix}_${i}_${field}`);
      row[field] = value;
      if (value) {
        hasAny = true;
      }
    }
    if (hasAny) {
      rows.push(row);
    }
  }

  return rows;
}

export function normalizePlan(raw: string): string {
  const value = raw.trim().toLowerCase();
  if (value === "premium") {
    return "premium";
  }
  if (value === "basico" || value === "basica" || value === "básico") {
    return "basico";
  }
  // golden / vip / sin-plan → free in Next v1
  return "free";
}

export function mapRsvpStatus(confirmValue: string): string {
  const v = confirmValue.trim();
  if (v === "1" || v === "yes" || v === "confirmed") {
    return "confirmed";
  }
  if (v === "0" || v === "no" || v === "declined") {
    return "declined";
  }
  return "pending";
}

export function mapRsvpMenu(raw: string): string {
  const v = raw.trim().toLowerCase();
  if (["celiaco", "celíaco", "celiac"].includes(v)) {
    return "celiaco";
  }
  if (["vegetariano", "vegetarian"].includes(v)) {
    return "vegetariano";
  }
  if (["vegano", "vegan"].includes(v)) {
    return "vegano";
  }
  // lo_que_venga and unknowns
  return "general";
}

/**
 * Convert WP password hash to something bcryptjs can verify when possible.
 * WP 6.8+ uses `$wp$2y$...` (bcrypt with prefix). Older `$P$` cannot be used.
 */
export function adaptWpPasswordHash(wpHash: string): {
  passwordHash: string;
  needsReset: boolean;
} {
  const hash = wpHash.trim();
  if (hash.startsWith("$wp$2y$") || hash.startsWith("$wp$2a$") || hash.startsWith("$wp$2b$")) {
    // WP stores `$wp` + `$2y$...` → strip only the `$wp` prefix
    return { passwordHash: hash.replace(/^\$wp/, ""), needsReset: false };
  }
  if (hash.startsWith("$2y$") || hash.startsWith("$2a$") || hash.startsWith("$2b$")) {
    return { passwordHash: hash, needsReset: false };
  }
  return { passwordHash: "", needsReset: true };
}

export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
