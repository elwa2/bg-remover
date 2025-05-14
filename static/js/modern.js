/**
 * Modern JS for 2025 Design - Dark/Light Mode and Subtle Animations
 */

document.addEventListener('DOMContentLoaded', function() {
    // إضافة عناصر الخلفية المتحركة (بشكل خفيف)
    createAnimatedBackground();

    // إضافة زر تبديل الوضع (داكن/فاتح)
    createThemeToggle();

    // تطبيق الوضع المحفوظ
    applyTheme();

    // تحسين مؤشر التحميل
    enhanceLoadingIndicator();

    // إضافة متغير RGB للون الأساسي
    addRgbColorVariables();
});

/**
 * إضافة متغير RGB للون الأساسي
 */
function addRgbColorVariables() {
    // استخراج قيم RGB من اللون الأساسي
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
    const rgbValues = hexToRgb(primaryColor);

    if (rgbValues) {
        document.documentElement.style.setProperty('--primary-color-rgb', `${rgbValues.r}, ${rgbValues.g}, ${rgbValues.b}`);
    }
}

/**
 * تحويل لون Hex إلى RGB
 */
function hexToRgb(hex) {
    // إذا كان اللون بتنسيق #rgb أو #rrggbb
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/**
 * إنشاء خلفية متحركة خفيفة
 */
function createAnimatedBackground() {
    const animatedBg = document.createElement('div');
    animatedBg.className = 'animated-bg';

    // إضافة العناصر المتحركة (Blobs) بشكل خفيف
    for (let i = 0; i < 3; i++) {
        const blob = document.createElement('div');
        blob.className = 'blob';
        animatedBg.appendChild(blob);
    }

    // إضافة الخلفية المتحركة إلى الصفحة
    document.body.appendChild(animatedBg);
}

/**
 * إنشاء زر تبديل الوضع (داكن/فاتح)
 */
function createThemeToggle() {
    const themeToggle = document.createElement('div');
    themeToggle.className = 'theme-toggle';
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    themeToggle.title = 'تبديل الوضع الداكن/الفاتح';

    // إضافة مستمع حدث للنقر
    themeToggle.addEventListener('click', toggleTheme);

    // إضافة زر التبديل إلى الصفحة
    document.body.appendChild(themeToggle);

    // تحديث أيقونة الزر حسب الوضع الحالي
    updateThemeIcon();
}

/**
 * تبديل الوضع بين الداكن والفاتح
 */
function toggleTheme() {
    // الحصول على الوضع الحالي
    const currentTheme = localStorage.getItem('theme') || 'light';

    // تبديل الوضع
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    // حفظ الوضع الجديد
    localStorage.setItem('theme', newTheme);

    // تطبيق الوضع الجديد
    applyTheme();

    // عرض رسالة للمستخدم
    showThemeChangeMessage(newTheme);
}

/**
 * تطبيق الوضع المحفوظ (داكن/فاتح)
 */
function applyTheme() {
    // الحصول على الوضع المحفوظ
    const savedTheme = localStorage.getItem('theme') || 'light';

    // تطبيق السمة على عنصر html
    document.documentElement.setAttribute('data-theme', savedTheme);

    // تحديث أيقونة زر التبديل
    updateThemeIcon();

    // تحديث متغير RGB للون الأساسي
    addRgbColorVariables();
}

/**
 * تحديث أيقونة زر تبديل الوضع
 */
function updateThemeIcon() {
    const themeToggle = document.querySelector('.theme-toggle');
    if (!themeToggle) return;

    const currentTheme = localStorage.getItem('theme') || 'light';

    // تغيير الأيقونة حسب الوضع الحالي
    if (currentTheme === 'dark') {
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

/**
 * عرض رسالة عند تغيير الوضع
 */
function showThemeChangeMessage(theme) {
    // إنشاء عنصر التنبيه
    const alert = document.createElement('div');
    alert.className = `alert alert-info theme-alert`;
    alert.style.position = 'fixed';
    alert.style.top = '60px';
    alert.style.right = '15px';
    alert.style.zIndex = '9999';
    alert.style.maxWidth = '250px';
    alert.style.background = 'var(--bg-card)';
    alert.style.borderRadius = 'var(--border-radius-sm)';
    alert.style.boxShadow = 'var(--shadow-md)';
    alert.style.border = '1px solid var(--border-color)';
    alert.style.opacity = '0';
    alert.style.transform = 'translateY(-10px)';
    alert.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

    // تعيين محتوى التنبيه
    alert.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas fa-${theme === 'dark' ? 'moon' : 'sun'} me-2"></i>
            <span>تم تفعيل الوضع ${theme === 'dark' ? 'الداكن' : 'الفاتح'}</span>
        </div>
    `;

    // إضافة التنبيه إلى الصفحة
    document.body.appendChild(alert);

    // تأخير قصير قبل إظهار التنبيه (للحصول على تأثير انتقالي)
    setTimeout(() => {
        alert.style.opacity = '1';
        alert.style.transform = 'translateY(0)';
    }, 10);

    // إزالة التنبيه بعد 2 ثوانٍ
    setTimeout(() => {
        alert.style.opacity = '0';
        alert.style.transform = 'translateY(-10px)';

        setTimeout(() => {
            alert.remove();
        }, 300);
    }, 2000);
}

/**
 * تحسين مؤشر التحميل
 */
function enhanceLoadingIndicator() {
    const loadingElement = document.getElementById('loading');
    if (!loadingElement) return;

    // إنشاء مؤشر تحميل جديد
    const newLoading = document.createElement('div');
    newLoading.className = 'loading-animation';
    newLoading.innerHTML = `
        <div class="spinner"></div>
        <p class="mt-3">جاري معالجة الصورة، يرجى الانتظار...</p>
    `;

    // استبدال مؤشر التحميل القديم بالجديد
    loadingElement.innerHTML = '';
    loadingElement.appendChild(newLoading);
}
