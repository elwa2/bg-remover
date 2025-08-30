from fastapi import FastAPI, File, UploadFile, Request, HTTPException, BackgroundTasks
from fastapi.responses import HTMLResponse, StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from rembg import remove
from PIL import Image
import io
import os
import uuid
import shutil
import uvicorn
import random
import logging
import traceback
import asyncio
import time
from datetime import datetime

# إعداد التسجيل
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# إنشاء مجلد للملفات المؤقتة إذا لم يكن موجوداً
os.makedirs("temp", exist_ok=True)

app = FastAPI(title="تطبيق إزالة خلفية الصور")

# إضافة CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# تكوين الملفات الثابتة والقوالب
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# قائمة الآيات القرآنية والأذكار
quran_verses = [
    "﴿وَاللَّهُ يَرْزُقُ مَن يَشَاءُ بِغَيْرِ حِسَابٍ﴾ [البقرة: 212]",
    "﴿رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ﴾ [البقرة: 201]",
    "﴿حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ﴾ [آل عمران: 173]",
    "﴿رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً إِنَّكَ أَنتَ الْوَهَّابُ﴾ [آل عمران: 8]",
    "﴿اللَّهُمَّ مَالِكَ الْمُلْكِ تُؤْتِي الْمُلْكَ مَن تَشَاءُ وَتَنزِعُ الْمُلْكَ مِمَّن تَشَاءُ﴾ [آل عمران: 26]"
]

morning_azkar = [
    "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لاَ إِلَٰهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيكَ لَهُ",
    "اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ هَذَا الْيَوْمِ: فَتْحَهُ، وَنَصْرَهُ، وَنُورَهُ، وَبَرَكَتَهُ، وَهُدَاهُ",
    "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ"
]

evening_azkar = [
    "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لاَ إِلَٰهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيكَ لَهُ",
    "اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ هَذِهِ اللَّيْلَةِ: فَتْحَهَا، وَنَصْرَهَا، وَنُورَهَا، وَبَرَكَتَهَا، وَهُدَاهَا",
    "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ"
]

hadith = [
    "قال رسول الله ﷺ: «مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ»",
    "قال رسول الله ﷺ: «الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ»",
    "قال رسول الله ﷺ: «إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى»"
]

# الصفحة الرئيسية
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    logger.info("طلب الصفحة الرئيسية")

    # اختيار ذكر عشوائي حسب الوقت
    current_datetime = datetime.now()
    current_hour = current_datetime.hour

    if 5 <= current_hour < 18:  # من الصباح حتى المساء
        azkar_list = morning_azkar
        logger.info("تم اختيار أذكار الصباح")
    else:  # من المساء حتى الصباح
        azkar_list = evening_azkar
        logger.info("تم اختيار أذكار المساء")

    # اختيار نص عشوائي من الآيات أو الأحاديث أو الأذكار
    all_texts = quran_verses + hadith + azkar_list
    random_text = random.choice(all_texts)
    logger.info(f"تم اختيار النص: {random_text[:30]}...")

    # إعداد بيانات القالب
    template_data = {
        "request": request,
        "random_text": random_text,
        "current_year": current_datetime.year
    }

    return templates.TemplateResponse("index.html", template_data)

# دالة لحذف الملفات المؤقتة في الخلفية
def cleanup_file(path: str):
    try:
        # الانتظار لمدة 15 دقيقة قبل الحذف
        time.sleep(900)
        os.remove(path)
        logger.info(f"تم حذف الملف المؤقت: {path}")
    except Exception as e:
        logger.error(f"فشل في حذف الملف المؤقت {path}: {e}")

