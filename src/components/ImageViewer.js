// src/components/ImageViewer.js
// ======== Start Full File ========

import { FirebaseService } from '../services/firebase.js';

export class ImageViewer {
    constructor(onImageFocus) {
        this.currentTopic = null;
        this.currentImages = [];
        this.onImageFocus = onImageFocus;
        this.container = null;
    }

    render() {
        console.log("VERIFY: [ImageViewer] Rendering main container.");
        const main = document.createElement('main');
        main.className = 'flex-1 h-full bg-darker relative overflow-hidden flex flex-col';
        this.container = main;
        this.renderEmptyState();
        return main;
    }

    async loadTopic(topic) {
        console.log(`VERIFY: [ImageViewer] Loading topic: ${topic.title}`);
        this.currentTopic = topic;
        this.container.innerHTML = `
            <div class="flex-1 flex flex-col items-center justify-center text-accent animate-pulse">
                <i class="fa-solid fa-circle-notch fa-spin text-4xl mb-4"></i>
                <p>Cargando imágenes...</p>
            </div>`;

        try {
            this.currentImages = await FirebaseService.getImages(topic.id);
            this.renderGrid();
        } catch (e) {
            this.container.innerHTML = `<p class="text-red-500 text-center mt-10">Error cargando imágenes.</p>`;
        }
    }

    renderEmptyState() {
        this.container.innerHTML = `
            <div class="h-full flex flex-col items-center justify-center text-gray-600 animate-slide-in">
                <i class="fa-regular fa-folder-open text-6xl mb-4 opacity-50"></i>
                <p class="text-lg">Selecciona un tema del menú lateral.</p>
            </div>
        `;
    }

