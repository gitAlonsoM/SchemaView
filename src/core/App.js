// src/core/App.js
// ======== Start Full File ========

import { Sidebar } from '../components/Sidebar.js';
import { ImageViewer } from '../components/ImageViewer.js';
import { FirebaseService } from '../services/firebase.js';

class App {
    constructor() {
        this.appElement = document.getElementById('app');
        this.authModal = document.getElementById('auth-modal');
        this.authInput = document.getElementById('auth-input');
        this.authBtn = document.getElementById('auth-btn');
        this.authError = document.getElementById('auth-error');
        
        this.sidebar = null;
        this.viewer = null;
        this.topics = [];

        window.FirebaseService = FirebaseService;
        window.AppInstance = this;
    }

    async init() {
        if (!this.checkAuth()) {
            this.showLogin();
        } else {
            await this.startApp();
        }
    }

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

    async startApp() {
        console.log("VERIFY: Auth passed. Loading Firebase data...");
        try {
            this.topics = await FirebaseService.getTopics();
            console.log("VERIFY: Topics loaded:", this.topics.length);
            this.initComponents();
        } catch (error) {
            console.error("DEBUG: Fatal Init Error:", error);
            this.appElement.innerHTML = `<div class="text-red-500 p-10">Error de conexión: ${error.message}</div>`;
        }
    }

    initComponents() {
        this.sidebar = new Sidebar(
            this.topics, 
            (selectedTopic) => this.handleTopicChange(selectedTopic), // Seleccionar
            (title, icon) => this.handleCreateTopic(title, icon),     // Crear
            (id, newName) => this.handleRenameTopic(id, newName),     // Renombrar
            (id) => this.handleDeleteTopic(id)                        // Eliminar
        );

        this.viewer = new ImageViewer((isFocusMode) => {
            this.handleFocusMode(isFocusMode);
        });

        this.appElement.innerHTML = '';
        this.appElement.appendChild(this.sidebar.render());
        this.appElement.appendChild(this.viewer.render());
    }

    handleTopicChange(topic) {
        this.viewer.loadTopic(topic);
        const currentMain = this.appElement.querySelector('main');
        if (!currentMain) this.appElement.appendChild(this.viewer.container);
    }

    async handleCreateTopic(title, icon) {
        try {
            await FirebaseService.createTopic(title, icon);
            await this.startApp(); // Recargar
        } catch (e) {
            alert("Error creando carpeta: " + e.message);
        }
    }

    async handleRenameTopic(id, newName) {
        try {
            await FirebaseService.updateTopicTitle(id, newName);
            await this.startApp(); // Recargar para ver el cambio
        } catch (e) {
            alert("Error al renombrar: " + e.message);
        }
    }

    async handleDeleteTopic(id) {
        try {
            // Mostrar indicador de carga visual si fuera necesario, pero el reload es rápido
            await FirebaseService.deleteTopic(id);
            // Si el visor estaba mostrando esa carpeta, lo limpiamos
            if (this.viewer.currentTopic && this.viewer.currentTopic.id === id) {
                this.viewer.renderEmptyState();
            }
            await this.startApp(); // Recargar lista
        } catch (e) {
            alert("Error al eliminar: " + e.message);
        }
    }

    handleFocusMode(active) {
        if (active) {
            setTimeout(() => {
                if(document.querySelector('.fa-times')) this.sidebar.toggle(false); 
            }, 1500);
        } else {
            this.sidebar.toggle(true); 
        }
    }
}

const app = new App();
document.addEventListener('DOMContentLoaded', () => app.init());
// ======== End Full File ========