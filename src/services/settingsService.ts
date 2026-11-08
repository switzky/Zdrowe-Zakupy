export interface UserSettings {
  healthGoals: string[];
  neurodivergence: string[];
  healthConditions: string[];
  dietType: string;
  allergies: string[];
  customNotes?: string;
}

const SETTINGS_STORAGE_KEY = 'verda_scanner_user_settings';

export const PRESET_NEURODIVERGENCE = [
  'ADHD (Wrażliwość na cukier i sztuczne barwniki)',
  'Spektrum autyzmu (ASD / Nadwrażliwość sensoryczna)',
  'Mgła mózgowa (Brain Fog) / Koncentracja',
  'Zaburzenia snu i zrywy hipnagogiczne',
  'Przewlekły stres / Wypalenie dopaminowe',
];

export const PRESET_HEALTH_CONDITIONS = [
  'Łuszczyca (w tym łuszczyca krostkowa)',
  'AZS (Atopowe zapalenie skóry) / Egzema',
  'Trądzik różowaty (Rosacea) i trądzik zapalny',
  'Insulinooporność / Cukrzyca typu 2',
  'Hashimoto / Niedoczynność tarczycy',
  'IBS (Zespół jelita drażliwego) / SIBO',
  'Refluks żołądkowy (GERD)',
  'Dna moczanowa (Wrażliwość na puryny)',
  'Bóle stawów i stany zapalne tkanki łącznej',
];

export const PRESET_DIETS = [
  'Low Carb (Niskowęglowodanowa)',
  'Ketogeniczna (Keto)',
  'Dieta Przeciwzapalna (Anti-inflammatory)',
  'Niskie IG (Niski indeks glikemiczny)',
  'Protokół Autoimmunologiczny (AIP)',
  'Low-FODMAP (Ochrona jelit)',
  'Śródziemnomorska (Mediterranean)',
  'Post przerywany (Intermittent Fasting)',
  'Bezglutenowa i bezlaktozowa',
  'Early Shift / Protokół Verda 8.3',
  'Zrównoważona / Clean Eating',
];

export const PRESET_HEALTH_GOALS = [
  'Przeciwzapalny (Anti-inflammatory)',
  'Zastrzyk energii (Energy boost)',
  'Stabilizacja glikemii (Blood sugar balance)',
  'Ochrona żołądka i jelit (Gut health)',
  'Regeneracja i sen (Sleep & recovery)',
  'Ochrona wątroby (Liver support)',
  'Zdrowe serce i naczynia',
  'Redukcja wagi (Weight management)',
  'Czysty skład / Clean label',
];

export const PRESET_ALLERGIES = [
  'Żeń-szeń (Zabroniony w protokole Verda)',
  'Laktoza / Nabiał krowi',
  'Gluten',
  'Orzeszki ziemne i orzechy',
  'Soja',
  'Jaja',
  'Histamina',
  'Sztuczne barwniki i konserwanty (E-dodatki)',
  'Cukier dodany i syrop glukozowo-fruktozowy',
  'Sztuczne słodziki (Aspartam, Sukraloza)',
  'Rośliny psiankowate (Pomidory, papryka, bakłażan)',
  'Skorupiaki / Ryby',
];

export const DEFAULT_SETTINGS: UserSettings = {
  healthGoals: [
    'Przeciwzapalny (Anti-inflammatory)',
    'Stabilizacja glikemii (Blood sugar balance)',
    'Ochrona żołądka i jelit (Gut health)',
  ],
  neurodivergence: [
    'ADHD (Wrażliwość na cukier i sztuczne barwniki)',
  ],
  healthConditions: [
    'Łuszczyca (w tym łuszczyca krostkowa)',
  ],
  dietType: 'Low Carb (Niskowęglowodanowa)',
  allergies: [
    'Żeń-szeń (Zabroniony w protokole Verda)',
  ],
  customNotes: '',
};

export const settingsService = {
  getSettings: (): UserSettings => {
    try {
      const data = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!data) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(data);
      return {
        healthGoals: Array.isArray(parsed.healthGoals) ? parsed.healthGoals : DEFAULT_SETTINGS.healthGoals,
        neurodivergence: Array.isArray(parsed.neurodivergence) ? parsed.neurodivergence : DEFAULT_SETTINGS.neurodivergence,
        healthConditions: Array.isArray(parsed.healthConditions) ? parsed.healthConditions : DEFAULT_SETTINGS.healthConditions,
        dietType: parsed.dietType || DEFAULT_SETTINGS.dietType,
        allergies: Array.isArray(parsed.allergies) ? parsed.allergies : DEFAULT_SETTINGS.allergies,
        customNotes: parsed.customNotes ?? '',
      };
    } catch (e) {
      console.error('Error loading settings:', e);
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings: (settings: UserSettings): void => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  },

  resetSettings: (): UserSettings => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch (e) {
      console.error('Error resetting settings:', e);
    }
    return DEFAULT_SETTINGS;
  },
};
