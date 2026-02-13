import React, { useState, useEffect } from 'react';
import { Stats, ContentPiece } from '../types';
import IdeaCard from './IdeaCard';
import LinkedInPreview from './LinkedInPreview';
import { PenTool, CheckCircle, Clock, Search, Bell, Sparkles, Zap, TrendingUp, Users, Hash, ChevronRight, Calendar, ExternalLink, Trash2, Building2 } from 'lucide-react';
import { runGenerateWorkflow } from '../services/geminiService';
import { getScheduleConfig, saveScheduleConfig, toggleSchedule } from '../services/scheduleService';

interface DashboardProps {
    stats: Stats;
    ideas: ContentPiece[];
    onSelectIdea: (idea: ContentPiece) => void;
    onRefresh?: () => void;
    onUpdatePost: (id: string, status: 'idea' | 'drafted' | 'approved' | 'posted') => void;
    onDeletePost: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, ideas, onSelectIdea, onRefresh, onUpdatePost, onDeletePost }) => {
    // State for the Hero Section controls
    const [manualCount, setManualCount] = useState(3);
    const [manualSource, setManualSource] = useState<'keywords' | 'creators'>('keywords');
    const [isGenerating, setIsGenerating] = useState(false);

    const [schedTime, setSchedTime] = useState('09:00');
    const [schedCount, setSchedCount] = useState(5);
    const [schedSource, setSchedSource] = useState<'keywords' | 'creators'>('creators');
    const [schedActive, setSchedActive] = useState(true);
    const [isSavingSchedule, setIsSavingSchedule] = useState(false);

    // Drag and drop state
    const [draggedItem, setDraggedItem] = useState<{ item: ContentPiece; source: string } | null>(null);
    const [previewPost, setPreviewPost] = useState<ContentPiece | null>(null);

    // Load schedule configuration from backend
    useEffect(() => {
        const loadSchedule = async () => {
            try {
                const schedule = await getScheduleConfig();
                if (schedule) {
                    setSchedTime(schedule.time);
                    setSchedCount(schedule.count);
                    setSchedSource(schedule.source);
                    setSchedActive(schedule.enabled);
                }
            } catch (error) {
                console.error('Error loading schedule:', error);
            }
        };
        loadSchedule();
    }, []);

    // Auto-save schedule when time changes
    useEffect(() => {
        const saveTimer = setTimeout(async () => {
            if (schedTime && schedCount > 0) {
                try {
                    await saveScheduleConfig({
                        enabled: schedActive,
                        time: schedTime,
                        source: schedSource,
                        count: schedCount
                    });
                } catch (error) {
                    console.error('Error saving schedule:', error);
                }
            }
        }, 1000); // Debounce: save after 1 second of inactivity

        return () => clearTimeout(saveTimer);
    }, [schedTime, schedCount, schedSource]);

    const handleToggleSchedule = async () => {
        setIsSavingSchedule(true);
        try {
            const result = await toggleSchedule();
            setSchedActive(result.schedule.enabled);
        } catch (error) {
            console.error('Error toggling schedule:', error);
            alert('Error toggling schedule');
        } finally {
            setIsSavingSchedule(false);
        }
    };

    // Drag and drop state
    const [draggedItem, setDraggedItem] = useState<{ item: ContentPiece; source: string } | null>(null);
    const [previewPost, setPreviewPost] = useState<ContentPiece | null>(null);

    // Filter content by status
    const newIdeas = ideas.filter(i => i.status === 'idea');
    const drafts = ideas.filter(i => i.status === 'drafted');
    const ready = ideas.filter(i => i.status === 'approved' || i.status === 'posted');

    const handleDragStart = (item: ContentPiece, source: string) => {
        setDraggedItem({ item, source });
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.currentTarget.classList.add('bg-slate-50');
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.currentTarget.classList.remove('bg-slate-50');
    };

    const handleDropOnSection = async (targetStatus: 'idea' | 'drafted' | 'approved', e: React.DragEvent) => {
        e.preventDefault();
        e.currentTarget.classList.remove('bg-slate-50');

        if (!draggedItem) return;

        const { item } = draggedItem;
        if (item.status === targetStatus) {
            setDraggedItem(null);
            return; // Same status, no change
        }

        // Optimistic Update via Parent
        onUpdatePost(item.id, targetStatus);
        setDraggedItem(null);
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            // Use the unified workflow - no popup needed!
            // Keywords/creators are fetched from profile settings
            const result = await runGenerateWorkflow(manualSource, manualCount);

            if (result.error) {
                alert(`Error: ${result.error}`);
            } else {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Glass ping sound
                audio.volume = 0.5;
                audio.play().catch(e => console.log("Audio play failed", e));
                alert(`¡Generación completada! ${result.postsProcessed || 0} posts creados.`);
                if (onRefresh) onRefresh();
            }
        } catch (error) {
            console.error(error);
            alert("Error al iniciar el flujo.");
        } finally {
            setIsGenerating(false);
        }
    };

    const SectionHeader = ({ icon: Icon, title, count, colorClass, iconColorClass }: any) => (
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${colorClass}`}>
                    <Icon size={18} className={iconColorClass} />
                </div>
                <h2 className="text-lg font-bold text-slate-800">{title}</h2>
            </div>
            <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold border border-slate-200">{count}</span>
        </div>
    );

    const SourceToggle = ({ active, onChange }: { active: 'keywords' | 'creators', onChange: (v: 'keywords' | 'creators') => void }) => (
        <div className="flex bg-slate-100 p-1 rounded-xl relative">
            <button
                onClick={() => onChange('keywords')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all z-10 ${active === 'keywords' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <Hash size={14} /> Temáticas
            </button>
            <button
                onClick={() => onChange('creators')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all z-10 ${active === 'creators' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <Users size={14} /> Referentes
            </button>
        </div>
    );

    const glowCardClass = "bg-white p-8 rounded-[32px] border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(30,41,59,0.08)] hover:border-slate-300 transition-all duration-300 relative overflow-hidden";

    return (
        <div className="max-w-[1600px] mx-auto p-10">

            {/* Top Navigation / Search */}
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <span>Hola, Pablo</span>
                        <span className="text-2xl">👋</span>
                    </h1>
                    <p className="text-slate-500 mt-1">Tu audiencia financiera espera.</p>
                </div>
                <div className="flex items-center gap-6">
                    <div className="relative hidden md:block">
                        <input
                            type="text"
                            placeholder="Buscar..."
                            className="pl-10 pr-4 py-3 w-64 bg-white border border-slate-200 rounded-2xl shadow-sm text-sm focus:ring-2 focus:ring-slate-100 placeholder-slate-400 outline-none transition-all focus:w-80"
                        />
                        <Search className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                    </div>
                    <button className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 text-slate-400 hover:text-blue-700 transition-colors relative hover:shadow-md">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    </button>
                </div>
            </div>

            {/* MINIMALIST FUNCTIONAL HERO */}
            <div className="w-full mb-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* LEFT: Manual Generation */}
                    <div className={`${glowCardClass}`}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-700"><Zap size={20} /></div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">Generador Manual</h3>
                                <p className="text-xs text-slate-400">Creación bajo demanda</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Cantidad</label>
                                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{manualCount} Ideas</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={manualCount}
                                    onChange={(e) => setManualCount(Number(e.target.value))}
                                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-700"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2 block">Fuente</label>
                                <SourceToggle active={manualSource} onChange={setManualSource} />
                            </div>
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className={`w-full mt-2 bg-slate-900 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 ${isGenerating ? 'opacity-70 cursor-not-allowed' : 'hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'}`}
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Generando...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} /> Generar Ahora
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* CENTER: Scheduler (The Clock) */}
                    <div className={`${glowCardClass}`}>
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Clock size={20} /></div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-lg">Piloto Automático</h3>
                                    <p className="text-xs text-slate-400">
                                        {schedActive ? 'Activo diariamente' : 'Pausado'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleToggleSchedule}
                                disabled={isSavingSchedule}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${schedActive ? 'bg-emerald-500' : 'bg-slate-200'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${schedActive ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        <div className="flex flex-col items-center justify-center mb-8 relative h-24 w-full">
                            <div className="relative z-10 w-full h-full flex items-center justify-center">
                                {/* Invisible Time Input Overlay - positioned specifically over the time display */}
                                <input
                                    type="time"
                                    value={schedTime}
                                    onChange={(e) => setSchedTime(e.target.value)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                                    style={{ pointerEvents: 'auto' }}
                                />
                                <div className="text-7xl font-bold text-slate-800 tracking-tighter flex items-center hover:text-blue-700 transition-colors select-none">
                                    {schedTime}
                                </div>
                            </div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-2 flex items-center gap-1 pointer-events-none">
                                <Calendar size={10} /> Hora de ejecución
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 relative z-20">
                            <div>
                                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2 block">Volumen</label>
                                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-2">
                                    <button onClick={() => setSchedCount(Math.max(1, schedCount - 1))} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-blue-700 font-bold text-lg">-</button>
                                    <span className="font-bold text-slate-900 text-sm">{schedCount}</span>
                                    <button onClick={() => setSchedCount(Math.min(10, schedCount + 1))} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-blue-700 font-bold text-lg">+</button>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2 block">Fuente</label>
                                {/* Mini Source Toggle for Scheduler */}
                                <div className="flex bg-slate-100 p-1 rounded-xl h-[42px]">
                                    <button onClick={() => setSchedSource('keywords')} className={`flex-1 flex items-center justify-center rounded-lg ${schedSource === 'keywords' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400'}`}><Hash size={14} /></button>
                                    <button onClick={() => setSchedSource('creators')} className={`flex-1 flex items-center justify-center rounded-lg ${schedSource === 'creators' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400'}`}><Users size={14} /></button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: System Status */}
                    <div className={`${glowCardClass}`}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl"><TrendingUp size={20} /></div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">Sistema</h3>
                                <p className="text-xs text-slate-400">Métricas en tiempo real</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Next Batch Status - Real */}
                            <div className={`bg-white border rounded-2xl p-4 shadow-sm transition-all ${schedActive ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100 bg-slate-50/30'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Estado del Piloto</p>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${schedActive ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-orange-600 bg-orange-50 border border-orange-200'}`}>
                                        {schedActive ? '✓ Activo' : '⏸ Pausado'}
                                    </span>
                                </div>
                                {schedActive ? (
                                    <>
                                        <p className="text-sm font-bold text-slate-900 mb-1">Próxima ejecución</p>
                                        <p className="text-2xl font-bold text-emerald-600 mb-2">{schedTime}</p>
                                        <p className="text-xs text-slate-600">Volumen: <span className="font-bold text-slate-900">{schedCount} ideas</span> • Fuente: <span className="font-bold text-slate-900">{schedSource === 'keywords' ? 'Temáticas' : 'Referentes'}</span></p>
                                    </>
                                ) : (
                                    <p className="text-sm text-slate-600 py-2">El piloto automático está desactivado. Actívalo para programar generación automática.</p>
                                )}
                            </div>

                            {/* Active Content Metrics */}
                            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                                <div className="flex justify-between items-center mb-3">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Contenido Procesado</p>
                                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">Hoy</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="text-center">
                                        <p className="text-xl font-bold text-slate-700">{newIdeas.length}</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">Ideas</p>
                                    </div>
                                    <div className="text-center border-l border-r border-slate-100">
                                        <p className="text-xl font-bold text-blue-700">{drafts.length}</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">Borradores</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xl font-bold text-emerald-600">{ready.length}</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">Listos</p>
                                    </div>
                                </div>
                            </div>

                            {/* Generation Progress */}
                            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                                <div className="flex justify-between items-center mb-3">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Progreso de Sesión</p>
                                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{((drafts.length + ready.length) / (newIdeas.length + drafts.length + ready.length) * 100 || 0).toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div
                                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${((drafts.length + ready.length) / (newIdeas.length + drafts.length + ready.length) * 100 || 0)}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-slate-600 mt-2">De idea a contenido listo para publicar</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* DIVIDER */}
            <div className="w-full h-px bg-slate-200 my-8"></div>

            {/* NEW LAYOUT GRID - FLATTENED */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* COLUMN 1: IDEAS (Backlog) */}
                <div className="flex flex-col gap-6">
                    <SectionHeader
                        icon={Building2} // More corporate icon for Ideas
                        title="Banco de Ideas"
                        count={newIdeas.length}
                        colorClass="bg-amber-100"
                        iconColorClass="text-amber-700"
                    />
                    <div className="space-y-4">
                        {newIdeas.map(item => (
                            <div
                                key={item.id}
                                draggable
                                onDragStart={() => handleDragStart(item, 'idea')}
                                className="cursor-move hover:opacity-75 transition-opacity"
                            >
                                <IdeaCard item={item} onClick={onSelectIdea} onDelete={onDeletePost} />
                            </div>
                        ))}
                        {newIdeas.length === 0 && <EmptyState text="Sin nuevas ideas de inversión" />}
                    </div>
                </div>

                {/* COLUMN 2: DRAFTS */}
                <div
                    className="flex flex-col gap-6 bg-slate-50/50 rounded-[32px] p-6 border border-slate-100/50 transition-colors h-full min-h-[500px]"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDropOnSection('drafted', e)}
                >
                    <SectionHeader
                        icon={PenTool}
                        title="En Edición"
                        count={drafts.length}
                        colorClass="bg-blue-100"
                        iconColorClass="text-blue-700"
                    />
                    <div className="space-y-4">
                        {drafts.map(item => (
                            <div
                                key={item.id}
                                draggable
                                onDragStart={() => handleDragStart(item, 'drafted')}
                                onClick={() => onSelectIdea(item)}
                                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-move group"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">Editando</span>
                                    <div className="flex items-center gap-2">
                                        {item.sourceUrl && (
                                            <a
                                                href={item.sourceUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-slate-300 hover:text-blue-500 transition-colors"
                                                title="Ver fuente"
                                            >
                                                <ExternalLink size={14} />
                                            </a>
                                        )}
                                        <button onClick={(e) => { e.stopPropagation(); onDeletePost(item.id); }} className="text-slate-300 hover:text-red-500 transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="font-bold text-slate-800 text-sm mb-2 leading-snug group-hover:text-blue-800 transition-colors">{item.generatedDraft.hook}</h3>
                                <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">{item.generatedDraft.body}</p>
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                                    <span className="text-[10px] text-slate-400">Hace 2h</span>
                                    <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-3/4 rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {drafts.length === 0 && <EmptyState text="No hay borradores activos" />}
                    </div>
                </div>

                {/* COLUMN 3: READY */}
                <div
                    className="flex flex-col gap-6 bg-slate-50/50 rounded-[32px] p-6 border border-slate-100/50 transition-colors h-full min-h-[500px]"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDropOnSection('approved', e)}
                >
                    <SectionHeader
                        icon={CheckCircle}
                        title="Listos para Publicar"
                        count={ready.length}
                        colorClass="bg-emerald-100"
                        iconColorClass="text-emerald-700"
                    />
                    <div className="space-y-4">
                        {ready.map(item => (
                            <div
                                key={item.id}
                                draggable
                                onDragStart={() => handleDragStart(item, 'approved')}
                                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm opacity-90 hover:opacity-100 transition-all cursor-move group relative"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1 bg-emerald-100 rounded-full text-emerald-600"><CheckCircle size={12} /></div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Programado</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-400">Mañana, 09:00</span>
                                        <button onClick={(e) => { e.stopPropagation(); onDeletePost(item.id); }} className="text-slate-300 hover:text-red-500 transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="font-medium text-slate-800 text-sm leading-snug mb-3">{item.generatedDraft.hook}</h3>
                                <button
                                    onClick={() => setPreviewPost(item)}
                                    className="w-full py-2 text-xs font-bold text-slate-500 bg-slate-50 rounded-lg hover:bg-slate-100 hover:text-blue-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    Ver Preview de LinkedIn
                                </button>
                            </div>
                        ))}
                        {ready.length === 0 && <EmptyState text="Nada programado aún" />}
                    </div>
                </div>

            </div>

            {previewPost && (
                <LinkedInPreview
                    post={previewPost}
                    isOpen={!!previewPost}
                    onClose={() => setPreviewPost(null)}
                />
            )}
        </div>
    );
};

const EmptyState = ({ text }: { text: string }) => (
    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
        <p className="text-slate-400 text-sm font-medium">{text}</p>
    </div>
);

export default Dashboard;