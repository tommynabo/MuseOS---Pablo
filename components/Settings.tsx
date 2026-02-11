import React, { useState, useEffect } from 'react';
import { ClientProfile } from '../types';
import { Plus, Trash2, Sliders, Save, X, Users, Link as LinkIcon, User } from 'lucide-react';
import { fetchCreators, addCreator, deleteCreator } from '../services/geminiService';

interface SettingsProps {
  profile: ClientProfile;
  onUpdate: (p: ClientProfile) => void;
}

const DEFAULT_MASTER_PROMPT = `Eres Pablo, un Asesor Financiero y Gestor Patrimonial independiente en España con más de 25 años de experiencia. Tienes 56 años, eres padre de familia y hablas desde la voz de la experiencia, la seguridad y la prudencia financiera.

Tu objetivo es educar a profesionales y familias sobre cómo proteger su dinero frente a la inflación, optimizar su fiscalidad (específicamente en España) y planificar su jubilación de forma inteligente.

Tono y Estilo:
- Cercano pero Profesional: Eres el asesor de confianza de toda la vida. Usas un tono educado, directo, sin vender humo ni prometer rendimientos mágicos. No usas lenguaje de 'criptobro' ni de 'lobo de Wall Street'.
- Prudente: Siempre recalcas la importancia de la diversificación y el perfil de riesgo.

Formato de Escritura:
- Párrafos muy cortos (1-2 líneas).
- Uso estratégico de saltos de línea.
- Emojis sobrios (📉, 💡, 🏛️).

Regla de Oro:
- NUNCA menciones a la empresa 'Safe Bro'. Hablas siempre como profesional independiente.

Instrucción de Tarea:
Vas a recibir un tema o un post viral sobre finanzas. Tu trabajo es reescribirlo usando tu tono y experiencia. El post debe tener:
1. Un 'Hook' (gancho) que hable de un dolor real (pagar muchos impuestos, perder poder adquisitivo).
2. Una explicación sencilla de un concepto complejo.
3. Un CTA (Call to Action) al final pidiendo a la gente que te contacte o comente si quieren revisar su salud financiera.`;

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
        <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
          <div className="p-2 bg-slate-700 rounded-xl text-white"><Sliders size={24} /></div>
          Motor de Estrategia
        </h1>
        <p className="text-slate-500 ml-14">Personaliza la inteligencia financiera para que hable como tú.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column: System Prompt */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden h-full">
            <div className="p-8 border-b border-slate-100 bg-white flex justify-between items-center">
              <div>
                <h2 className="font-bold text-slate-800 text-lg">Personalidad & Tono</h2>
                <p className="text-sm text-slate-500 mt-1">Define las reglas que la IA debe seguir estrictamente.</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  className="px-4 py-2 bg-slate-50 text-slate-700 rounded-xl text-sm font-bold border border-slate-200 w-40"
                  value={profile.tone}
                  onChange={(e) => onUpdate({ ...profile, tone: e.target.value })}
                  placeholder="Ej: Prudente"
                />
              </div>
            </div>
            <div className="p-8 bg-white">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Instrucciones del Sistema (System Prompt)</label>
                <button
                  onClick={handleSetDefaultPrompt}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Cargar plantilla Asesor
                </button>
              </div>
              <textarea
                className="w-full border border-slate-200 rounded-2xl p-6 text-base text-slate-700 bg-white focus:ring-4 focus:ring-slate-100 focus:border-slate-400 transition-all shadow-inner leading-relaxed"
                rows={16}
                value={profile.customInstructions}
                onChange={(e) => onUpdate({ ...profile, customInstructions: e.target.value })}
                placeholder="Escribe aquí cómo quieres que se comporte la IA..."
              />
              <div className="mt-4 flex gap-2">
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-md">Tip: Sé específico con los "No hagas"</span>
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-md">Tip: Define tu audiencia</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Inputs */}
        <div className="space-y-8">
          {/* Creators */}
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 p-8">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-xl text-blue-600"><Users size={18} /></div>
                <h2 className="font-bold text-slate-800 text-lg">Referentes</h2>
              </div>
              <p className="text-xs text-slate-500 ml-11">Expertos a monitorizar</p>
            </div>

            {/* Add Creator Form - Improved UI */}
            <div className="mb-6 p-5 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border border-blue-100 shadow-sm">
              <label className="block text-[10px] font-bold text-blue-800 mb-3 uppercase tracking-wider">Agregar nuevo referente</label>
              <div className="space-y-3">
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Nombre (ej: Marc Vidal)"
                    value={newCreatorName}
                    onChange={(e) => setNewCreatorName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-blue-200 bg-white rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all placeholder-slate-400 text-slate-700"
                  />
                </div>
                <div className="relative">
                  <LinkIcon size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="LinkedIn URL"
                    value={newCreatorUrl}
                    onChange={(e) => setNewCreatorUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-blue-200 bg-white rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all placeholder-slate-400 text-slate-700"
                  />
                </div>
                <button
                  onClick={handleAddCreator}
                  disabled={!newCreatorUrl}
                  className={`w-full px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${newCreatorUrl ? 'bg-blue-700 text-white hover:bg-blue-800 shadow-md shadow-blue-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                >
                  <Plus size={16} /> Agregar
                </button>
              </div>
            </div>

            {/* Creators List - Improved Layout */}
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {creators.length === 0 ? (
                <div className="text-center py-8 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50">
                  <Users size={24} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs text-slate-400 font-medium">Sin referentes monitorizados</p>
                </div>
              ) : (
                creators.map((creator) => (
                  <div key={creator.id} className="group flex items-start justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
                    <div className="flex gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-600 flex-shrink-0 mt-0.5">
                        <User size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-sm truncate">{creator.name}</p>
                        <a
                          href={creator.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-slate-400 truncate hover:text-blue-700 hover:underline flex items-center gap-1 max-w-[90%] inline-flex"
                        >
                          <LinkIcon size={10} />
                          {creator.linkedin_url.replace('https://', '')}
                        </a>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteCreator(creator.id)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
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
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 p-8">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700"><Sliders size={18} /></div>
                <h2 className="font-bold text-slate-800 text-lg">Temáticas</h2>
              </div>
              <p className="text-xs text-slate-500 ml-11">Define tus temas principales</p>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {profile.nicheKeywords.length === 0 ? (
                <p className="text-xs text-slate-400 w-full py-2">Sin temáticas. Agrega las primeras.</p>
              ) : (
                profile.nicheKeywords.map((kw, idx) => (
                  <span key={idx} className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 text-emerald-800 rounded-full text-sm font-bold shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group">
                    {kw}
                    <button
                      onClick={() => handleDeleteKeyword(idx)}
                      className="text-emerald-400 hover:text-red-500 group-hover:block hidden transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))
              )}
            </div>

            {showKeywordInput ? (
              <div className="flex gap-2 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                  className="flex-1 border border-emerald-200 bg-white rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-200 outline-none text-slate-700"
                  placeholder="Nueva temática..."
                  autoFocus
                />
                <button
                  onClick={handleAddKeyword}
                  disabled={!newKeyword.trim()}
                  className={`p-2 rounded-lg transition-all ${newKeyword.trim() ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-200 text-slate-400'}`}
                >
                  <Save size={16} />
                </button>
                <button
                  onClick={() => { setShowKeywordInput(false); setNewKeyword(''); }}
                  className="p-2 bg-white text-slate-500 rounded-lg hover:bg-slate-100 border border-slate-200"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowKeywordInput(true)}
                className="w-full flex items-center justify-center gap-2 text-sm text-slate-700 font-bold border border-emerald-200 py-3 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-all bg-white"
              >
                <Plus size={16} /> Añadir Temática
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;