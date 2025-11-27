import React, { useState } from 'react';
import { WaitlistEntry, Waiter } from '../types';
import { WaitlistCard } from '../components/WaitlistCard';

interface AdminDashboardProps {
  queue: WaitlistEntry[];
  waiters: Waiter[];
  onAddEntry: (entry: Omit<WaitlistEntry, 'id' | 'joinedAt' | 'status'>) => void;
  onSeated: (entryId: string, waiterId: string) => void;
  onCancel: (entryId: string) => void;
  onUpdateWaiters: (waiters: Waiter[]) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  queue, 
  waiters, 
  onAddEntry, 
  onSeated, 
  onCancel,
  onUpdateWaiters
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // New entry state
  const [newName, setNewName] = useState('');
  const [newPax, setNewPax] = useState(2);
  const [newPhone, setNewPhone] = useState('');

  // Waiter Management State
  const [newWaiterName, setNewWaiterName] = useState('');
  const [editingWaiterId, setEditingWaiterId] = useState<string | null>(null);
  const [editWaiterName, setEditWaiterName] = useState('');

  // Stats
  const waitingCount = queue.filter(q => q.status === 'waiting').length;
  const totalServed = queue.filter(q => q.status === 'seated').length;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddEntry({
      customerName: newName,
      partySize: newPax,
      phoneNumber: newPhone || undefined
    });
    setNewName('');
    setNewPax(2);
    setNewPhone('');
    setShowAddModal(false);
  };

  // --- Waiter Logic ---

  const handleAddWaiter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWaiterName.trim()) return;
    
    const newWaiter: Waiter = {
      id: Date.now().toString(),
      name: newWaiterName.trim(),
      isActive: true,
      tablesServed: 0
    };
    
    onUpdateWaiters([...waiters, newWaiter]);
    setNewWaiterName('');
  };

  const startEditing = (waiter: Waiter) => {
    setEditingWaiterId(waiter.id);
    setEditWaiterName(waiter.name);
  };

  const saveEditWaiter = () => {
    if (!editWaiterName.trim()) return;
    const updated = waiters.map(w => 
      w.id === editingWaiterId ? { ...w, name: editWaiterName.trim() } : w
    );
    onUpdateWaiters(updated);
    setEditingWaiterId(null);
    setEditWaiterName('');
  };

  const deleteWaiter = (id: string) => {
    if (confirm('¿Estás seguro de eliminar a este mesero?')) {
      onUpdateWaiters(waiters.filter(w => w.id !== id));
    }
  };

  const toggleWaiterStatus = (id: string) => {
    const updated = waiters.map(w => 
      w.id === id ? { ...w, isActive: !w.isActive } : w
    );
    onUpdateWaiters(updated);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar / Mobile Header */}
      <div className="bg-white md:w-64 border-b md:border-b-0 md:border-r border-gray-200 p-6 flex flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-orange-600 flex items-center gap-2">
            🌮 Admin
          </h1>
          <p className="text-gray-400 text-sm">Panel de Control</p>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setShowSettings(false)}
            className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${!showSettings ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Lista de Espera
          </button>
          <button 
             onClick={() => setShowSettings(true)}
             className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${showSettings ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Configuración Meseros
          </button>
        </nav>

        <div className="mt-auto bg-gray-50 p-4 rounded-xl border border-gray-100">
          <p className="text-xs text-gray-500 uppercase font-bold mb-2">Resumen</p>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">En espera:</span>
            <span className="font-bold text-gray-800">{waitingCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Sentados:</span>
            <span className="font-bold text-green-600">{totalServed}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        
        {!showSettings ? (
          <>
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Fila Actual</h2>
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Registrar Mesa
              </button>
            </div>

            {/* Waiting List Grid */}
            {waitingCount === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                <p className="text-gray-400 text-lg">No hay nadie en la lista de espera.</p>
                <p className="text-gray-300 text-sm mt-1">¡Buen momento para limpiar mesas!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {queue
                  .filter(entry => entry.status === 'waiting')
                  .sort((a, b) => a.joinedAt - b.joinedAt)
                  .map(entry => (
                    <WaitlistCard 
                      key={entry.id}
                      entry={entry}
                      waiters={waiters}
                      onSeated={onSeated}
                      onCancel={onCancel}
                    />
                  ))
                }
              </div>
            )}
          </>
        ) : (
          /* Settings View */
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Gestión de Meseros</h2>
            
            {/* Add Waiter Form */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
              <h3 className="text-sm font-bold text-gray-700 mb-3">Agregar Nuevo Mesero</h3>
              <form onSubmit={handleAddWaiter} className="flex gap-2">
                <input 
                  type="text" 
                  value={newWaiterName}
                  onChange={(e) => setNewWaiterName(e.target.value)}
                  placeholder="Nombre del mesero..."
                  className="flex-1 border rounded-lg px-4 py-2 outline-orange-500"
                />
                <button 
                  type="submit"
                  disabled={!newWaiterName.trim()}
                  className="bg-orange-600 disabled:bg-orange-300 text-white px-6 py-2 rounded-lg font-bold"
                >
                  Agregar
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-12 bg-gray-50 p-4 font-semibold text-gray-500 text-sm">
                <div className="col-span-5">Nombre</div>
                <div className="col-span-3 text-center">Mesas Hoy</div>
                <div className="col-span-4 text-right">Acciones</div>
              </div>
              <div className="divide-y divide-gray-100">
                {waiters.map(waiter => (
                  <div key={waiter.id} className="p-4 grid grid-cols-12 items-center">
                    
                    {/* Name Column (Editable) */}
                    <div className="col-span-5">
                      {editingWaiterId === waiter.id ? (
                        <div className="flex items-center gap-2">
                          <input 
                            value={editWaiterName}
                            onChange={(e) => setEditWaiterName(e.target.value)}
                            className="w-full border rounded px-2 py-1 text-sm outline-orange-500"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <span className="font-medium text-gray-800">{waiter.name}</span>
                      )}
                    </div>

                    {/* Stats Column */}
                    <div className="col-span-3 text-center text-gray-600">{waiter.tablesServed}</div>

                    {/* Actions Column */}
                    <div className="col-span-4 flex justify-end items-center gap-2">
                      {editingWaiterId === waiter.id ? (
                        <>
                          <button onClick={saveEditWaiter} className="text-green-600 hover:bg-green-50 p-1 rounded" title="Guardar">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button onClick={() => setEditingWaiterId(null)} className="text-red-500 hover:bg-red-50 p-1 rounded" title="Cancelar">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                             </svg>
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                             onClick={() => startEditing(waiter)} 
                             className="text-gray-400 hover:text-blue-600 p-1 hover:bg-blue-50 rounded"
                             title="Editar nombre"
                          >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                             </svg>
                          </button>
                          
                          <button 
                            onClick={() => toggleWaiterStatus(waiter.id)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors w-20 text-center ${waiter.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                          >
                            {waiter.isActive ? 'ACTIVO' : 'INACTIVO'}
                          </button>

                          <button 
                             onClick={() => deleteWaiter(waiter.id)}
                             className="text-gray-300 hover:text-red-600 p-1 hover:bg-red-50 rounded"
                             title="Eliminar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                
                {waiters.length === 0 && (
                   <div className="p-8 text-center text-gray-400">
                     No hay meseros registrados.
                   </div>
                )}
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              * El sistema recomendará automáticamente al mesero activo con menos mesas asignadas.
            </p>
          </div>
        )}
      </main>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Registrar Mesa Manual</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nombre</label>
                <input required className="w-full border rounded-lg px-3 py-2 outline-orange-500" value={newName} onChange={e => setNewName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Personas</label>
                <input type="number" min="1" required className="w-full border rounded-lg px-3 py-2 outline-orange-500" value={newPax} onChange={e => setNewPax(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Teléfono (Opcional)</label>
                <input type="tel" className="w-full border rounded-lg px-3 py-2 outline-orange-500" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
              </div>
              <button type="submit" className="w-full bg-orange-600 text-white font-bold py-3 rounded-xl mt-2 hover:bg-orange-700">Agregar a Fila</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};