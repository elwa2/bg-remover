document.addEventListener('DOMContentLoaded', function() {
    // العناصر الرئيسية
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const uploadArea = document.getElementById('upload-area');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const originalImage = document.getElementById('original-image');
    const resultImage = document.getElementById('result-image');
    const resultPlaceholder = document.getElementById('result-placeholder');
    const removeBgBtn = document.getElementById('remove-bg-btn');
    const downloadBtn = document.getElementById('download-btn');
    const resetBtn = document.getElementById('reset-btn');
    const loading = document.getElementById('loading');

    // متغيرات عامة
    let selectedFile = null;
    let processedImageFilename = null;
    let isProcessing = false;

    // إضافة مستمعي الأحداث
    browseBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    dropArea.addEventListener('dragover', handleDragOver);
    dropArea.addEventListener('dragleave', handleDragLeave);
    dropArea.addEventListener('drop', handleDrop);
    removeBgBtn.addEventListener('click', removeBackground);
    downloadBtn.addEventListener('click', downloadImage);
    resetBtn.addEventListener('click', resetApp);

    // إضافة مستمع لحدث اللصق (Ctrl+V) على مستوى النافذة بأكملها
    window.addEventListener('paste', handlePaste);

    // إضافة رسالة ترحيبية لإخبار المستخدم بميزة اللصق
    console.log('تم تفعيل ميزة اللصق (Ctrl+V) - يمكنك لصق أي صورة من الحافظة في أي وقت');
    showAlert('يمكنك لصق أي صورة من الحافظة باستخدام Ctrl+V في أي وقت', 'info');

    // معالجة اختيار الملف
    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            processSelectedFile(file);
        }
    }

    // معالجة سحب وإفلات الملف
    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.add('dragover');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.remove('dragover');
    }

    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.remove('dragover');

        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            processSelectedFile(file);
        } else {
            showAlert('يرجى اختيار ملف صورة صالح', 'danger');
        }
    }

    // معالجة حدث اللصق (Ctrl+V)
    function handlePaste(e) {
        // التحقق من وجود بيانات في الحافظة
        const clipboardData = e.clipboardData || window.clipboardData || e.originalEvent.clipboardData;

        if (!clipboardData) {
            console.error('لا يمكن الوصول إلى بيانات الحافظة');
            return;
        }

        const items = clipboardData.items;

        console.log('تم اكتشاف حدث لصق، عدد العناصر:', items ? items.length : 0);

        // إذا كان هناك عناصر في الحافظة
        if (items && items.length > 0) {
            let imageFound = false;

            // البحث عن صورة في العناصر
            for (let i = 0; i < items.length; i++) {
                if (items[i].type && items[i].type.indexOf('image') !== -1) {
                    console.log('تم العثور على صورة في الحافظة:', items[i].type);

                    try {
                        // الحصول على الملف من الحافظة
                        const file = items[i].getAsFile();

                        if (file) {
                            // معالجة الملف
                            processSelectedFile(file);
                            imageFound = true;

                            // عرض تنبيه للمستخدم
                            showAlert('تم لصق الصورة بنجاح وجاري معالجتها...', 'success');

                            // منع السلوك الافتراضي للمتصفح
                            e.preventDefault();
                            break;
                        }
                    } catch (error) {
                        console.error('خطأ في معالجة الصورة الملصقة:', error);
                    }
                }
            }

            // إذا لم يتم العثور على صورة
            if (!imageFound) {
                console.log('لم يتم العثور على صورة في الحافظة');
            }
        } else if (clipboardData.files && clipboardData.files.length > 0) {
            // بعض المتصفحات تستخدم خاصية files بدلاً من items
            const file = clipboardData.files[0];

            if (file && file.type && file.type.indexOf('image') !== -1) {
                console.log('تم العثور على صورة في الحافظة (files):', file.type);

                // معالجة الملف
                processSelectedFile(file);

                // عرض تنبيه للمستخدم
                showAlert('تم لصق الصورة بنجاح وجاري معالجتها...', 'success');

                // منع السلوك الافتراضي للمتصفح
                e.preventDefault();
            }
        } else {
            console.log('لا توجد بيانات صورة في الحافظة');
        }
    }

    // معالجة الملف المختار
    function processSelectedFile(file) {
        if (!file.type.startsWith('image/')) {
            showAlert('يرجى اختيار ملف صورة صالح', 'danger');
            return;
        }

        selectedFile = file;

        // عرض الصورة الأصلية
        const reader = new FileReader();
        reader.onload = function(e) {
            originalImage.src = e.target.result;
            uploadArea.classList.add('d-none');
            imagePreviewContainer.classList.remove('d-none');
            resultImage.classList.add('d-none');
            resultPlaceholder.classList.remove('d-none');
            downloadBtn.classList.add('d-none');

            // بدء إزالة الخلفية تلقائياً
            setTimeout(() => {
                removeBackground();
            }, 300);
        };
        reader.readAsDataURL(file);
    }

    // إزالة خلفية الصورة
    async function removeBackground() {
        if (!selectedFile) {
            showAlert('يرجى اختيار صورة أولاً', 'warning');
            return;
        }

        // منع المعالجة المتزامنة
        if (isProcessing) {
            console.log('جاري معالجة صورة أخرى، يرجى الانتظار...');
            return;
        }

        try {
            // تعيين حالة المعالجة
            isProcessing = true;

            // إظهار مؤشر التحميل
            loading.classList.remove('d-none');

            // تعطيل زر إزالة الخلفية
            removeBgBtn.disabled = true;

            // إنشاء نموذج FormData
            const formData = new FormData();
            formData.append('file', selectedFile);

            // إرسال الطلب إلى الخادم
            console.log('جاري إرسال الصورة للمعالجة...');
            const response = await fetch('/remove-bg/', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                // محاولة قراءة رسالة الخطأ من الخادم
                let errorMessage = 'فشل في معالجة الصورة';
                try {
                    const errorData = await response.json();
                    if (errorData && errorData.detail) {
                        errorMessage = errorData.detail;
                    }
                } catch (e) {
                    console.error('خطأ في قراءة رسالة الخطأ:', e);
                }

                console.error(`خطأ من الخادم: ${response.status} - ${errorMessage}`);
                throw new Error(errorMessage);
            }

            console.log('تم استلام الرد من الخادم');
            const data = await response.json();

            if (!data || !data.filename) {
                throw new Error('لم يتم استلام اسم الملف من الخادم');
            }

            processedImageFilename = data.filename;
            console.log(`تم استلام اسم الملف: ${processedImageFilename}`);

            // عرض الصورة المعالجة
            resultImage.src = `/processed-image/${processedImageFilename}`;

            // معالجة حدث تحميل الصورة
            resultImage.onload = function() {
                console.log('تم تحميل الصورة المعالجة بنجاح');
                resultPlaceholder.classList.add('d-none');
                resultImage.classList.remove('d-none');
                downloadBtn.classList.remove('d-none');
                loading.classList.add('d-none');
                removeBgBtn.disabled = false;
                isProcessing = false;
            };

            // معالجة حدث فشل تحميل الصورة
            resultImage.onerror = function() {
                console.error('فشل في تحميل الصورة المعالجة');
                loading.classList.add('d-none');
                showAlert('فشل في تحميل الصورة المعالجة', 'danger');
                removeBgBtn.disabled = false;
                isProcessing = false;
            };

        } catch (error) {
            console.error('Error:', error);
            loading.classList.add('d-none');
            showAlert(error.message || 'حدث خطأ أثناء معالجة الصورة', 'danger');
            removeBgBtn.disabled = false;
            isProcessing = false;
        }
    }

    // تحميل الصورة المعالجة
    function downloadImage() {
        if (!processedImageFilename) {
            showAlert('لا توجد صورة معالجة للتحميل', 'warning');
            return;
        }

        const link = document.createElement('a');
        link.href = `/processed-image/${processedImageFilename}`;
        link.download = 'no-bg-image.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // إعادة تعيين التطبيق
    function resetApp() {
        selectedFile = null;
        processedImageFilename = null;
        isProcessing = false;
        fileInput.value = '';
        originalImage.src = '';
        resultImage.src = '';
        uploadArea.classList.remove('d-none');
        imagePreviewContainer.classList.add('d-none');
        resultImage.classList.add('d-none');
        resultPlaceholder.classList.remove('d-none');
        downloadBtn.classList.add('d-none');
        removeBgBtn.disabled = false;
    }

    // عرض تنبيه
    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        // إضافة التنبيه إلى الصفحة
        const container = document.querySelector('.container');
        container.insertBefore(alertDiv, container.firstChild);

        // إزالة التنبيه تلقائياً بعد 5 ثوانٍ
        setTimeout(() => {
            alertDiv.classList.remove('show');
            setTimeout(() => alertDiv.remove(), 300);
        }, 5000);
    }
});
