import React from 'react';

const TriageReportCard = ({ report }) => {
  if (!report) return null;
  let data = {};
  try { data = typeof report === 'string' ? JSON.parse(report) : report; } catch (e) { return null; }

  return (
    <div className="bg-white border-l-4 border-l-orange-500 border border-gray-100 rounded-xl p-5 space-y-4 shadow-sm mt-4">
      <div className="flex items-center gap-2 border-b border-gray-50 pb-3 mb-1">
        <span className="text-xl">🚨</span>
        <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Relatório de Triagem</h4>
      </div>
      <div className="space-y-3 text-sm">
        <div><span className="font-bold text-gray-800 block flex items-center gap-1.5 mb-0.5">👤 Cliente:</span><p className="text-gray-600 pl-1">{data.cliente || 'Identificando...'}</p></div>
        <div><span className="font-bold text-gray-800 block flex items-center gap-1.5 mb-0.5">📂 Tema:</span><p className="text-gray-600 pl-1 bg-gray-100 px-2 py-0.5 rounded inline-block border border-gray-200">{data.tema || 'Geral'}</p></div>
        <div><span className="font-bold text-gray-800 block flex items-center gap-1.5 mb-0.5">📝 Interpretação:</span><p className="text-gray-600 pl-1 text-sm leading-relaxed bg-orange-50/50 p-2 rounded-lg border border-orange-100/50">{data.interpretacao}</p></div>
        {data.sugestao && <div className="bg-blue-50 p-3 rounded-lg border border-blue-100"><span className="font-bold text-blue-800 block flex items-center gap-1.5 mb-1 text-xs">⚖ Sugestão:</span><p className="text-blue-900 text-xs pl-1">{data.sugestao}</p></div>}
      </div>
    </div>
  );
};

export default TriageReportCard;
