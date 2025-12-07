//src\core\App.js
// src/core/App.js
// ======== Start Full File ========

import { Sidebar } from '../components/Sidebar.js';
import { ImageViewer } from '../components/ImageViewer.js';
import { FirebaseService } from '../services/firebase.js';

class App {
    constructor() {
        this.appElement = document.getElementById('app');
        // Auth Elements
        this.authModal = document.getElementById('auth-modal');
        this.authInput = document.getElementById('auth-input');
        this.authBtn = document.getElementById('auth-btn');
        this.authError = document.getElementById('auth-error');
        
        this.sidebar = null;
        this.viewer = null;
        this.topics = [];
    }

    async init() {
        // 1. Comprobar Contraseña
        if (!this.checkAuth()) {
            this.showLogin();
        } else {
            await this.startApp();
        }
    }

    // --- SEGURIDAD ---
    checkAuth() {
        return localStorage.getItem('schemaView_auth') === '1558';
    }

    showLogin() {
        this.authModal.classList.remove('hidden');
        this.appElement.classList.add('blur-sm', 'pointer-events-none');

        const attemptLogin = () => {
            if (this.authInput.value === '1558') {
                localStorage.setItem('schemaView_auth', '1558');
                this.authModal.classList.add('hidden');
                this.appElement.classList.remove('blur-sm', 'pointer-events-none');
                this.startApp();
            } else {
                this.authError.classList.remove('hidden');
                this.authInput.classList.add('border-red-500');
            }
        };

        this.authBtn.addEventListener('click', attemptLogin);
        this.authInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') attemptLogin();
        });
    }

    // --- INICIO APP ---
    async startApp() {
        console.log("VERIFY: Auth passed. Loading Firebase data...");
        
        try {
            this.topics = await FirebaseService.getTopics();
            console.log("VERIFY: Topics loaded:", this.topics.length);
            
            this.initComponents();
        } catch (error) {
            console.error("DEBUG: Fatal Init Error:", error);
            this.appElement.innerHTML = `
                <div class="text-red-500 p-10 font-mono">
                    <h1 class="text-xl font-bold">Error de Conexión</h1>
                    <p>No se pudo conectar a Firebase.</p>
                    <p class="text-sm mt-2 opacity-75">${error.message}</p>
                </div>`;
        }
    }

    initComponents() {
        // Inicializar Sidebar
        this.sidebar = new Sidebar(this.topics, (selectedTopic) => {
            this.handleTopicChange(selectedTopic);
        });

        // Inicializar Viewer
        this.viewer = new ImageViewer((isFocusMode) => {
            this.handleFocusMode(isFocusMode);
        });

        this.appElement.innerHTML = '';
        this.appElement.appendChild(this.sidebar.render());
        this.appElement.appendChild(this.viewer.render());
    }

    handleTopicChange(topic) {
        // Cargar imágenes del tema seleccionado
        this.viewer.loadTopic(topic);
        
        // Renderizar (si fuera necesario reemplazar el DOM, aunque el viewer se actualiza internamente)
        const currentMain = this.appElement.querySelector('main');
        if (!currentMain) {
            this.appElement.appendChild(this.viewer.container);
        }
    }

    handleFocusMode(active) {
        if (active) {
            setTimeout(() => {
                if(document.querySelector('.fa-times')) { 
                    this.sidebar.toggle(false); 
                }
            }, 1500);
        } else {
            this.sidebar.toggle(true); 
        }
    }
}

const app = new App();
document.addEventListener('DOMContentLoaded', () => app.init());
// ======== End Full File ========