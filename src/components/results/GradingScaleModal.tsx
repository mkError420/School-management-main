import React from "react";

interface GradingScaleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GradingScaleModal: React.FC<GradingScaleModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const tiers = [
    { range: "80% - 100%", grade: "A+", gp: "5.00", remark: "Outstanding / Golden", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
    { range: "70% - 79%",  grade: "A",  gp: "4.00", remark: "Excellent",            color: "bg-green-100 text-green-800 border-green-300" },
    { range: "60% - 69%",  grade: "A-", gp: "3.50", remark: "Very Good",            color: "bg-teal-100 text-teal-800 border-teal-300" },
    { range: "50% - 59%",  grade: "B",  gp: "3.00", remark: "Good",                 color: "bg-blue-100 text-blue-800 border-blue-300" },
    { range: "40% - 49%",  grade: "C",  gp: "2.00", remark: "Satisfactory",         color: "bg-amber-100 text-amber-800 border-amber-300" },
    { range: "33% - 39%",  grade: "D",  gp: "1.00", remark: "Passing",              color: "bg-orange-100 text-orange-800 border-orange-300" },
    { range: "00% - 32%",  grade: "F",  gp: "0.00", remark: "Failed",               color: "bg-rose-100 text-rose-800 border-rose-300" },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/80">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </span>
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-base">
              Bangladesh National Curriculum Grading System
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-purple-900 text-white font-semibold">
                  <th className="py-2.5 px-3">Numerical Score</th>
                  <th className="py-2.5 px-3 text-center">Letter Grade</th>
                  <th className="py-2.5 px-3 text-center">Grade Point</th>
                  <th className="py-2.5 px-3">Performance Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-800 dark:text-gray-200">
                {tiers.map((t) => (
                  <tr key={t.grade} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-2 px-3 font-semibold">{t.range}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${t.color}`}>
                        {t.grade}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center font-bold">{t.gp}</td>
                    <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{t.remark}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-purple-50 dark:bg-purple-950/30 p-3.5 rounded-xl border border-purple-200 dark:border-purple-800 space-y-2 text-gray-700 dark:text-gray-300">
            <h4 className="font-bold text-purple-950 dark:text-purple-300 text-xs uppercase tracking-wider">
              Key Evaluation Rules:
            </h4>
            <ul className="list-disc list-inside space-y-1 text-[11px]">
              <li>
                <strong>Fail Condition:</strong> A score below 33% in any compulsory subject is graded <strong>&quot;F&quot; (0.00 GP)</strong>. If a student receives an &quot;F&quot; in any subject, their overall GPA becomes <strong>0.00</strong> and final result is <strong>FAILED</strong>.
              </li>
              <li>
                <strong>Overall GPA Calculation:</strong> GPA = Total Grade Points earned in all subjects &divide; Total number of subjects (rounded to 2 decimal places, maximum 5.00).
              </li>
              <li>
                <strong>Golden A+:</strong> A student who secures an <strong>A+ (5.00) in all individual subjects</strong> achieves the prestigious Golden A+.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};

export default GradingScaleModal;
