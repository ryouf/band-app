"use client";
import { useState } from "react";

export default function Home() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [expandedClause, setExpandedClause] = useState(null);
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const riskConfig = {
    high: { bg: "bg-red-50", border: "border-r-red-500", badge: "bg-red-100 text-red-700", label: "مرتفع", dot: "bg-red-500", bar: "bg-red-500", text: "text-red-600" },
    medium: { bg: "bg-amber-50", border: "border-r-amber-400", badge: "bg-amber-100 text-amber-700", label: "متوسط", dot: "bg-amber-400", bar: "bg-amber-400", text: "text-amber-600" },
    low: { bg: "bg-emerald-50", border: "border-r-emerald-400", badge: "bg-emerald-100 text-emerald-700", label: "منخفض", dot: "bg-emerald-500", bar: "bg-emerald-500", text: "text-emerald-600" },
  };

  const handleDrop = async (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) await processFile(file);
  };

  const processFile = async (file) => {
    if (file.type !== "application/pdf") { setError("يرجى رفع ملف PDF فقط"); return; }
    setLoading(true); setError(""); setText(""); setFileName(file.name);
    try {
      const formData = new FormData();
      formData.append("pdf", file);
      const res = await fetch("/api/parse-pdf", { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) { setError(data.error); setFileName(""); } else { setText(data.text); }
    } catch { setError("خطأ في رفع الملف"); setFileName(""); }
    finally { setLoading(false); }
  };

  const handleAnalyse = async () => {
    if (!text.trim()) { setError("يرجى إدخال نص العقد أو رفع ملف"); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); } else { setResult(data); }
    } catch { setError("حدث خطأ في الاتصال"); }
    finally { setLoading(false); }
  };

  const highCount = result?.clauses?.filter(c => c.risk === "high").length || 0;
  const medCount = result?.clauses?.filter(c => c.risk === "medium").length || 0;
  const lowCount = result?.clauses?.filter(c => c.risk === "low").length || 0;

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100">

      {/* Header */}
      <header className="bg-[#0a1628] border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-5 flex justify-start">
          <span className="text-white font-bold text-xl tracking-wide">band</span>
          <span className="text-red-400 font-bold text-xl">.</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">

        {/* Input Screen */}
        {!result && !loading && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-slate-800 mb-3">
                العقود مليانة مخاطر خفية — نكشفها لك قبل التوقيع
                </h1>
              <p className="text-slate-500 text-sm leading-relaxed max-w-md mx-auto">
               مساعدك الذكي لتحليل العقود واكتشاف المخاطر القانونية 
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                className={`relative border-b border-slate-100 transition-all ${dragOver ? "bg-blue-50" : "bg-slate-50"}`}
              >
                <label className="flex flex-col items-center justify-center p-10 cursor-pointer">
                  {fileName ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">✅</span>
                      </div>
                      <p className="text-emerald-700 font-medium text-sm">{fileName}</p>
                      <p className="text-slate-400 text-xs">تم رفع الملف — انقر تحليل العقد</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${dragOver ? "bg-blue-100" : "bg-white border-2 border-dashed border-slate-200"}`}>
                        <span className="text-2xl">{dragOver ? "⬇️" : "📄"}</span>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-600 text-sm font-medium">اسحب ملف PDF هنا</p>
                        <p className="text-slate-400 text-xs mt-1">أو <span className="text-blue-500 underline">انقر للرفع</span> — حد أقصى ٥ صفحات</p>
                      </div>
                    </div>
                  )}
                  <input type="file" accept=".pdf" className="hidden" onChange={(e) => processFile(e.target.files[0])} />
                </label>
              </div>

              <div className="px-6 pb-6 pt-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-slate-100" />
                  <span className="text-slate-300 text-xs px-2">أو الصق النص مباشرة</span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>

                <textarea
                  value={text}
                  onChange={(e) => { setText(e.target.value); setFileName(""); }}
                  placeholder="الصق نص العقد هنا..."
                  className="w-full h-40 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-800 placeholder-slate-300 resize-none focus:outline-none focus:ring-2 focus:ring-[#0a1628]/20 focus:border-[#0a1628] transition leading-relaxed"
                  dir="rtl"
                />

                {error && (
                  <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    <span className="text-red-400 text-sm">⚠️</span>
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleAnalyse}
                  disabled={loading || (!text.trim() && !fileName)}
                  className="w-full mt-4 bg-[#0a1628] text-white py-4 rounded-xl font-semibold text-sm hover:bg-[#1a3460] active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <span>تحليل العقد</span>
                  <span className="text-blue-300">←</span>
                </button>

                <p className="text-center text-slate-300 text-xs mt-3">
                  هذا التحليل للاسترشاد فقط وليس استشارة قانونية معتمدة
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {["تقسيم البنود تلقائياً", "مراجع نظام العمل السعودي", "شرح بالعربي والإنجليزي", "درجة مخاطرة لكل بند"].map((f) => (
                <span key={f} className="text-xs text-slate-500 bg-white border border-slate-100 px-3 py-1.5 rounded-full shadow-sm">
                  ✓ {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-[#0a1628] rounded-2xl p-8 mb-5 text-center">
              <div className="flex justify-center mb-4">
                <svg className="animate-spin h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              </div>
              <p className="text-white font-medium mb-1">جارٍ تحليل العقد...</p>
            </div>
            <div className="animate-pulse space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="bg-white rounded-xl p-5 border border-slate-100">
                  <div className="flex justify-between mb-3">
                    <div className="h-4 bg-slate-100 rounded w-32" />
                    <div className="h-5 bg-slate-100 rounded w-16" />
                  </div>
                  <div className="h-3 bg-slate-50 rounded w-full mb-2" />
                  <div className="h-3 bg-slate-50 rounded w-2/3" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-[#0a1628] rounded-2xl p-5">
                <p className="text-slate-400 text-xs mb-2">الدرجة الكلية</p>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className={`text-5xl font-bold ${result.overallScore >= 60 ? "text-red-400" : result.overallScore >= 35 ? "text-amber-400" : "text-emerald-400"}`}>
                    {result.overallScore}
                  </span>
                  <span className="text-slate-500 text-lg">/100</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1.5 mb-3">
                  <div
                    className={`h-1.5 rounded-full transition-all ${result.overallScore >= 60 ? "bg-red-500" : result.overallScore >= 35 ? "bg-amber-400" : "bg-emerald-500"}`}
                    style={{ width: `${result.overallScore}%` }}
                  />
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${riskConfig[result.overallRisk]?.badge}`}>
                  مخاطرة {riskConfig[result.overallRisk]?.label}
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-500">ملخص البنود</p>
                {[
                  { label: "مرتفع الخطورة", count: highCount, color: "bg-red-500" },
                  { label: "متوسط الخطورة", count: medCount, color: "bg-amber-400" },
                  { label: "منخفض الخطورة", count: lowCount, color: "bg-emerald-500" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${s.color}`} />
                      <span className="text-xs text-slate-600">{s.label}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-800">{s.count}</span>
                  </div>
                ))}
              </div>

              {result.topIssues?.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                  <p className="text-xs font-semibold text-red-700 mb-2">⚠️ أبرز المشكلات</p>
                  {result.topIssues.map((issue, i) => (
                    <div key={i} className="flex gap-2 items-start mb-2">
                      <span className="text-red-400 text-xs mt-0.5 flex-shrink-0">•</span>
                      <p className="text-red-700 text-xs leading-relaxed">{issue}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-white border border-slate-100 rounded-2xl p-4">
                <p className="text-xs font-semibold text-slate-500 mb-2">ملخص العقد</p>
                <p className="text-xs text-slate-600 leading-relaxed">{result.summary}</p>
              </div>

              <button
                onClick={() => { setResult(null); setText(""); setFileName(""); setError(""); setExpandedClause(null); }}
                className="w-full text-sm text-slate-500 border border-slate-200 py-2.5 rounded-xl hover:bg-slate-50 transition"
              >
                ← تحليل عقد جديد
              </button>
            </div>

            {/* Clauses */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-slate-700 font-bold text-sm">تفاصيل البنود</h3>
                <span className="text-xs text-slate-400 bg-white border border-slate-100 px-2 py-1 rounded-full">
                  {result.clauses?.length} بند
                </span>
              </div>

              <div className="bg-white rounded-xl border border-slate-100 p-3 mb-2">
                <p className="text-xs text-slate-400 mb-2">خريطة المخاطر</p>
                <div className="flex gap-0.5 h-6 rounded-lg overflow-hidden">
                  {result.clauses?.map((clause, i) => (
                    <div
                      key={i}
                      onClick={() => setExpandedClause(i)}
                      className={`flex-1 cursor-pointer hover:opacity-75 transition ${riskConfig[clause.risk]?.bar}`}
                      title={clause.title}
                    />
                  ))}
                </div>
              </div>

              {result.clauses?.map((clause, i) => (
                <div key={i} className={`bg-white rounded-xl border border-slate-100 border-r-4 ${riskConfig[clause.risk]?.border} overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
                  <div className="p-4 cursor-pointer" onClick={() => setExpandedClause(expandedClause === i ? null : i)}>
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${riskConfig[clause.risk]?.dot}`} />
                          <p className="font-semibold text-slate-800 text-sm truncate">{clause.title}</p>
                        </div>
                        <p className="text-slate-500 text-xs leading-relaxed">{clause.summaryAr}</p>
                        <p className="text-slate-300 text-xs mt-1 leading-relaxed italic">{clause.summaryEn}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${riskConfig[clause.risk]?.badge}`}>
                          {riskConfig[clause.risk]?.label}
                        </span>
                        {clause.riskScore && (
                          <span className={`text-xs font-bold ${riskConfig[clause.risk]?.text}`}>
                            {clause.riskScore}/100
                          </span>
                        )}
                      </div>
                    </div>

                    {clause.isRedFlag && (
                      <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                        <span className="text-red-500 text-xs flex-shrink-0 mt-0.5">🚩</span>
                        <span className="text-red-600 text-xs leading-relaxed">{clause.riskReason}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-slate-300 text-xs">
                        {expandedClause === i ? "▲ إخفاء" : "▼ الشرح القانوني الكامل"}
                      </span>
                      {clause.saudiLawRef && (
                        <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 truncate max-w-[180px]">
                          ⚖️ {clause.saudiLawRef.split("—")[0]}
                        </span>
                      )}
                    </div>
                  </div>

                  {expandedClause === i && (
                    <div className="border-t border-slate-50 bg-slate-50 px-4 py-4 space-y-3">
                      <div className="bg-white rounded-xl p-3 border border-slate-100">
                        <p className="text-xs font-semibold text-slate-700 mb-1.5">لماذا هذا البند خطر؟</p>
                        <p className="text-xs text-slate-600 leading-relaxed">{clause.riskReason}</p>
                      </div>

                      {clause.flaggedTerms?.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-400 mb-1.5">كلمات خطرة مكتشفة:</p>
                          <div className="flex flex-wrap gap-1">
                            {clause.flaggedTerms.map((term, t) => (
                              <span key={t} className="text-xs bg-red-50 text-red-500 border border-red-100 px-2 py-0.5 rounded-full">{term}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                        <p className="text-xs font-semibold text-blue-700 mb-1.5">⚖️ السياق القانوني السعودي</p>
                        <p className="text-xs text-blue-600 leading-relaxed">{clause.saudiLawRef}</p>
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={() => navigator.clipboard.writeText(`${clause.title}\n\n${clause.riskReason}\n\n${clause.saudiLawRef}`)}
                          className="text-xs text-slate-400 border border-slate-200 bg-white px-3 py-1.5 rounded-lg hover:bg-slate-50 transition flex items-center gap-1"
                        >
                          📋 نسخ الشرح
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}