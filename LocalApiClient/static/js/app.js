document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const reqMethod = document.getElementById('reqMethod');
    const reqUrl = document.getElementById('reqUrl');
    const sendBtn = document.getElementById('sendBtn');
    const saveBtn = document.getElementById('saveBtn');
    
    // Header/Body Tabs
    const stepType = document.getElementById('stepType');
    const reqMethodContainer = document.getElementById('reqMethodContainer');
    const reqUrlContainer = document.getElementById('reqUrlContainer');
    const configRequest = document.getElementById('configRequest');
    const configAction = document.getElementById('configAction');
    
    const reqTabs = document.querySelectorAll('.request-config .tab');
    const resTabs = document.querySelectorAll('.response-viewer .tab');
    
    // Editors
    const headersEditor = document.getElementById('headersEditor');
    const addHeaderBtn = document.getElementById('addHeaderBtn');
    const bodyRadios = document.querySelectorAll('input[name="bodyType"]');
    const bodyEditor = document.getElementById('bodyEditor');
    const varsEditor = document.getElementById('varsEditor');
    const addVarBtn = document.getElementById('addVarBtn');
    
    // Response Section
    const loadingOverlay = document.getElementById('loadingOverlay');
    const responseBody = document.getElementById('responseBody');
    const responseHeaders = document.getElementById('responseHeaders');
    const resStatus = document.getElementById('resStatus');
    const resTime = document.getElementById('resTime');
    const resSize = document.getElementById('resSize');
    
    // Header Buttons
    const newRequestBtn = document.getElementById('newRequestBtn');

    // Save Modal
    const saveModal = document.getElementById('saveModal');
    const cancelSaveBtn = document.getElementById('cancelSaveBtn');
    const confirmSaveBtn = document.getElementById('confirmSaveBtn');
    const collectionList = document.getElementById('collectionList');
    
    // Active Flow
    const activeFlowSelect = document.getElementById('activeFlowSelect');
    const newFlowBtn = document.getElementById('newFlowBtn');
    const saveFlowLabel = document.getElementById('saveFlowLabel');
    
    const flowRunnerModal = document.getElementById('flowRunnerModal');
    const flowRunnerTitle = document.getElementById('flowRunnerTitle');
    const flowRunnerStatus = document.getElementById('flowRunnerStatus');
    const flowRunnerLogs = document.getElementById('flowRunnerLogs');
    const closeFlowRunnerBtn = document.getElementById('closeFlowRunnerBtn');
    
    const extractPopup = document.getElementById('extractPopup');
    const extractVarName = document.getElementById('extractVarName');
    const confirmExtractBtn = document.getElementById('confirmExtractBtn');
    const cancelExtractBtn = document.getElementById('cancelExtractBtn');
    let currentExtractPath = '';

    const envBtn = document.getElementById('envBtn');
    const envModal = document.getElementById('envModal');
    const envEditor = document.getElementById('envEditor');
    const closeEnvBtn = document.getElementById('closeEnvBtn');
    
    let savedCollections = [];
    let savedEnvironment = {};

    // --- Auth DOM Elements ---
    const authRadios = document.querySelectorAll('input[name="authType"]');
    const authBasicUI = document.getElementById('auth-basic-ui');
    const authBearerUI = document.getElementById('auth-bearer-ui');
    const authNoneUI = document.getElementById('auth-none-ui');
    const authBasicUser = document.getElementById('authBasicUser');
    const authBasicPass = document.getElementById('authBasicPass');
    const authBearerToken = document.getElementById('authBearerToken');

    // --- Tab Switching Logic ---
    function setupTabs(tabsNodeList) {
        tabsNodeList.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active from peers
                tab.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tab.parentElement.parentElement.parentElement.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                // Add active to current
                tab.classList.add('active');
                document.getElementById(`tab-${tab.dataset.target}`).classList.add('active');
            });
        });
    }
    setupTabs(reqTabs);
    setupTabs(resTabs);

    // --- Dynamic styling for Http Method & action toggling ---
    stepType.addEventListener('change', () => {
        const isReq = stepType.value === 'request';
        reqMethodContainer.style.display = isReq ? 'block' : 'none';
        reqUrlContainer.style.display = isReq ? 'block' : 'none';
        sendBtn.style.display = isReq ? 'block' : 'none';
        
        if (isReq) {
            configRequest.classList.remove('hidden');
            configAction.classList.add('hidden');
        } else {
            configRequest.classList.add('hidden');
            configAction.classList.remove('hidden');
            
            document.querySelectorAll('.action-ui').forEach(el => el.classList.add('hidden'));
            document.getElementById(`ui-${stepType.value}`).classList.remove('hidden');
        }
    });

    reqMethod.addEventListener('change', (e) => {
        reqMethod.className = `method-select ${e.target.value}`;
    });

    // --- Headers Editor Logic ---
    function addHeaderRow(key = '', value = '') {
        const row = document.createElement('div');
        row.className = 'key-value-row';
        row.innerHTML = `
            <input type="text" placeholder="Key" class="h-key" value="${key}">
            <input type="text" placeholder="Value" class="h-val" value="${value}">
            <button class="btn-icon remove-row"><i class="fas fa-trash"></i></button>
        `;
        
        row.querySelector('.remove-row').addEventListener('click', () => {
            row.remove();
        });
        
        headersEditor.insertBefore(row, addHeaderBtn);
    }

    addHeaderBtn.addEventListener('click', () => addHeaderRow());

    function getHeaders() {
        const headers = {};
        document.querySelectorAll('#headersEditor .key-value-row').forEach(row => {
            const key = row.querySelector('.h-key').value.trim();
            const val = row.querySelector('.h-val').value.trim();
            if (key) {
                headers[key] = val;
            }
        });
        return headers;
    }

    // --- Extract Logic ---
    function addVarRow(key = '', value = '') {
        const row = document.createElement('div');
        row.className = 'key-value-row';
        row.innerHTML = `
            <input type="text" placeholder="Variable Name" class="h-key" value="${key}">
            <input type="text" placeholder="JSON Path (e.g. data.token)" class="h-val" value="${value}">
            <button class="btn-icon remove-row"><i class="fas fa-trash"></i></button>
        `;
        row.querySelector('.remove-row').addEventListener('click', () => row.remove());
        varsEditor.insertBefore(row, addVarBtn);
    }

    addVarBtn.addEventListener('click', () => addVarRow());

    function getExtractors() {
        const ext = {};
        document.querySelectorAll('#tab-vars .key-value-row').forEach(row => {
            const key = row.querySelector('.h-key').value.trim();
            const val = row.querySelector('.h-val').value.trim();
            if (key && val) ext[key] = val;
        });
        return ext;
    }

    // --- Auth Logic ---
    authRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            authBasicUI.classList.add('hidden');
            authBearerUI.classList.add('hidden');
            authNoneUI.classList.add('hidden');
            if (e.target.value === 'basic') authBasicUI.classList.remove('hidden');
            else if (e.target.value === 'bearer') authBearerUI.classList.remove('hidden');
            else authNoneUI.classList.remove('hidden');
        });
    });

    function getAuth() {
        const authType = document.querySelector('input[name="authType"]:checked').value;
        if (authType === 'basic') return { type: 'basic', username: authBasicUser.value, password: authBasicPass.value };
        if (authType === 'bearer') return { type: 'bearer', token: authBearerToken.value };
        return { type: 'none' };
    }
    
    function setAuth(auth) {
        if (!auth) auth = { type: 'none' };
        document.querySelector(`input[name="authType"][value="${auth.type}"]`).checked = true;
        document.querySelector(`input[name="authType"][value="${auth.type}"]`).dispatchEvent(new Event('change'));
        if (auth.type === 'basic') {
            authBasicUser.value = auth.username || '';
            authBasicPass.value = auth.password || '';
        } else if (auth.type === 'bearer') {
            authBearerToken.value = auth.token || '';
        }
    }

    // --- Environment Interpolation Logic ---
    let approvedMissingVars = new Set();

    async function asyncConfirm(message) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal';
            overlay.style.zIndex = '9999';
            
            const box = document.createElement('div');
            box.className = 'modal-content';
            
            box.innerHTML = `
                <h3 style="margin-bottom: 12px; color: #fbbf24;"><i class="fas fa-exclamation-triangle"></i> Missing Variable</h3>
                <p style="margin-bottom: 24px; white-space: pre-wrap; font-size: 0.9rem; line-height: 1.5;">${escapeHTML(message)}</p>
                <div class="modal-actions">
                    <button class="btn-secondary" id="confirmCancel">Abort</button>
                    <button class="btn-primary" id="confirmOk">Continue</button>
                </div>
            `;
            
            overlay.appendChild(box);
            document.body.appendChild(overlay);
            
            box.querySelector('#confirmOk').addEventListener('click', () => {
                overlay.remove();
                resolve(true);
            });
            box.querySelector('#confirmCancel').addEventListener('click', () => {
                overlay.remove();
                resolve(false);
            });
        });
    }

    async function interpolateStr(str) {
        if (typeof str !== 'string') return str;
        
        let match;
        const missing = [];
        const regex = /\{\{([^}]+)\}\}/g;
        while ((match = regex.exec(str)) !== null) {
            const key = match[1].trim();
            if (savedEnvironment[key] === undefined && !missing.includes(key) && !approvedMissingVars.has(key)) {
                missing.push(key);
            }
        }
        
        for (const m of missing) {
            const proceed = await asyncConfirm(`The environment variable "{{${m}}}" is missing.\n\nClick Continue to leave it as literal text, or Abort to stop execution.`);
            if (!proceed) {
                throw new Error(`USER_ABORT: Missing variable "{{${m}}}"`);
            }
            approvedMissingVars.add(m);
        }

        return str.replace(/\{\{([^}]+)\}\}/g, (mOriginal, key) => {
            const k = key.trim();
            return savedEnvironment[k] !== undefined ? savedEnvironment[k] : mOriginal;
        });
    }

    // --- Body Editor Logic ---
    bodyRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'none') {
                bodyEditor.disabled = true;
                bodyEditor.value = '';
            } else {
                bodyEditor.disabled = false;
                if (e.target.value === 'json' && !bodyEditor.value) {
                    bodyEditor.value = '{\n  \n}';
                }
            }
        });
    });

    // --- Send Request Logic ---
    sendBtn.addEventListener('click', async () => {
        approvedMissingVars.clear();
        // Collect Data
        let requestData;
        try {
            requestData = {
                url: await interpolateStr(reqUrl.value.trim()),
                method: reqMethod.value,
                headers: {}
            };
            const rawHeaders = getHeaders();
            for (let k in rawHeaders) {
                requestData.headers[await interpolateStr(k)] = await interpolateStr(rawHeaders[k]);
            }

            const authInfo = getAuth();
            if (authInfo.type === 'basic') {
                const u = await interpolateStr(authInfo.username);
                const p = await interpolateStr(authInfo.password);
                requestData.headers['Authorization'] = 'Basic ' + btoa(u + ':' + p);
            } else if (authInfo.type === 'bearer') {
                const t = await interpolateStr(authInfo.token);
                requestData.headers['Authorization'] = 'Bearer ' + t;
            }

            const bodyType = document.querySelector('input[name="bodyType"]:checked').value;
            if (bodyType !== 'none' && bodyEditor.value.trim()) {
                if (bodyType === 'json') {
                    // Inject json header automatically if missing
                    if(!requestData.headers['Content-Type']){
                        requestData.headers['Content-Type'] = 'application/json';
                    }
                    requestData.body = JSON.parse(await interpolateStr(bodyEditor.value));
                } else {
                    requestData.body = await interpolateStr(bodyEditor.value);
                }
            }
        } catch (e) {
            if (e.message.startsWith('USER_ABORT')) return;
            alert('Error during interpolation/parsing:\n' + e.message);
            return;
        }

        if (!requestData.url) {
            alert('Please enter a URL');
            return;
        }

        // Send to backend
        loadingOverlay.classList.remove('hidden');
        try {
            const res = await fetch('/api/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });
            const data = await res.json();
            
            // Format Response
            displayResponse(data);
        } catch (error) {
            resStatus.textContent = "Error";
            resStatus.className = "status-badge error";
            responseBody.textContent = `Client Error: ${error.message}`;
        } finally {
            loadingOverlay.classList.add('hidden');
        }
    });

    function displayResponse(data) {
        // Status Badge
        resStatus.textContent = `Status: ${data.status} ${data.status_text || ''}`;
        resStatus.className = 'status-badge';
        if (data.status >= 200 && data.status < 300) resStatus.classList.add('success');
        else if (data.status >= 400) resStatus.classList.add('error');
        else resStatus.classList.add('warning');

        // Meta info
        resTime.innerHTML = `<i class="fas fa-clock"></i> ${data.time_ms || 0} ms`;
        resSize.innerHTML = `<i class="fas fa-save"></i> ${formatBytes(data.size_bytes || 0)}`;

        // Body Formatting
        if (data.error) {
            responseBody.textContent = `Error: ${data.error}`;
        } else if (data.is_json) {
            responseBody.innerHTML = generateJSONHTML(data.body);
        } else {
            responseBody.textContent = data.body;
        }

        // Headers Formatting
        responseHeaders.textContent = JSON.stringify(data.headers || {}, null, 2);

        // Run Extractors
        if (data.is_json && data.body) {
            const extracts = getExtractors();
            let envChanged = false;
            for (let varName in extracts) {
                const path = extracts[varName];
                const result = path.split('.').reduce((o, i) => (o && typeof o === 'object' ? o[i] : undefined), data.body);
                if (result !== undefined) {
                    savedEnvironment[varName] = result;
                    envChanged = true;
                }
            }
            if (envChanged) {
                saveServerData();
            }
        }
    }

    function formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function escapeHTML(str) {
        if (!str) return str;
        return String(str).replace(/[&<>'"]/g, tag => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        }[tag] || tag));
    }

    function generateJSONHTML(obj, path = '', indent = 0) {
        const sp = '  '.repeat(indent);
        const insp = '  '.repeat(indent + 1);
        if (obj === null) return `<span class="json-hoverable json-null" data-path="${path}">null</span>`;
        if (typeof obj === 'boolean') return `<span class="json-hoverable json-bool" data-path="${path}">${obj}</span>`;
        if (typeof obj === 'number') return `<span class="json-hoverable json-num" data-path="${path}">${obj}</span>`;
        if (typeof obj === 'string') return `<span class="json-hoverable json-str" data-path="${path}">"${escapeHTML(obj)}"</span>`;
        
        if (Array.isArray(obj)) {
            if (obj.length === 0) return '[]';
            let html = '[\n';
            obj.forEach((val, i) => {
                let newPath = path ? `${path}[${i}]` : `[${i}]`;
                html += `${insp}${generateJSONHTML(val, newPath, indent + 1)}${i < obj.length - 1 ? ',' : ''}\n`;
            });
            html += `${sp}]`;
            return html;
        }
        
        if (typeof obj === 'object') {
            const keys = Object.keys(obj);
            if (keys.length === 0) return '{}';
            let html = '{\n';
            keys.forEach((k, i) => {
                let newPath = path ? `${path}.${k}` : k;
                html += `${insp}<span class="json-hoverable json-key" data-path="${newPath}">"${escapeHTML(k)}"</span>: ${generateJSONHTML(obj[k], newPath, indent + 1)}${i < keys.length - 1 ? ',' : ''}\n`;
            });
            html += `${sp}}`;
            return html;
        }
        return '';
    }

    // Visual Extractor Interactivity
    responseBody.addEventListener('click', (e) => {
        const target = e.target.closest('.json-hoverable');
        if (!target) return;
        currentExtractPath = target.dataset.path;
        
        extractPopup.style.left = `${e.pageX + 10}px`;
        extractPopup.style.top = `${e.pageY + 10}px`;
        extractPopup.classList.remove('hidden');
        
        const parts = currentExtractPath.split('.');
        extractVarName.value = parts[parts.length - 1].replace(/[^a-zA-Z0-9_]/g, '');
        extractVarName.focus();
    });
    
    cancelExtractBtn.addEventListener('click', () => extractPopup.classList.add('hidden'));
    confirmExtractBtn.addEventListener('click', () => {
        const varName = extractVarName.value.trim();
        if (varName && currentExtractPath) {
            addVarRow(varName, currentExtractPath);
            document.querySelector('.tab[data-target="vars"]').click();
            extractPopup.classList.add('hidden');
        }
    });

    // --- Save/Load Logic ---
    async function saveServerData() {
        try {
            await fetch('/api/collections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ collections: savedCollections, environment: savedEnvironment })
            });
        } catch(e) { console.error("Failed to save data to server"); }
    }

    async function loadCollections() {
        try {
            const res = await fetch('/api/collections');
            const data = await res.json();
            savedCollections = data.collections || [];
            savedEnvironment = data.environment || {};
            renderCollectionsList();
        } catch (e) {
            console.error("Failed to load collections");
        }
    }

    function renderCollectionsList() {
        collectionList.innerHTML = '';
        const flows = {};
        
        savedCollections.forEach(req => {
            const flowName = req.collection || 'Default';
            if (!flows[flowName]) flows[flowName] = [];
            flows[flowName].push(req);
        });

        // Update Active Flow Dropdown
        const currentSelectedFlow = activeFlowSelect.value;
        activeFlowSelect.innerHTML = '';
        Object.keys(flows).forEach(f => {
            const opt = document.createElement('option');
            opt.value = f;
            opt.textContent = f;
            activeFlowSelect.appendChild(opt);
        });
        if (flows[currentSelectedFlow]) {
            activeFlowSelect.value = currentSelectedFlow;
        } else if (Object.keys(flows).length > 0) {
            activeFlowSelect.value = Object.keys(flows)[0];
        } else {
            const defaultOpt = document.createElement('option');
            defaultOpt.value = 'Default';
            defaultOpt.textContent = 'Default';
            activeFlowSelect.appendChild(defaultOpt);
            activeFlowSelect.value = 'Default';
        }

        Object.keys(flows).forEach(flowName => {
            const flowGroup = document.createElement('div');
            flowGroup.className = 'flow-group';
            
            const header = document.createElement('div');
            header.className = 'flow-group-header';
            header.innerHTML = `
                <span><i class="fas fa-layer-group"></i> ${escapeHTML(flowName)}</span>
                <button class="btn-icon run-flow-btn" title="Run Flow"><i class="fas fa-play"></i></button>
            `;
            
            header.querySelector('.run-flow-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                runFlow(flowName, flows[flowName]);
            });

            const reqsContainer = document.createElement('div');
            reqsContainer.className = 'flow-requests';

            flows[flowName].forEach(req => {
                const div = document.createElement('div');
                div.className = 'saved-request-item';
                div.draggable = true;
                div.dataset.flow = flowName;
                div.reqData = req;

                let iconHtml = `<i class="fas fa-globe" style="color: #60a5fa; margin-right: 6px;"></i>`;
                let methodHtml = `<span class="${req.method}">${req.method}</span>`;
                let descHtml = escapeHTML(req.url);

                if (req.type && req.type !== 'request') {
                    if (req.type === 'clear_vars') { iconHtml = `🧹`; methodHtml = `<span style="color:#f87171; font-size:0.75rem; font-weight:bold;">CLEAR VARS</span>`; descHtml = req.actionData.vars || 'All'; }
                    if (req.type === 'delay') { iconHtml = `⏱️`; methodHtml = `<span style="color:#fbbf24; font-size:0.75rem; font-weight:bold;">DELAY</span>`; descHtml = `${req.actionData.ms}ms`; }
                    if (req.type === 'script') { iconHtml = `📜`; methodHtml = `<span style="color:#a78bfa; font-size:0.75rem; font-weight:bold;">SCRIPT</span>`; descHtml = 'Custom JS'; }
                    if (req.type === 'conditional') { iconHtml = `❓`; methodHtml = `<span style="color:#34d399; font-size:0.75rem; font-weight:bold;">IF</span>`; descHtml = `${req.actionData.var} ${req.actionData.op} ${req.actionData.val}`; }
                }

                div.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; width:100%;">
                        <div style="min-width:0; flex:1;">
                            <div class="req-name"><i class="fas fa-grip-vertical" style="color: #475569; margin-right: 6px;"></i>${iconHtml} ${escapeHTML(req.name)}</div>
                            <div class="req-meta">
                                ${methodHtml}
                                <span class="url-trunc" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px; display:inline-block; vertical-align:bottom;">${descHtml}</span>
                            </div>
                        </div>
                        <button class="btn-icon delete-step-btn" title="Delete Step" style="padding:4px; margin-left:4px; pointer-events: auto; position: relative; z-index: 50;"><i class="fas fa-trash" style="font-size: 0.8rem; color: #ef4444; pointer-events: none;"></i></button>
                    </div>
                `;
                
                div.addEventListener('click', () => loadRequestIntoUI(req));

                const delBtn = div.querySelector('.delete-step-btn');
                delBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if(confirm(`Are you sure you want to delete the step "${req.name}"?`)) {
                        savedCollections = savedCollections.filter(r => r !== req);
                        await saveServerData();
                        renderCollectionsList();
                    }
                });
                
                // --- Drag and Drop Logic ---
                div.addEventListener('dragstart', function(e) {
                    window.draggedRequestEle = this;
                    setTimeout(() => this.classList.add('dragging'), 0);
                    e.dataTransfer.effectAllowed = 'move';
                });

                div.addEventListener('dragend', function() {
                    this.classList.remove('dragging');
                    window.draggedRequestEle = null;
                });

                div.addEventListener('dragover', function(e) {
                    e.preventDefault();
                    if (!window.draggedRequestEle || window.draggedRequestEle.dataset.flow !== this.dataset.flow) return;
                    e.dataTransfer.dropEffect = 'move';
                    
                    const rect = this.getBoundingClientRect();
                    const midY = rect.top + rect.height / 2;
                    if (e.clientY < midY) {
                        this.parentNode.insertBefore(window.draggedRequestEle, this);
                    } else {
                        this.parentNode.insertBefore(window.draggedRequestEle, this.nextSibling);
                    }
                });

                div.addEventListener('drop', async function(e) {
                    e.preventDefault();
                    const dragEle = window.draggedRequestEle;
                    if (dragEle && dragEle.dataset.flow === this.dataset.flow) {
                        const container = this.parentNode;
                        const newOrder = Array.from(container.children).map(child => child.reqData);
                        
                        const updatedCollections = [];
                        let flowIdx = 0;
                        savedCollections.forEach(r => {
                            if ((r.collection || 'Default') === flowName) {
                                updatedCollections.push(newOrder[flowIdx]);
                                flowIdx++;
                            } else {
                                updatedCollections.push(r);
                            }
                        });
                        savedCollections = updatedCollections;
                        await saveServerData();
                        renderCollectionsList(); // Re-render to update the runFlow bindings with new order
                    }
                });

                reqsContainer.appendChild(div);
            });

            flowGroup.appendChild(header);
            flowGroup.appendChild(reqsContainer);
            collectionList.appendChild(flowGroup);
        });
    }

    // --- Flow Runner Engine ---
    if(closeFlowRunnerBtn) closeFlowRunnerBtn.addEventListener('click', () => flowRunnerModal.classList.add('hidden'));

    function logFlow(msg, color = '#f8fafc') {
        const div = document.createElement('div');
        div.style.color = color;
        div.style.marginBottom = '4px';
        div.style.whiteSpace = 'pre-wrap';
        div.textContent = msg;
        flowRunnerLogs.appendChild(div);
        flowRunnerLogs.scrollTop = flowRunnerLogs.scrollHeight;
        return div;
    }

    function logInteractiveRequest(reqData, resData) {
        const div = document.createElement('div');
        div.style.marginBottom = '8px';
        
        const isSuccess = resData.status >= 200 && resData.status < 300;
        const link = document.createElement('a');
        link.href = '#';
        link.style.color = isSuccess ? '#34d399' : '#f87171';
        link.style.textDecoration = 'none';
        link.style.display = 'block';
        link.style.padding = '6px';
        link.style.borderRadius = '4px';
        link.style.background = 'rgba(255,255,255,0.05)';
        link.style.border = `1px solid ${isSuccess ? 'rgba(52, 211, 153, 0.2)' : 'rgba(248, 113, 113, 0.2)'}`;
        
        const iconHtml = isSuccess ? `<i class="fas fa-check-circle" style="margin-right:4px;"></i>` : `<i class="fas fa-times-circle" style="margin-right:4px;"></i>`;
        link.innerHTML = `${iconHtml}<strong>${reqData.method}</strong> ${escapeHTML(reqData.url)} &rarr; ${resData.status || 'ERR'} ${resData.status_text || ''} (${resData.time_ms || 0}ms)`;
        
        const details = document.createElement('div');
        details.className = 'hidden';
        details.style.marginTop = '4px';
        details.style.padding = '8px';
        details.style.background = '#0f172a';
        details.style.borderRadius = '4px';
        details.style.border = '1px solid #334155';
        details.style.fontSize = '0.8rem';
        details.style.fontFamily = 'monospace';
        details.style.whiteSpace = 'pre-wrap';
        details.style.overflowX = 'auto';

        let rHead = JSON.stringify(reqData.headers, null, 2);
        let rBody = typeof reqData.body === 'object' ? JSON.stringify(reqData.body, null, 2) : (reqData.body || '');
        
        let sHead = JSON.stringify(resData.headers || {}, null, 2);
        let sBody = resData.error ? JSON.stringify({error: resData.error}) : (resData.is_json && resData.body ? JSON.stringify(resData.body, null, 2) : (resData.body || ''));

        const fullDump = JSON.stringify({
            request: reqData,
            response: resData
        }, null, 2);

        details.innerHTML = `
<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
    <div style="color:#60a5fa; font-weight:bold;">REQ HEADERS</div>
    <button class="btn-outline copy-dump-btn" style="padding:4px 8px; font-size:0.75rem; color:#94a3b8; border-color:#334155;"><i class="fas fa-copy"></i> Copy Dump</button>
</div>
<div style="color:#94a3b8; margin-bottom:8px;">${escapeHTML(rHead)}</div>
${rBody ? `<div style="color:#60a5fa; font-weight:bold; margin-bottom:4px;">REQ BODY</div><div style="color:#94a3b8; margin-bottom:8px;">${escapeHTML(rBody)}</div>` : ''}
<div style="color:#34d399; font-weight:bold; margin-bottom:4px;">RES HEADERS</div>
<div style="color:#94a3b8; margin-bottom:8px;">${escapeHTML(sHead)}</div>
${sBody ? `<div style="color:#34d399; font-weight:bold; margin-bottom:4px;">RES BODY</div><div style="color:#94a3b8;">${escapeHTML(sBody)}</div>` : ''}
        `;

        details.querySelector('.copy-dump-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(fullDump).then(() => {
                const btn = details.querySelector('.copy-dump-btn');
                btn.innerHTML = '<i class="fas fa-check" style="color:#34d399;"></i> Copied';
                setTimeout(() => btn.innerHTML = '<i class="fas fa-copy"></i> Copy Dump', 2000);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        });

        link.addEventListener('click', (e) => {
            e.preventDefault();
            details.classList.toggle('hidden');
        });

        div.appendChild(link);
        div.appendChild(details);
        flowRunnerLogs.appendChild(div);
        flowRunnerLogs.scrollTop = flowRunnerLogs.scrollHeight;
        return div;
    }

    async function runFlow(flowName, requests) {
        approvedMissingVars.clear();
        flowRunnerTitle.textContent = `Running Flow: ${flowName}`;
        flowRunnerLogs.innerHTML = '';
        flowRunnerStatus.textContent = 'Running';
        flowRunnerStatus.style.background = 'rgba(59, 130, 246, 0.2)';
        flowRunnerStatus.style.color = '#60a5fa';
        flowRunnerModal.classList.remove('hidden');

        logFlow(`=> Starting flow with ${requests.length} steps...`, '#60a5fa');

        let successCount = 0;
        for (let i = 0; i < requests.length; i++) {
            const req = requests[i];
            logFlow(`\n[Step ${i+1}/${requests.length}] ${req.name}`);
            
            if (req.type && req.type !== 'request') {
                if (req.type === 'clear_vars') {
                    const varsToClear = (req.actionData.vars || '').split(',').map(v => v.trim()).filter(v => v);
                    let count = 0;
                    if(varsToClear.length === 0) {
                        savedEnvironment = {};
                        logFlow(`> Action: Cleared ALL variables`, '#f87171');
                    } else {
                        varsToClear.forEach(v => {
                            if (savedEnvironment[v] !== undefined) {
                                delete savedEnvironment[v];
                                count++;
                            }
                        });
                        logFlow(`> Action: Cleared ${count} variable(s)`, '#f87171');
                    }
                    saveServerData();
                } else if (req.type === 'delay') {
                    const ms = req.actionData.ms || 0;
                    logFlow(`> Action: Waiting for ${ms}ms...`, '#fbbf24');
                    await new Promise(r => setTimeout(r, ms));
                } else if (req.type === 'script') {
                    logFlow(`> Action: Running Javascript`, '#a78bfa');
                    try {
                        const envFunc = new Function('env', req.actionData.script);
                        envFunc(savedEnvironment);
                        saveServerData();
                        logFlow(`> Script execution finished successfully.`, '#a78bfa');
                    } catch(e) {
                         logFlow(`✗ Script Error: ${e.message}`, '#ef4444');
                         break;
                    }
                } else if (req.type === 'conditional') {
                    let varVal, valStr;
                    try {
                        varVal = await interpolateStr(req.actionData.var);
                        valStr = await interpolateStr(req.actionData.val);
                    } catch (e) {
                        logFlow(`✗ Action Aborted: ${e.message}`, '#ef4444');
                        break;
                    }
                    const op = req.actionData.op;
                    let result = false;

                    if (op === '==') result = (varVal == valStr);
                    if (op === '!=') result = (varVal != valStr);
                    if (op === '>') {
                         const n1 = parseFloat(varVal);
                         const n2 = parseFloat(valStr);
                         if (!isNaN(n1) && !isNaN(n2)) result = n1 > n2;
                         else result = varVal > valStr;
                    }
                    if (op === '<') {
                         const n1 = parseFloat(varVal);
                         const n2 = parseFloat(valStr);
                         if (!isNaN(n1) && !isNaN(n2)) result = n1 < n2;
                         else result = varVal < valStr;
                    }

                    if (!result) {
                        logFlow(`> Action: Condition failed ("${varVal}" ${op} "${valStr}"). Aborting flow.`, '#fbbf24');
                        break;
                    } else {
                        logFlow(`> Action: Condition passed ("${varVal}" ${op} "${valStr}"). Continuing.`, '#34d399');
                    }
                }
                successCount++;
                continue;
            }

            let requestData;
            try {
                requestData = { url: await interpolateStr(req.url), method: req.method, headers: {} };
                if (req.headers) {
                    for (let k in req.headers) {
                        requestData.headers[await interpolateStr(k)] = await interpolateStr(req.headers[k]);
                    }
                }
                
                if (req.auth) {
                    if (req.auth.type === 'basic') {
                        const u = await interpolateStr(req.auth.username);
                        const p = await interpolateStr(req.auth.password);
                        requestData.headers['Authorization'] = 'Basic ' + btoa(u + ':' + p);
                    } else if (req.auth.type === 'bearer') {
                        const t = await interpolateStr(req.auth.token);
                        requestData.headers['Authorization'] = 'Bearer ' + t;
                    }
                }

                if (req.body) {
                    if (typeof req.body === 'object') {
                        if (!requestData.headers['Content-Type']) requestData.headers['Content-Type'] = 'application/json';
                        requestData.body = JSON.parse(await interpolateStr(JSON.stringify(req.body)));
                    } else {
                        requestData.body = await interpolateStr(req.body);
                    }
                }
            } catch (e) {
                logFlow(`✗ Step Aborted: ${e.message}`, '#ef4444');
                break;
            }
            const pendingEle = logFlow(`> ${requestData.method} ${requestData.url} ...`, '#94a3b8');

            try {
                const res = await fetch('/api/execute', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestData)
                });
                const data = await res.json();
                
                pendingEle.remove();
                
                if (data.error) {
                    logInteractiveRequest(requestData, { status: 500, status_text: 'Execution Failed', error: data.error });
                    break;
                }
                
                logInteractiveRequest(requestData, data);
                
                if (data.status >= 200 && data.status < 300) {
                    successCount++;
                    
                    if (data.is_json && data.body && req.extractors) {
                        let extractedCount = 0;
                        for (let varName in req.extractors) {
                            const path = req.extractors[varName];
                            const result = path.split('.').reduce((o, i) => o && typeof o === 'object' ? o[i] : undefined, data.body);
                            if (result !== undefined) {
                                savedEnvironment[varName] = result;
                                logFlow(`  [Extract] ${varName} = ${result}`, '#eab308');
                                extractedCount++;
                            }
                        }
                        if (extractedCount > 0) saveServerData(); 
                    }
                } else {
                    break;
                }
            } catch (error) {
                pendingEle.remove();
                logInteractiveRequest(requestData, { status: 500, status_text: 'Network Error', error: error.message });
                break;
            }
        }
        
        // Remove the log text from the loop finish
        if (successCount === requests.length) {
            logFlow(`\n✨ Flow completed successfully!`, '#34d399');
            flowRunnerStatus.textContent = 'Success';
            flowRunnerStatus.style.background = 'rgba(16, 185, 129, 0.2)';
            flowRunnerStatus.style.color = '#34d399';
        } else {
            logFlow(`\n⚠️ Flow aborted due to an error.`, '#ef4444');
            flowRunnerStatus.textContent = 'Failed';
            flowRunnerStatus.style.background = 'rgba(239, 68, 68, 0.2)';
            flowRunnerStatus.style.color = '#f87171';
        }
    }

    function loadRequestIntoUI(req) {
        if (req.type && req.type !== 'request') {
            stepType.value = req.type;
            stepType.dispatchEvent(new Event('change'));
            
            if (req.type === 'clear_vars') {
                document.getElementById('clearVarsInput').value = req.actionData.vars || '';
            } else if (req.type === 'delay') {
                document.getElementById('delayMsInput').value = req.actionData.ms || '';
            } else if (req.type === 'script') {
                document.getElementById('scriptInput').value = req.actionData.script || '';
            } else if (req.type === 'conditional') {
                document.getElementById('condVar').value = req.actionData.var || '';
                document.getElementById('condOp').value = req.actionData.op || '==';
                document.getElementById('condVal').value = req.actionData.val || '';
            }
        } else {
            stepType.value = 'request';
            stepType.dispatchEvent(new Event('change'));
            
            reqMethod.value = req.method;
            reqMethod.dispatchEvent(new Event('change'));
            reqUrl.value = req.url;

            // Clear existing tabs content
            document.querySelectorAll('.key-value-row').forEach(r => r.remove());
            
            // Load Auth
            setAuth(req.auth);
            
            // Load Extractors
            if(req.extractors) {
                Object.entries(req.extractors).forEach(([k, v]) => addVarRow(k, v));
            }

            // Load Headers
            if(req.headers) {
                Object.entries(req.headers).forEach(([k, v]) => addHeaderRow(k, v));
            }

            // Load Body
            if (req.body) {
                const isObj = typeof req.body === 'object';
                document.querySelector(`input[name="bodyType"][value="${isObj ? 'json' : 'text'}"]`).checked = true;
                bodyEditor.disabled = false;
                bodyEditor.value = isObj ? JSON.stringify(req.body, null, 2) : req.body;
            } else {
                document.querySelector(`input[name="bodyType"][value="none"]`).checked = true;
                bodyEditor.disabled = true;
                bodyEditor.value = '';
            }
        }
    }

    newFlowBtn.addEventListener('click', () => {
        const name = prompt("Enter new flow name:");
        if (name && name.trim()) {
            const flowName = name.trim();
            // add to dropdown if doesn't exist
            let exists = false;
            Array.from(activeFlowSelect.options).forEach(opt => {
                if (opt.value === flowName) exists = true;
            });
            if (!exists) {
                const opt = document.createElement('option');
                opt.value = flowName;
                opt.textContent = flowName;
                activeFlowSelect.appendChild(opt);
            }
            activeFlowSelect.value = flowName;
        }
    });

    newRequestBtn.addEventListener('click', () => {
        // Reset URL and Method
        stepType.value = 'request';
        stepType.dispatchEvent(new Event('change'));
        
        reqUrl.value = '';
        reqMethod.value = 'GET';
        reqMethod.dispatchEvent(new Event('change'));

        // Clear all tabs content (headers and extractors)
        document.querySelectorAll('.key-value-row').forEach(r => r.remove());

        // Reset Auth
        setAuth({ type: 'none' });

        // Reset Body
        document.querySelector(`input[name="bodyType"][value="none"]`).checked = true;
        bodyEditor.disabled = true;
        bodyEditor.value = '';

        // Reset Response Viewer
        resStatus.textContent = 'Status: --';
        resStatus.className = 'status-badge';
        resTime.innerHTML = '<i class="fas fa-clock"></i> -- ms';
        resSize.innerHTML = '<i class="fas fa-save"></i> -- B';
        responseBody.textContent = 'Response will appear here...';
        responseHeaders.textContent = 'Headers will appear here...';
        
        // Reset save modal inputs
        document.getElementById('saveReqName').value = '';
        
        // Focus URL
        reqUrl.focus();
    });

    saveBtn.addEventListener('click', () => {
        saveFlowLabel.textContent = `Adding to Flow: ${activeFlowSelect.value}`;
        saveModal.classList.remove('hidden');
    });
    cancelSaveBtn.addEventListener('click', () => saveModal.classList.add('hidden'));
    
    confirmSaveBtn.addEventListener('click', async () => {
        const name = document.getElementById('saveReqName').value.trim();
        const collection = activeFlowSelect.value;
        
        if (!name) return alert("Name is required");

        let dataToSave;
        const type = stepType.value;
        
        if (type === 'request') {
            dataToSave = {
                id: Date.now().toString(),
                name,
                collection,
                type: 'request',
                url: reqUrl.value.trim(),
                method: reqMethod.value,
                headers: getHeaders(),
                auth: getAuth(),
                extractors: getExtractors(),
                body: document.querySelector('input[name="bodyType"]:checked').value === 'json' ? 
                      JSON.parse(bodyEditor.value || '{}') : 
                      (document.querySelector('input[name="bodyType"]:checked').value !== 'none' ? bodyEditor.value : null)
            };
        } else {
            let actionData = {};
            if (type === 'clear_vars') actionData = { vars: document.getElementById('clearVarsInput').value.trim() };
            if (type === 'delay') actionData = { ms: parseInt(document.getElementById('delayMsInput').value) || 0 };
            if (type === 'script') actionData = { script: document.getElementById('scriptInput').value };
            if (type === 'conditional') actionData = { 
                var: document.getElementById('condVar').value,
                op: document.getElementById('condOp').value,
                val: document.getElementById('condVal').value
            };
            dataToSave = {
                id: Date.now().toString(),
                name,
                collection,
                type: type,
                actionData
            };
        }

        savedCollections.push(dataToSave);
        await saveServerData();
        saveModal.classList.add('hidden');
        renderCollectionsList();
    });

    // Environment Handlers
    envBtn.addEventListener('click', () => {
        envEditor.value = JSON.stringify(savedEnvironment, null, 2);
        envModal.classList.remove('hidden');
    });
    
    closeEnvBtn.addEventListener('click', () => {
        try {
            savedEnvironment = JSON.parse(envEditor.value || '{}');
            saveServerData();
            envModal.classList.add('hidden');
        } catch(e) {
            alert('Invalid JSON in environment');
        }
    });

    // Init
    loadCollections();
});
