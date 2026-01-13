import os
import subprocess
import sys
import shutil

def build():
    print("--- بدء عملية بناء ملف EXE لتطبيق إزالة الخلفية ---")
    
    # التحقق من وجود PyInstaller
    try:
        import PyInstaller
    except ImportError:
        print("جاري تثبيت PyInstaller...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller"])

    # في ويندوز، نستخدم ; للفصل بين المسار المصدر والمسار الهدف في --add-data
    separator = ";" if os.name == "nt" else ":"
    
    cmd = [
        "pyinstaller",
        "--onefile",
        "--noconsole",  # إخفاء نافذة CMD السوداء
        # Hidden imports للمكتبات المطلوبة
        "--hidden-import=rembg",
        "--hidden-import=onnxruntime",
        "--hidden-import=uvicorn",
        "--hidden-import=uvicorn.logging",
        "--hidden-import=uvicorn.lifespan",
        "--hidden-import=uvicorn.lifespan.on",
        "--hidden-import=uvicorn.lifespan.off",
        "--hidden-import=uvicorn.protocols",
        "--hidden-import=uvicorn.protocols.http",
        "--hidden-import=uvicorn.protocols.http.auto",
        "--hidden-import=uvicorn.protocols.http.h11_impl",
        "--hidden-import=uvicorn.protocols.http.httptools_impl",
        "--hidden-import=uvicorn.protocols.websockets",
        "--hidden-import=uvicorn.protocols.websockets.auto",
        "--hidden-import=uvicorn.protocols.websockets.websockets_impl",
        "--hidden-import=uvicorn.protocols.websockets.wsproto_impl",
        "--hidden-import=uvicorn.loops",
        "--hidden-import=uvicorn.loops.auto",
        "--hidden-import=uvicorn.loops.asyncio",
        "--hidden-import=fastapi",
        "--hidden-import=starlette",
        "--hidden-import=starlette.routing",
        "--hidden-import=starlette.middleware",
        "--hidden-import=starlette.middleware.cors",
        "--hidden-import=PIL",
        "--hidden-import=PIL.Image",
        "--hidden-import=jinja2",
        "--hidden-import=aiofiles",
        "--hidden-import=python_multipart",
        # تضمين الملفات الثابتة والقوالب
        f"--add-data=templates{separator}templates",
        f"--add-data=static{separator}static",
        "--name=BackgroundRemoverAI",
        "--icon=static/img/favicon.ico" if os.path.exists("static/img/favicon.ico") else "",
        "main.py"
    ]
    
    # إزالة خيار الأيقونة إذا لم توجد
    cmd = [c for c in cmd if c]
    
    print(f"جاري تنفيذ الأمر: {' '.join(cmd)}")
    
    try:
        subprocess.check_call(cmd)
        print("\n" + "="*50)
        print("    ✅ اكتملت العملية بنجاح!")
        print("="*50)
        print(f"\n📁 يمكنك العثور على الملف التنفيذي في:")
        print(f"    dist\\BackgroundRemoverAI.exe")
        print("\n📋 ملاحظات مهمة:")
        print("    - اضغط مرتين على الملف لتشغيله")
        print("    - سيفتح المتصفح تلقائياً")
        print("    - لإغلاق السيرفر، استخدم زر 'إغلاق السيرفر' في الموقع")
        print("="*50)
    except subprocess.CalledProcessError as e:
        print(f"\n❌ حدث خطأ أثناء البناء: {e}")
    except Exception as e:
        print(f"\n❌ حدث خطأ غير متوقع: {e}")

if __name__ == "__main__":
    build()

