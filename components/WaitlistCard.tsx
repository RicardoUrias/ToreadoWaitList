import React, { useState } from 'react';
import { WaitlistEntry, Waiter } from '../types';
import { TimeTracker } from './TimeTracker';
import { generateWelcomeMessage } from '../services/gemini';
import { recommendWaiter } from '../services/storage';

interface WaitlistCardProps {
  entry: WaitlistEntry;
  waiters: Waiter[];
  onSeated: (entryId: string, waiterId: string) => void;
  onCancel: (entryId: string) => void;
}

export const WaitlistCard: React.FC<WaitlistCardProps> = ({ entry, waiters, onSeated, onCancel }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState<string | null>(null);
  
  const recommended = recommendWaiter(waiters);

  const handleNotifyAndSeat = async () => {
    if (!entry.phoneNumber) {
      // Just seat if no phone
      if (recommended) onSeated(entry.id, recommended.id);
      return;
    }

    setIsGenerating(true);
    const waitTime = Math.floor((Date.now() - entry.joinedAt) / 60000);
    const msg = await generateWelcomeMessage(entry.customerName, waitTime);
    setGeneratedMessage(msg);
    setIsGenerating(false);
  };

  const confirmSeat = () => {
    if (recommended) {
      onSeated(entry.id, recommended.id);
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100 flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-gray-800 text-lg">{entry.customerName}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>{entry.partySize} personas</span>
            {entry.phoneNumber && (
               <span className="flex items-center gap-1 ml-2 text-xs bg-gray-100 px-1 rounded">
                 📱 {entry.phoneNumber}
               </span>
            )}
          </div>
        </div>
        <TimeTracker startTime={entry.joinedAt} />
      </div>

      {/* Action Area */}
      {generatedMessage ? (
        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <p className="text-xs text-green-800 font-semibold mb-1">Mensaje Generado (Simulación):</p>
          <p className="text-sm text-gray-700 italic mb-2">"{generatedMessage}"</p>
          <div className="flex gap-2">
            <button 
              onClick={confirmSeat}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded-lg text-sm font-medium transition-colors"
            >
              Enviar y Asignar a {recommended?.name}
            </button>
            <button 
              onClick={() => setGeneratedMessage(null)}
              className="text-gray-500 hover:text-gray-700 text-sm px-2"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 mt-2">
           <button 
            onClick={handleNotifyAndSeat}
            disabled={isGenerating}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {isGenerating ? (
              <span className="animate-pulse">Generando mensaje...</span>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Asignar Mesa
              </>
            )}
          </button>
          <button 
            onClick={() => onCancel(entry.id)}
            className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg border border-red-100 transition-colors"
            title="Cancelar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Recommendation Hint */}
      {recommended && !generatedMessage && (
        <div className="text-xs text-orange-400 font-medium text-center">
          Recomendación: {recommended.name} (Mesas: {recommended.tablesServed})
        </div>
      )}
    </div>
  );
};