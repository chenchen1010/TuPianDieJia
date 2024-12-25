document.addEventListener('DOMContentLoaded', () => {
    const baseImageInput = document.getElementById('baseImage');
    const overlayImageInput = document.getElementById('overlayImage');
    const baseImagesList = document.getElementById('baseImagesList');
    const overlayPreview = document.getElementById('overlayPreview');
    const resultPreview = document.getElementById('resultPreview');
    const downloadBtn = document.getElementById('downloadBtn');

    let baseImages = []; // 存储所有底图
    let selectedBaseImage = null; // 当前选中的底图
    let overlayImages = []; // 存储所有素材图
    let selectedOverlays = new Set(); // 存储选中的素材图索引

    // 添加图片处理函数
    function processImage(originalImage) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 计算正方形尺寸（取较短边）
        const size = Math.min(originalImage.width, originalImage.height);
        canvas.width = size;
        canvas.height = size;
        
        // 计算裁剪位置（居中裁剪）
        const x = (originalImage.width - size) / 2;
        const y = (originalImage.height - size) / 2;
        
        // 绘制裁剪后的图片
        ctx.drawImage(originalImage, 
            x, y,            // 源图片裁剪起始坐标
            size, size,      // 源图片裁剪尺寸
            0, 0,            // 目标绘制起始坐标
            size, size       // 目标绘制尺寸
        );
        
        // 创建新的图片对象
        const processedImage = new Image();
        processedImage.src = canvas.toDataURL('image/png');
        
        return new Promise((resolve) => {
            processedImage.onload = () => resolve(processedImage);
        });
    }

    // 修改处理底图上传的函数
    function handleBaseImagesUpload(files) {
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const img = new Image();
                img.onload = async () => {
                    // 处理图片为1:1比例
                    const processedImg = await processImage(img);
                    
                    // 创建预览容器
                    const previewContainer = document.createElement('div');
                    previewContainer.className = 'preview-image';
                    
                    // 创建删除按钮
                    const deleteBtn = document.createElement('div');
                    deleteBtn.className = 'delete-btn';
                    deleteBtn.innerHTML = '×';
                    deleteBtn.onclick = (e) => {
                        e.stopPropagation(); // 阻止事件冒泡，避免触发选中事件
                        
                        // 获取当前图片在数组中的索引
                        const index = baseImages.indexOf(processedImg);
                        if (index > -1) {
                            // 从数组中移除
                            baseImages.splice(index, 1);
                            // 从预览列表中移除
                            previewContainer.remove();
                            
                            // 如果删除的是当前选中的图片
                            if (selectedBaseImage === processedImg) {
                                selectedBaseImage = null;
                                // 如果还有其他图片，选中第一张
                                if (baseImages.length > 0) {
                                    const firstPreview = baseImagesList.firstElementChild;
                                    firstPreview.click();
                                }
                            }
                            
                            // 更新合成结果
                            if (selectedOverlays.size > 0) {
                                mergeImages();
                            }
                        }
                    };
                    
                    // 创建预览图片
                    const previewImg = document.createElement('img');
                    previewImg.src = processedImg.src;
                    
                    // 添加删除按钮
                    previewContainer.appendChild(deleteBtn);
                    previewContainer.appendChild(previewImg);
                    
                    // 添加点击选择功能
                    previewContainer.addEventListener('click', () => {
                        // 移除其他图片的选中状态
                        document.querySelectorAll('.preview-image.selected')
                            .forEach(el => el.classList.remove('selected'));
                        
                        // 选中当前图片
                        previewContainer.classList.add('selected');
                        selectedBaseImage = processedImg;
                        
                        // 如果已有素材图，则立即合成
                        if (overlayImages.length > 0) {
                            mergeImages();
                        }
                    });
                    
                    // 添加到预览列表最前面
                    baseImagesList.insertBefore(previewContainer, baseImagesList.firstChild);
                    
                    // 保存图片对象到数组最前面
                    baseImages.unshift(processedImg);
                    
                    // 移除之前选中的状态
                    document.querySelectorAll('.preview-image.selected')
                        .forEach(el => el.classList.remove('selected'));
                    
                    // 选中新上传的图片
                    previewContainer.classList.add('selected');
                    selectedBaseImage = processedImg;
                    
                    // 如果已有选中的素材图，立即合成
                    if (selectedOverlays.size > 0) {
                        mergeImages();
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // 修改素材图上传处理函数
    function handleOverlayImagesUpload(files) {
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    // 创建预览容器
                    const overlayItem = document.createElement('div');
                    overlayItem.className = 'overlay-item';
                    
                    // 创建预览图片容器
                    const previewContainer = document.createElement('div');
                    previewContainer.className = 'preview-image';
                    
                    // 创建预览图片
                    const previewImg = document.createElement('img');
                    previewImg.src = e.target.result;
                    previewContainer.appendChild(previewImg);
                    
                    // 创建复选框
                    const checkbox = document.createElement('div');
                    checkbox.className = 'checkbox';
                    
                    // 保存素材图对象到数组最前面
                    overlayImages.unshift(img);
                    
                    // 创建删除按钮
                    const deleteBtn = document.createElement('div');
                    deleteBtn.className = 'delete-btn';
                    deleteBtn.innerHTML = '×';
                    deleteBtn.onclick = (e) => {
                        e.stopPropagation(); // 阻止事件冒泡，避免触发选中事件
                        
                        // 获取当前元素在列表中的位置
                        const overlaysList = document.getElementById('overlayImagesList');
                        const currentIndex = Array.from(overlaysList.children).indexOf(overlayItem);
                        
                        // 从数组中移除
                        overlayImages.splice(currentIndex, 1);
                        // 从选中集合中移除
                        selectedOverlays.delete(currentIndex);
                        // 更新其他素材的选中状态索引
                        const newSelectedOverlays = new Set();
                        selectedOverlays.forEach(index => {
                            if (index < currentIndex) {
                                newSelectedOverlays.add(index);
                            } else {
                                newSelectedOverlays.add(index - 1);
                            }
                        });
                        selectedOverlays = newSelectedOverlays;
                        
                        // 从预览列表中移除
                        overlayItem.remove();
                        
                        // 更新合成结果
                        if (baseImages.length > 0) {
                            mergeImages();
                        }
                    };
                    
                    // 添加删除按钮
                    overlayItem.appendChild(deleteBtn);
                    overlayItem.appendChild(previewContainer);
                    overlayItem.appendChild(checkbox);
                    
                    // 添加点击选择功能
                    overlayItem.addEventListener('click', () => {
                        // 获取当前元素在列表中的位置
                        const overlaysList = document.getElementById('overlayImagesList');
                        const currentIndex = Array.from(overlaysList.children).indexOf(overlayItem);
                        
                        // 切换选中状态
                        if (selectedOverlays.has(currentIndex)) {
                            selectedOverlays.delete(currentIndex);
                            overlayItem.classList.remove('selected');
                        } else {
                            selectedOverlays.add(currentIndex);
                            overlayItem.classList.add('selected');
                        }
                        
                        // 只要有底图，就立即重新合成
                        if (baseImages.length > 0) {
                            mergeImages();
                        }
                    });
                    
                    // 添加到预览列表最前面
                    const overlayImagesList = document.getElementById('overlayImagesList');
                    overlayImagesList.insertBefore(overlayItem, overlayImagesList.firstChild);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // 修改合并图片函数
    function mergeImages() {
        const mergedImagesGrid = document.getElementById('mergedImagesGrid');
        mergedImagesGrid.innerHTML = '';
        
        // 如果没有选中的素材图，禁用下载按钮并返回
        if (selectedOverlays.size === 0) {
            downloadBtn.disabled = true;
            return;
        }
        
        // 如果没有底图，返回
        if (baseImages.length === 0) return;
        
        const mergedImages = [];
        
        // 对每个底图
        baseImages.forEach((baseImage, baseIndex) => {
            // 创建画布
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = baseImage.width;
            canvas.height = baseImage.height;

            // 绘制底图
            ctx.drawImage(baseImage, 0, 0);

            // 将选中的素材图索引转换为数组并排序，确保叠加顺序一致
            const selectedOverlaysArray = Array.from(selectedOverlays).sort((a, b) => b - a);
            
            // 按顺序叠加每个选中的素材图
            selectedOverlaysArray.forEach(overlayIndex => {
                const overlayImage = overlayImages[overlayIndex];
                
                // 计算素材图的缩放尺寸
                let overlayWidth = overlayImage.width;
                let overlayHeight = overlayImage.height;
                
                const scale = Math.min(
                    baseImage.width / overlayWidth,
                    baseImage.height / overlayHeight
                );
                
                overlayWidth *= scale;
                overlayHeight *= scale;

                // 计算居中位置
                const x = (canvas.width - overlayWidth) / 2;
                const y = (canvas.height - overlayHeight) / 2;

                // 绘制缩放后的素材图
                ctx.drawImage(overlayImage, 
                    0, 0, overlayImage.width, overlayImage.height,
                    x, y, overlayWidth, overlayHeight
                );
            });

            // 存储合成结果
            mergedImages.push({
                data: canvas.toDataURL('image/png').split(',')[1],
                index: mergedImages.length + 1
            });

            // 创建预览项
            const mergedItem = document.createElement('div');
            mergedItem.className = 'merged-image-item';

            const previewContainer = document.createElement('div');
            previewContainer.className = 'preview-image';

            const resultImage = document.createElement('img');
            resultImage.src = canvas.toDataURL('image/png');
            previewContainer.appendChild(resultImage);

            mergedItem.appendChild(previewContainer);
            mergedImagesGrid.appendChild(mergedItem);
        });

        // 启用下载按钮
        downloadBtn.disabled = false;
        
        // 设置批量下载功能（创建压缩包）
        downloadBtn.onclick = async () => {
            const zip = new JSZip();
            
            mergedImages.forEach(({data, index}) => {
                zip.file(`merged-image-${index}.png`, data, {base64: true});
            });
            
            try {
                const content = await zip.generateAsync({
                    type: 'blob',
                    compression: 'DEFLATE',
                    compressionOptions: {
                        level: 9
                    }
                });
                
                const link = document.createElement('a');
                link.href = URL.createObjectURL(content);
                link.download = 'merged-images.zip';
                link.click();
                
                setTimeout(() => {
                    URL.revokeObjectURL(link.href);
                }, 1000);
            } catch (err) {
                console.error('创建压缩包时出错:', err);
                alert('下载失败，请重试');
            }
        };
    }

    // 监听文件上传
    baseImageInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleBaseImagesUpload(e.target.files);
        }
    });

    overlayImageInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleOverlayImagesUpload(e.target.files);
        }
    });

    // 修改拖放处理函数
    function setupDragAndDrop(element, isBase) {
        element.addEventListener('dragover', (e) => {
            e.preventDefault();
            element.style.backgroundColor = 'rgba(0, 122, 255, 0.1)';
        });

        element.addEventListener('dragleave', (e) => {
            e.preventDefault();
            element.style.backgroundColor = '';
        });

        element.addEventListener('drop', (e) => {
            e.preventDefault();
            element.style.backgroundColor = '';
            const files = Array.from(e.dataTransfer.files).filter(file => 
                file.type.startsWith('image/')
            );
            if (files.length > 0) {
                if (isBase) {
                    handleBaseImagesUpload(files);
                } else {
                    handleOverlayImagesUpload(files);
                }
            }
        });
    }

    // 设置拖放区域
    setupDragAndDrop(document.getElementById('baseImageUpload'), true);
    setupDragAndDrop(document.getElementById('overlayImageUpload'), false);
}); 