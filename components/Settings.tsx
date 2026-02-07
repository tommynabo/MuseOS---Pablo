import React, { useState, useEffect } from 'react';
import { ClientProfile } from '../types';
import { Plus, Trash2, Sliders } from 'lucide-react';
import { fetchCreators, addCreator } from '../services/geminiService';

interface SettingsProps {
  profile: ClientProfile;
  onUpdate: (p: ClientProfile) => void;
}

const Settings: React.FC<SettingsProps> = ({ profile, onUpdate }) => {
  const [creators, setCreators] = useState<{ id: number, name: string, linkedinUrl: string }[]>([]);

  useEffect(() => {
    loadCreators();
  }, []);

  const loadCreators = async () => {
    try {
      const data = await fetchCreators();
      setCreators(data);
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
      loadCreators(); // Refresh list
    } catch (e) {
      alert("Error al añadir creador");
    }
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
              <span className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-bold border border-indigo-100">
                {profile.tone}
              </span>
            </div>
            <div className="p-8 bg-white"> {/* Ensure white background */}
              <label className="block text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Instrucciones del Sistema (System Prompt)</label>
              <textarea
                className="w-full border border-gray-200 rounded-2xl p-6 text-base text-gray-800 bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all shadow-inner leading-relaxed"
                rows={12}
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
          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8">
            <h2 className="font-bold text-gray-900 mb-6 text-lg">Fuentes de Inspiración</h2>
            <div className="space-y-3 mb-6">
              {creators.map((creator) => (
                <div key={creator.id} className="flex items-center justify-between text-sm p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-indigo-200 transition-colors">
                  <span className="truncate text-gray-600 w-48 font-medium">{creator.name}</span>
                  <button className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
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

          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8">
            <h2 className="font-bold text-gray-900 mb-6 text-lg">Palabras Clave</h2>
            <div className="flex flex-wrap gap-2 mb-6">
              {profile.nicheKeywords.map((kw, idx) => (
                <span key={idx} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm">
                  {kw}
                  <button className="text-gray-300 hover:text-red-500"><Trash2 size={12} /></button>
                </span>
              ))}
            </div>
            <button className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 font-bold border border-gray-200 py-3 rounded-xl hover:bg-gray-50 transition-colors">
              <Plus size={18} /> Añadir Keyword
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;