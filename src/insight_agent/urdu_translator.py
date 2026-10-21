"""
Bilingual Urdu Support and Translation Engine (اردو ترجمہ).
HackInsight 2026 - Member 3: Insight / RAG Agent & Decision Support.

Provides fluent, natural Urdu translations for:
1. Air quality observations and 24-hour ML forecasts.
2. Punjab Clean Air Action Plan 2023 emergency thresholds & advisories.
3. Health guidance (N95 masks, vulnerable groups, school activity restrictions).
4. System statuses (unsupported cities, out-of-scope, data quality audits).
"""

from typing import Dict, Any, Optional

CITY_NAMES_URDU = {
    "Lahore": "لاہور",
    "Karachi": "کراچی",
    "Islamabad": "اسلام آباد",
    "Peshawar": "پشاور",
    "Quetta": "کوئٹہ",
    "Multan": "ملتان",
    "Faisalabad": "فیصل آباد"
}

AQI_CATEGORIES = {
    "good": {"en": "Good", "ur": "اچھا (Good)", "color": "#00E400"},
    "moderate": {"en": "Moderate", "ur": "معتدل (Moderate)", "color": "#FFFF00"},
    "sensitive": {"en": "Unhealthy for Sensitive Groups", "ur": "حساس افراد کے لیے مضر", "color": "#FF7E00"},
    "unhealthy": {"en": "Unhealthy", "ur": "مضرِ صحت (Unhealthy)", "color": "#FF0000"},
    "very_unhealthy": {"en": "Very Unhealthy", "ur": "انتہائی مضرِ صحت", "color": "#8F3F97"},
    "hazardous": {"en": "Hazardous / Smog Emergency", "ur": "خطرناک / اسموگ ایمرجنسی", "color": "#7E0023"}
}


def get_aqi_category_info(pm25_val: float, lang: str = "en") -> Dict[str, str]:
    """Return AQI category and health advisory in requested language."""
    if pm25_val <= 12.0:
        cat = AQI_CATEGORIES["good"]
        adv_en = "Air quality is satisfactory. Clean air poses minimal or no health risk."
        adv_ur = "ہوا کا معیار تسلی بخش ہے اور صحت کے لیے کوئی خطرہ نہیں ہے۔"
    elif pm25_val <= 35.4:
        cat = AQI_CATEGORIES["moderate"]
        adv_en = "Air quality is acceptable. Concentrations meet Pakistan Ambient Air Quality Standards (35 µg/m³)."
        adv_ur = "ہوا کا معیار قابل قبول ہے اور پاکستان کے قومی ماحولیاتی معیار (35 مائیکرو گرام) کے اندر ہے۔"
    elif pm25_val <= 55.4:
        cat = AQI_CATEGORIES["sensitive"]
        adv_en = "Members of sensitive groups (children, elderly, asthmatics) should limit prolonged outdoor exertion."
        adv_ur = "حساس افراد (بچے، بزرگ اور سانس کے مریض) کھلے آسمان تلے زیادہ وقت گزارنے سے گریز کریں۔"
    elif pm25_val <= 150.4:
        cat = AQI_CATEGORIES["unhealthy"]
        adv_en = "Air quality is unhealthy for everyone. Wear N95 masks outdoors. School outdoor activities should be suspended."
        adv_ur = "ہوا کا معیار تمام شہریوں کے لیے مضر ہے۔ باہر N95 ماسک پہنیں اور اسکولوں میں بیرونی سرگرمیاں معطل کی جائیں۔"
    elif pm25_val <= 250.4:
        cat = AQI_CATEGORIES["very_unhealthy"]
        adv_en = "Health alert: Very unhealthy air. Avoid all non-essential outdoor travel. High risk of respiratory aggravation."
        adv_ur = "ہیلتھ الرٹ: انتہائی مضرِ صحت ہوا! تمام غیر ضروری بیرونی سرگرمیاں فوری ترک کریں۔"
    else:
        cat = AQI_CATEGORIES["hazardous"]
        adv_en = "Emergency conditions! Concentrations exceed Punjab Clean Air Action Plan 2023 emergency limits (150+ µg/m³). Mandatory mask orders, remote schooling, and severe industrial restrictions apply."
        adv_ur = "شدید اسموگ ایمرجنسی! ہوا میں آلودگی پنجاب کلین ایئر ایکشن پلان 2023 کی ہنگامی حد (150 مائیکرو گرام) سے تجاوز کر چکی ہے۔ لازمی ماسک، اسکولوں کی بندش اور صنعتی اخراج پر پابندیاں نافذ ہیں۔"

    return {
        "category": cat["ur"] if lang == "ur" else cat["en"],
        "advisory": adv_ur if lang == "ur" else adv_en,
        "color": cat["color"]
    }


