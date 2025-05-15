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
    const imageEditorContainer = document.getElementById('image-editor-container');
    const imageEditorToolbar = document.getElementById('image-editor-toolbar');
    const removeBgBtn = document.getElementById('remove-bg-btn');
    const downloadBtn = document.getElementById('download-btn');
    const copyImageBtn = document.getElementById('copy-image-btn');
    const resetBtn = document.getElementById('reset-btn');
    const loading = document.getElementById('loading');
    const imageHistoryContainer = document.getElementById('image-history-container');
    const noHistoryMessage = document.getElementById('no-history-message');

    // أزرار أدوات تعديل الصورة
    const rotateLeftBtn = document.getElementById('rotate-left-btn');
    const rotateRightBtn = document.getElementById('rotate-right-btn');
    const flipHorizontalBtn = document.getElementById('flip-horizontal-btn');
    const flipVerticalBtn = document.getElementById('flip-vertical-btn');
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const resetTransformBtn = document.getElementById('reset-transform-btn');
    const cropBtn = document.getElementById('crop-btn');
    const brightnessBtn = document.getElementById('brightness-btn');
    const contrastBtn = document.getElementById('contrast-btn');
    const applyChangesBtn = document.getElementById('apply-changes-btn');
    const copyImageToolbarBtn = document.getElementById('copy-image-toolbar-btn');
    const cancelChangesBtn = document.getElementById('cancel-changes-btn');

    // أزرار موضع الصورة
    const centerImageBtn = document.getElementById('center-image-btn');
    const moveUpBtn = document.getElementById('move-up-btn');
    const moveDownBtn = document.getElementById('move-down-btn');
    const moveLeftBtn = document.getElementById('move-left-btn');
    const moveRightBtn = document.getElementById('move-right-btn');

    // متغيرات عامة
    let selectedFile = null;
    let processedImageFilename = null;
    let isProcessing = false;
    let originalImageData = null; // لتخزين بيانات الصورة الأصلية قبل التعديل

    // متغيرات تعديل الصورة
    let currentRotation = 0;
    let currentScale = 1;
    let flipX = false;
    let flipY = false;
    let brightness = 100;
    let contrast = 100;
    let isEditMode = false;
    let isCropMode = false;
    let cropBox = null;
    let imagePositionX = 0;
    let imagePositionY = 0;

    // مصفوفة لتخزين سجل الصور
    let imageHistory = [];

    // مدة الاحتفاظ بالصور (بالمللي ثانية) - ساعة واحدة
    const IMAGE_RETENTION_TIME = 60 * 60 * 1000; // 60 دقيقة × 60 ثانية × 1000 مللي ثانية

    // إضافة مستمعي الأحداث
    browseBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);

    // إضافة مستمعي أحداث السحب والإفلات لمنطقة السحب
    dropArea.addEventListener('dragover', handleDragOver);
    dropArea.addEventListener('dragleave', handleDragLeave);
    dropArea.addEventListener('drop', handleDrop);

    // إضافة مستمعي أحداث السحب والإفلات للصفحة بأكملها
    document.body.addEventListener('dragover', handleBodyDragOver);
    document.body.addEventListener('drop', handleDrop);
    document.body.addEventListener('dragleave', handleBodyDragLeave);

    removeBgBtn.addEventListener('click', removeBackground);
    downloadBtn.addEventListener('click', downloadImage);
    copyImageBtn.addEventListener('click', copyImage); // سيتم تمرير الحدث تلقائيًا
    resetBtn.addEventListener('click', resetApp);

    // إضافة مستمع لحدث اللصق (Ctrl+V) على مستوى النافذة بأكملها
    window.addEventListener('paste', handlePaste);

    // إضافة مستمعي أحداث لأدوات تعديل الصورة
    rotateLeftBtn.addEventListener('click', () => rotateImage(-90));
    rotateRightBtn.addEventListener('click', () => rotateImage(90));
    flipHorizontalBtn.addEventListener('click', flipImageHorizontal);
    flipVerticalBtn.addEventListener('click', flipImageVertical);
    zoomInBtn.addEventListener('click', () => scaleImage(0.1));
    zoomOutBtn.addEventListener('click', () => scaleImage(-0.1));
    resetTransformBtn.addEventListener('click', resetImageTransform);
    cropBtn.addEventListener('click', toggleCropMode);
    brightnessBtn.addEventListener('click', showBrightnessControl);
    contrastBtn.addEventListener('click', showContrastControl);
    applyChangesBtn.addEventListener('click', applyImageChanges);
    copyImageToolbarBtn.addEventListener('click', copyImage); // سيتم تمرير الحدث تلقائيًا
    cancelChangesBtn.addEventListener('click', cancelImageChanges);

    // إضافة مستمعي أحداث لأزرار موضع الصورة
    centerImageBtn.addEventListener('click', centerImage);
    moveUpBtn.addEventListener('click', () => moveImage(0, -10));
    moveDownBtn.addEventListener('click', () => moveImage(0, 10));
    moveLeftBtn.addEventListener('click', () => moveImage(-10, 0));
    moveRightBtn.addEventListener('click', () => moveImage(10, 0));

    // إضافة رسالة ترحيبية لإخبار المستخدم بميزة اللصق
    console.log('تم تفعيل ميزة اللصق (Ctrl+V) - يمكنك لصق أي صورة من الحافظة في أي وقت');
    showAlert('يمكنك لصق أي صورة من الحافظة باستخدام Ctrl+V في أي وقت', 'info');

    // معالجة اختيار الملف
    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            // إذا كانت هناك صورة حالية، أضفها إلى السجل قبل معالجة الصورة الجديدة
            if (processedImageFilename) {
                addToImageHistory(processedImageFilename);
            }
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

    // معالجة سحب وإفلات الملف على مستوى الصفحة
    function handleBodyDragOver(e) {
        e.preventDefault();
        e.stopPropagation();

        // إظهار تأثير بصري على الصفحة بأكملها
        document.body.classList.add('body-dragover');

        // إظهار منطقة السحب إذا كانت مخفية
        if (uploadArea.classList.contains('d-none')) {
            // إذا كانت هناك صورة حالية، نعرض تلميح للمستخدم
            const dragHint = document.getElementById('drag-hint') || createDragHint();
            dragHint.classList.remove('d-none');
        } else {
            // إذا كانت منطقة السحب ظاهرة، نضيف تأثير السحب عليها
            dropArea.classList.add('dragover');
        }
    }

    function handleBodyDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();

        // التحقق مما إذا كان المؤشر خرج من الصفحة بالفعل
        const rect = document.body.getBoundingClientRect();
        if (
            e.clientX <= rect.left ||
            e.clientX >= rect.right ||
            e.clientY <= rect.top ||
            e.clientY >= rect.bottom
        ) {
            document.body.classList.remove('body-dragover');

            // إخفاء تلميح السحب إذا كان موجوداً
            const dragHint = document.getElementById('drag-hint');
            if (dragHint) {
                dragHint.classList.add('d-none');
            }
        }
    }

    // إنشاء تلميح السحب
    function createDragHint() {
        const dragHint = document.createElement('div');
        dragHint.id = 'drag-hint';
        dragHint.className = 'drag-hint d-none';
        dragHint.innerHTML = `
            <div class="drag-hint-content">
                <i class="fas fa-cloud-upload-alt fa-3x mb-3"></i>
                <h4>أفلت الصورة هنا لمعالجتها</h4>
            </div>
        `;
        document.body.appendChild(dragHint);
        return dragHint;
    }

    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();

        // إزالة تأثيرات السحب
        dropArea.classList.remove('dragover');
        document.body.classList.remove('body-dragover');

        // إخفاء تلميح السحب إذا كان موجوداً
        const dragHint = document.getElementById('drag-hint');
        if (dragHint) {
            dragHint.classList.add('d-none');
        }

        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            // إذا كانت هناك صورة حالية، أضفها إلى السجل قبل معالجة الصورة الجديدة
            if (processedImageFilename) {
                addToImageHistory(processedImageFilename);
            }
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
                            // إذا كانت هناك صورة حالية، أضفها إلى السجل قبل معالجة الصورة الجديدة
                            if (processedImageFilename) {
                                addToImageHistory(processedImageFilename);
                            }

                            // معالجة الملف الجديد
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

                // إذا كانت هناك صورة حالية، أضفها إلى السجل قبل معالجة الصورة الجديدة
                if (processedImageFilename) {
                    addToImageHistory(processedImageFilename);
                }

                // معالجة الملف الجديد
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
                imageEditorContainer.classList.remove('d-none');
                resultImage.classList.remove('d-none'); // تأكد من إظهار الصورة نفسها
                imageEditorToolbar.classList.remove('d-none');
                downloadBtn.classList.remove('d-none');
                copyImageBtn.classList.remove('d-none');
                loading.classList.add('d-none');
                removeBgBtn.disabled = false;
                isProcessing = false;

                // حفظ بيانات الصورة الأصلية للرجوع إليها عند إلغاء التعديلات
                saveOriginalImageData();

                // إعادة ضبط متغيرات التعديل
                resetImageTransformVariables();

                // إضافة سجل في وحدة التحكم للتأكد من أن الصورة ظاهرة
                console.log('تم إظهار الصورة المعالجة:', resultImage.src);
                console.log('حالة الصورة:', resultImage.complete ? 'مكتملة' : 'غير مكتملة');
                console.log('حالة العرض:', resultImage.classList.contains('d-none') ? 'مخفية' : 'ظاهرة');
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

    // نسخ الصورة إلى الحافظة
    async function copyImage(event) {
        // منع السلوك الافتراضي للزر
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        if (!processedImageFilename) {
            showAlert('لا توجد صورة معالجة للنسخ', 'warning');
            return;
        }

        try {
            // إظهار مؤشر التحميل
            loading.classList.remove('d-none');

            // تحديد العنصر الذي تم النقر عليه
            let clickedButton;
            if (event && event.currentTarget) {
                clickedButton = event.currentTarget;
            } else {
                clickedButton = document.activeElement;
            }
            console.log('تم النقر على زر:', clickedButton.id);

            // إظهار تأثير بصري على الزر المضغوط
            if (clickedButton && (clickedButton.id === 'copy-image-btn' || clickedButton.id === 'copy-image-toolbar-btn')) {
                clickedButton.classList.add('active');
                setTimeout(() => {
                    clickedButton.classList.remove('active');
                }, 300);
            }

            // إظهار ملاحظة فورية للمستخدم
            showCopyNotification(clickedButton);

            // الحصول على الصورة كـ blob
            const response = await fetch(`/processed-image/${processedImageFilename}`);
            const blob = await response.blob();

            // طريقة 1: استخدام واجهة برمجة التطبيقات الحديثة للحافظة
            if (navigator.clipboard && navigator.clipboard.write) {
                try {
                    console.log('محاولة نسخ الصورة باستخدام Clipboard API');
                    // إنشاء كائن ClipboardItem
                    const item = new ClipboardItem({ [blob.type]: blob });

                    // نسخ الصورة إلى الحافظة
                    await navigator.clipboard.write([item]);

                    // إخفاء مؤشر التحميل
                    loading.classList.add('d-none');

                    // عرض رسالة نجاح
                    showAlert('تم نسخ الصورة إلى الحافظة بنجاح', 'success');
                    return;
                } catch (clipboardError) {
                    console.warn('فشل في استخدام واجهة برمجة التطبيقات الحديثة للحافظة:', clipboardError);
                    // سنستمر بالطريقة البديلة
                }
            }

            // طريقة 2: استخدام عنصر canvas للنسخ
            console.log('استخدام طريقة Canvas للنسخ');
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = function() {
                console.log('تم تحميل الصورة بنجاح للنسخ');
                // إنشاء عنصر canvas
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;

                // رسم الصورة على canvas
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                // طريقة 3: تحويل Canvas إلى Data URL ونسخه
                try {
                    // تحويل Canvas إلى صورة Data URL
                    const dataURL = canvas.toDataURL('image/png');

                    // إنشاء عنصر مؤقت للنسخ
                    const tempInput = document.createElement('textarea');
                    tempInput.value = dataURL;
                    document.body.appendChild(tempInput);
                    tempInput.select();

                    console.log('محاولة نسخ Data URL');
                    const successful = document.execCommand('copy');
                    if (successful) {
                        console.log('تم نسخ Data URL بنجاح');
                        showAlert('تم نسخ الصورة إلى الحافظة بنجاح', 'success');
                    } else {
                        // إذا فشلت هذه الطريقة، نستخدم الطريقة الأخيرة
                        copyCanvasAsBlob(canvas);
                    }

                    // تنظيف
                    document.body.removeChild(tempInput);
                    loading.classList.add('d-none');
                } catch (err) {
                    console.error('فشل في نسخ Data URL:', err);
                    // استخدام الطريقة الأخيرة
                    copyCanvasAsBlob(canvas);
                }
            };

            img.onerror = function() {
                console.error('فشل في تحميل الصورة للنسخ');
                loading.classList.add('d-none');
                showAlert('فشل في تحميل الصورة للنسخ', 'danger');
            };

            // تحميل الصورة
            img.src = `/processed-image/${processedImageFilename}`;

        } catch (error) {
            console.error('خطأ في نسخ الصورة:', error);
            loading.classList.add('d-none');

            // التحقق من نوع الخطأ وعرض رسالة مناسبة
            if (error.name === 'NotAllowedError') {
                showAlert('لم يتم السماح بنسخ الصورة. يرجى منح الإذن للموقع للوصول إلى الحافظة.', 'warning');
            } else if (error.name === 'NotSupportedError') {
                showAlert('متصفحك لا يدعم نسخ الصور. يرجى استخدام زر التحميل بدلاً من ذلك.', 'warning');
            } else {
                showAlert('حدث خطأ أثناء نسخ الصورة', 'danger');
            }
        }
    }

    // إظهار ملاحظة نسخ الصورة
    function showCopyNotification(button) {
        // إنشاء عنصر الملاحظة
        const notification = document.createElement('div');
        notification.className = 'copy-notification';
        notification.innerHTML = '<i class="fas fa-check-circle me-1"></i> تم نسخ الصورة';

        // تحديد موضع الملاحظة بالنسبة للزر
        const buttonRect = button.getBoundingClientRect();

        // إضافة الملاحظة إلى الصفحة
        document.body.appendChild(notification);

        // تحديد موضع الملاحظة
        notification.style.position = 'fixed';
        notification.style.top = `${buttonRect.top - 40}px`;
        notification.style.left = `${buttonRect.left + (buttonRect.width / 2)}px`;
        notification.style.transform = 'translateX(-50%)';

        // إظهار الملاحظة
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // إخفاء الملاحظة بعد ثانيتين
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 2000);
    }

    // وظيفة مساعدة لنسخ Canvas كـ Blob
    function copyCanvasAsBlob(canvas) {
        console.log('استخدام طريقة Blob للنسخ');
        canvas.toBlob(function(canvasBlob) {
            // إنشاء عنصر مؤقت للنسخ
            const tempImg = document.createElement('img');
            tempImg.src = URL.createObjectURL(canvasBlob);

            // إضافة العنصر إلى الصفحة بشكل مؤقت
            tempImg.style.position = 'fixed';
            tempImg.style.left = '-9999px';
            document.body.appendChild(tempImg);

            // تحديد العنصر ونسخه
            const range = document.createRange();
            range.selectNode(tempImg);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);

            try {
                console.log('محاولة نسخ الصورة باستخدام execCommand');
                const successful = document.execCommand('copy');
                if (successful) {
                    console.log('تم نسخ الصورة بنجاح');
                    showAlert('تم نسخ الصورة إلى الحافظة بنجاح', 'success');
                } else {
                    console.warn('فشل في نسخ الصورة باستخدام execCommand');
                    showAlert('فشل في نسخ الصورة، يرجى استخدام زر التحميل بدلاً من ذلك', 'warning');
                }
            } catch (err) {
                console.error('خطأ في نسخ الصورة:', err);
                showAlert('فشل في نسخ الصورة، يرجى استخدام زر التحميل بدلاً من ذلك', 'warning');
            }

            // تنظيف
            window.getSelection().removeAllRanges();
            document.body.removeChild(tempImg);
            URL.revokeObjectURL(tempImg.src);

            // إخفاء مؤشر التحميل
            loading.classList.add('d-none');
        });
    }

    // إعادة تعيين التطبيق
    function resetApp() {
        // إذا كانت هناك صورة حالية، أضفها إلى السجل قبل إعادة التعيين
        if (processedImageFilename) {
            addToImageHistory(processedImageFilename);
        }

        selectedFile = null;
        processedImageFilename = null;
        isProcessing = false;
        fileInput.value = '';
        originalImage.src = '';
        resultImage.src = '';
        uploadArea.classList.remove('d-none');
        imagePreviewContainer.classList.add('d-none');
        imageEditorContainer.classList.add('d-none');
        imageEditorToolbar.classList.add('d-none');
        resultPlaceholder.classList.remove('d-none');
        downloadBtn.classList.add('d-none');
        copyImageBtn.classList.add('d-none');
        removeBgBtn.disabled = false;

        // إعادة ضبط متغيرات التعديل
        resetImageTransformVariables();

        // إزالة أي عناصر تحكم إضافية
        removeAllControls();
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

    // إضافة صورة إلى سجل الصور
    function addToImageHistory(filename) {
        if (!filename) return;

        console.log(`إضافة الصورة ${filename} إلى سجل الصور`);

        // إنشاء كائن للصورة مع الوقت الحالي
        const imageObj = {
            filename: filename,
            timestamp: new Date().getTime()
        };

        // إضافة الصورة إلى بداية المصفوفة (لتظهر في المقدمة)
        imageHistory.unshift(imageObj);

        // تحديث عرض سجل الصور
        updateImageHistoryDisplay();

        // بدء مؤقت لحذف الصورة بعد ساعة
        setTimeout(() => {
            removeExpiredImages();
        }, IMAGE_RETENTION_TIME);
    }

    // تحديث عرض سجل الصور
    function updateImageHistoryDisplay() {
        // إزالة رسالة "لا توجد صور سابقة" إذا كان هناك صور
        if (imageHistory.length > 0) {
            noHistoryMessage.classList.add('d-none');
        } else {
            noHistoryMessage.classList.remove('d-none');
            return;
        }

        // إزالة جميع الصور الحالية من العرض
        const existingImages = imageHistoryContainer.querySelectorAll('.history-image-item');
        existingImages.forEach(item => {
            if (!item.id.includes('no-history-message')) {
                item.remove();
            }
        });

        // إضافة الصور من المصفوفة
        imageHistory.forEach((image, index) => {
            // إنشاء عنصر للصورة
            const imageCol = document.createElement('div');
            imageCol.className = 'col-6 col-md-4 col-lg-3 history-image-item';

            // حساب الوقت المنقضي
            const now = new Date().getTime();
            const elapsed = now - image.timestamp;
            const minutesLeft = Math.floor((IMAGE_RETENTION_TIME - elapsed) / 60000);

            // إنشاء HTML للصورة
            imageCol.innerHTML = `
                <div class="history-image-container">
                    <img src="/processed-image/${image.filename}" class="history-image" alt="صورة سابقة">
                    <div class="history-image-time">
                        <i class="fas fa-clock"></i> ${minutesLeft} دقيقة
                    </div>
                    <div class="history-image-overlay">
                        <button class="btn btn-sm btn-light mb-2 use-image-btn" data-filename="${image.filename}">
                            <i class="fas fa-sync-alt"></i> استخدام
                        </button>
                        <button class="btn btn-sm btn-outline-light download-image-btn" data-filename="${image.filename}">
                            <i class="fas fa-download"></i> تحميل
                        </button>
                    </div>
                </div>
            `;

            // إضافة العنصر إلى الحاوية
            imageHistoryContainer.appendChild(imageCol);

            // إضافة مستمعي الأحداث للأزرار
            const useBtn = imageCol.querySelector('.use-image-btn');
            const downloadBtn = imageCol.querySelector('.download-image-btn');

            useBtn.addEventListener('click', () => useHistoryImage(image.filename));
            downloadBtn.addEventListener('click', () => downloadHistoryImage(image.filename));
        });
    }

    // استخدام صورة من السجل
    function useHistoryImage(filename) {
        if (isProcessing) {
            showAlert('يرجى الانتظار حتى تنتهي المعالجة الحالية', 'warning');
            return;
        }

        console.log(`استخدام الصورة ${filename} من السجل`);

        // إذا كانت هناك صورة حالية، أضفها إلى السجل أولاً
        if (processedImageFilename && processedImageFilename !== filename) {
            addToImageHistory(processedImageFilename);
        }

        // تعيين الصورة المختارة كصورة حالية
        processedImageFilename = filename;
        resultImage.src = `/processed-image/${filename}`;

        // إظهار الصورة
        uploadArea.classList.add('d-none');
        imagePreviewContainer.classList.remove('d-none');
        resultPlaceholder.classList.add('d-none');
        imageEditorContainer.classList.remove('d-none');
        imageEditorToolbar.classList.remove('d-none');
        resultImage.classList.remove('d-none');
        downloadBtn.classList.remove('d-none');

        // حفظ بيانات الصورة الأصلية للرجوع إليها عند إلغاء التعديلات
        saveOriginalImageData();

        // إعادة ضبط متغيرات التعديل
        resetImageTransformVariables();

        // إزالة الصورة من السجل
        imageHistory = imageHistory.filter(img => img.filename !== filename);
        updateImageHistoryDisplay();

        showAlert('تم استخدام الصورة من السجل', 'success');
    }

    // تحميل صورة من السجل
    function downloadHistoryImage(filename) {
        console.log(`تحميل الصورة ${filename} من السجل`);

        const link = document.createElement('a');
        link.href = `/processed-image/${filename}`;
        link.download = `no-bg-image-${filename}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // إزالة الصور المنتهية صلاحيتها
    function removeExpiredImages() {
        const now = new Date().getTime();

        // تصفية الصور التي تجاوزت مدة الاحتفاظ
        const expiredImages = imageHistory.filter(img => (now - img.timestamp) >= IMAGE_RETENTION_TIME);

        if (expiredImages.length > 0) {
            console.log(`إزالة ${expiredImages.length} صور منتهية الصلاحية`);

            // تحديث المصفوفة لتحتوي فقط على الصور غير المنتهية
            imageHistory = imageHistory.filter(img => (now - img.timestamp) < IMAGE_RETENTION_TIME);

            // تحديث العرض
            updateImageHistoryDisplay();
        }
    }

    // تحديث عداد الوقت المتبقي للصور كل دقيقة
    setInterval(() => {
        if (imageHistory.length > 0) {
            updateImageHistoryDisplay();
        }
    }, 60000); // تحديث كل دقيقة

    // إزالة الصور المنتهية كل 5 دقائق
    setInterval(() => {
        removeExpiredImages();
    }, 5 * 60000);

    // ======== وظائف تعديل الصورة ========

    // حفظ بيانات الصورة الأصلية
    function saveOriginalImageData() {
        originalImageData = {
            src: resultImage.src,
            width: resultImage.naturalWidth,
            height: resultImage.naturalHeight
        };
    }

    // إعادة ضبط متغيرات التعديل
    function resetImageTransformVariables() {
        currentRotation = 0;
        currentScale = 1;
        flipX = false;
        flipY = false;
        brightness = 100;
        contrast = 100;
        isEditMode = false;
        isCropMode = false;
        imagePositionX = 0;
        imagePositionY = 0;

        // إعادة ضبط نمط التحويل
        applyTransform();
    }

    // تطبيق التحويلات على الصورة
    function applyTransform() {
        let transform = '';

        // تطبيق الموضع
        if (imagePositionX !== 0 || imagePositionY !== 0) {
            transform += `translate(${imagePositionX}px, ${imagePositionY}px) `;
        }

        // تطبيق التدوير
        if (currentRotation !== 0) {
            transform += `rotate(${currentRotation}deg) `;
        }

        // تطبيق المقياس
        if (currentScale !== 1) {
            transform += `scale(${currentScale}) `;
        }

        // تطبيق القلب
        if (flipX || flipY) {
            const scaleX = flipX ? -1 : 1;
            const scaleY = flipY ? -1 : 1;
            transform += `scale(${scaleX}, ${scaleY}) `;
        }

        // تطبيق السطوع والتباين
        let filter = '';
        if (brightness !== 100) {
            filter += `brightness(${brightness}%) `;
        }
        if (contrast !== 100) {
            filter += `contrast(${contrast}%) `;
        }

        // تطبيق التحويلات
        resultImage.style.transform = transform;
        resultImage.style.filter = filter;
    }

    // تدوير الصورة
    function rotateImage(degrees) {
        if (!isEditMode) {
            enterEditMode();
        }

        currentRotation = (currentRotation + degrees) % 360;
        applyTransform();
    }

    // قلب الصورة أفقياً
    function flipImageHorizontal() {
        if (!isEditMode) {
            enterEditMode();
        }

        flipX = !flipX;
        applyTransform();
    }

    // قلب الصورة رأسياً
    function flipImageVertical() {
        if (!isEditMode) {
            enterEditMode();
        }

        flipY = !flipY;
        applyTransform();
    }

    // تغيير مقياس الصورة
    function scaleImage(delta) {
        if (!isEditMode) {
            enterEditMode();
        }

        currentScale = Math.max(0.1, Math.min(3, currentScale + delta));
        applyTransform();
    }

    // إعادة ضبط تحويلات الصورة
    function resetImageTransform() {
        resetImageTransformVariables();
    }

    // الدخول في وضع التعديل
    function enterEditMode() {
        if (!isEditMode) {
            isEditMode = true;
            applyChangesBtn.classList.remove('d-none');
            cancelChangesBtn.classList.remove('d-none');
        }
    }

    // تبديل وضع القص
    function toggleCropMode() {
        if (!isEditMode) {
            enterEditMode();
        }

        isCropMode = !isCropMode;

        if (isCropMode) {
            // تفعيل وضع القص
            cropBtn.classList.add('active');
            initCropBox();
        } else {
            // إلغاء وضع القص
            cropBtn.classList.remove('active');
            removeCropBox();
        }
    }

    // إنشاء مربع القص
    function initCropBox() {
        // إزالة مربع القص الحالي إذا كان موجوداً
        removeCropBox();

        // إنشاء مربع القص
        cropBox = document.createElement('div');
        cropBox.className = 'crop-box';
        cropBox.style.position = 'absolute';
        cropBox.style.border = '2px dashed white';
        cropBox.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        cropBox.style.cursor = 'move';

        // تحديد الحجم الأولي لمربع القص
        const imgRect = resultImage.getBoundingClientRect();
        const containerRect = imageEditorContainer.getBoundingClientRect();

        const cropWidth = imgRect.width * 0.8;
        const cropHeight = imgRect.height * 0.8;

        cropBox.style.width = `${cropWidth}px`;
        cropBox.style.height = `${cropHeight}px`;
        cropBox.style.left = `${(imgRect.width - cropWidth) / 2}px`;
        cropBox.style.top = `${(imgRect.height - cropHeight) / 2}px`;

        // إضافة مربع القص إلى الحاوية
        imageEditorContainer.appendChild(cropBox);

        // إضافة مستمعي أحداث للسحب
        makeDraggable(cropBox);
        makeResizable(cropBox);
    }

    // جعل العنصر قابل للسحب
    function makeDraggable(element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        element.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e.preventDefault();
            // الحصول على موضع المؤشر عند النقر
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e.preventDefault();
            // حساب الموضع الجديد
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;

            // تحديد الحدود
            const containerRect = imageEditorContainer.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();

            let newTop = element.offsetTop - pos2;
            let newLeft = element.offsetLeft - pos1;

            // التأكد من أن العنصر لا يخرج عن حدود الحاوية
            if (newTop < 0) newTop = 0;
            if (newLeft < 0) newLeft = 0;
            if (newTop + elementRect.height > containerRect.height) {
                newTop = containerRect.height - elementRect.height;
            }
            if (newLeft + elementRect.width > containerRect.width) {
                newLeft = containerRect.width - elementRect.width;
            }

            // تعيين الموضع الجديد
            element.style.top = newTop + "px";
            element.style.left = newLeft + "px";
        }

        function closeDragElement() {
            // إيقاف تحريك العنصر عند ترك زر الماوس
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    // جعل العنصر قابل لتغيير الحجم
    function makeResizable(element) {
        // إنشاء مقابض تغيير الحجم
        const positions = ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'];

        positions.forEach(pos => {
            const handle = document.createElement('div');
            handle.className = `resize-handle resize-${pos}`;
            handle.style.position = 'absolute';
            handle.style.width = '10px';
            handle.style.height = '10px';
            handle.style.backgroundColor = 'white';
            handle.style.border = '1px solid #0d6efd';

            // تحديد موضع المقبض
            switch(pos) {
                case 'nw': // الشمال الغربي
                    handle.style.top = '-5px';
                    handle.style.left = '-5px';
                    handle.style.cursor = 'nwse-resize';
                    break;
                case 'ne': // الشمال الشرقي
                    handle.style.top = '-5px';
                    handle.style.right = '-5px';
                    handle.style.cursor = 'nesw-resize';
                    break;
                case 'sw': // الجنوب الغربي
                    handle.style.bottom = '-5px';
                    handle.style.left = '-5px';
                    handle.style.cursor = 'nesw-resize';
                    break;
                case 'se': // الجنوب الشرقي
                    handle.style.bottom = '-5px';
                    handle.style.right = '-5px';
                    handle.style.cursor = 'nwse-resize';
                    break;
                case 'n': // الشمال
                    handle.style.top = '-5px';
                    handle.style.left = '50%';
                    handle.style.transform = 'translateX(-50%)';
                    handle.style.cursor = 'ns-resize';
                    break;
                case 's': // الجنوب
                    handle.style.bottom = '-5px';
                    handle.style.left = '50%';
                    handle.style.transform = 'translateX(-50%)';
                    handle.style.cursor = 'ns-resize';
                    break;
                case 'e': // الشرق
                    handle.style.right = '-5px';
                    handle.style.top = '50%';
                    handle.style.transform = 'translateY(-50%)';
                    handle.style.cursor = 'ew-resize';
                    break;
                case 'w': // الغرب
                    handle.style.left = '-5px';
                    handle.style.top = '50%';
                    handle.style.transform = 'translateY(-50%)';
                    handle.style.cursor = 'ew-resize';
                    break;
            }

            element.appendChild(handle);

            // إضافة مستمع حدث للسحب
            handle.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                resizeMouseDown(e, pos);
            });
        });

        function resizeMouseDown(e, pos) {
            e.preventDefault();

            const startX = e.clientX;
            const startY = e.clientY;
            const startWidth = parseInt(document.defaultView.getComputedStyle(element).width, 10);
            const startHeight = parseInt(document.defaultView.getComputedStyle(element).height, 10);
            const startTop = element.offsetTop;
            const startLeft = element.offsetLeft;

            document.onmousemove = (e) => {
                const containerRect = imageEditorContainer.getBoundingClientRect();

                // حساب التغيير في الموضع
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;

                // تطبيق التغييرات حسب المقبض المسحوب
                if (pos.includes('e')) { // شرق
                    const newWidth = Math.min(startWidth + dx, containerRect.width - startLeft);
                    element.style.width = `${Math.max(20, newWidth)}px`;
                }
                if (pos.includes('w')) { // غرب
                    const newWidth = Math.min(startWidth - dx, startLeft + startWidth);
                    const newLeft = startLeft + dx;

                    if (newWidth > 20 && newLeft >= 0) {
                        element.style.width = `${newWidth}px`;
                        element.style.left = `${newLeft}px`;
                    }
                }
                if (pos.includes('s')) { // جنوب
                    const newHeight = Math.min(startHeight + dy, containerRect.height - startTop);
                    element.style.height = `${Math.max(20, newHeight)}px`;
                }
                if (pos.includes('n')) { // شمال
                    const newHeight = Math.min(startHeight - dy, startTop + startHeight);
                    const newTop = startTop + dy;

                    if (newHeight > 20 && newTop >= 0) {
                        element.style.height = `${newHeight}px`;
                        element.style.top = `${newTop}px`;
                    }
                }
            };

            document.onmouseup = () => {
                document.onmousemove = null;
                document.onmouseup = null;
            };
        }
    }

    // إزالة مربع القص
    function removeCropBox() {
        if (cropBox) {
            cropBox.remove();
            cropBox = null;
        }
    }

    // إظهار عنصر التحكم في السطوع
    function showBrightnessControl() {
        if (!isEditMode) {
            enterEditMode();
        }

        // إزالة عناصر التحكم الحالية
        removeAllControls();

        // إنشاء عنصر التحكم في السطوع
        const control = document.createElement('div');
        control.className = 'image-control brightness-control';
        control.innerHTML = `
            <label for="brightness-slider">السطوع:</label>
            <input type="range" id="brightness-slider" min="0" max="200" value="${brightness}" class="form-range">
            <span class="ms-2">${brightness}%</span>
        `;

        // إضافة عنصر التحكم إلى الحاوية
        imageEditorContainer.appendChild(control);

        // إضافة مستمع حدث لتغيير السطوع
        const slider = control.querySelector('#brightness-slider');
        const valueDisplay = control.querySelector('span');

        slider.addEventListener('input', (e) => {
            brightness = parseInt(e.target.value);
            valueDisplay.textContent = `${brightness}%`;
            applyTransform();
        });

        // تفعيل زر السطوع
        brightnessBtn.classList.add('active');
    }

    // إظهار عنصر التحكم في التباين
    function showContrastControl() {
        if (!isEditMode) {
            enterEditMode();
        }

        // إزالة عناصر التحكم الحالية
        removeAllControls();

        // إنشاء عنصر التحكم في التباين
        const control = document.createElement('div');
        control.className = 'image-control contrast-control';
        control.innerHTML = `
            <label for="contrast-slider">التباين:</label>
            <input type="range" id="contrast-slider" min="0" max="200" value="${contrast}" class="form-range">
            <span class="ms-2">${contrast}%</span>
        `;

        // إضافة عنصر التحكم إلى الحاوية
        imageEditorContainer.appendChild(control);

        // إضافة مستمع حدث لتغيير التباين
        const slider = control.querySelector('#contrast-slider');
        const valueDisplay = control.querySelector('span');

        slider.addEventListener('input', (e) => {
            contrast = parseInt(e.target.value);
            valueDisplay.textContent = `${contrast}%`;
            applyTransform();
        });

        // تفعيل زر التباين
        contrastBtn.classList.add('active');
    }

    // تحريك الصورة
    function moveImage(deltaX, deltaY) {
        if (!isEditMode) {
            enterEditMode();
        }

        imagePositionX += deltaX;
        imagePositionY += deltaY;
        applyTransform();
    }

    // توسيط الصورة
    function centerImage() {
        if (!isEditMode) {
            enterEditMode();
        }

        imagePositionX = 0;
        imagePositionY = 0;
        applyTransform();
    }

    // إزالة جميع عناصر التحكم
    function removeAllControls() {
        // إزالة عناصر التحكم في السطوع والتباين
        const controls = imageEditorContainer.querySelectorAll('.image-control');
        controls.forEach(control => control.remove());

        // إزالة مربع القص
        removeCropBox();

        // إلغاء تفعيل جميع الأزرار
        brightnessBtn.classList.remove('active');
        contrastBtn.classList.remove('active');
        cropBtn.classList.remove('active');
    }

    // تطبيق التغييرات على الصورة
    async function applyImageChanges() {
        if (!isEditMode) return;

        try {
            // إظهار مؤشر التحميل
            loading.classList.remove('d-none');

            // إنشاء عنصر canvas لتطبيق التحويلات
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // تحميل الصورة
            const img = new Image();
            img.crossOrigin = 'anonymous';

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = originalImageData.src;
            });

            // تعيين أبعاد canvas
            canvas.width = img.width;
            canvas.height = img.height;

            // تطبيق التحويلات
            ctx.save();

            // تحديد نقطة المنتصف للتدوير
            ctx.translate(canvas.width / 2, canvas.height / 2);

            // تطبيق الموضع
            if (imagePositionX !== 0 || imagePositionY !== 0) {
                // تحويل الموضع من بكسل إلى نسبة من حجم الصورة
                const posXRatio = imagePositionX / resultImage.width;
                const posYRatio = imagePositionY / resultImage.height;
                ctx.translate(posXRatio * canvas.width, posYRatio * canvas.height);
            }

            // تطبيق التدوير
            if (currentRotation !== 0) {
                ctx.rotate((currentRotation * Math.PI) / 180);
            }

            // تطبيق المقياس
            if (currentScale !== 1) {
                ctx.scale(currentScale, currentScale);
            }

            // تطبيق القلب
            if (flipX || flipY) {
                ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
            }

            // رسم الصورة
            ctx.drawImage(
                img,
                -img.width / 2,
                -img.height / 2,
                img.width,
                img.height
            );

            // تطبيق القص إذا كان مفعلاً
            if (isCropMode && cropBox) {
                // الحصول على نسبة القص
                const imgRect = resultImage.getBoundingClientRect();
                const cropRect = cropBox.getBoundingClientRect();

                const cropX = (cropRect.left - imgRect.left) / imgRect.width * img.width;
                const cropY = (cropRect.top - imgRect.top) / imgRect.height * img.height;
                const cropWidth = cropRect.width / imgRect.width * img.width;
                const cropHeight = cropRect.height / imgRect.height * img.height;

                // إنشاء canvas جديد للقص
                const cropCanvas = document.createElement('canvas');
                cropCanvas.width = cropWidth;
                cropCanvas.height = cropHeight;

                // نسخ المنطقة المقصوصة
                const cropCtx = cropCanvas.getContext('2d');
                cropCtx.drawImage(
                    canvas,
                    cropX,
                    cropY,
                    cropWidth,
                    cropHeight,
                    0,
                    0,
                    cropWidth,
                    cropHeight
                );

                // استبدال canvas الأصلي بالمقصوص
                canvas.width = cropWidth;
                canvas.height = cropHeight;
                ctx.drawImage(cropCanvas, 0, 0);
            }

            // تطبيق السطوع والتباين
            if (brightness !== 100 || contrast !== 100) {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                // تحويل النسب المئوية إلى قيم مناسبة
                const brightnessValue = brightness / 100;
                const contrastValue = contrast / 100;

                for (let i = 0; i < data.length; i += 4) {
                    // تطبيق السطوع
                    data[i] = data[i] * brightnessValue;     // R
                    data[i + 1] = data[i + 1] * brightnessValue; // G
                    data[i + 2] = data[i + 2] * brightnessValue; // B

                    // تطبيق التباين
                    data[i] = ((data[i] - 128) * contrastValue) + 128;     // R
                    data[i + 1] = ((data[i + 1] - 128) * contrastValue) + 128; // G
                    data[i + 2] = ((data[i + 2] - 128) * contrastValue) + 128; // B
                }

                ctx.putImageData(imageData, 0, 0);
            }

            ctx.restore();

            // تحويل canvas إلى blob
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/png');
            });

            // إنشاء ملف من blob
            const file = new File([blob], 'edited-image.png', { type: 'image/png' });

            // إضافة الصورة الحالية إلى السجل
            if (processedImageFilename) {
                addToImageHistory(processedImageFilename);
            }

            // معالجة الصورة المعدلة
            selectedFile = file;
            await removeBackground();

            // إعادة ضبط وضع التعديل
            isEditMode = false;
            isCropMode = false;
            removeAllControls();
            applyChangesBtn.classList.add('d-none');
            cancelChangesBtn.classList.add('d-none');

        } catch (error) {
            console.error('خطأ في تطبيق التغييرات:', error);
            showAlert('حدث خطأ أثناء تطبيق التغييرات', 'danger');
        } finally {
            loading.classList.add('d-none');
        }
    }

    // إلغاء التغييرات
    function cancelImageChanges() {
        if (!isEditMode) return;

        // إعادة ضبط متغيرات التعديل
        resetImageTransformVariables();

        // إزالة جميع عناصر التحكم
        removeAllControls();

        // إعادة ضبط وضع التعديل
        isEditMode = false;
        isCropMode = false;
        applyChangesBtn.classList.add('d-none');
        cancelChangesBtn.classList.add('d-none');
    }
});
