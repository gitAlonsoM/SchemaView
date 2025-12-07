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

    // Render inicial del contenedor
    render() {
        const main = document.createElement('main');
        main.className = 'flex-1 h-full bg-darker relative overflow-hidden flex flex-col';
        this.container = main;
        this.renderEmptyState();
        return main;
    }

    // Carga asíncrona de datos
    async loadTopic(topic) {
        this.currentTopic = topic;
        this.container.innerHTML = ''; 
        
        // Spinner de carga
        this.container.innerHTML = `
            <div class="flex-1 flex flex-col items-center justify-center text-accent animate-pulse">
                <i class="fa-solid fa-circle-notch fa-spin text-4xl mb-4"></i>
                <p>Cargando imágenes...</p>
            </div>`;

        try {
            this.currentImages = await FirebaseService.getImages(topic.id);
            this.renderGrid();
        } catch (e) {
            console.error(e);
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
        this.container.innerHTML = '';

        // --- HEADER CON BOTÓN DE SUBIDA ---
        const header = document.createElement('div');
        header.className = 'p-6 pb-2 flex justify-between items-end border-b border-gray-800 bg-darker z-10';
        
        const titleGroup = document.createElement('div');
        titleGroup.innerHTML = `
            <h2 class="text-2xl font-bold text-white mb-1">${this.currentTopic.title}</h2>
            <p class="text-gray-400 text-sm">${this.currentTopic.description || 'Gestión de esquemas'}</p>
        `;

        // Input oculto y botón
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.className = 'hidden';
        fileInput.onchange = (e) => this.handleUpload(e);

        const uploadBtn = document.createElement('button');
        uploadBtn.className = 'bg-accent hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all cursor-pointer text-sm font-semibold';
        uploadBtn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Subir Imagen`;
        uploadBtn.onclick = () => fileInput.click();

        header.appendChild(titleGroup);
        header.appendChild(uploadBtn);
        header.appendChild(fileInput);

        // --- GRID DE IMÁGENES ---
        const grid = document.createElement('div');
        grid.className = 'flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 content-start';

        if(this.currentImages.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center text-gray-500 mt-10 border-2 border-dashed border-gray-800 rounded-xl p-10">
                    <i class="fa-solid fa-cloud-upload text-4xl mb-3 opacity-50"></i>
                    <p>Carpeta vacía. ¡Sube tu primer esquema!</p>
                </div>`;
        }

        this.currentImages.forEach(imgData => {
            grid.appendChild(this.createImageCard(imgData));
        });

        this.container.appendChild(header);
        this.container.appendChild(grid);
    }

    createImageCard(imgData) {
        const card = document.createElement('div');
        card.className = `bg-surface border border-gray-700 rounded-xl overflow-hidden hover:border-accent transition-all duration-300 hover:shadow-xl group flex flex-col h-72`;
        
        card.innerHTML = `
            <div class="flex-1 bg-black/40 relative overflow-hidden flex items-center justify-center cursor-pointer image-trigger">
                <img src="${imgData.src}" alt="${imgData.title}" 
                    class="max-w-full max-h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500">
                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <i class="fa-solid fa-expand text-white opacity-0 group-hover:opacity-100 text-3xl drop-shadow-lg transform scale-50 group-hover:scale-100 transition-all"></i>
                </div>
            </div>
            
            <div class="p-3 bg-surface z-10 border-t border-gray-700 flex justify-between items-center gap-2">
                <div class="flex-1 min-w-0">
                    <h3 class="font-semibold text-sm truncate text-gray-200 outline-none hover:text-white border border-transparent hover:border-gray-600 rounded px-1 transition-all" 
                        contenteditable="true" 
                        title="Clic para renombrar">${imgData.title}</h3>
                </div>
                <button class="text-gray-500 hover:text-red-500 transition-colors delete-btn p-2 rounded-md hover:bg-red-500/10" title="Eliminar">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `;

        // Eventos
        card.querySelector('.image-trigger').addEventListener('click', () => this.openFullscreen(imgData));

        // Borrar
        card.querySelector('.delete-btn').addEventListener('click', async (e) => {
            if(confirm('¿Seguro que quieres eliminar esta imagen permanentemente?')) {
                const btn = e.target.closest('button');
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                await FirebaseService.deleteImage(imgData.id, imgData.storagePath);
                this.loadTopic(this.currentTopic); // Refrescar
            }
        });

        // Renombrar
        const titleEl = card.querySelector('h3');
        titleEl.addEventListener('blur', async () => {
            const newText = titleEl.innerText.trim();
            if(newText !== imgData.title && newText.length > 0) {
                await FirebaseService.renameImage(imgData.id, newText);
            } else {
                titleEl.innerText = imgData.title;
            }
        });
        titleEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); titleEl.blur(); }
        });

        return card;
    }

    async handleUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const btn = this.container.querySelector('button');
        const originalContent = btn.innerHTML;
        btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Subiendo...`;
        btn.disabled = true;
        btn.classList.add('opacity-75');

        try {
            await FirebaseService.uploadImage(file, this.currentTopic.id);
            await this.loadTopic(this.currentTopic); // Recargar grid
        } catch (error) {
            alert("Error al subir: " + error.message);
            btn.innerHTML = originalContent;
            btn.disabled = false;
            btn.classList.remove('opacity-75');
        }
    }

    // ==========================================
    //  ZOOM LOGIC (FULLSCREEN)
    // ==========================================
    openFullscreen(imgData) {
        this.onImageFocus(true);
        let scale = 1, pannedX = 0, pannedY = 0;
        let isDragging = false, startX = 0, startY = 0;

        const overlay = document.createElement('div');
        overlay.className = `fixed inset-0 bg-darker/98 z-[9999] flex items-center justify-center overflow-hidden animate-slide-in select-none`;

        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'transition-transform duration-75 ease-out cursor-grab active:cursor-grabbing will-change-transform flex items-center justify-center w-full h-full';
        
        const imgContent = document.createElement('img');
        imgContent.src = imgData.src;
        imgContent.className = 'max-w-none max-h-none shadow-2xl pointer-events-none bg-white/5 rounded-sm'; 
        imgContent.style.maxWidth = '90vw';
        imgContent.style.maxHeight = '90vh';
        
        imgWrapper.appendChild(imgContent);
        overlay.appendChild(imgWrapper);

        // UI Controls
        const closeBtn = document.createElement('button');
        closeBtn.className = 'fixed top-6 right-6 text-white text-4xl hover:text-red-500 transition-colors z-[10000] drop-shadow-md bg-black/50 rounded-full w-12 h-12 flex items-center justify-center cursor-pointer';
        closeBtn.innerHTML = '<i class="fa-solid fa-times"></i>';

        const resetBtn = document.createElement('button');
        resetBtn.className = 'fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-surface border border-gray-600 text-white px-4 py-2 rounded-full shadow-xl hover:bg-gray-700 transition-all z-[10000] flex items-center gap-2 text-sm cursor-pointer';
        resetBtn.innerHTML = '<i class="fa-solid fa-compress"></i> Restablecer';
        
        // Handlers
        const updateTransform = () => imgWrapper.style.transform = `translate(${pannedX}px, ${pannedY}px) scale(${scale})`;
        
        const closeHandler = () => { overlay.remove(); this.onImageFocus(false); };
        closeBtn.onclick = closeHandler;
        
        resetBtn.onclick = (e) => { e.stopPropagation(); scale = 1; pannedX = 0; pannedY = 0; updateTransform(); };

        // Zoom/Pan Events
        overlay.addEventListener('wheel', (e) => {
            e.preventDefault();
            scale = Math.min(Math.max(0.1, scale + (e.deltaY * -0.001)), 10);
            updateTransform();
        });
        overlay.addEventListener('mousedown', (e) => { isDragging = true; startX = e.clientX - pannedX; startY = e.clientY - pannedY; imgWrapper.style.cursor = 'grabbing'; });
        overlay.addEventListener('mousemove', (e) => { if(!isDragging)return; e.preventDefault(); pannedX = e.clientX - startX; pannedY = e.clientY - startY; updateTransform(); });
        const stopDrag = () => { isDragging = false; imgWrapper.style.cursor = 'grab'; };
        overlay.addEventListener('mouseup', stopDrag);
        overlay.addEventListener('mouseleave', stopDrag);

        overlay.appendChild(closeBtn);
        overlay.appendChild(resetBtn);
        document.body.appendChild(overlay);
    }
}
// ======== End Full File ========