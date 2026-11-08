import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Check, 
  Target, 
  AlertTriangle, 
  Plus, 
  Sparkles, 
  RotateCcw, 
  ShieldAlert,
  Brain,
  Activity,
  Apple,
  SlidersHorizontal
} from 'lucide-react';
import { 
  UserSettings, 
  PRESET_NEURODIVERGENCE,
  PRESET_HEALTH_CONDITIONS,
  PRESET_DIETS,
  PRESET_HEALTH_GOALS, 
  PRESET_ALLERGIES, 
  DEFAULT_SETTINGS 
} from '../services/settingsService';

interface SettingsModalProps {
  currentSettings: UserSettings;
  onSave: (newSettings: UserSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  currentSettings,
  onSave,
  onClose,
}) => {
  const [settings, setSettings] = useState<UserSettings>({
    ...currentSettings,
    healthGoals: [...(currentSettings.healthGoals || [])],
    neurodivergence: [...(currentSettings.neurodivergence || [])],
    healthConditions: [...(currentSettings.healthConditions || [])],
    allergies: [...(currentSettings.allergies || [])],
    dietType: currentSettings.dietType || DEFAULT_SETTINGS.dietType,
  });

  const [customGoalInput, setCustomGoalInput] = useState('');
  const [customNeuroInput, setCustomNeuroInput] = useState('');
  const [customConditionInput, setCustomConditionInput] = useState('');
  const [customAllergyInput, setCustomAllergyInput] = useState('');
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Generic toggler helper
  const toggleItem = (key: 'healthGoals' | 'neurodivergence' | 'healthConditions' | 'allergies', item: string) => {
    setSettings((prev) => {
      const list = prev[key] || [];
      const exists = list.includes(item);
      return {
        ...prev,
        [key]: exists ? list.filter((i) => i !== item) : [...list, item],
      };
    });
  };

  const addItem = (key: 'healthGoals' | 'neurodivergence' | 'healthConditions' | 'allergies', value: string, clearFn: () => void) => {
    const trimmed = value.trim();
    if (trimmed && !settings[key]?.includes(trimmed)) {
      setSettings((prev) => ({
        ...prev,
        [key]: [...(prev[key] || []), trimmed],
      }));
      clearFn();
    }
  };

  const removeItem = (key: 'healthGoals' | 'neurodivergence' | 'healthConditions' | 'allergies', item: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: prev[key]?.filter((i) => i !== item) || [],
    }));
  };

  const handleReset = () => {
    if (confirm('Czy chcesz przywrócić domyślne ustawienia profilu zdrowotnego?')) {
      setSettings({
        ...DEFAULT_SETTINGS,
        healthGoals: [...DEFAULT_SETTINGS.healthGoals],
        neurodivergence: [...DEFAULT_SETTINGS.neurodivergence],
        healthConditions: [...DEFAULT_SETTINGS.healthConditions],
        allergies: [...DEFAULT_SETTINGS.allergies],
      });
    }
  };

  const handleSave = () => {
    onSave(settings);
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
      onClose();
    }, 400);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/95 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Twój Profil Zdrowotny</h2>
              <p className="text-xs text-zinc-400">Dieta, wariant neuroatypowy, choroby skóry i cele</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 space-y-8 overflow-y-auto flex-grow custom-scrollbar">

          {/* SECTION 1: Model Diety */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <Apple className="w-4 h-4 text-emerald-400" />
                Aktualny Model Żywieniowy (Dieta)
              </label>
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {settings.dietType}
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              AI dopasuje ocenę makroskładników, ukrytych cukrów i węglowodanów do wybranego modelu żywieniowego.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {PRESET_DIETS.map((diet) => (
                <button
                  key={diet}
                  type="button"
                  onClick={() => setSettings((prev) => ({ ...prev, dietType: diet }))}
                  className={`
                    p-3 rounded-xl border text-xs text-left transition-all cursor-pointer font-medium flex items-center justify-between
                    ${
                      settings.dietType === diet
                        ? 'bg-emerald-500/15 border-emerald-500/70 text-emerald-300 font-bold shadow-sm'
                        : 'bg-zinc-800/40 border-white/5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    }
                  `}
                >
                  <span className="truncate">{diet}</span>
                  {settings.dietType === diet && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-white/5" />

          {/* SECTION 2: Wariant Neuroatypowy */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                Wariant Neuroatypowy & Układ Nerwowy
              </label>
              <span className="text-[11px] font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                {settings.neurodivergence.length} aktywne
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Ochrona przed składnikami zaostrzającymi objawy (sztuczne barwniki, nagłe skoki glukozy, wypłukiwanie magnezu, nadmiar stymulantów).
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {PRESET_NEURODIVERGENCE.map((item) => {
                const isSelected = settings.neurodivergence.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleItem('neurodivergence', item)}
                    className={`
                      text-xs px-3.5 py-2 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer
                      ${
                        isSelected
                          ? 'bg-purple-500/15 border-purple-500/60 text-purple-300 font-semibold shadow-sm'
                          : 'bg-zinc-800/50 border-white/5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                      }
                    `}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-purple-400" />}
                    <span>{item}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Neuro Input */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Dodaj inną cechę neuroatypową (np. zaburzenia koncentracji)..."
                value={customNeuroInput}
                onChange={(e) => setCustomNeuroInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem('neurodivergence', customNeuroInput, () => setCustomNeuroInput(''));
                  }
                }}
                className="flex-grow bg-zinc-800/80 border border-white/10 rounded-xl px-4 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50"
              />
              <button
                type="button"
                onClick={() => addItem('neurodivergence', customNeuroInput, () => setCustomNeuroInput(''))}
                disabled={!customNeuroInput.trim()}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-purple-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Dodaj</span>
              </button>
            </div>
          </div>

          <div className="h-px bg-white/5" />

          {/* SECTION 3: Choroby Skóry & Dolegliwości Przewlekłe */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                Choroby Skóry & Dolegliwości Przewlekłe
              </label>
              <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                {settings.healthConditions.length} aktywne
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Szczególne wyczulenie na składniki wyzwalające rzuty (np. <strong className="text-amber-300">łuszczyca krostkowa</strong>, AZS, trądzik różowaty, stany zapalne).
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {PRESET_HEALTH_CONDITIONS.map((cond) => {
                const isSelected = settings.healthConditions.includes(cond);
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => toggleItem('healthConditions', cond)}
                    className={`
                      text-xs px-3.5 py-2 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer
                      ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/60 text-amber-300 font-semibold shadow-sm'
                          : 'bg-zinc-800/50 border-white/5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                      }
                    `}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{cond}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Condition Input */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Dodaj dolegliwość (np. Łuszczyca krostkowa dłoni, SIBO)..."
                value={customConditionInput}
                onChange={(e) => setCustomConditionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem('healthConditions', customConditionInput, () => setCustomConditionInput(''));
                  }
                }}
                className="flex-grow bg-zinc-800/80 border border-white/10 rounded-xl px-4 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
              />
              <button
                type="button"
                onClick={() => addItem('healthConditions', customConditionInput, () => setCustomConditionInput(''))}
                disabled={!customConditionInput.trim()}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-amber-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Dodaj</span>
              </button>
            </div>
          </div>

          <div className="h-px bg-white/5" />

          {/* SECTION 4: Cele Zdrowotne */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                Główne Cele Zdrowotne
              </label>
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {settings.healthGoals.length} wybrane
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {PRESET_HEALTH_GOALS.map((goal) => {
                const isSelected = settings.healthGoals.includes(goal);
                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleItem('healthGoals', goal)}
                    className={`
                      text-xs px-3.5 py-2 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer
                      ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300 font-semibold shadow-sm'
                          : 'bg-zinc-800/50 border-white/5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                      }
                    `}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>{goal}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Dodaj własny cel (np. autofagia, zero kofeiny po 14:00)..."
                value={customGoalInput}
                onChange={(e) => setCustomGoalInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem('healthGoals', customGoalInput, () => setCustomGoalInput(''));
                  }
                }}
                className="flex-grow bg-zinc-800/80 border border-white/10 rounded-xl px-4 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
              />
              <button
                type="button"
                onClick={() => addItem('healthGoals', customGoalInput, () => setCustomGoalInput(''))}
                disabled={!customGoalInput.trim()}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-emerald-400 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Dodaj</span>
              </button>
            </div>
          </div>

          <div className="h-px bg-white/5" />

          {/* SECTION 5: Alergie i Bezwzględne Wykluczenia */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Alergie & Składniki Bezwzględnie Wykluczone
              </label>
              <span className="text-[11px] font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                {settings.allergies.length} wykluczeń
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Wykrycie tych substancji natychmiast nada produktowi status <strong className="text-red-400">UNIKAJ</strong> oraz wysokie ryzyko.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {PRESET_ALLERGIES.map((allergy) => {
                const isSelected = settings.allergies.includes(allergy);
                return (
                  <button
                    key={allergy}
                    type="button"
                    onClick={() => toggleItem('allergies', allergy)}
                    className={`
                      text-xs px-3.5 py-2 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer
                      ${
                        isSelected
                          ? 'bg-red-500/15 border-red-500/60 text-red-300 font-semibold shadow-sm'
                          : 'bg-zinc-800/50 border-white/5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                      }
                    `}
                  >
                    {isSelected && <ShieldAlert className="w-3.5 h-3.5 text-red-400" />}
                    <span>{allergy}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Dodaj inną alergię (np. olej palmowy, seler, sezam)..."
                value={customAllergyInput}
                onChange={(e) => setCustomAllergyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem('allergies', customAllergyInput, () => setCustomAllergyInput(''));
                  }
                }}
                className="flex-grow bg-zinc-800/80 border border-white/10 rounded-xl px-4 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50"
              />
              <button
                type="button"
                onClick={() => addItem('allergies', customAllergyInput, () => setCustomAllergyInput(''))}
                disabled={!customAllergyInput.trim()}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-red-400 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Dodaj</span>
              </button>
            </div>
          </div>

          <div className="h-px bg-white/5" />

          {/* SECTION 6: Własne Wskazówki */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-200">
              Własne Wskazówki i Leki (opcjonalnie)
            </label>
            <textarea
              rows={2}
              placeholder="np. Biorę leki rano na czczo, unikam grejpfruta, szukam produktów o wysokiej gęstości odżywczej..."
              value={settings.customNotes || ''}
              onChange={(e) => setSettings((prev) => ({ ...prev, customNotes: e.target.value }))}
              className="w-full bg-zinc-800/80 border border-white/10 rounded-xl p-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 resize-none"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-white/5 bg-zinc-900/95 flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-0 z-10 backdrop-blur-md">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5 transition-colors cursor-pointer py-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Przywróć domyślne</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-3 rounded-xl border border-white/10 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              Anuluj
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 sm:flex-none px-7 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all active:scale-95 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {savedFeedback ? (
                <>
                  <Check className="w-4 h-4 text-black" />
                  <span>Zapisano w profilu!</span>
                </>
              ) : (
                <span>Zapisz profil</span>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
