// src/components/Sidebar.js
// ======== Start Full File ========

export class Sidebar {
    constructor(topics, onTopicSelect, onCreateTopic) {
        this.topics = topics;
        this.onTopicSelect = onTopicSelect;
        this.onCreateTopic = onCreateTopic; // Nueva función para crear
        this.element = null;
    }

    render() {
        console.log("VERIFY: Rendering Sidebar topics:", this.topics.length);
        
        const container = document.createElement('aside');
        container.id = 'sidebar';
        container.className = `
            w-72 bg-surface h-full border-r border-gray-800 flex flex-col shadow-2xl z-20 absolute md:relative
            transition-transform duration-300
        `;

        // Header con botón de Crear
        const header = document.createElement('div');
        header.className = 'p-6 border-b border-gray-700 flex items-center justify-between';
        header.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                    <i class="fa-solid fa-layer-group text-white text-sm"></i>
                </div>
                <h1 class="text-xl font-bold tracking-tight text-white">SchemaView</h1>
            </div>
            <button id="add-topic-btn" class="text-gray-400 hover:text-white transition-colors" title="Crear Carpeta">
                <i class="fa-solid fa-plus-circle text-xl"></i>
            </button>
        `;

        // Evento Crear Carpeta
        header.querySelector('#add-topic-btn').addEventListener('click', () => {
            const name = prompt("Nombre de la nueva carpeta (Ej: Redes):");
            if (name) {
                // Icono por defecto aleatorio o fijo
                const icon = "fa-folder"; 
                this.onCreateTopic(name, icon);
            }
        });

        // List
        const list = document.createElement('ul');
        list.className = 'flex-1 overflow-y-auto p-4 space-y-2';

        this.topics.forEach(topic => {
            const li = document.createElement('li');
            li.className = `
                group flex items-center gap-3 p-3 rounded-xl cursor-pointer
                hover:bg-gray-700 transition-all duration-200
                text-gray-400 hover:text-white
            `;
            
            // Protección contra undefined
            const count = topic.images ? topic.images.length : 0;

            li.innerHTML = `
                <i class="fa-solid ${topic.icon || 'fa-folder'} w-6 text-center group-hover:text-accent transition-colors"></i>
                <span class="font-medium text-sm">${topic.title}</span>
                ${count > 0 ? `<span class="ml-auto text-xs bg-dark px-2 py-1 rounded-full text-gray-500">${count}</span>` : ''}
            `;

            li.addEventListener('click', () => {
                Array.from(list.children).forEach(c => c.classList.remove('bg-gray-700', 'text-white'));
                li.classList.add('bg-gray-700', 'text-white');
                this.onTopicSelect(topic);
            });

            list.appendChild(li);
        });

        // Footer
        const footer = document.createElement('div');
        footer.className = 'p-4 border-t border-gray-800 text-xs text-center text-gray-600';
        footer.textContent = 'v2.1 Full Management';

        container.appendChild(header);
        container.appendChild(list);
        container.appendChild(footer);

        this.element = container;
        return container;
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