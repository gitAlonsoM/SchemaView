// src/services/firebase.js

// src/services/firebase.js
// ======== Start Full File ========

// 1. IMPORTS: CDN (No requiere npm)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, collection, getDocs, addDoc, deleteDoc, doc, query, where, orderBy, updateDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
    getStorage, ref, uploadBytes, getDownloadURL, deleteObject 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// 2. CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyCW2vGe-m0QZeTWHORDs3L0fNXUhvw9WGM",
  authDomain: "schemaview-v2.firebaseapp.com",
  projectId: "schemaview-v2",
  storageBucket: "schemaview-v2.firebasestorage.app",
  messagingSenderId: "628826474306",
  appId: "1:628826474306:web:8d94a7b55164045083aadb",
  measurementId: "G-XDXTJPXDNN"
};

// 3. INITIALIZATION
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

console.log("VERIFY: Firebase initialized.");

// 4. SERVICE LAYER
export const FirebaseService = {
    
    // --- TOPICS (Carpetas) ---
    async getTopics() {
        try {
            const querySnapshot = await getDocs(collection(db, "topics"));
            const topics = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return topics;
        } catch (error) {
            console.error("DEBUG: Error fetching topics:", error);
            throw error;
        }
    },

    // --- IMAGES ---
    async getImages(topicId) {
        try {
            const q = query(
                collection(db, "images"), 
                where("topicId", "==", topicId),
                orderBy("uploadedAt", "desc")
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("DEBUG: Error fetching images:", error);
            throw error;
        }
    },

    async uploadImage(file, topicId, customTitle) {
        try {
            console.log("VERIFY: Uploading file...", file.name);
            
            // 1. Storage
            const storageRef = ref(storage, `images/${topicId}/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            // 2. Firestore
            const docRef = await addDoc(collection(db, "images"), {
                topicId: topicId,
                src: downloadURL,
                title: customTitle || file.name,
                fileName: file.name,
                storagePath: snapshot.metadata.fullPath,
                uploadedAt: Date.now()
            });

            console.log("VERIFY: Upload success ID:", docRef.id);
            return { id: docRef.id, src: downloadURL, title: customTitle };
        } catch (error) {
            console.error("DEBUG: Upload failed:", error);
            throw error;
        }
    },

    async deleteImage(imageId, storagePath) {
        try {
            // Borrar de Storage si existe path
            if (storagePath) {
                const imgRef = ref(storage, storagePath);
                await deleteObject(imgRef).catch(e => console.warn("Storage delete warn:", e));
            }
            // Borrar de DB
            await deleteDoc(doc(db, "images", imageId));
            console.log("VERIFY: Image deleted.");
        } catch (error) {
            console.error("DEBUG: Delete failed:", error);
            throw error;
        }
    },

    async renameImage(imageId, newTitle) {
        try {
            const imageRef = doc(db, "images", imageId);
            await updateDoc(imageRef, { title: newTitle });
            console.log("VERIFY: Renamed successfully.");
        } catch (error) {
            console.error("DEBUG: Rename failed:", error);
            throw error;
        }
    }
};
// ======== End Full File ========