    renderGrid() {
        console.log(`VERIFY: [ImageViewer] Rendering grid with ${this.currentImages.length} images.`);
        this.container.innerHTML = '';

        const header = document.createElement('div');
        header.className = 'p-6 pb-2 flex justify-between items-end border-b border-gray-800 bg-darker z-10';
        header.innerHTML = `
            <div>
                <h2 class="text-2xl font-bold text-white mb-1">${this.currentTopic.title}</h2>
                <p class="text-gray-400 text-sm">${this.currentTopic.description || 'Gestión de esquemas'}</p>
            </div>
        `;

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.className = 'hidden';
        fileInput.onchange = (e) => this.handleUpload(e);

        const uploadBtn = document.createElement('button');
        uploadBtn.className = 'bg-accent hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all cursor-pointer text-sm font-semibold';
        uploadBtn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Subir Imagen`;
        uploadBtn.onclick = () => fileInput.click();

        header.appendChild(uploadBtn);
        header.appendChild(fileInput);

        const grid = document.createElement('div');
        grid.className = 'flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 content-start pb-20';

        this.currentImages.forEach(imgData => {
            grid.appendChild(this.createImageCard(imgData));
        });

        this.container.appendChild(header);
        this.container.appendChild(grid);
    }

    createImageCard(imgData) {
        const card = document.createElement('div');
        card.className = `bg-surface border border-gray-700 rounded-xl overflow-hidden hover:border-accent transition-all duration-300 hover:shadow-xl group flex flex-col h-[340px]`;
        
        // --- LÓGICA DE DATOS REALES ---
        // MIME Type: "image/png" -> "PNG"
        let typeLabel = "IMG (Legacy)";
        if (imgData.type) {
            typeLabel = imgData.type.split('/')[1].toUpperCase();
        }

        const sizeLabel = imgData.size ? this.formatBytes(imgData.size) : 'Peso Desconocido';

        card.innerHTML = `
            <div class="flex-1 bg-black/40 relative overflow-hidden flex items-center justify-center cursor-pointer image-trigger h-48">
                <img src="${imgData.src}" alt="${imgData.title}" class="max-w-full max-h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500">
                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <i class="fa-solid fa-expand text-white opacity-0 group-hover:opacity-100 text-3xl drop-shadow-lg transform scale-50 group-hover:scale-100 transition-all"></i>
                </div>
            </div>
            
            <div class="p-3 bg-surface z-10 border-t border-gray-700 flex flex-col gap-2">
                <div class="flex justify-between items-start gap-2">
                    <h3 class="font-semibold text-sm text-gray-200 outline-none hover:text-white border border-transparent hover:border-gray-600 rounded px-1 transition-all flex-1 break-words line-clamp-2" contenteditable="true">${imgData.title}</h3>
                    <div class="flex gap-1 shrink-0">
                        <button class="text-gray-400 hover:text-accent download-btn p-1.5 rounded-md hover:bg-gray-700 transition-colors" title="Descargar Original"><i class="fa-solid fa-download"></i></button>
                        <button class="text-gray-400 hover:text-red-500 delete-btn p-1.5 rounded-md hover:bg-red-500/10 transition-colors" title="Eliminar"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </div>
                <div class="flex items-center gap-3 text-[10px] text-gray-500 border-t border-gray-700/50 pt-2 mt-1 uppercase tracking-wider font-bold">
                    <span class="bg-gray-800 px-2 py-0.5 rounded text-accent border border-gray-700">${typeLabel}</span>
                    <span><i class="fa-regular fa-hdd mr-1"></i>${sizeLabel}</span>
                </div>
            </div>
        `;

        // Eventos con LOGS descriptivos
        card.querySelector('.image-trigger').onclick = () => {
            console.log(`VERIFY: [UI] Opening Fullscreen: ${imgData.title}`);
            this.openFullscreen(imgData);
        };

        card.querySelector('.download-btn').onclick = (e) => {
            e.stopPropagation();
            console.log(`VERIFY: [UI] Download requested: ${imgData.fileName}`);
            this.downloadImage(imgData.src, imgData.fileName);
        };

        card.querySelector('.delete-btn').onclick = async (e) => {
            e.stopPropagation();
            if(confirm('¿Eliminar esta imagen permanentemente?')) {
                console.log(`VERIFY: [UI] Delete confirmed for image: ${imgData.id}`);
                await FirebaseService.deleteImage(imgData.id, imgData.storagePath);
                this.loadTopic(this.currentTopic);
            }
        };

        const titleEl = card.querySelector('h3');
        titleEl.onblur = async () => {
            const newText = titleEl.innerText.trim();
            if(newText !== imgData.title && newText.length > 0) {
                console.log(`VERIFY: [UI] Renaming image to: ${newText}`);
                await FirebaseService.renameImage(imgData.id, newText);
            }
        };

        return card;
    }

    async handleUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        console.log(`VERIFY: [UI] Upload triggered for file: ${file.name}`);

        const btn = this.container.querySelector('button');
        btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Subiendo...`;
        btn.disabled = true;

        try {
            await FirebaseService.uploadImage(file, this.currentTopic.id);
            await this.loadTopic(this.currentTopic);
        } catch (error) {
            alert("Error: " + error.message);
            btn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Subir Imagen`;
            btn.disabled = false;
        }
    }

    openFullscreen(imgData) {
        this.onImageFocus(true);
        const overlay = document.createElement('div');
        overlay.className = `fixed inset-0 bg-darker/98 z-[9999] flex flex-col animate-slide-in select-none overflow-hidden`;

        const viewport = document.createElement('div');
        viewport.className = 'flex-1 relative overflow-hidden w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center';
        
        const imgContent = document.createElement('img');
        imgContent.src = imgData.src;
        imgContent.className = 'absolute origin-center transition-transform duration-75 ease-out shadow-2xl';
        imgContent.draggable = false; 

        let state = { scale: 1, pannedX: 0, pannedY: 0, isDragging: false, startX: 0, startY: 0 };

        const closeBtn = document.createElement('button');
        closeBtn.className = 'fixed top-6 right-6 text-white text-4xl hover:text-red-500 transition-colors z-[10000] drop-shadow-lg cursor-pointer opacity-70 hover:opacity-100';
        closeBtn.innerHTML = '<i class="fa-solid fa-times"></i>';
        closeBtn.onclick = () => { 
            console.log("VERIFY: [UI] Closing Fullscreen.");
            overlay.remove(); 
            this.onImageFocus(false); 
        };

        const bottomBar = document.createElement('div');
        bottomBar.className = 'fixed bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-[10000]';

        const resetBtn = this.createFab('fa-compress', 'Reset Zoom');
        const downloadBtn = this.createFab('fa-download', 'Download');
        
        resetBtn.onclick = () => { state.scale = state.initialScale || 1; state.pannedX = 0; state.pannedY = 0; updateTransform(); };
        downloadBtn.onclick = () => this.downloadImage(imgData.src, imgData.fileName);

        bottomBar.appendChild(resetBtn);
        bottomBar.appendChild(downloadBtn);

        imgContent.onload = () => {
            const viewportW = viewport.clientWidth;
            const viewportH = viewport.clientHeight;
            const initialScale = Math.min((viewportW - 80) / imgContent.naturalWidth, (viewportH - 80) / imgContent.naturalHeight, 1); 
            state.initialScale = initialScale;
            state.scale = initialScale;
            updateTransform();
            console.log(`VERIFY: [ImageViewer] Rendered at High-Quality. Scale: ${initialScale.toFixed(3)}`);
        };

        const updateTransform = () => {
            imgContent.style.transform = `translate3d(${state.pannedX}px, ${state.pannedY}px, 0) scale(${state.scale})`;
        };

        viewport.onwheel = (e) => {
            e.preventDefault();
            state.scale = Math.min(Math.max(0.05, state.scale + (e.deltaY * -0.001)), 20);
            updateTransform();
        };

        viewport.onmousedown = (e) => { 
            state.isDragging = true; 
            state.startX = e.clientX - state.pannedX; 
            state.startY = e.clientY - state.pannedY; 
            viewport.style.cursor = 'grabbing';
        };

        window.onmousemove = (e) => { 
            if(!state.isDragging) return; 
            state.pannedX = e.clientX - state.startX; 
            state.pannedY = e.clientY - state.startY; 
            updateTransform(); 
        };

        window.onmouseup = () => { state.isDragging = false; viewport.style.cursor = 'grab'; };

        viewport.appendChild(imgContent);
        overlay.appendChild(viewport);
        overlay.appendChild(closeBtn);
        overlay.appendChild(bottomBar);
        document.body.appendChild(overlay);
    }

    createFab(icon, title) {
        const btn = document.createElement('button');
        btn.className = 'bg-surface/80 backdrop-blur border border-gray-600 text-white w-12 h-12 rounded-full shadow-xl hover:bg-gray-700 hover:border-accent transition-all flex items-center justify-center text-lg cursor-pointer';
        btn.title = title;
        btn.innerHTML = `<i class="fa-solid ${icon}"></i>`;
        return btn;
    }

    formatBytes(bytes) {
        if (!+bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    }

    async downloadImage(url, filename) {
        try {
            const link = document.createElement("a");
            link.href = url;
            link.download = filename; 
            link.target = "_blank";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            console.log("VERIFY: [System] Direct Download Executed.");
        } catch (e) {
            window.open(url, '_blank');
        }
    }
}
// ======== End Full File ========