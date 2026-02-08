import React, { useState, useEffect } from 'react';
import { ClientProfile } from '../types';
import { Plus, Trash2, Sliders, Save, X } from 'lucide-react';
import { fetchCreators, addCreator, deleteCreator } from '../services/geminiService';

interface SettingsProps {
  profile: ClientProfile;
  onUpdate: (p: ClientProfile) => void;
}

const DEFAULT_MASTER_PROMPT = `Eres Lilia Cruz García, psicóloga especializada en bienestar emocional y desarrollo personal.

ESTILO DE COMUNICACIÓN:
- Tono empático, cercano pero profesional
- Usa "tú" para crear conexión
- Frases cortas y directas
- Sin jerga técnica excesiva - hazlo accesible
- Incluye preguntas reflexivas para el lector

ESTRUCTURA DE POSTS:
- Hook emocional o pregunta que conecte
- Desarrollo con ejemplos cotidianos
- Cierre con reflexión o llamada a la acción suave

TEMAS PRINCIPALES:
- Autoestima y amor propio
- Gestión emocional
- Relaciones saludables
- Bienestar mental
- Crecimiento personal

NO HACER:
- No usar emojis en exceso (máximo 1-2)
- No ser condescendiente
- No dar diagnósticos
- No usar clickbait agresivo`;

const Settings: React.FC<SettingsProps> = ({ profile, onUpdate }) => {
  const [creators, setCreators] = useState<{ id: number, name: string, linkedin_url: string }[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [showKeywordInput, setShowKeywordInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCreators();
  }, []);

  const loadCreators = async () => {
    try {
      const data = await fetchCreators();
      if (Array.isArray(data)) setCreators(data);
    } catch (e) {
      console.error("Failed to load creators", e);
    }
  };

  const handleAddCreator = async () => {
    const url = prompt("Introduce la URL del perfil de LinkedIn:");
    if (!url) return;
    const name = prompt("Nombre del creador (opcional):") || "Nuevo Creador";
    try {
      await addCreator({ name, linkedinUrl: url });
      loadCreators();
    } catch (e) {
      alert("Error al añadir creador");
    }
  };

  const handleDeleteCreator = async (id: number) => {
    if (!confirm("¿Eliminar este creador?")) return;
    try {
      await deleteCreator(id);
      loadCreators();
    } catch (e) {
      alert("Error al eliminar");
    }
  };

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    const updated = [...profile.nicheKeywords, newKeyword.trim()];
    onUpdate({ ...profile, nicheKeywords: updated });
    setNewKeyword('');
    setShowKeywordInput(false);
  };

  const handleDeleteKeyword = (idx: number) => {
    const updated = profile.nicheKeywords.filter((_, i) => i !== idx);
    onUpdate({ ...profile, nicheKeywords: updated });
  };

  const handleSetDefaultPrompt = () => {
    onUpdate({ ...profile, customInstructions: DEFAULT_MASTER_PROMPT });
  };

  return (
    <div className="max-w-[1200px] mx-auto p-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl text-white"><Sliders size={24} /></div>
          Motor de Inspiración
        </h1>
        <p className="text-gray-500 ml-14">Personaliza la inteligencia de MuseOS para que hable como tú.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column: System Prompt */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden h-full">
            <div className="p-8 border-b border-gray-100 bg-white flex justify-between items-center">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Personalidad & Tono</h2>
                <p className="text-sm text-gray-500 mt-1">Define las reglas que la IA debe seguir estrictamente.</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-bold border border-indigo-100 w-40"
                  value={profile.tone}
                  onChange={(e) => onUpdate({ ...profile, tone: e.target.value })}
                  placeholder="Ej: Empático"
                />
              </div>
            </div>
            <div className="p-8 bg-white">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Instrucciones del Sistema (System Prompt)</label>
                <button
                  onClick={handleSetDefaultPrompt}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Cargar plantilla Psicóloga
                </button>
              </div>
              <textarea
                className="w-full border border-gray-200 rounded-2xl p-6 text-base text-gray-800 bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all shadow-inner leading-relaxed"
                rows={14}
                value={profile.customInstructions}
                onChange={(e) => onUpdate({ ...profile, customInstructions: e.target.value })}
                placeholder="Escribe aquí cómo quieres que se comporte la IA..."
              />
              <div className="mt-4 flex gap-2">
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-md">Tip: Sé específico con los "No hagas"</span>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-md">Tip: Define tu audiencia</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Inputs */}
        <div className="space-y-8">
          {/* Creators */}
          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8">
            <h2 className="font-bold text-gray-900 mb-6 text-lg">Fuentes de Inspiración</h2>
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
              {creators.map((creator) => (
                <div key={creator.id} className="flex items-center justify-between text-sm p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-indigo-200 transition-colors">
                  <span className="truncate text-gray-600 w-48 font-medium">{creator.name}</span>
                  <button
                    onClick={() => handleDeleteCreator(creator.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {creators.length === 0 && <p className="text-xs text-gray-400">Sin creadores monitorizados.</p>}
            </div>
            <button
              onClick={handleAddCreator}
              className="w-full flex items-center justify-center gap-2 text-sm text-indigo-600 font-bold bg-indigo-50 py-3 rounded-xl hover:bg-indigo-100 transition-colors"
            >
              <Plus size={18} /> Añadir Perfil
            </button>
          </div>

          {/* Keywords */}
          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8">
            <h2 className="font-bold text-gray-900 mb-6 text-lg">Palabras Clave</h2>
            <div className="flex flex-wrap gap-2 mb-6">
              {profile.nicheKeywords.map((kw, idx) => (
                <span key={idx} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm">
                  {kw}
                  <button
                    onClick={() => handleDeleteKeyword(idx)}
                    className="text-gray-300 hover:text-red-500"
                  >
                    <Trash2 size={12} />
                  </button>
                </span>
              ))}
              {profile.nicheKeywords.length === 0 && <p className="text-xs text-gray-400">Sin palabras clave.</p>}
            </div>

            {showKeywordInput ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm"
                  placeholder="Nueva keyword..."
                  autoFocus
                />
                <button onClick={handleAddKeyword} className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">
                  <Save size={18} />
                </button>
                <button onClick={() => setShowKeywordInput(false)} className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200">
                  <X size={18} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowKeywordInput(true)}
                className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 font-bold border border-gray-200 py-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Plus size={18} /> Añadir Keyword
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;