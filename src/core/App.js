//src\core\App.js

import { Sidebar } from '../components/Sidebar.js';
import { ImageViewer } from '../components/ImageViewer.js';

class App {
    constructor() {
        this.appElement = document.getElementById('app');
        this.sidebar = null;
        this.viewer = null;
        this.data = [];
    }

    async init() {
        console.log("VERIFY: App initializing...");
        try {
            await this.loadData();
            this.initComponents();
            console.log("VERIFY: App initialized successfully.");
        } catch (error) {
            console.error("DEBUG: Fatal Error initializing app:", error);
            this.appElement.innerHTML = `<div class="text-red-500 p-10">Error loading application data. Check console.</div>`;
        }
    }

    async loadData() {
        // Simulating fetch
        const response = await fetch('./src/data/schemas.json');
        if (!response.ok) throw new Error("Failed to load JSON");
        this.data = await response.json();
        console.log("VERIFY: Data loaded records:", this.data.length);
    }

    initComponents() {
        // 1. Initialize Sidebar
        this.sidebar = new Sidebar(this.data, (selectedTopic) => {
            this.handleTopicChange(selectedTopic);
        });

        // 2. Initialize Viewer
        this.viewer = new ImageViewer((isFocusMode) => {
            this.handleFocusMode(isFocusMode);
        });

        // 3. Render to DOM
        this.appElement.innerHTML = ''; // Clear loading state
        this.appElement.appendChild(this.sidebar.render());
        this.appElement.appendChild(this.viewer.render());
    }

    handleTopicChange(topic) {
        // Re-render only the viewer content
        const newViewer = this.viewer.render(topic);
        
        // Replace old viewer
        const currentMain = this.appElement.querySelector('main');
        if (currentMain) {
            this.appElement.replaceChild(newViewer, currentMain);
        } else {
            this.appElement.appendChild(newViewer);
        }
    }

    handleFocusMode(active) {
        if (active) {
            console.log("VERIFY: Focus mode active. Sidebar will hide shortly.");
            // Hide sidebar after 1.5 seconds
            setTimeout(() => {
                // Check if we are still in fullscreen mode (look for the close button)
                if(document.querySelector('.fa-times')) { 
                    this.sidebar.toggle(false); // Hide
                }
            }, 1500);
        } else {
            console.log("VERIFY: Focus mode inactive. Restoring sidebar.");
            this.sidebar.toggle(true); // Show immediately
        }
    }
}

// Entry Point
const app = new App();
document.addEventListener('DOMContentLoaded', () => app.init());