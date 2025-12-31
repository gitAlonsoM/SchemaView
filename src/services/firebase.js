// src/services/firebase.js
// ======== Start Full File ========

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, collection, getDocs, addDoc, deleteDoc, doc, query, where, orderBy, updateDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
    getStorage, ref, uploadBytes, getDownloadURL, deleteObject 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCW2vGe-m0QZeTWHORDs3L0fNXUhvw9WGM",
  authDomain: "schemaview-v2.firebaseapp.com",
  projectId: "schemaview-v2",
  storageBucket: "schemaview-v2.firebasestorage.app",
  messagingSenderId: "628826474306",
  appId: "1:628826474306:web:8d94a7b55164045083aadb",
  measurementId: "G-XDXTJPXDNN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

console.log("VERIFY: [Firebase] Connection established.");

export const FirebaseService = {
    
    async getTopics() {
        console.log("VERIFY: [FirebaseService] Fetching all topics...");
        try {
            const querySnapshot = await getDocs(collection(db, "topics"));
            const topics = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log(`VERIFY: [FirebaseService] ${topics.length} topics retrieved.`);
            return topics.sort((a, b) => a.title.localeCompare(b.title));
        } catch (error) {
            console.error("DEBUG: [FirebaseService] Error getTopics:", error);
            throw error;
        }
    },

    async createTopic(title, icon, description) {
        console.log(`VERIFY: [FirebaseService] Creating topic: '${title}'...`);
        try {
            const docRef = await addDoc(collection(db, "topics"), {
                title: title,
                icon: icon || "fa-folder",
                description: description || "Carpeta de esquemas",
                createdAt: Date.now()
            });
            console.log(`VERIFY: [FirebaseService] Topic created successfully. ID: ${docRef.id}`);
            return docRef.id;
        } catch (error) {
            console.error("DEBUG: [FirebaseService] Error createTopic:", error);
            throw error;
        }
    },

    async updateTopicTitle(topicId, newTitle) {
        console.log(`VERIFY: [FirebaseService] Renaming topic ID ${topicId} to '${newTitle}'...`);
        try {
            const topicRef = doc(db, "topics", topicId);
            await updateDoc(topicRef, { title: newTitle });
            console.log("VERIFY: [FirebaseService] Topic renamed successfully.");
        } catch (error) {
            console.error("DEBUG: [FirebaseService] Error updateTopicTitle:", error);
            throw error;
        }
    },

    async deleteTopic(topicId) {
        console.log(`VERIFY: [FirebaseService] CASCADE DELETE initiated for topic ID: ${topicId}`);
        try {
            const images = await this.getImages(topicId);
            console.log(`VERIFY: [FirebaseService] Found ${images.length} images to delete.`);
            
            const deletePromises = images.map(img => this.deleteImage(img.id, img.storagePath));
            await Promise.all(deletePromises); 
            
            await deleteDoc(doc(db, "topics", topicId));
            console.log("VERIFY: [FirebaseService] Topic and all contents deleted successfully.");
        } catch (error) {
            console.error("DEBUG: [FirebaseService] Error deleteTopic:", error);
            throw error;
        }
    },

    async getImages(topicId) {
        console.log(`VERIFY: [FirebaseService] Fetching images for topic ID: ${topicId}...`);
        try {
            const q = query(
                collection(db, "images"), 
                where("topicId", "==", topicId),
                orderBy("uploadedAt", "desc")
            );
            const querySnapshot = await getDocs(q);
            const imgs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log(`VERIFY: [FirebaseService] ${imgs.length} images loaded.`);
            return imgs;
        } catch (error) {
            console.error("DEBUG: [FirebaseService] Error getImages:", error);
            throw error;
        }
    },

    async uploadImage(file, topicId, customTitle) {
        console.log(`VERIFY: [FirebaseService] START UPLOAD: ${file.name} (${file.type}, ${file.size} bytes)`);
        try {
            const metadata = {
                contentType: file.type,
                customMetadata: { 'originalName': file.name }
            };

            const storagePath = `images/${topicId}/${Date.now()}_${file.name}`;
            const storageRef = ref(storage, storagePath);
            const snapshot = await uploadBytes(storageRef, file, metadata);
            const downloadURL = await getDownloadURL(snapshot.ref);

            const docRef = await addDoc(collection(db, "images"), {
                topicId: topicId,
                src: downloadURL,
                title: customTitle || file.name,
                fileName: file.name,
                storagePath: snapshot.metadata.fullPath,
                uploadedAt: Date.now(),
                size: file.size, 
                type: file.type // Aquí guardamos el MIME TYPE real
            });

            console.log(`VERIFY: [FirebaseService] Upload Success. Document ID: ${docRef.id}`);
            return { id: docRef.id, src: downloadURL, title: customTitle };
        } catch (error) {
            console.error("DEBUG: [FirebaseService] Upload Failed:", error);
            throw error;
        }
    },

    async deleteImage(imageId, storagePath) {
        console.log(`VERIFY: [FirebaseService] Deleting image ID: ${imageId}...`);
        try {
            if (storagePath) {
                const imgRef = ref(storage, storagePath);
                await deleteObject(imgRef);
            }
            await deleteDoc(doc(db, "images", imageId));
            console.log("VERIFY: [FirebaseService] Image deleted from Storage and DB.");
        } catch (error) {
            console.error("DEBUG: [FirebaseService] Delete Failed:", error);
            throw error;
        }
    },

    async renameImage(imageId, newTitle) {
        console.log(`VERIFY: [FirebaseService] Renaming image ID ${imageId} to '${newTitle}'...`);
        try {
            const imageRef = doc(db, "images", imageId);
            await updateDoc(imageRef, { title: newTitle });
            console.log("VERIFY: [FirebaseService] Image title updated.");
        } catch (error) {
            console.error("DEBUG: [FirebaseService] Rename Failed:", error);
            throw error;
        }
    }
};
// ======== End Full File ========