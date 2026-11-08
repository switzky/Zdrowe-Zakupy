export const VERDA_PROTOCOL = `
PROTOKÓŁ VERDA 8.3 (Early Shift) - Health Profile Rules:

1. Model Operacyjny: Pobudka 05:00, praca 06:00. Wysoka wydajność.
2. Kluczowe Leki/Suplementy: Brintellix (rano na czczo), Berberyna (20 min przed posiłkiem), Magnez (rano i wieczór), Maca (rano), D3+K2, Omega-3, Kolagen + Wit. C (wieczór), Ketrel + Zincas (noc).
3. Dieta i Składniki:
   - Preferowane: Tłuste białka (jaja, boczek, ser Bursztyn, udziec z indyka), czarny czosnek, kiełki brokułu (surowe), makaron konjac, chia, jogurt grecki, sól himalajska, ocet jabłkowy, masło klarowane (Ghee), oliwa extra virgin.
   - Unikać: Żeń-szeń (bezwzględnie!), cukier (używać ksylitolu), wysokie IG (Berberyna wymaga niskiego IG), składniki drażniące żołądek (chyba że z Ghee).
4. Interakcje:
   - Unikać składników wypłukujących magnez (nadmiar kofeiny bez osłony, silne zioła moczopędne bez soli).
   - Unikać składników blokujących wchłanianie (np. śluz z siemienia lnianego musi być 40 min po posiłku).
5. Cel: Stabilizacja glikemii, ochrona bariery śluzowej, regeneracja tkanek (pięty), wyciszenie układu nerwowego (zrywy hipnagogiczne).

ZADANIE: Zanalizuj produkt(y) na podstawie zdjęcia etykiety LUB opisu użytkownika. Jeśli użytkownik wymienia kilka produktów, porównaj je i wskaż "mniejsze zło" w kontekście Protokółu Verda 8.3.
Zwróć odpowiedź w formacie JSON:
{
  "isComparison": boolean,
  "products": [
    {
      "productName": "Nazwa produktu",
      "verdict": "KUPUJ" | "UNIKAJ" | "Z ROZWAGĄ",
      "healthScore": 0-100,
      "summary": "Krótkie podsumowanie",
      "pros": ["zalety"],
      "cons": ["wady"],
      "ingredientsAnalysis": "Analiza składu",
      "protocolFit": "Dopasowanie do protokołu",
      "detailedRisks": [
        {
          "ingredient": "Nazwa składnika",
          "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "BENEFICIAL",
          "reason": "Dlaczego ten składnik jest ryzykowny lub korzystny w Protokole Verda 8.3"
        }
      ]
    }
  ],
  "comparisonSummary": "Jeśli isComparison=true, tutaj wpisz porównanie i wybór mniejszego zła",
  "recommendation": "Konkretna rekomendacja (który wybrać)"
}
`;

export const STORAGE_KEY = 'verda_scanner_history';
export const API_KEY_STORAGE_KEY = 'verda_gemini_api_key';
export const MAX_HISTORY_ITEMS = 50;
