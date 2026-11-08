import { GoogleGenAI, Type } from "@google/genai";
import { VERDA_PROTOCOL } from "../constants";
import { UserSettings } from "./settingsService";

export interface AnalysisResult {
  isComparison: boolean;
  products: {
    productName: string;
    verdict: 'KUPUJ' | 'UNIKAJ' | 'Z ROZWAGĄ';
    healthScore: number;
    summary: string;
    pros: string[];
    cons: string[];
    ingredientsAnalysis: string;
    protocolFit: string;
    naturopathicAdvice?: string;
    personalizedInsights?: {
      goalMatch: string;
      allergyAlerts: string[];
      conditionWarnings?: string[];
    };
    detailedRisks: {
      ingredient: string;
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'BENEFICIAL';
      reason: string;
    }[];
  }[];
  comparisonSummary?: string;
  recommendation?: string;
}

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("BŁĄD KRYTYCZNY: Brak klucza API (VITE_GEMINI_API_KEY lub GEMINI_API_KEY)");
}

export const performProductAnalysis = async (
  apiKeyOverride?: string,
  imageData?: string,
  description?: string,
  userSettings?: UserSettings
): Promise<AnalysisResult> => {
  const apiKey = apiKeyOverride || API_KEY;
  if (!apiKey) throw new Error("API Key is required");

  const genAI = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";

  const currentTime = new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  const currentDate = new Date().toLocaleDateString('pl-PL');

  // Build personalized profile context
  const goalsText = userSettings?.healthGoals && userSettings.healthGoals.length > 0
    ? userSettings.healthGoals.map(g => `• ${g}`).join('\n')
    : 'Brak zdefiniowanych celów szczegółowych.';

  const neuroText = userSettings?.neurodivergence && userSettings.neurodivergence.length > 0
    ? userSettings.neurodivergence.map(n => `• ${n}`).join('\n')
    : 'Brak zadeklarowanych cech neuroatypowych.';

  const conditionsText = userSettings?.healthConditions && userSettings.healthConditions.length > 0
    ? userSettings.healthConditions.map(c => `• ${c}`).join('\n')
    : 'Brak zgłoszonych chorób przewlekłych / skórnych.';

  const dietText = userSettings?.dietType ? `Wybrany model żywieniowy: ${userSettings.dietType}` : '';

  const allergiesText = userSettings?.allergies && userSettings.allergies.length > 0
    ? userSettings.allergies.map(a => `• ${a}`).join('\n')
    : 'Brak zgłoszonych alergii.';

  const notesText = userSettings?.customNotes?.trim()
    ? `Dodatkowe instrukcje użytkownika: ${userSettings.customNotes.trim()}`
    : '';

  const personalizedContext = `
SPERSONALIZOWANY PROFIL ZDROWOTNY UŻYTKOWNIKA (NAJWYŻSZY PRIORYTET ANALIZY):
1. AKTUALNY MODEL ŻYWIENIOWY (DIETA):
${dietText}

2. WARIANTEK NEUROATYPOWY I UKŁAD NERWOWY (np. ADHD, zaburzenia snu, mgła mózgowa):
${neuroText}

3. CHOROBY SKÓRY I STANY ZAPALNE (np. łuszczyca krostkowa, AZS, trądzik różowaty, insulinooporność):
${conditionsText}

4. GŁÓWNE CELE ZDROWOTNE:
${goalsText}

5. ALERGIE, NIETOLERANCJE I WYKLUCZENIA (BEZWZGLĘDNIE KRYTYCZNE):
${allergiesText}
${notesText ? `\n6. WSKAZÓWKI UŻYTKOWNIKA:\n${notesText}` : ''}
`;

  const systemInstruction = `
Jesteś wybitnym lekarzem medycyny integracyjnej i czołowym naturoterapeutą klinicznym. Posiadasz najnowocześniejszą wiedzę medyczną i fitoterapeutyczną (stale aktualizowaną w oparciu o najnowsze badania kliniczne, literaturę EBM, medycynę funkcjonalną i biochemię żywienia).

TWOJE FUNDAMENTY ANALIZY:
1. NAJWYŻSZA KOMPETENCJA MEDYCZNA:
- Dokładna ocena biochemiczna: wpływ składników na cytokiny prozapalne (IL-1, IL-6, TNF-alpha), oś jelito-mózg, szczelność bariery jelitowej (zonulina), równowagę kwasowo-zasadową oraz mikrobiotę.
- Ukryte zapalenie tkanki łącznej i stawów: identyfikuj składniki wywołujące cichy stan zapalny (silent inflammation), produkty glikacji (AGEs), oksydowane tłuszcze i prozapalny stosunek kwasów omega-6 do omega-3.

2. NATUROTERAPIA KLINICZNA I HOLISTYCZNA:
- Zwracaj uwagę na czystość surowców (clean label), brak syntetycznych emulgatorów niszczących śluzówkę (np. karagen, polisorbaty, karboksymetyloceluloza).
- Doceniaj naturalne synergie składników, polifenole, fitoskładniki, adaptogeny i fermenty.
- W polu 'naturopathicAdvice' podaj ekspercką, zwięzłą wskazówkę naturoterapeuty klinicznego (np. jak neutralizować fityniany, jak łączyć składnik dla lepszej biodostępności, czym zastąpić szkodliwy element lub jak naturalnie wesprzeć detoksykację wątroby i skóry).

3. SPECJALIZACJA POD PROFIL UŻYTKOWNIKA:
- Wariant neuroatypowy (ADHD, zaburzenia snu): bezwzględnie piętnuj syntetyczne barwniki (tartrazyna, czerwień Allura), benzoesan sodu, ukryty glutaminian sodu, syropy o wysokim IG rozregulowujące dopaminę oraz składniki chelatujące i wypłukujące magnez/cynk.
- Choroby skóry (Łuszczyca, w tym krostkowa, AZS): w łuszczycy krostkowej układ odpornościowy jest nadreaktywny. Bezwzględnie wyłapuj tłuszcze trans, oleje rafinowane z nadmiarem omega-6, psiankowate (jeśli są wyzwalaczem), alkohol, sztuczne aromaty oraz składniki obciążające wątrobę i jelita.
- Diety (Low Carb, Keto, AIP itp.): weryfikuj węglowodany netto, ukryte cukry (dekstroza, maltodekstryna, syrop ryżowy) i polialkohole.
- Alergie: Natychmiastowy werdykt UNIKAJ lub Z ROZWAGĄ przy wykryciu alergenu.
`;

  const prompt = `
    ${VERDA_PROTOCOL}
    
    ${personalizedContext}
    
    AKTUALNY CZAS: ${currentDate}, ${currentTime}
    
    JAKO WYBITNY EKSPERT MEDYCYNY INTEGRACYJNEJ I NATUROTERAPEUTA KLINICZNY, PRZEPROWADŹ DOKŁADNĄ, SPERSONALIZOWANĄ ANALIZĘ PRODUKTU W OPARCIU O POWYŻSZY PROFIL ZDROWOTNY.
  `;

  const parts: any[] = [{ text: prompt }];

  if (imageData) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: imageData.split(',')[1]
      }
    });
  }

  if (description) {
    parts.push({ text: `DANE OD UŻYTKOWNIKA: ${description}` });
  }

  const response = await genAI.models.generateContent({
    model,
    contents: [{ parts }],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ['isComparison', 'products'],
        properties: {
          isComparison: { type: Type.BOOLEAN },
          products: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ['productName', 'verdict', 'healthScore', 'summary', 'pros', 'cons', 'ingredientsAnalysis', 'protocolFit', 'detailedRisks'],
              properties: {
                productName: { type: Type.STRING },
                verdict: { type: Type.STRING, enum: ['KUPUJ', 'UNIKAJ', 'Z ROZWAGĄ'] },
                healthScore: { type: Type.NUMBER },
                summary: { type: Type.STRING },
                pros: { type: Type.ARRAY, items: { type: Type.STRING } },
                cons: { type: Type.ARRAY, items: { type: Type.STRING } },
                ingredientsAnalysis: { type: Type.STRING },
                protocolFit: { type: Type.STRING },
                naturopathicAdvice: { type: Type.STRING },
                personalizedInsights: {
                  type: Type.OBJECT,
                  properties: {
                    goalMatch: { type: Type.STRING },
                    allergyAlerts: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    conditionWarnings: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    }
                  }
                },
                detailedRisks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    required: ['ingredient', 'riskLevel', 'reason'],
                    properties: {
                      ingredient: { type: Type.STRING },
                      riskLevel: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH', 'BENEFICIAL'] },
                      reason: { type: Type.STRING }
                    }
                  }
                }
              }
            }
          },
          comparisonSummary: { type: Type.STRING },
          recommendation: { type: Type.STRING }
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Empty response from AI");
  return JSON.parse(text);
};
