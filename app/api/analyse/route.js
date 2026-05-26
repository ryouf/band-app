import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const RISK_TERMS = {
  "without notice": 20, "بدون إشعار": 20, "دون إشعار": 20,
  "full liability": 25, "المسؤولية الكاملة": 25,
  "non-refundable": 15, "غير قابل للاسترداد": 15,
  "terminate at any time": 25, "إنهاء في أي وقت": 25, "إنهاء العقد في أي وقت": 25,
  "unlimited compensation": 20, "تعويض غير محدد": 20, "تعويض غير مقيد": 20,
  "waive rights": 30, "التنازل عن الحقوق": 30,
  "exclusive jurisdiction": 15, "اختصاص حصري": 15,
  "unilateral": 20, "انفرادي": 20, "منفرد": 15,
  "no compensation": 25, "دون تعويض": 25, "بدون تعويض": 25,
  "10 years": 10, "عشر سنوات": 10,
  "60 days": 10, "ستين يوماً": 10, "ستون يوم": 10,
};

const SAUDI_LAW_REFS = {
  termination: "نظام العمل السعودي — المادة ٧٤: يجب تحديد مدة إشعار مسبق لإنهاء العقد",
  compensation: "نظام العمل السعودي — المادة ٨٠: حق الموظف في التعويض عند الإنهاء التعسفي",
  confidentiality: "نظام التجارة الإلكترونية السعودي — المادة ١٥: ضوابط بنود السرية",
  ip: "نظام الملكية الفكرية السعودي — المادة ٤: حقوق المؤلف والإبداع",
  payment: "نظام المحكمة التجارية السعودية: يُعتبر التأخير فوق ٣٠ يوماً إخلالاً تجارياً",
  jurisdiction: "نظام التحكيم السعودي — المادة ٩: حق الطرفين في اختيار جهة التحكيم",
};

function keywordRiskScore(text) {
  let penalty = 0;
  const found = [];
  const lowerText = text.toLowerCase();
  for (const [term, score] of Object.entries(RISK_TERMS)) {
    if (lowerText.includes(term.toLowerCase())) {
      penalty += score;
      found.push(term);
    }
  }
  return { penalty: Math.min(penalty, 40), found };
}

function getSaudiRef(clauseText) {
  const t = clauseText.toLowerCase();
  if (t.includes("إنهاء") || t.includes("termination")) return SAUDI_LAW_REFS.termination;
  if (t.includes("تعويض") || t.includes("compensation")) return SAUDI_LAW_REFS.compensation;
  if (t.includes("سرية") || t.includes("confidential")) return SAUDI_LAW_REFS.confidentiality;
  if (t.includes("ملكية فكرية") || t.includes("intellectual")) return SAUDI_LAW_REFS.ip;
  if (t.includes("دفع") || t.includes("أتعاب") || t.includes("payment")) return SAUDI_LAW_REFS.payment;
  if (t.includes("اختصاص") || t.includes("محكمة") || t.includes("jurisdiction")) return SAUDI_LAW_REFS.jurisdiction;
  return "مبادئ العدالة التعاقدية في نظام المعاملات المدنية السعودي";
}

export async function POST(request) {
  try {
    const { text } = await request.json();
    if (!text || text.trim().length === 0) {
      return Response.json({ error: "لا يوجد نص للتحليل" }, { status: 400 });
    }

    const { penalty: globalPenalty, found: globalFlags } = keywordRiskScore(text);

    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4000,
      messages: [{
        role: "user",
        content: `أنت محلل قانوني متخصص في القانون السعودي. حلل هذا العقد وأعطني النتيجة بصيغة JSON فقط بدون أي نص إضافي أو markdown.

العقد:
${text}

أعطني JSON بهذا الشكل بالضبط:
{
  "overallRisk": "low" أو "medium" أو "high",
  "overallScore": رقم من 0 إلى 100 (0 = آمن تماماً، 100 = خطير جداً),
  "summary": "ملخص قصير للعقد بالعربية",
  "clauses": [
    {
      "title": "عنوان البند بالعربية",
      "summaryAr": "شرح البند بالعربية بلغة بسيطة",
      "summaryEn": "Clause explanation in simple English",
      "risk": "low" أو "medium" أو "high",
      "riskScore": رقم من 0 إلى 100,
      "riskReason": "سبب تقييم المخاطرة بالتفصيل",
      "isRedFlag": true أو false
    }
  ],
  "topIssues": ["المشكلة الأولى", "المشكلة الثانية", "المشكلة الثالثة"]
}`,
      }],
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return Response.json({ error: "خطأ في تحليل الرد" }, { status: 500 });

    const analysis = JSON.parse(jsonMatch[0]);

    // Hybrid: دمج السكور مع الـ keyword penalties
    analysis.overallScore = Math.min(100, analysis.overallScore + globalPenalty);
    if (analysis.overallScore >= 60) analysis.overallRisk = "high";
    else if (analysis.overallScore >= 35) analysis.overallRisk = "medium";
    else analysis.overallRisk = "low";

    // إضافة Saudi Law References لكل بند
    analysis.clauses = analysis.clauses.map((clause) => {
      const { penalty, found } = keywordRiskScore(clause.summaryAr + " " + clause.title);
      const adjustedScore = Math.min(100, (clause.riskScore || 50) + penalty);
      return {
        ...clause,
        riskScore: adjustedScore,
        risk: adjustedScore >= 60 ? "high" : adjustedScore >= 35 ? "medium" : "low",
        saudiLawRef: getSaudiRef(clause.title + " " + clause.summaryAr),
        flaggedTerms: found,
      };
    });

    if (globalFlags.length > 0) {
      analysis.globalFlags = globalFlags;
    }

    return Response.json(analysis);
  } catch (error) {
    console.error("API Error:", error.message);
    return Response.json({ error: "حدث خطأ في التحليل" }, { status: 500 });
  }
}