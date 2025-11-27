import React, { useState, useEffect } from 'react';
import { WaitlistEntry } from '../types';
import { TimeTracker } from '../components/TimeTracker';

interface PublicViewProps {
  onJoin: (entry: Omit<WaitlistEntry, 'id' | 'joinedAt' | 'status'>) => Promise<string>; // Returns Promise now
  queue: WaitlistEntry[];
  onCancel: (id: string) => void;
}

export const PublicView: React.FC<PublicViewProps> = ({ onJoin, queue, onCancel }) => {
  // Local state for form
  const [name, setName] = useState('');
  const [pax, setPax] = useState(2);
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for recovery
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [recoveryError, setRecoveryError] = useState('');

  // UI State
  const [isConfirmingExit, setIsConfirmingExit] = useState(false);

  // Persistent User State
  const [myId, setMyId] = useState<string | null>(() => localStorage.getItem('taco_queue_id'));

  useEffect(() => {
    if (myId) {
      localStorage.setItem('taco_queue_id', myId);
    } else {
      localStorage.removeItem('taco_queue_id');
    }
  }, [myId]);

  // Derived state
  const myEntry = queue.find(q => q.id === myId);
  const waitingQueue = queue.filter(q => q.status === 'waiting').sort((a, b) => a.joinedAt - b.joinedAt);
  const myPosition = myEntry ? waitingQueue.findIndex(q => q.id === myEntry.id) : -1;
  const groupsAhead = myPosition; 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || pax < 1) return;

    setIsSubmitting(true);
    try {
      const newId = await onJoin({
        customerName: name,
        partySize: pax,
        phoneNumber: phone || undefined
      });
      setMyId(newId);
    } catch (e) {
      alert("Error al unirse a la fila. Intente de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    const found = [...queue]
      .reverse()
      .find(q => q.phoneNumber === recoveryPhone && q.status === 'waiting');

    if (found) {
      setMyId(found.id);
      setShowRecovery(false);
      setRecoveryError('');
    } else {
      setRecoveryError('No encontramos una reserva activa con ese número.');
    }
  };

  const handleLeaveQueue = () => {
    if (myId) {
      onCancel(myId);
      setMyId(null);
      setName('');
      setPhone('');
      setIsConfirmingExit(false);
    }
  };

  // ---------------------------------------------------------
  // RENDER: TICKET STATUS VIEW (If user has an ID)
  // ---------------------------------------------------------
  if (myId && myEntry) {
    if (myEntry.status === 'cancelled') {
      return (
        <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full">
            <div className="text-red-600 mb-4 text-5xl">✕</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Reserva Cancelada</h2>
            <p className="text-gray-600 mb-6">Tu lugar en la fila ha sido cancelado.</p>
            <button onClick={() => setMyId(null)} className="text-red-600 font-bold hover:underline">Volver al inicio</button>
          </div>
        </div>
      );
    }

    if (myEntry.status === 'seated') {
      return (
        <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full border-t-4 border-green-500">
             <div className="text-5xl mb-4">🌶️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">¡A comer!</h2>
            <p className="text-gray-600 mb-6">Tu mesa ya fue asignada. ¡Disfruta los tacos!</p>
            <button onClick={() => setMyId(null)} className="text-green-600 font-bold hover:underline">Finalizar</button>
          </div>
        </div>
      );
    }

    // WAITING STATUS
    return (
      <div className="min-h-screen bg-red-600 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative">
          {/* Status Header */}
          <div className="bg-red-700 p-6 text-center text-white">
            <h2 className="text-2xl font-bold">Tu Turno Digital</h2>
            <p className="opacity-90 text-sm mt-1">Hola, {myEntry.customerName}</p>
          </div>

          <div className="p-8 text-center">
            {/* Big Number Display */}
            <div className="mb-8">
              {myPosition === 0 ? (
                <div className="animate-bounce">
                  <p className="text-green-600 font-bold text-xl mb-2">¡Eres el siguiente!</p>
                  <p className="text-gray-500 text-sm">Acércate al mostrador.</p>
                </div>
              ) : (
                <>
                  <p className="text-gray-500 text-sm uppercase font-bold tracking-wider mb-2">Grupos delante de ti</p>
                  <p className="text-6xl font-black text-gray-800">{groupsAhead}</p>
                </>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-red-50 p-3 rounded-xl">
                <p className="text-xs text-red-600 font-bold uppercase mb-1">Tiempo en fila</p>
                <TimeTracker startTime={myEntry.joinedAt} />
              </div>
              <div className="bg-red-50 p-3 rounded-xl">
                <p className="text-xs text-red-600 font-bold uppercase mb-1">Mesa para</p>
                <p className="font-bold text-gray-800">{myEntry.partySize} personas</p>
              </div>
            </div>

            <div className="text-xs text-gray-400 mb-6">
              Esta pantalla se actualiza automáticamente. No la cierres si es posible.
            </div>

            {isConfirmingExit ? (
              <div className="bg-red-50 p-4 rounded-xl border border-red-100 animate-pulse">
                <p className="text-sm text-red-800 font-bold mb-3">¿Seguro que quieres salir?</p>
                <p className="text-xs text-red-600 mb-3">Perderás tu lugar en la fila.</p>
                <div className="flex gap-2 justify-center">
                  <button 
                    onClick={handleLeaveQueue} 
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-bold transition-colors"
                  >
                    Sí, salir
                  </button>
                  <button 
                    onClick={() => setIsConfirmingExit(false)} 
                    className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-3 py-2 rounded-lg text-sm font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsConfirmingExit(true)}
                className="text-red-500 text-sm font-medium hover:bg-red-50 px-4 py-2 rounded-lg transition-colors border border-transparent hover:border-red-100"
              >
                Salir de la fila
              </button>
            )}
          </div>
        </div>
        <p className="text-white/60 text-xs mt-6 text-center max-w-xs">
          Guarda esta página o mantén la pestaña abierta para ver tu progreso.
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------
  // RENDER: RECOVERY FORM
  // ---------------------------------------------------------
  if (showRecovery) {
    return (
      <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Recuperar Turno</h2>
          <p className="text-gray-600 text-sm mb-4">Ingresa el teléfono con el que te registraste.</p>
          
          <form onSubmit={handleRecovery}>
            <input
              type="tel"
              value={recoveryPhone}
              onChange={(e) => setRecoveryPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 mb-2 focus:outline-red-500"
              placeholder="Tu teléfono"
              autoFocus
            />
            {recoveryError && <p className="text-red-600 text-xs mb-3">{recoveryError}</p>}
            
            <button
              type="submit"
              className="w-full bg-red-600 text-white font-bold py-3 rounded-xl mb-2 hover:bg-red-700 transition-colors"
            >
              Buscar
            </button>
            <button
              type="button"
              onClick={() => setShowRecovery(false)}
              className="w-full text-gray-500 py-2"
            >
              Cancelar
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // RENDER: REGISTRATION FORM (Default)
  // ---------------------------------------------------------
  return (
    <div className="min-h-screen bg-red-600 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-white mb-2 drop-shadow-md flex items-center justify-center gap-2">
           <span className="text-5xl">🌶️</span> Tacos el toreado
        </h1>
        <p className="text-red-100 font-medium">Lista de Espera Digital</p>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-red-50 p-6 border-b border-red-100 text-center">
          <p className="text-gray-600 text-sm">Escanea el QR o completa este formulario para tu mesa.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
              placeholder="Ej. Juan Pérez"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Número de Comensales</label>
            <div className="flex items-center gap-4">
               <button 
                 type="button" 
                 onClick={() => setPax(Math.max(1, pax - 1))}
                 className="w-12 h-12 rounded-xl bg-red-100 text-red-600 font-bold text-xl hover:bg-red-200"
               >-</button>
               <div className="flex-1 text-center text-2xl font-bold text-gray-800">{pax}</div>
               <button 
                 type="button" 
                 onClick={() => setPax(pax + 1)}
                 className="w-12 h-12 rounded-xl bg-red-100 text-red-600 font-bold text-xl hover:bg-red-200"
               >+</button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Teléfono <span className="text-gray-400 font-normal">(Opcional para SMS)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
              placeholder="55 1234 5678"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-200 transition-transform active:scale-95 text-lg disabled:opacity-50"
          >
            {isSubmitting ? 'Registrando...' : 'Unirme a la Fila'}
          </button>

          <div className="text-center pt-2">
            <button 
              type="button"
              onClick={() => setShowRecovery(true)}
              className="text-sm text-gray-400 hover:text-red-600 underline decoration-dotted"
            >
              Ya estoy en la lista, ver mi turno
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};