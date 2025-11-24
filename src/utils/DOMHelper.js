//src\utils\DOMHelper.js

// Utility for cleaner DOM manipulation
export const $ = (selector) => document.querySelector(selector);
export const $$ = (selector) => document.querySelectorAll(selector);

// Simple log wrapper
export const log = (msg, data = null) => {
    if (data) console.log(`[SchemaView] ${msg}`, data);
    else console.log(`[SchemaView] ${msg}`);
};