// src/components/Sidebar.js
// ======== Start Full File ========

export class Sidebar {
    constructor(topics, onTopicSelect, onCreateTopic, onRenameTopic, onDeleteTopic) {
        this.topics = topics;
        this.onTopicSelect = onTopicSelect;
        this.onCreateTopic = onCreateTopic;
        this.onRenameTopic = onRenameTopic;
        this.onDeleteTopic = onDeleteTopic;
        this.element = null;
        this.listElement = null; // Referencia para repintar la lista

        // Cargar favoritos del caché local (Array de IDs)
        // El índice 0 es el más reciente (Posición #1)
        this.favorites = JSON.parse(localStorage.getItem('schemaView_favorites')) || [];
    }

    render() {
        console.log("VERIFY: Rendering Sidebar structure...");
        
        const container = document.createElement('aside');
        container.id = 'sidebar';
        container.className = `
            w-72 bg-surface h-full border-r border-gray-800 flex flex-col shadow-2xl z-20 absolute md:relative
            transition-transform duration-300
        `;

        // --- Header ---
        const header = document.createElement('div');
        header.className = 'p-6 border-b border-gray-700 flex items-center justify-between';
        header.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                    <i class="fa-solid fa-layer-group text-white text-sm"></i>
                </div>
                <h1 class="text-xl font-bold tracking-tight text-white">SchemaView</h1>
            </div>
            <button id="add-topic-btn" class="text-gray-400 hover:text-white transition-colors p-1" title="Crear Carpeta">
                <i class="fa-solid fa-plus-circle text-xl"></i>
            </button>
        `;

        header.querySelector('#add-topic-btn').addEventListener('click', () => {
            const name = prompt("Nombre de la nueva carpeta:");
            if (name && name.trim()) {
                this.onCreateTopic(name.trim(), "fa-folder");
            }
        });

        // --- Lista (Contenedor vacío al inicio) ---
        this.listElement = document.createElement('ul');
        this.listElement.className = 'flex-1 overflow-y-auto p-4 space-y-2';

        // Renderizamos los items (con ordenamiento aplicado)
        this.renderItems();

        // --- Footer ---
        const footer = document.createElement('div');
        footer.className = 'p-4 border-t border-gray-800 text-xs text-center text-gray-600';
        footer.textContent = 'v2.3 Favorites Mode';

        container.appendChild(header);
        container.appendChild(this.listElement);
        container.appendChild(footer);

        this.element = container;
        return container;
    }

    // Lógica principal de ordenamiento y pintado
    renderItems() {
        if (!this.listElement) return;
        this.listElement.innerHTML = ''; // Limpiar lista actual

        // 1. Clonar y Ordenar los temas
        // Lógica: Si está en favoritos, gana. Si ambos están, el índice menor en favoritos (más reciente) gana.
        const sortedTopics = [...this.topics].sort((a, b) => {
            const indexA = this.favorites.indexOf(a.id);
            const indexB = this.favorites.indexOf(b.id);

            const isFavA = indexA !== -1;
            const isFavB = indexB !== -1;

            // Caso 1: Ambos son favoritos -> Ordenar por quién llegó primero al array (índice 0 gana)
            if (isFavA && isFavB) return indexA - indexB;
            
            // Caso 2: Solo A es favorito -> A va primero
            if (isFavA) return -1;
            
            // Caso 3: Solo B es favorito -> B va primero
            if (isFavB) return 1;

            // Caso 4: Ninguno es favorito -> Orden alfabético
            return a.title.localeCompare(b.title);
        });

        // 2. Generar HTML
        sortedTopics.forEach(topic => {
            const isFav = this.favorites.includes(topic.id);
            const li = document.createElement('li');
            li.className = `
                group flex items-center p-3 rounded-xl cursor-pointer
                transition-all duration-200 relative
                ${isFav ? 'bg-yellow-500/5 hover:bg-yellow-500/10 border border-yellow-500/20' : 'hover:bg-gray-700 text-gray-400 hover:text-white'}
            `;
            
            // Si está seleccionado visualmente (lógica simple de clases)
            // Nota: Al repintar perdemos la clase 'active' pura, pero al hacer click se restaura.
            
            li.innerHTML = `
                <div class="flex items-center gap-3 flex-1 min-w-0">
                    <i class="fa-solid ${topic.icon || 'fa-folder'} w-6 text-center ${isFav ? 'text-yellow-500' : 'group-hover:text-accent'} transition-colors"></i>
                    <span class="font-medium text-sm truncate ${isFav ? 'text-yellow-100' : ''}">${topic.title}</span>
                </div>
                
                <div class="flex items-center gap-1 ml-2">
                    <button class="fav-btn p-1.5 rounded transition-colors ${isFav ? 'text-yellow-400 opacity-100' : 'text-gray-600 hover:text-yellow-400 opacity-0 group-hover:opacity-100'}" title="${isFav ? 'Quitar Favorito' : 'Hacer Favorito'}">
                        <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-star text-xs"></i>
                    </button>

                    <div class="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                        <button class="edit-btn p-1.5 hover:bg-gray-600 rounded text-gray-400 hover:text-blue-400" title="Renombrar">
                            <i class="fa-solid fa-pen text-xs"></i>
                        </button>
                        <button class="delete-btn p-1.5 hover:bg-gray-600 rounded text-gray-400 hover:text-red-500" title="Eliminar">
                            <i class="fa-solid fa-trash text-xs"></i>
                        </button>
                    </div>
                </div>
            `;

            // --- Eventos ---

            // Click Carpeta (Seleccionar)
            li.addEventListener('click', (e) => {
                if (e.target.closest('button')) return; // Ignorar clicks en botones
                
                // Reset visual
                Array.from(this.listElement.children).forEach(c => {
                    c.classList.remove('bg-gray-700', 'text-white');
                    // Si era favorito, mantener su estilo base
                    if(c.dataset.fav === "true") { /* lógica css si fuera necesaria */ }
                });
                
                // Si NO es favorito, le ponemos el gris de activo. Si ES favorito, ya tiene su color.
                if(!isFav) li.classList.add('bg-gray-700', 'text-white');
                
                this.onTopicSelect(topic);
            });

            // Click Favorito (Estrella)
            li.querySelector('.fav-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(topic.id);
            });

            // Click Renombrar
            li.querySelector('.edit-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                const newName = prompt("Nuevo nombre:", topic.title);
                if (newName && newName.trim() !== topic.title) {
                    this.onRenameTopic(topic.id, newName.trim());
                }
            });

            // Click Eliminar
            li.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`⚠️ ¿ELIMINAR "${topic.title}" Y SUS IMÁGENES?`)) {
                    this.onDeleteTopic(topic.id);
                }
            });

            this.listElement.appendChild(li);
        });
    }

    toggleFavorite(id) {
        const index = this.favorites.indexOf(id);
        
        if (index !== -1) {
            // Si ya existe, lo quitamos
            this.favorites.splice(index, 1);
        } else {
            // Si no existe, lo ponemos AL PRINCIPIO (unshift)
            // Esto cumple tu deseo: "Se pone en primer lugar y desplaza a la anterior"
            this.favorites.unshift(id);
        }

        // Guardar en LocalStorage
        localStorage.setItem('schemaView_favorites', JSON.stringify(this.favorites));
        console.log("VERIFY: Favorites updated:", this.favorites);

        // Re-pintar la lista inmediatamente para ver el cambio de orden
        this.renderItems();
    }

    toggle(isVisible) {
        if (this.element) {
            if (isVisible) {
                this.element.classList.remove('-translate-x-full');
            } else {
                this.element.classList.add('-translate-x-full');
            }
        }
    }
}
// ======== End Full File ========