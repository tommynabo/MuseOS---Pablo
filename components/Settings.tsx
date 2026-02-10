import React, { useState, useEffect } from 'react';
import { ClientProfile } from '../types';
import { Plus, Trash2, Sliders, Save, X, Users, Link as LinkIcon, User } from 'lucide-react';
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

  const [newCreatorName, setNewCreatorName] = useState('');
  const [newCreatorUrl, setNewCreatorUrl] = useState('');

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
    if (!newCreatorUrl) return;
    const name = newCreatorName || "Nuevo Creador";
    try {
      await addCreator({ name, linkedinUrl: newCreatorUrl });
      setNewCreatorName('');
      setNewCreatorUrl('');
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
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-xl text-blue-600"><Users size={18} /></div>
                <h2 className="font-bold text-gray-900 text-lg">Fuentes de Inspiración</h2>
              </div>
              <p className="text-xs text-gray-500 ml-11">Agrega creadores para monitorizar su contenido</p>
            </div>

            {/* Add Creator Form - Improved UI */}
            <div className="mb-6 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 shadow-sm">
              <label className="block text-[10px] font-bold text-blue-700 mb-3 uppercase tracking-wider">Agregar nuevo creador</label>
              <div className="space-y-3">
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Nombre (ej: Simon Sinek)"
                    value={newCreatorName}
                    onChange={(e) => setNewCreatorName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-blue-200 bg-white rounded-xl text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition-all"
                  />
                </div>
                <div className="relative">
                  <LinkIcon size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="LinkedIn URL"
                    value={newCreatorUrl}
                    onChange={(e) => setNewCreatorUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-blue-200 bg-white rounded-xl text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition-all"
                  />
                </div>
                <button
                  onClick={handleAddCreator}
                  disabled={!newCreatorUrl}
                  className={`w-full px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${newCreatorUrl ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                >
                  <Plus size={16} /> Agregar Creador
                </button>
              </div>
            </div>

            {/* Creators List - Improved Layout */}
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {creators.length === 0 ? (
                <div className="text-center py-8 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
                  <Users size={24} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-xs text-gray-400 font-medium">Sin creadores monitorizados</p>
                  <p className="text-[10px] text-gray-300 mt-1">Agrega creadores para inspirarte</p>
                </div>
              ) : (
                creators.map((creator) => (
                  <div key={creator.id} className="group flex items-start justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
                    <div className="flex gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-blue-100 rounded-lg text-blue-600 flex-shrink-0 mt-0.5">
                        <User size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{creator.name}</p>
                        <a 
                          href={creator.linkedin_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[11px] text-gray-400 truncate hover:text-blue-600 hover:underline flex items-center gap-1 max-w-[90%] inline-flex"
                        >
                          <LinkIcon size={10} />
                          {creator.linkedin_url.replace('https://', '')}
                        </a>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteCreator(creator.id)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                      title="Eliminar creador"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Keywords */}
          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-xl text-purple-600"><Sliders size={18} /></div>
                <h2 className="font-bold text-gray-900 text-lg">Palabras Clave</h2>
              </div>
              <p className="text-xs text-gray-500 ml-11">Define tus temas principales</p>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {profile.nicheKeywords.length === 0 ? (
                <p className="text-xs text-gray-400 w-full py-2">Sin palabras clave. Agrega las primeras.</p>
              ) : (
                profile.nicheKeywords.map((kw, idx) => (
                  <span key={idx} className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 text-gray-700 rounded-full text-sm font-bold shadow-sm hover:shadow-md hover:border-purple-300 transition-all group">
                    {kw}
                    <button
                      onClick={() => handleDeleteKeyword(idx)}
                      className="text-gray-400 hover:text-red-500 group-hover:block hidden transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))
              )}
            </div>

            {showKeywordInput ? (
              <div className="flex gap-2 p-4 bg-purple-50 rounded-xl border border-purple-200">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                  className="flex-1 border border-purple-200 bg-white rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                  placeholder="Nueva palabra clave..."
                  autoFocus
                />
                <button 
                  onClick={handleAddKeyword} 
                  disabled={!newKeyword.trim()}
                  className={`p-2 rounded-lg transition-all ${newKeyword.trim() ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-200 text-gray-400'}`}
                >
                  <Save size={16} />
                </button>
                <button 
                  onClick={() => { setShowKeywordInput(false); setNewKeyword(''); }} 
                  className="p-2 bg-white text-gray-600 rounded-lg hover:bg-gray-100 border border-gray-200"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowKeywordInput(true)}
                className="w-full flex items-center justify-center gap-2 text-sm text-gray-700 font-bold border border-purple-200 py-3 rounded-xl hover:bg-purple-50 hover:border-purple-300 transition-all bg-white"
              >
                <Plus size={16} /> Añadir Palabra Clave
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;