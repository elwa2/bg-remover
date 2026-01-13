document.addEventListener("DOMContentLoaded", function () {
  // العناصر الرئيسية
  const dropArea = document.getElementById("drop-area");
  const fileInput = document.getElementById("file-input");
  const multipleFileInput = document.getElementById("multiple-file-input");
  const browseBtn = document.getElementById("browse-btn");
  const browseFolderBtn = document.getElementById("browse-folder-btn");
  const uploadArea = document.getElementById("upload-area");
  const imagePreviewContainer = document.getElementById(
    "image-preview-container"
  );
  const originalImage = document.getElementById("original-image");
  const resultImage = document.getElementById("result-image");
  const resultPlaceholder = document.getElementById("result-placeholder");
  const imageEditorContainer = document.getElementById(
    "image-editor-container"
  );
  const imageEditorToolbar = document.getElementById("image-editor-toolbar");
  const removeBgBtn = document.getElementById("remove-bg-btn");
  const downloadBtn = document.getElementById("download-btn");
  const copyImageBtn = document.getElementById("copy-image-btn");
  const resetBtn = document.getElementById("reset-btn");
  const noHistoryMessage = document.getElementById("no-history-message");
  const clearHistoryBtn = document.getElementById("clear-history-btn");

  // عناصر معالجة المجلد
  const folderProcessingArea = document.getElementById(
    "folder-processing-area"
  );
  const folderProgressBar = document.getElementById("folder-progress-bar");
  const folderProgressStatus = document.getElementById(
    "folder-progress-status"
  );
  const processedFolderImages = document.getElementById(
    "processed-folder-images"
  );
  const downloadZipBtn = document.getElementById("download-zip-btn");

  // أزرار أدوات تعديل الصورة
  const rotateLeftBtn = document.getElementById("rotate-left-btn");
  const rotateRightBtn = document.getElementById("rotate-right-btn");
  const flipHorizontalBtn = document.getElementById("flip-horizontal-btn");
  const flipVerticalBtn = document.getElementById("flip-vertical-btn");
  const zoomInBtn = document.getElementById("zoom-in-btn");
  const zoomOutBtn = document.getElementById("zoom-out-btn");
  const resetTransformBtn = document.getElementById("reset-transform-btn");
  const applyChangesBtn = document.getElementById("apply-changes-btn");
  const copyImageToolbarBtn = document.getElementById("copy-image-toolbar-btn");
  const cancelChangesBtn = document.getElementById("cancel-changes-btn");

  // متغيرات عامة
  let selectedFile = null;
  let processedImageFilename = null;
  let processedImageBlob = null; // لتخزين الصورة المعالجة كـ Blob
  let isProcessing = false;
  let imageHistory = [];
  const IMAGE_RETENTION_TIME = 60 * 60 * 1000;

  // متغيرات تعديل الصورة
  let editorState = {
    rotation: 0,
    scale: 1,
    flipX: false,
    flipY: false,
    brightness: 100,
    contrast: 100,
    isEditMode: false,
    positionX: 0,
    positionY: 0,
  };

  // متغيرات معالجة المجلد
  let folderFiles = [];
  let processedFolderData = [];
  let currentFolderIndex = 0;

  // إضافة مستمعي الأحداث
  if (browseBtn) {
    browseBtn.addEventListener("click", () => fileInput.click());
  }
  // لم نعد بحاجة لربط زر المجلد، لأن الـ label يقوم بذلك تلقائياً
  if (fileInput) {
    fileInput.addEventListener("change", handleFileSelect);
  }
  if (multipleFileInput) {
    multipleFileInput.addEventListener("change", handleMultipleFileSelect);
  }

  dropArea.addEventListener("dragover", handleDragOver);
  dropArea.addEventListener("dragleave", handleDragLeave);
  dropArea.addEventListener("drop", handleDrop);
  // منع السلوك الافتراضي للمتصفح عند السحب فوق الصفحة
  document.body.addEventListener("dragover", (e) => e.preventDefault());
  // إزالة المستمع المكرر الذي يسبب المشكلة
  document.body.addEventListener("drop", (e) => e.preventDefault());

  removeBgBtn.addEventListener("click", () => processFile(selectedFile));
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", clearHistory);
  }
  downloadBtn.addEventListener("click", downloadImage);
  copyImageBtn.addEventListener("click", copyImage);
  resetBtn.addEventListener("click", resetApp);
  window.addEventListener("paste", handlePaste);

  // زر إغلاق السيرفر
  const shutdownServerBtn = document.getElementById("shutdown-server-btn");
  if (shutdownServerBtn) {
    shutdownServerBtn.addEventListener("click", async () => {
      if (
        confirm("هل أنت متأكد من إغلاق السيرفر؟ سيتم إيقاف التطبيق بالكامل.")
      ) {
        try {
          await fetch("/shutdown", { method: "POST" });
          showAlert("جاري إغلاق السيرفر... يمكنك إغلاق المتصفح الآن.", "info");
          setTimeout(() => {
            window.close();
          }, 1000);
        } catch (error) {
          console.error("Shutdown error:", error);
        }
      }
    });
  }

  // مستمعي أحداث أدوات التعديل
  rotateLeftBtn.addEventListener("click", () => {
    editorState.rotation -= 90;
    applyEditorTransforms();
  });
  rotateRightBtn.addEventListener("click", () => {
    editorState.rotation += 90;
    applyEditorTransforms();
  });
  flipHorizontalBtn.addEventListener("click", () => {
    editorState.flipX = !editorState.flipX;
    applyEditorTransforms();
  });
  flipVerticalBtn.addEventListener("click", () => {
    editorState.flipY = !editorState.flipY;
    applyEditorTransforms();
  });
  zoomInBtn.addEventListener("click", () => {
    editorState.scale = Math.min(3, editorState.scale + 0.1);
    applyEditorTransforms();
  });
  zoomOutBtn.addEventListener("click", () => {
    editorState.scale = Math.max(0.1, editorState.scale - 0.1);
    applyEditorTransforms();
  });
  resetTransformBtn.addEventListener("click", resetEditorTransforms);
  applyChangesBtn.addEventListener("click", applyImageChanges);
  cancelChangesBtn.addEventListener("click", cancelImageChanges);
  // تم إزالة زر التحميل المجمع

  // معالجة اختيار ملف واحد
  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      processSelectedFile(file);
    }
  }

  // معالجة اختيار عدة ملفات
  function handleMultipleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
      folderFiles = Array.from(files).filter((file) =>
        file.type.startsWith("image/")
      );
      if (folderFiles.length > 0) {
        startFolderProcessing();
      } else {
        showAlert("لم يتم اختيار صور صالحة.", "warning");
      }
    }
  }

  // معالجة السحب والإفلات
  function handleDragOver(e) {
    e.preventDefault();
    dropArea.classList.add("dragover");
  }
  function handleDragLeave(e) {
    e.preventDefault();
    dropArea.classList.remove("dragover");
  }
  function handleDrop(e) {
    e.preventDefault();
    dropArea.classList.remove("dragover");
    const files = e.dataTransfer.files;

    if (files.length === 0) {
      return; // لم يتم إفلات أي ملفات
    }

    // إذا تم إفلات ملف واحد فقط
    if (files.length === 1) {
      const file = files[0];
      if (file && file.type.startsWith("image/")) {
        processSelectedFile(file); // تشغيل منطق الصورة الواحدة
      } else {
        showAlert("يرجى إفلات ملف صورة صالح.", "warning");
      }
    } else {
      // إذا تم إفلات أكثر من ملف
      folderFiles = Array.from(files).filter((file) =>
        file.type.startsWith("image/")
      );
      if (folderFiles.length > 0) {
        startFolderProcessing(); // تشغيل منطق الصور المتعددة
      } else {
        showAlert(
          "لم يتم العثور على صور صالحة ضمن الملفات التي تم إفلاتها.",
          "warning"
        );
      }
    }
  }

  // معالجة اللصق
  function handlePaste(e) {
    const items = (e.clipboardData || window.clipboardData).items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        processSelectedFile(file);
        showAlert("تم لصق الصورة بنجاح، جاري المعالجة...", "success");
        e.preventDefault();
        break;
      }
    }
  }

  // عرض الصورة الأصلية وبدء المعالجة
  function processSelectedFile(file) {
    if (!file.type.startsWith("image/")) {
      showAlert("يرجى اختيار ملف صورة صالح", "danger");
      return;
    }
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = function (e) {
      originalImage.src = e.target.result;
      uploadArea.classList.add("d-none");
      imagePreviewContainer.classList.remove("d-none");
      resetUIState();
      setTimeout(() => processFile(file), 300);
    };
    reader.readAsDataURL(file);
  }

  // إرسال الملف للخادم للمعالجة
  async function processFile(file, isFromFolder = false) {
    if (!file) {
      showAlert("يرجى اختيار صورة أولاً", "warning");
      return;
    }
    if (isProcessing && !isFromFolder) {
      return;
    }

    isProcessing = true;
    if (!isFromFolder) {
      loading.classList.remove("d-none");
      removeBgBtn.disabled = true;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/remove-bg/", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "فشل في معالجة الصورة");
      }
      const data = await response.json();
      processedImageFilename = data.filename;

      // تحميل الصورة المعالجة كـ Blob
      const imageResponse = await fetch(
        `/processed-image/${processedImageFilename}`
      );
      processedImageBlob = await imageResponse.blob();
      resultImage.src = URL.createObjectURL(processedImageBlob);

      resultImage.onload = () => {
        if (!isFromFolder) {
          resultPlaceholder.classList.add("d-none");
          imageEditorContainer.classList.remove("d-none");
          resultImage.classList.remove("d-none");
          imageEditorToolbar.classList.remove("d-none");
          downloadBtn.classList.remove("d-none");
          copyImageBtn.classList.remove("d-none");

          // إضافة للصجل
          addToHistory(processedImageFilename, file.name, processedImageBlob);
        }
      };
      return { success: true, filename: file.name, blob: processedImageBlob };
    } catch (error) {
      console.error("Error:", error);
      if (!isFromFolder) showAlert(error.message, "danger");
      return { success: false, filename: file.name, error: error.message };
    } finally {
      isProcessing = false;
      if (!isFromFolder) {
        loading.classList.add("d-none");
        removeBgBtn.disabled = false;
      }
    }
  }

  // بدء معالجة المجلد
  function startFolderProcessing() {
    resetApp();
    uploadArea.classList.add("d-none");
    folderProcessingArea.classList.remove("d-none");
    processedFolderImages.innerHTML = "";
    processedFolderData = [];
    currentFolderIndex = 0;
    updateFolderProgress();
    processNextFileInFolder();
  }

  // معالجة الصورة التالية في المجلد
  async function processNextFileInFolder() {
    if (currentFolderIndex >= folderFiles.length) {
      folderProgressStatus.textContent =
        "اكتملت المعالجة! سيتم إعادة تعيين الواجهة بعد 5 ثوانٍ.";
      // الانتظار 5 ثوان ثم إعادة تعيين الواجهة تلقائياً
      setTimeout(resetApp, 5000);
      return;
    }
    const file = folderFiles[currentFolderIndex];
    const result = await processFile(file, true);

    if (result.success) {
      // تنزيل الصورة تلقائياً
      const link = document.createElement("a");
      link.href = URL.createObjectURL(result.blob);
      link.download = `${result.filename.split(".")[0]}_no_bg.png`;
      link.click();
      URL.revokeObjectURL(link.href);
    }

    displayProcessedFolderImage(result);
    currentFolderIndex++;
    updateFolderProgress();
    setTimeout(processNextFileInFolder, 1000); // زيادة التأخير قليلاً لتجنب حظر المتصفح بسبب كثرة التنزيلات
  }

  // تحديث شريط التقدم للمجلد
  function updateFolderProgress() {
    const percentage = (currentFolderIndex / folderFiles.length) * 100;
    folderProgressBar.style.width = `${percentage}%`;
    folderProgressBar.textContent = `${Math.round(percentage)}%`;
    folderProgressStatus.textContent = `جاري معالجة الصورة ${currentFolderIndex} من ${folderFiles.length}...`;
  }

  // عرض الصورة المعالجة من المجلد
  function displayProcessedFolderImage(result) {
    const col = document.createElement("div");
    col.className = "col-6 col-md-4 col-lg-3";
    let content = "";
    if (result.success) {
      const imageUrl = URL.createObjectURL(result.blob);
      content = `
                <div class="card h-100 border-success">
                    <div class="card-body p-2 text-center d-flex flex-column justify-content-center">
                        <i class="fas fa-check-circle fa-2x text-success mb-2"></i>
                        <p class="card-text small text-truncate">${result.filename}</p>
                        <small class="text-muted">تم التحميل بنجاح</small>
                    </div>
                </div>
            `;
    } else {
      content = `
                <div class="card h-100 border-danger">
                    <div class="card-body p-2 text-center d-flex flex-column justify-content-center">
                        <i class="fas fa-times-circle fa-2x text-danger mb-2"></i>
                        <p class="card-text small text-truncate text-danger">${result.filename}</p>
                        <small class="text-muted">${result.error}</small>
                    </div>
                </div>
            `;
    }
    col.innerHTML = content;
    processedFolderImages.appendChild(col);
  }

  // تحميل الصورة الحالية
  function downloadImage() {
    if (!processedImageBlob) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(processedImageBlob);
    link.download = "no-bg-image.png";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  // نسخ الصورة الحالية
  async function copyImage() {
    if (!processedImageBlob) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ [processedImageBlob.type]: processedImageBlob }),
      ]);
      showAlert("تم نسخ الصورة إلى الحافظة بنجاح", "success");
    } catch (error) {
      console.error("Copy failed:", error);
      showAlert("فشل نسخ الصورة.", "danger");
    }
  }

  // إعادة تعيين التطبيق
  function resetApp() {
    selectedFile = null;
    processedImageFilename = null;
    processedImageBlob = null;
    isProcessing = false;
    fileInput.value = "";
    if (multipleFileInput) {
      multipleFileInput.value = "";
    }
    originalImage.src = "";
    resultImage.src = "";
    uploadArea.classList.remove("d-none");
    imagePreviewContainer.classList.add("d-none");
    folderProcessingArea.classList.add("d-none");
    resetUIState();
    resetEditorTransforms();
  }

  function resetUIState() {
    resultPlaceholder.classList.remove("d-none");
    imageEditorContainer.classList.add("d-none");
    resultImage.classList.add("d-none");
    imageEditorToolbar.classList.add("d-none");
    downloadBtn.classList.add("d-none");
    copyImageBtn.classList.add("d-none");
    removeBgBtn.disabled = false;
  }

  // ======== وظائف تعديل الصورة ========

  function applyEditorTransforms() {
    if (!editorState.isEditMode) {
      editorState.isEditMode = true;
      applyChangesBtn.classList.remove("d-none");
      cancelChangesBtn.classList.remove("d-none");
    }
    const {
      rotation,
      scale,
      flipX,
      flipY,
      brightness,
      contrast,
      positionX,
      positionY,
    } = editorState;
    const scaleX = flipX ? -1 : 1;
    const scaleY = flipY ? -1 : 1;
    resultImage.style.transform = `translate(${positionX}px, ${positionY}px) rotate(${rotation}deg) scale(${
      scale * scaleX
    }, ${scale * scaleY})`;
    resultImage.style.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
  }

  function resetEditorTransforms() {
    editorState = {
      ...editorState,
      rotation: 0,
      scale: 1,
      flipX: false,
      flipY: false,
      brightness: 100,
      contrast: 100,
      positionX: 0,
      positionY: 0,
    };
    applyEditorTransforms();
  }

  function cancelImageChanges() {
    editorState.isEditMode = false;
    applyChangesBtn.classList.add("d-none");
    cancelChangesBtn.classList.add("d-none");
    resetEditorTransforms();
    resultImage.style.transform = "none";
    resultImage.style.filter = "none";
  }

  // **التحسين الأهم: تطبيق التعديلات في المتصفح مباشرة**
  async function applyImageChanges() {
    if (!processedImageBlob) return;

    loading.classList.remove("d-none");

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    await new Promise((resolve) => {
      img.onload = resolve;
      img.src = URL.createObjectURL(processedImageBlob);
    });

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((editorState.rotation * Math.PI) / 180);
    const scaleX = editorState.flipX ? -1 : 1;
    const scaleY = editorState.flipY ? -1 : 1;
    ctx.scale(editorState.scale * scaleX, editorState.scale * scaleY);
    ctx.filter = `brightness(${editorState.brightness}%) contrast(${editorState.contrast}%)`;
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();

    canvas.toBlob((blob) => {
      processedImageBlob = blob;
      resultImage.src = URL.createObjectURL(processedImageBlob);
      cancelImageChanges(); // لإعادة ضبط واجهة المحرر
      loading.classList.add("d-none");
      showAlert("تم تطبيق التعديلات بنجاح.", "success");
    }, "image/png");
  }

  // ======== وظائف السجل (History) ========

  // تحميل السجل عند بدء التشغيل
  function loadHistory() {
    const savedHistory = localStorage.getItem("imageHistory");
    if (savedHistory) {
      imageHistory = JSON.parse(savedHistory);
      // تنظيف السجل من الصور القديمة (أكثر من ساعة)
      const now = Date.now();
      imageHistory = imageHistory.filter(
        (item) => now - item.timestamp < IMAGE_RETENTION_TIME
      );
      saveHistory();
      renderHistory();
    }
  }

  // حفظ السجل
  function saveHistory() {
    localStorage.setItem("imageHistory", JSON.stringify(imageHistory));
  }

  // إضافة للصجل
  function addToHistory(filename, originalName, blob) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const historyItem = {
        id: Date.now(),
        filename: filename,
        originalName: originalName,
        dataUrl: e.target.result,
        timestamp: Date.now(),
      };
      imageHistory.unshift(historyItem); // إضافة في البداية
      if (imageHistory.length > 10) imageHistory.pop(); // الاحتفاظ بآخر 10 فقط
      saveHistory();
      renderHistory();
    };
    reader.readAsDataURL(blob);
  }

  // عرض السجل
  function renderHistory() {
    if (!imageHistoryContainer) return;

    if (imageHistory.length === 0) {
      noHistoryMessage.classList.remove("d-none");
      return;
    }

    noHistoryMessage.classList.add("d-none");
    // تفريغ الحاوية باستثناء رسالة "لا توجد صور"
    const items = imageHistoryContainer.querySelectorAll(".history-item-col");
    items.forEach((item) => item.remove());

    imageHistory.forEach((item) => {
      const col = document.createElement("div");
      col.className = "col-6 col-md-4 col-lg-3 history-item-col fade-in";
      col.innerHTML = `
                <div class="card h-100 history-card" onclick="viewHistoryItem(${
                  item.id
                })">
                    <img src="${item.dataUrl}" class="card-img-top p-2" alt="${
        item.originalName
      }" style="height: 120px; object-fit: contain;">
                    <div class="card-body p-2">
                        <p class="card-text small text-truncate mb-0">${
                          item.originalName
                        }</p>
                        <small class="text-muted">${new Date(
                          item.timestamp
                        ).toLocaleTimeString()}</small>
                    </div>
                </div>
            `;
      imageHistoryContainer.appendChild(col);
    });
  }

  // عرض عنصر من السجل
  window.viewHistoryItem = function (id) {
    const item = imageHistory.find((i) => i.id === id);
    if (item) {
      resultImage.src = item.dataUrl;
      // تحويل dataUrl إلى Blob للاستخدام في التحميل والنسخ
      fetch(item.dataUrl)
        .then((res) => res.blob())
        .then((blob) => {
          processedImageBlob = blob;
          resultPlaceholder.classList.add("d-none");
          imageEditorContainer.classList.remove("d-none");
          resultImage.classList.remove("d-none");
          imageEditorToolbar.classList.remove("d-none");
          downloadBtn.classList.remove("d-none");
          copyImageBtn.classList.remove("d-none");
          imagePreviewContainer.classList.remove("d-none");
          uploadArea.classList.add("d-none");
          showAlert("تم استعادة الصورة من السجل.", "info");
        });
    }
  };

  // مسح السجل
  function clearHistory() {
    if (confirm("هل أنت متأكد من رغبتك في مسح سجل الصور؟")) {
      imageHistory = [];
      saveHistory();
      renderHistory();
      showAlert("تم مسح السجل بنجاح.", "success");
    }
  }

  // تحميل السجل عند بدء التشغيل
  loadHistory();

  // عرض تنبيه
  function showAlert(message, type) {
    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = "alert";
    alertDiv.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
    document
      .querySelector(".container")
      .insertBefore(alertDiv, document.querySelector(".container").firstChild);
    setTimeout(() => {
      alertDiv.classList.remove("show");
      setTimeout(() => alertDiv.remove(), 300);
    }, 5000);
  }
});
