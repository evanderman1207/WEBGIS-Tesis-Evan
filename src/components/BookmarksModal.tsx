import React, { useState, useEffect } from 'react';
import { X, Bookmark, Plus, Eye, CheckCircle2 } from 'lucide-react';
import { SpatialBookmark } from '../types/spatial.ts';

interface BookmarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: { center: [number, number]; zoom: number; activeLayers: string[] };
  onJumpToView: (lon: number, lat: number, zoom: number) => void;
}

export const BookmarksModal: React.FC<BookmarksModalProps> = ({
  isOpen,
  onClose,
  currentView,
  onJumpToView,
}) => {
  const [bookmarks, setBookmarks] = useState<SpatialBookmark[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchBookmarks = () => {
    setLoading(true);
    fetch('/api/spatial/bookmarks')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setBookmarks(data);
      })
      .catch((err) => console.error('Failed to fetch bookmarks:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      fetchBookmarks();
    }
  }, [isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/spatial/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          notes,
          centerLon: currentView.center[0],
          centerLat: currentView.center[1],
          zoom: currentView.zoom,
          activeLayers: currentView.activeLayers,
        }),
      });

      if (res.ok) {
        setTitle('');
        setNotes('');
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
        fetchBookmarks();
      }
    } catch (err) {
      console.error('Failed to save bookmark:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800/80">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Titik Tinjau Spasial (Bookmarks)</h3>
              <p className="text-xs text-slate-400">
                Simpan dan kelola sudut pandang analisis tersimpan di PostgreSQL
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs custom-scrollbar">
          <form onSubmit={handleSave} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
            <span className="font-semibold text-white block text-xs flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-sky-400" />
              <span>Simpan Posisi Tampilan Peta Saat Ini</span>
            </span>

            <div className="text-[11px] font-mono text-slate-400 bg-slate-900 p-2 rounded border border-slate-800 flex justify-between">
              <span>Bujur: {currentView.center[0].toFixed(4)}°E</span>
              <span>Lintang: {currentView.center[1].toFixed(4)}°S</span>
              <span>Zoom: {Math.round(currentView.zoom)}</span>
            </div>

            <input
              type="text"
              placeholder="Nama Tinjauan (misal: Kawasan Kumuh Baamang)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              required
            />

            <textarea
              placeholder="Catatan analisis spasial atau observasi lapangan (opsional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
            />

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-lg transition flex items-center justify-center gap-1.5 shadow"
            >
              <span>{isSaving ? 'Menyimpan ke Database...' : 'Simpan ke PostgreSQL'}</span>
            </button>

            {savedSuccess && (
              <p className="text-emerald-400 text-center flex items-center justify-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Titik tinjau berhasil disimpan!</span>
              </p>
            )}
          </form>

          <div className="space-y-2">
            <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider block">
              Daftar Titik Tinjau Tersimpan ({bookmarks.length})
            </span>

            {loading ? (
              <div className="p-4 text-center text-slate-500">Memuat...</div>
            ) : bookmarks.length === 0 ? (
              <div className="p-6 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                Belum ada titik tinjau tersimpan. Geser peta ke lokasi menarik dan simpan formulir di atas.
              </div>
            ) : (
              bookmarks.map((b) => (
                <div
                  key={b.id}
                  className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between gap-2"
                >
                  <div className="space-y-0.5 flex-1">
                    <h4 className="font-bold text-slate-200 text-xs">{b.title}</h4>
                    {b.notes && <p className="text-[11px] text-slate-400 line-clamp-1">{b.notes}</p>}
                    <span className="text-[10px] font-mono text-slate-500 block">
                      {b.centerLon.toFixed(3)}°E, {b.centerLat.toFixed(3)}°S (Zoom {Math.round(b.zoom)})
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      onJumpToView(b.centerLon, b.centerLat, b.zoom);
                      onClose();
                    }}
                    className="p-2 rounded-lg bg-sky-950 text-sky-400 border border-sky-800/80 hover:bg-sky-900 transition flex items-center gap-1 font-medium text-[11px]"
                    title="Arahkan Peta ke Titik Ini"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lihat</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-3 border-t border-slate-800 bg-slate-950/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
