// Abacus Practice - Data Manager
// This module handles all data storage/retrieval operations with IndexedDB

class DataManager {
  constructor() {
    this.dbName = 'abacusPracticeDB';
    this.dbVersion = 1;
    this.db = null;
    this.initializeDB();
    
    // Migrate from localStorage if needed
    this.migrateFromLocalStorage();
  }
  
  // Initialize the database
  async initializeDB() {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        reject('Could not open IndexedDB');
      };
      
      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log('IndexedDB connection established');
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('practiceStats')) {
          const practiceStore = db.createObjectStore('practiceStats', { keyPath: 'id', autoIncrement: true });
          practiceStore.createIndex('date', 'date', { unique: false });
          practiceStore.createIndex('operation', 'operation', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }
  
  // Ensure DB is ready before performing operations
  async ensureDBReady() {
    if (!this.db) {
      await this.initializeDB();
    }
    return this.db;
  }
  
  // Migrate data from localStorage to IndexedDB
  async migrateFromLocalStorage() {
    await this.ensureDBReady();
    
    // Check if migration has already happened
    const migrated = await this.getSetting('localStorageMigrated');
    if (migrated) return;
    
    // Get practice stats from localStorage
    const practiceStatsJSON = localStorage.getItem('practiceStats');
    if (practiceStatsJSON) {
      try {
        const practiceStats = JSON.parse(practiceStatsJSON);
        if (Array.isArray(practiceStats)) {
          // Save each practice stat to IndexedDB
          for (const stat of practiceStats) {
            await this.savePracticeStat(stat);
          }
          console.log(`Migrated ${practiceStats.length} practice records from localStorage`);
        }
      } catch (error) {
        console.error('Error migrating data from localStorage:', error);
      }
    }
    
    // Mark migration as complete
    await this.saveSetting('localStorageMigrated', true);
  }
  
  // Save a practice stat
  async savePracticeStat(stat) {
    await this.ensureDBReady();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['practiceStats'], 'readwrite');
      const store = transaction.objectStore('practiceStats');
      
      // Add timestamp if not present
      if (!stat.date) {
        stat.date = new Date().toISOString();
      }
      
      const request = store.add(stat);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  // Get all practice stats
  async getAllPracticeStats() {
    await this.ensureDBReady();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['practiceStats'], 'readonly');
      const store = transaction.objectStore('practiceStats');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  // Get practice stats with filters
  async getPracticeStatsWithFilter(filterFn) {
    const allStats = await this.getAllPracticeStats();
    return allStats.filter(filterFn);
  }
  
  // Get practice stats for last N days
  async getPracticeStatsForLastDays(days) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return this.getPracticeStatsWithFilter(stat => {
      const statDate = new Date(stat.date);
      return statDate >= cutoffDate;
    });
  }
  
  // Clear all practice stats
  async clearAllPracticeStats() {
    await this.ensureDBReady();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['practiceStats'], 'readwrite');
      const store = transaction.objectStore('practiceStats');
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  // Save a setting
  async saveSetting(key, value) {
    await this.ensureDBReady();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      
      const request = store.put({ key, value });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  // Get a setting
  async getSetting(key) {
    await this.ensureDBReady();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      
      const request = store.get(key);
      
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.value);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }
}

// Create and export singleton instance
const dataManager = new DataManager(); 