def translate_to_urdu(english_answer: str, evidence_dict: Dict[str, Any], city: Optional[str] = None) -> str:
    """
    Synthesize high-fidelity, natural Urdu translation grounded strictly in evidence.
    """
    ur_parts = []
    c_name = CITY_NAMES_URDU.get(city, city or "شہر")

    # Unsupported or out of scope handling
    if "is not currently supported" in english_answer:
        return f"معذرت، میں نہیں جانتا۔ {c_name} فی الوقت ہمارے سینسر نیٹ ورک اور ڈیٹا میں شامل نہیں ہے۔ معاونت شدہ شہر: لاہور اور کراچی ہیں۔"
    if "falls outside the scope" in english_answer:
        return "معذرت، میں نہیں جانتا۔ یہ سوال PM2.5 فضائی معیار، پیشن گوئی اور ڈیٹا کوالٹی کے دائرہ کار سے باہر ہے۔"
    if "Unable to retrieve verified evidence" in english_answer:
        return f"معذرت، میں نہیں جانتا۔ سسٹم ٹولز سے {c_name} کے لیے تصدیق شدہ شواہد حاصل نہیں ہو سکے۔"

    # Current PM2.5
    curr = evidence_dict.get("current_pm25")
    if curr is not None:
        ur_parts.append(f"{c_name} میں PM2.5 کی تازہ ترین مشاہدہ کردہ مقدار {curr} مائیکرو گرام فی مکعب میٹر (µg/m³) ہے۔")

    # 24h Forecast
    fore = evidence_dict.get("forecast_pm25")
    if fore is not None:
        low = evidence_dict.get("forecast_lower_80")
        up = evidence_dict.get("forecast_upper_80")
        base = evidence_dict.get("baseline_persistence")
        fore_txt = f"{c_name} کے لیے آئندہ 24 گھنٹوں کی متوقع PM2.5 مقدار {fore} µg/m³ ہے"
        if low is not None and up is not None:
            fore_txt += f" (80 فیصد پیشگوئی کا تخمینہ: [{low}, {up}] µg/m³"
            if base is not None:
                fore_txt += f"، مسلسل بنیاد: {base} µg/m³"
            fore_txt += ")"
        fore_txt += "۔"
        ur_parts.append(fore_txt)

        # Action Plan Context
        if fore > 150.0:
            ur_parts.append(
                "پنجاب کلین ایئر ایکشن پلان اور اسموگ پالیسی کے تحت آلودگی ہنگامی حد (150 µg/m³) سے تجاوز کر چکی ہے۔ کھلے میدان میں غیر ضروری سرگرمیاں ترک کریں، N95 ماسک لازمی استعمال کریں اور اسکولوں کے اوقات میں احتیاط برتیں۔"
            )
        elif fore > 35.0:
            ur_parts.append(
                "فضائی آلودگی پاکستان کے قومی ماحولیاتی معیار (35 µg/m³) سے زیادہ ہے۔ حساس افراد کو حفاظتی تدابیر اختیار کرنی چاہئیں۔"
            )
        else:
            ur_parts.append("فضائی معیار تسلی بخش اور محفوظ حد کے اندر ہے۔")

    # Model metrics
    mae = evidence_dict.get("model_mae")
    if mae is not None:
        met_txt = f"پیشن گوئی ماڈل کا اوسط ٹیسٹ MAE تقریباً {mae} µg/m³ ہے"
        b_mae = evidence_dict.get("baseline_mae")
        if b_mae is not None:
            met_txt += f" (جو پرانی مسلسل بنیاد {b_mae} µg/m³ سے نمایاں طور پر بہتر ہے)"
        met_txt += "۔"
        ur_parts.append(met_txt)

    # Data Quality
    dq = evidence_dict.get("quality_status")
    if dq:
        ur_parts.append(f"ڈیٹا کے معیار کی تصدیقی حالت: {dq} ہے۔")

    return " ".join(ur_parts) if ur_parts else english_answer
