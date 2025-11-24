export class ImageViewer {
    constructor(onImageFocus) {
        this.currentTopic = null;
        this.onImageFocus = onImageFocus;
        this.container = null;
    }

    render(topic = null) {
        this.currentTopic = topic;
        
        // Main Container
        const main = document.createElement('main');
        main.className = 'flex-1 h-full bg-darker relative overflow-hidden flex flex-col';
        this.container = main;

        if (!topic) {
            this.renderEmptyState(main);
        } else {
            this.renderGrid(main);
        }

        return main;
    }

    renderEmptyState(container) {
        container.innerHTML = `
            <div class="h-full flex flex-col items-center justify-center text-gray-600 animate-slide-in">
                <i class="fa-regular fa-folder-open text-6xl mb-4 opacity-50"></i>
                <p class="text-lg">Select a topic from the sidebar to view diagrams.</p>
            </div>
        `;
    }

    renderGrid(container) {
        console.log(`VERIFY: Rendering grid for topic: ${this.currentTopic.title}`);
        
        // Header Area
        const header = document.createElement('div');
        header.className = 'p-6 pb-2';
        header.innerHTML = `
            <h2 class="text-2xl font-bold text-white mb-1">${this.currentTopic.title}</h2>
            <p class="text-gray-400 text-sm">${this.currentTopic.description}</p>
        `;

        // Grid Area
        const grid = document.createElement('div');
        grid.className = 'flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6';

        if(this.currentTopic.images.length === 0) {
            grid.innerHTML = `<p class="text-gray-500 col-span-full text-center mt-10">No diagrams found in this folder.</p>`;
        }

        this.currentTopic.images.forEach(imgData => {
            const card = document.createElement('div');
            card.className = `
                bg-surface border border-gray-700 rounded-xl overflow-hidden hover:border-accent 
                transition-all duration-300 hover:shadow-lg group cursor-pointer h-64 flex flex-col
            `;
            
            card.innerHTML = `
                <div class="flex-1 bg-black/50 relative overflow-hidden flex items-center justify-center">
                    <img src="${imgData.src}" alt="${imgData.title}" 
                        class="max-w-full max-h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                        onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'text-red-500 text-xs p-4\\'>Image not found</div>'">
                    <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <i class="fa-solid fa-expand text-white opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-300 text-3xl drop-shadow-lg"></i>
                    </div>
                </div>
                <div class="p-3 bg-surface z-10 border-t border-gray-700">
                    <h3 class="font-semibold text-sm truncate text-gray-200">${imgData.title}</h3>
                </div>
            `;

            card.addEventListener('click', () => {
                this.openFullscreen(imgData);
            });

            grid.appendChild(card);
        });

        container.innerHTML = '';
        container.appendChild(header);
        container.appendChild(grid);
    }

    // ==========================================
    //  ZOOM & PAN LOGIC IMPLEMENTATION
    // ==========================================
    openFullscreen(imgData) {
        console.log(`VERIFY: Opening fullscreen for: ${imgData.title}`);
        this.onImageFocus(true);

        // Variables for Zoom/Pan state
        let scale = 1;
        let pannedX = 0;
        let pannedY = 0;
        let isDragging = false;
        let startX = 0;
        let startY = 0;

        // Overlay - FIX: Changed from 'absolute' to 'fixed' to ignore Sidebar space
        const overlay = document.createElement('div');
        overlay.className = `
            fixed inset-0 bg-darker/98 z-[9999] flex items-center justify-center 
            overflow-hidden animate-slide-in select-none
        `;

        // Image Wrapper
        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'transition-transform duration-75 ease-out cursor-grab active:cursor-grabbing will-change-transform flex items-center justify-center w-full h-full';
        
        const imgContent = document.createElement('img');
        imgContent.src = imgData.src;
        // FIX: Removed max constraints that might collapse SVGs, relying on flex parent
        imgContent.className = 'max-w-none max-h-none shadow-2xl pointer-events-none bg-white/5 rounded-sm'; 
        // Initial sizing to fit screen reasonably
        imgContent.style.maxWidth = '90vw';
        imgContent.style.maxHeight = '90vh';

        // DEBUGGING: Image Load Events
        imgContent.onload = () => {
            console.log(`VERIFY SUCCESS: Image loaded. Natural Size: ${imgContent.naturalWidth}x${imgContent.naturalHeight}`);
            if (imgContent.naturalWidth === 0) {
                 console.error("VERIFY ERROR: Image loaded but has 0 width (Corrupt SVG or missing attributes?)");
            }
        };

        imgContent.onerror = () => {
            console.error(`VERIFY ERROR: FAILED to load image at: ${imgData.src}`);
            alert(`Error: Could not load image.\nPath: ${imgData.src}\nCheck if the file exists and the name matches exactly.`);
            overlay.remove(); // Close on error
        };
        
        imgWrapper.appendChild(imgContent);
        overlay.appendChild(imgWrapper);

        // --- Controls UI ---
        
        // 1. Close Button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'fixed top-6 right-6 text-white text-4xl hover:text-red-500 transition-colors z-[10000] drop-shadow-md bg-black/50 rounded-full w-12 h-12 flex items-center justify-center cursor-pointer';
        closeBtn.innerHTML = '<i class="fa-solid fa-times"></i>';

        // 2. Reset Zoom Button
        const resetBtn = document.createElement('button');
        resetBtn.className = 'fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-surface border border-gray-600 text-white px-4 py-2 rounded-full shadow-xl hover:bg-gray-700 transition-all z-[10000] flex items-center gap-2 text-sm cursor-pointer';
        resetBtn.innerHTML = '<i class="fa-solid fa-compress"></i> Reset View';
        resetBtn.onclick = (e) => {
            e.stopPropagation();
            scale = 1; pannedX = 0; pannedY = 0;
            updateTransform();
        };
        overlay.appendChild(resetBtn);

        // --- Functions ---

        const updateTransform = () => {
            imgWrapper.style.transform = `translate(${pannedX}px, ${pannedY}px) scale(${scale})`;
            // Removed noisy log, uncomment if needed for physics debug
            // console.log(`VERIFY: Transform: scale=${scale.toFixed(2)}, x=${pannedX}, y=${pannedY}`);
        };

        const closeHandler = () => {
            console.log("VERIFY: Closing fullscreen");
            overlay.remove();
            this.onImageFocus(false);
        };

        closeBtn.onclick = closeHandler;

        // --- Event Listeners for Zoom/Pan ---

        // A. Wheel Zoom
        overlay.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY * -0.001;
            const newScale = Math.min(Math.max(0.1, scale + delta), 10); // Expanded zoom limits
            scale = newScale;
            updateTransform();
        });

        // B. Dragging (Panning)
        overlay.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX - pannedX;
            startY = e.clientY - pannedY;
            imgWrapper.style.cursor = 'grabbing';
        });

        overlay.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            pannedX = e.clientX - startX;
            pannedY = e.clientY - startY;
            updateTransform();
        });

        const stopDrag = () => {
            isDragging = false;
            imgWrapper.style.cursor = 'grab';
        };

        overlay.addEventListener('mouseup', stopDrag);
        overlay.addEventListener('mouseleave', stopDrag);

        // Append everything
        overlay.appendChild(closeBtn);
        // Important: Append to BODY to break out of all containers
        document.body.appendChild(overlay);
    }
}