# واجهة برمجة التطبيق لإزالة خلفية الصورة
@app.post("/remove-bg/")
async def remove_bg(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    logger.info(f"تم استلام طلب لإزالة خلفية صورة: {file.filename}")

    # التحقق من نوع الملف
    if not file.content_type.startswith("image/"):
        logger.warning(f"نوع ملف غير صالح: {file.content_type}")
        raise HTTPException(status_code=400, detail="يرجى رفع ملف صورة فقط")

    try:
        # قراءة الصورة
        logger.info("جاري قراءة بيانات الصورة...")
        input_image_data = await file.read()

        # التحقق من حجم الصورة
        if len(input_image_data) > 10 * 1024 * 1024:  # 10 ميجابايت كحد أقصى
            logger.warning(f"حجم الصورة كبير جداً: {len(input_image_data) / (1024 * 1024):.2f} MB")
            raise HTTPException(status_code=400, detail="حجم الصورة كبير جداً. الحد الأقصى هو 10 ميجابايت")

        # إزالة الخلفية باستخدام rembg في thread منفصل لتجنب حظر الخادم
        logger.info("جاري إزالة خلفية الصورة...")
        try:
            output_image_data = await asyncio.to_thread(remove, input_image_data)
        except Exception as e:
            logger.error(f"خطأ في مكتبة rembg: {str(e)}")
            logger.error(traceback.format_exc())
            raise HTTPException(status_code=500, detail=f"خطأ في معالجة الصورة: {str(e)}")

        # إنشاء اسم فريد للملف
        filename = f"{uuid.uuid4()}.png"
        output_path = os.path.join("temp", filename)
        logger.info(f"جاري حفظ الصورة المعالجة في: {output_path}")

        # حفظ الصورة المعالجة
        try:
            with open(output_path, "wb") as f:
                f.write(output_image_data)
        except Exception as e:
            logger.error(f"خطأ في حفظ الصورة: {str(e)}")
            logger.error(traceback.format_exc())
            raise HTTPException(status_code=500, detail=f"خطأ في حفظ الصورة: {str(e)}")

        # إضافة مهمة في الخلفية لحذف الملف بعد فترة
        background_tasks.add_task(cleanup_file, output_path)
        logger.info(f"تمت جدولة حذف الملف {output_path} بعد 15 دقيقة")

        # إرجاع الصورة المعالجة
        logger.info(f"تمت معالجة الصورة بنجاح: {filename}")
        return {"filename": filename}
    except HTTPException:
        # إعادة رفع استثناءات HTTP كما هي
        raise
    except Exception as e:
        # تسجيل الخطأ وإرجاع رسالة خطأ عامة
        logger.error(f"خطأ غير متوقع: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"حدث خطأ أثناء معالجة الصورة: {str(e)}")

# الحصول على الصورة المعالجة
@app.get("/processed-image/{filename}")
async def get_processed_image(filename: str):
    logger.info(f"طلب الحصول على الصورة المعالجة: {filename}")

    # التحقق من صحة اسم الملف (منع الوصول إلى الملفات خارج المجلد)
    if ".." in filename or "/" in filename or "\\" in filename:
        logger.warning(f"محاولة وصول غير آمنة: {filename}")
        raise HTTPException(status_code=400, detail="اسم ملف غير صالح")

    file_path = os.path.join("temp", filename)
    logger.info(f"مسار الملف: {file_path}")

    if not os.path.exists(file_path):
        logger.warning(f"الملف غير موجود: {file_path}")
        raise HTTPException(status_code=404, detail="الملف غير موجود")

    try:
        return FileResponse(file_path)
    except Exception as e:
        logger.error(f"خطأ في إرجاع الملف: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"خطأ في قراءة الملف: {str(e)}")

# تنظيف الملفات المؤقتة (يمكن تشغيلها بشكل دوري)
@app.get("/cleanup/")
async def cleanup_temp_files():
    logger.info("بدء تنظيف الملفات المؤقتة")
    try:
        count = 0
        for filename in os.listdir("temp"):
            file_path = os.path.join("temp", filename)
            # حذف الملفات
            if os.path.isfile(file_path):
                try:
                    os.remove(file_path)
                    count += 1
                    logger.info(f"تم حذف الملف: {file_path}")
                except Exception as e:
                    logger.error(f"فشل في حذف الملف {file_path}: {str(e)}")

        logger.info(f"تم تنظيف {count} ملف بنجاح")
        return {"message": f"تم تنظيف {count} ملف بنجاح"}
    except Exception as e:
        logger.error(f"خطأ أثناء تنظيف الملفات: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"حدث خطأ أثناء تنظيف الملفات: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
