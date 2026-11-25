// AetherOS — IndexedDB Virtual Filesystem (Drag & Drop + Cross-App Piping), .aether Backup/Restore & PWA Installer
(function () {
    const DB_NAME = 'AetherOS_VFS_v1';
    const STORE_FILES = 'files';
    const STORE_META = 'meta';

    const memFiles = new Map();
    const memMeta = new Map();
    let dbPromise = null, persistenceWarned = false;
    function reportPersistence(durable, reason='') {
        if(window.AetherVFS)window.AetherVFS.storageStatus={mode:durable?'indexeddb':'session-only',reason};
        if(!durable && !persistenceWarned){
            persistenceWarned=true;
            window.Notifications?.push('SESSION-ONLY STORAGE','Files are available in this tab, but could not be persisted. Export a backup before closing or reloading.');
            window.dispatchEvent(new CustomEvent('aether:storage-warning',{detail:{mode:'session-only',reason}}));
        }
    }

    function openDB() {
        if (dbPromise) return dbPromise;
        dbPromise = new Promise((resolve) => {
            if (typeof indexedDB === 'undefined') {
                resolve(null);
                return;
            }
            try {
                const req = indexedDB.open(DB_NAME, 1);
                req.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(STORE_FILES)) {
                        db.createObjectStore(STORE_FILES, { keyPath: 'id' });
                    }
                    if (!db.objectStoreNames.contains(STORE_META)) {
                        db.createObjectStore(STORE_META, { keyPath: 'key' });
                    }
                };
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => resolve(null);
            } catch (_) {
                resolve(null);
            }
        });
        return dbPromise;
    }

    function formatBytes(bytes) {
        const n = Number(bytes || 0);
        if (n < 1024) return n + ' B';
        if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
        return (n / 1048576).toFixed(2) + ' MB';
    }

    function inferKind(name, mime) {
        const lower = String(name || '').toLowerCase();
        const m = String(mime || '').toLowerCase();
        if (m.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|avif)$/.test(lower)) return 'media';
        if (m.startsWith('audio/') || /\.(mp3|wav|ogg|flac|m4a)$/.test(lower)) return 'media';
        if (/\.(md|markdown|txt|json|js|ts|py|html|css|yml|yaml|csv|xml|log)$/.test(lower) || m.startsWith('text/')) return 'note';
        return 'entity';
    }

    function inferIcon(name, mime) {
        const lower = String(name || '').toLowerCase();
        const m = String(mime || '').toLowerCase();
        if (m.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|avif)$/.test(lower)) return 'image';
        if (m.startsWith('audio/') || /\.(mp3|wav|ogg|flac|m4a)$/.test(lower)) return 'music';
        if (/\.(json|js|ts|py|html|css)$/.test(lower)) return 'file-code';
        if (/\.(md|markdown|txt)$/.test(lower)) return 'file-text';
        return 'file';
    }

    const AetherVFS = window.AetherVFS = {
        storageStatus: {mode:'not-yet-written',reason:''},
        async putFile(entry) {
            const record = {
                id: entry.id || ('vfs-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)),
                name: String(entry.name || 'Untitled'),
                mime: entry.mime || 'application/octet-stream',
                sizeBytes: entry.sizeBytes || (entry.content ? entry.content.length : 0),
                size: entry.size || formatBytes(entry.sizeBytes || (entry.content ? entry.content.length : 0)),
                kind: entry.kind || inferKind(entry.name, entry.mime),
                icon: entry.icon || inferIcon(entry.name, entry.mime),
                folder: entry.folder || 'User Uploads',
                content: entry.content || '',
                dataUrl: entry.dataUrl || '',
                imageUrl: entry.imageUrl || ((entry.mime || '').startsWith('image/') ? entry.dataUrl : ''),
                sourceUrl: entry.sourceUrl || '',
                tags: Array.isArray(entry.tags) ? entry.tags : ['local-vfs'],
                modified: new Date().toISOString().slice(0, 10),
                createdAt: entry.createdAt || Date.now()
            };
            memFiles.set(record.id, record);
            const db = await openDB();
            let reason='IndexedDB unavailable or blocked';
            const durable=db ? await new Promise(resolve=>{
                try{
                    const tx=db.transaction(STORE_FILES,'readwrite');tx.objectStore(STORE_FILES).put(record);
                    tx.oncomplete=()=>resolve(true);
                    tx.onerror=tx.onabort=()=>{reason=tx.error?.message||'Storage transaction failed';resolve(false);};
                }catch(error){reason=error.message;resolve(false);}
            }):false;
            record.persistence=durable?'indexeddb':'session-only';
            reportPersistence(durable,durable?'':reason);
            this.syncToFileManager();
            return record;
        },

        async getAllFiles() {
            const db = await openDB();
            if (db) {
                const list = await new Promise((resolve) => {
                    try {
                        const tx = db.transaction(STORE_FILES, 'readonly');
                        const req = tx.objectStore(STORE_FILES).getAll();
                        req.onsuccess = () => resolve(req.result || []);
                        req.onerror = () => resolve([]);
                    } catch (_) { resolve([]); }
                });
                list.forEach((f) => {if(memFiles.get(f.id)?.persistence!=='session-only')memFiles.set(f.id, f);});
            }
            return Array.from(memFiles.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        },

        getCachedFile(id) {
            return memFiles.get(id) || null;
        },

        async deleteFile(id) {
            memFiles.delete(id);
            const db=await openDB();
            const durable=db ? await new Promise(resolve=>{
                try{const tx=db.transaction(STORE_FILES,'readwrite');tx.objectStore(STORE_FILES).delete(id);tx.oncomplete=()=>resolve(true);tx.onerror=tx.onabort=()=>resolve(false);}
                catch(_){resolve(false);}
            }):false;
            reportPersistence(durable,durable?'':'Deletion could not be persisted; the file may return after reload');
            this.syncToFileManager();
        },

        async setMeta(key, value) {
            memMeta.set(key, value);
            const db=await openDB();
            const durable=db ? await new Promise(resolve=>{
                try{const tx=db.transaction(STORE_META,'readwrite');tx.objectStore(STORE_META).put({key,value});tx.oncomplete=()=>resolve(true);tx.onerror=tx.onabort=()=>resolve(false);}
                catch(_){resolve(false);}
            }):false;
            reportPersistence(durable,durable?'':'Metadata could not be persisted');
            return {persistence:durable?'indexeddb':'session-only'};
        },

        async getMeta(key) {
            if (memMeta.has(key)) return memMeta.get(key);
            const db = await openDB();
            if (!db) return null;
            return new Promise((resolve) => {
                try {
                    const tx = db.transaction(STORE_META, 'readonly');
                    const req = tx.objectStore(STORE_META).get(key);
                    req.onsuccess = () => {
                        const val = req.result ? req.result.value : null;
                        if (val !== null) memMeta.set(key, val);
                        resolve(val);
                    };
                    req.onerror = () => resolve(null);
                } catch (_) { resolve(null); }
            });
        },

        readBrowserFile(file) {
            return new Promise((resolve) => {
                const mime = file.type || '';
                const isText = mime.startsWith('text/') || /\.(md|markdown|txt|json|js|ts|py|html|css|yml|yaml|csv|xml|log|svg)$/i.test(file.name);
                const reader = new FileReader();
                reader.onload = () => {
                    const dataUrl = String(reader.result || '');
                    if (isText) {
                        const textReader = new FileReader();
                        textReader.onload = () => resolve({ dataUrl, content: String(textReader.result || '') });
                        textReader.onerror = () => resolve({ dataUrl, content: '' });
                        textReader.readAsText(file);
                    } else {
                        resolve({ dataUrl, content: `Imported ${file.type || 'binary'} file (${formatBytes(file.size)}).` });
                    }
                };
                reader.onerror = () => resolve({ dataUrl: '', content: '' });
                reader.readAsDataURL(file);
            });
        },

        async importBrowserFiles(fileList, folder = 'User Uploads') {
            const files = Array.from(fileList || []);
            if (!files.length) return [];
            const saved = [];
            for (const f of files) {
                const { dataUrl, content } = await this.readBrowserFile(f);
                const rec = await this.putFile({
                    name: f.name,
                    mime: f.type || 'application/octet-stream',
                    sizeBytes: f.size,
                    folder,
                    content: content.slice(0, 120000),
                    dataUrl,
                    imageUrl: (f.type || '').startsWith('image/') ? dataUrl : '',
                    tags: ['imported', (f.type || 'file').split('/')[0] || 'local']
                });
                saved.push(rec);
            }
            if (window.Notifications) {
                window.Notifications.push('FILE ARCHIVE', `Imported ${saved.length} file${saved.length === 1 ? '' : 's'} into /Archive/${folder}`);
            }
            if (window.os && os.isModuleEnabled && os.isModuleEnabled('filemanager')) {
                os.openWindow('filemanager');
                os.filemanager.currentPath = `/Archive/${folder}`;
                if (saved[0]) os.filemanager.activeFileId = saved[0].id;
                os.fmRender && os.fmRender();
            }
            return saved;
        },

        async init() {
            await this.getAllFiles();
            this.syncToFileManager();
        },

        async saveClipperItem({ name, title, kind = 'note', content = '', imageUrl = '', sourceUrl = '', tags = ['clipped'] }) {
            const safeTitle = title ? title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 48) + '.md' : '';
            const rec = await this.putFile({
                name: name || safeTitle || 'Clipped-Item.md',
                mime: 'text/markdown',
                kind,
                icon: imageUrl ? 'image' : 'bookmark',
                folder: 'Saved Clipper',
                content,
                imageUrl,
                dataUrl: imageUrl || '',
                sourceUrl,
                tags
            });
            if (window.Notifications) {
                window.Notifications.push(rec.persistence==='session-only'?'SESSION-ONLY COPY':'SAVED TO FILES',rec.persistence==='session-only'?'Export this clip before closing or reloading.':`"${rec.name}" saved to /Archive/Saved Clipper`);
            }
            return rec;
        },

        syncToFileManager() {
            if (!window.os || !os.filemanager || !os.filemanager.data) return;
            const root=os.filemanager.data;root.children ||= [];
            const all=Array.from(memFiles.values()).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
            const ids=new Set(all.map(f=>f.id));
            const clean=node=>{if(node.children){node.children=node.children.filter(child=>!child.isVfs&&!ids.has(child.id));node.children.forEach(clean);}};
            clean(root);
            const ensureFolder=relative=>{
                const parts=String(relative||'User Uploads').replace(/^\/Archive\/?/,'').split('/').filter(Boolean);
                if(parts.some(p=>p==='.'||p==='..'||p.includes('\\')))return ensureFolder('User Uploads');
                let parent=root;
                for(const name of parts){
                    let folder=parent.children.find(n=>n.kind==='folder'&&n.name===name);
                    if(!folder){const path=`${parent.path}/${name}`;let hash=0;for(const char of path)hash=(Math.imul(hash,31)+char.charCodeAt(0))|0;folder={id:'vfs-dir-'+(hash>>>0).toString(16),name,path,kind:'folder',signal:'Local',children:[]};parent.children.unshift(folder);}
                    folder.children ||= [];parent=folder;
                }
                return parent;
            };
            ensureFolder('Saved Clipper');ensureFolder('User Uploads');
            const custom=memMeta.get('archive-folders-v1');if(Array.isArray(custom))for(const path of custom)if(typeof path==='string'&&path.length<500)ensureFolder(path).localFolder=true;
            for(const file of all){
                const folder=ensureFolder(file.folder);
                folder.children.push({...file,path:`${folder.path}/${file.name}`,signal:file.persistence==='session-only'?'Session':'Browser',related:[],refs:[],isVfs:true});
            }

            if (document.getElementById('filemanager-root') && os.fmRender) {
                os.fmRender();
            }
        },

        triggerUploadDialog() {
            let inp = document.getElementById('vfs-hidden-file-input');
            if (!inp) {
                inp = document.createElement('input');
                inp.type = 'file';
                inp.multiple = true;
                inp.id = 'vfs-hidden-file-input';
                inp.style.display = 'none';
                inp.onchange = (e) => {
                    if (e.target.files && e.target.files.length) {
                        this.importBrowserFiles(e.target.files, 'User Uploads');
                        inp.value = '';
                    }
                };
                document.body.appendChild(inp);
            }
            inp.click();
        },

        downloadFile(id) {
            const f = memFiles.get(id) || (window.os && os.fmFindById && os.fmFindById(id));
            if (!f) return;
            const a = document.createElement('a');
            if (f.dataUrl) {
                a.href = f.dataUrl;
            } else {
                const blob = new Blob([f.content || ''], { type: 'text/plain;charset=utf-8' });
                a.href = URL.createObjectURL(blob);
            }
            a.download = f.name || 'aether-file.txt';
            a.click();
        },

        async applyFileAsWallpaper(id) {
            const f = memFiles.get(id) || (window.os && os.fmFindById && os.fmFindById(id));
            const url = f && (f.imageUrl || f.dataUrl);
            if (!url) return;
            await this.setMeta('custom_wallpaper', url);
            SystemState.settings.wallpaper_mode = 'custom';
            SystemState.save();
            window.os && os.syncSystemPerformanceEngine && os.syncSystemPerformanceEngine();
            window.Notifications && window.Notifications.push('WALLPAPER STUDIO', `Applied "${f.name}" as desktop wallpaper.`);
        },

        openInDevPad(id) {
            const f = memFiles.get(id) || (window.os && os.fmFindById && os.fmFindById(id));
            if (!f || !window.os) return;
            if (!os.isModuleEnabled('devpad')) os.setModuleEnabled('devpad', true, { silent: true });
            os.openWindow('devpad');
            setTimeout(() => {
                os.devpadOpenExternalFile && os.devpadOpenExternalFile({ title: f.name, content: f.content || '' });
            }, 40);
        }
    };

    // ── AES-256-GCM .aether Workspace Snapshot Backup & Restore ──
    async function deriveBackupKey(passphrase, saltBytes) {
        const enc = new TextEncoder();
        const mat = await crypto.subtle.importKey('raw', enc.encode(passphrase), { name: 'PBKDF2' }, false, ['deriveKey']);
        return crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt: saltBytes, iterations: 120000, hash: 'SHA-256' },
            mat,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    function bytesToBase64(bytes) {
        let bin = '';
        const arr = new Uint8Array(bytes);
        for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
        return btoa(bin);
    }

    function base64ToBytes(b64) {
        const bin = atob(b64);
        const out = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
        return out;
    }

    const AetherBackup = window.AetherBackup = {
        deferredInstallPrompt: null,

        async buildSnapshotObject() {
            const localKeys = {};
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith('AetherOS')) {
                    localKeys[k] = localStorage.getItem(k);
                }
            }
            const vfsFiles = await AetherVFS.getAllFiles();
            const customWall = await AetherVFS.getMeta('custom_wallpaper');
            return {
                format: 'aetheros-snapshot-v1',
                exportedAt: new Date().toISOString(),
                localStorage: localKeys,
                vfsFiles,
                customWallpaper: customWall || ''
            };
        },

        async exportSnapshot(passphrase = '') {
            SystemState.saveNow && SystemState.saveNow();
            const snap = await this.buildSnapshotObject();
            let payloadObj = snap;

            if (passphrase && window.crypto && crypto.subtle) {
                const salt = crypto.getRandomValues(new Uint8Array(16));
                const iv = crypto.getRandomValues(new Uint8Array(12));
                const key = await deriveBackupKey(passphrase, salt);
                const plainBytes = new TextEncoder().encode(JSON.stringify(snap));
                const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plainBytes);
                payloadObj = {
                    format: 'aetheros-encrypted-snapshot-v1',
                    exportedAt: snap.exportedAt,
                    salt: bytesToBase64(salt),
                    iv: bytesToBase64(iv),
                    ciphertext: bytesToBase64(cipherBuf)
                };
            }

            const blob = new Blob([JSON.stringify(payloadObj, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `aetheros-workspace-${new Date().toISOString().slice(0, 10)}.aether.json`;
            a.click();
            window.Notifications && window.Notifications.push('WORKSPACE BACKUP', passphrase ? 'Encrypted .aether snapshot exported.' : 'Workspace .aether snapshot exported.');
        },

        async importSnapshotText(jsonText) {
            let parsed = JSON.parse(jsonText);
            if (parsed.format === 'aetheros-encrypted-snapshot-v1') {
                const pass = window.prompt('Enter passphrase to decrypt this .aether workspace backup:');
                if (!pass) return false;
                const key = await deriveBackupKey(pass, base64ToBytes(parsed.salt));
                const decBuf = await crypto.subtle.decrypt(
                    { name: 'AES-GCM', iv: base64ToBytes(parsed.iv) },
                    key,
                    base64ToBytes(parsed.ciphertext)
                );
                parsed = JSON.parse(new TextDecoder().decode(decBuf));
            }
            if (!parsed || !parsed.localStorage) {
                throw new Error('Invalid .aether snapshot file');
            }
            Object.entries(parsed.localStorage).forEach(([k, v]) => {
                if (typeof v === 'string') localStorage.setItem(k, v);
            });
            if (Array.isArray(parsed.vfsFiles)) {
                for (const f of parsed.vfsFiles) {
                    await AetherVFS.putFile(f);
                }
            }
            if (parsed.customWallpaper) {
                await AetherVFS.setMeta('custom_wallpaper', parsed.customWallpaper);
            }
            window.Notifications && window.Notifications.push('WORKSPACE RESTORED', 'Snapshot imported. Reloading AetherOS...');
            setTimeout(() => location.reload(), 450);
            return true;
        },

        triggerExportUI() {
            const pass = window.prompt('Optional: enter a passphrase to AES-256 encrypt this backup (leave empty for plain .aether.json):', '');
            if (pass === null) return;
            this.exportSnapshot(pass.trim());
        },

        triggerImportUI() {
            let inp = document.getElementById('aether-backup-import-input');
            if (!inp) {
                inp = document.createElement('input');
                inp.type = 'file';
                inp.accept = '.json,.aether,application/json';
                inp.id = 'aether-backup-import-input';
                inp.style.display = 'none';
                inp.onchange = async (e) => {
                    const file = e.target.files && e.target.files[0];
                    if (!file) return;
                    try {
                        const text = await file.text();
                        await this.importSnapshotText(text);
                    } catch (err) {
                        window.Notifications && window.Notifications.push('IMPORT FAILED', 'Could not decrypt or parse snapshot file.');
                    }
                    inp.value = '';
                };
                document.body.appendChild(inp);
            }
            inp.click();
        },

        async installPWA() {
            if (this.deferredInstallPrompt) {
                this.deferredInstallPrompt.prompt();
                await this.deferredInstallPrompt.userChoice.catch(() => {});
                this.deferredInstallPrompt = null;
            } else if (window.Notifications) {
                window.Notifications.push('INSTALL APP', 'Use your browser menu → "Install AetherOS" or "Add to Dock / Desktop" to run standalone.');
            }
        }
    };

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        AetherBackup.deferredInstallPrompt = e;
    });

    // Global Desktop Drag & Drop File Importer + Service Worker Registration
    window.addEventListener('DOMContentLoaded', () => {
        AetherVFS.getAllFiles().then(() => AetherVFS.syncToFileManager());

        if ('serviceWorker' in navigator && /^https?:$/i.test(location.protocol)) {
            navigator.serviceWorker.register('./sw.js').catch(() => {});
        }

        let dragDepth = 0;
        const dropOverlay = document.getElementById('vfs-drop-overlay');
        window.addEventListener('dragenter', (e) => {
            if (!e.dataTransfer || !Array.from(e.dataTransfer.types || []).includes('Files')) return;
            dragDepth++;
            if (dropOverlay) dropOverlay.classList.add('active');
        });
        window.addEventListener('dragover', (e) => {
            if (!e.dataTransfer || !Array.from(e.dataTransfer.types || []).includes('Files')) return;
            e.preventDefault();
        });
        window.addEventListener('dragleave', (e) => {
            if (!e.dataTransfer || !Array.from(e.dataTransfer.types || []).includes('Files')) return;
            dragDepth = Math.max(0, dragDepth - 1);
            if (dragDepth === 0 && dropOverlay) dropOverlay.classList.remove('active');
        });
        window.addEventListener('drop', (e) => {
            if (!e.dataTransfer || !e.dataTransfer.files || !e.dataTransfer.files.length) return;
            e.preventDefault();
            dragDepth = 0;
            if (dropOverlay) dropOverlay.classList.remove('active');
            AetherVFS.importBrowserFiles(e.dataTransfer.files, 'User Uploads');
        });
    });
})();
