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
    const newGroupBtn = document.getElementById('newGroupBtn');
    const newFlowBtn = document.getElementById('newFlowBtn');
    const exitBtn = document.getElementById('exitBtn');

    // Save Modal
    const saveModal = document.getElementById('saveModal');
    const cancelSaveBtn = document.getElementById('cancelSaveBtn');
    const confirmSaveBtn = document.getElementById('confirmSaveBtn');
    const collectionList = document.getElementById('collectionList');
    const groupsList = document.getElementById('groupsList');
    const contextMenu = document.getElementById('contextMenu');
    const saveGroupName = document.getElementById('saveGroupName');
    const saveFlowName = document.getElementById('saveFlowName');

    // Input Modal
    const inputModal = document.getElementById('inputModal');
    const inputModalTitle = document.getElementById('inputModalTitle');
    const inputModalField = document.getElementById('inputModalField');
    const inputModalError = document.getElementById('inputModalError');
    const cancelInputBtn = document.getElementById('cancelInputBtn');
    const confirmInputBtn = document.getElementById('confirmInputBtn');
    let currentInputCallback = null;

    // Action Modal
    const actionModal = document.getElementById('actionModal');
    const actionModalTitle = document.getElementById('actionModalTitle');
    const actionGroupName = document.getElementById('actionGroupName');
    const actionFlowName = document.getElementById('actionFlowName');
    const actionGroupNameContainer = document.getElementById('actionGroupNameContainer');
    const actionFlowNameContainer = document.getElementById('actionFlowNameContainer');
    const cancelActionBtn = document.getElementById('cancelActionBtn');
    const confirmActionBtn = document.getElementById('confirmActionBtn');
    let currentActionCallback = null;

    const envBtn = document.getElementById('envBtn');
    const envModal = document.getElementById('envModal');
    const envEditor = document.getElementById('envEditor');
    const closeEnvBtn = document.getElementById('closeEnvBtn');

    // Dynamic Variables Modal
    const dynamicVarsBtn = document.getElementById('dynamicVarsBtn');
    const dynamicVarsModal = document.getElementById('dynamicVarsModal');
    const closeDynamicVarsBtn = document.getElementById('closeDynamicVarsBtn');

    if (dynamicVarsBtn && dynamicVarsModal && closeDynamicVarsBtn) {
        dynamicVarsBtn.onclick = () => dynamicVarsModal.classList.remove('hidden');
        closeDynamicVarsBtn.onclick = () => dynamicVarsModal.classList.add('hidden');
    }

    // Groups Toggle
    const groupsHeader = document.getElementById('groupsHeader');
    const groupsChevron = document.querySelector('.groups-chevron');
    if (groupsHeader && groupsList && groupsChevron) {
        groupsHeader.addEventListener('click', (e) => {
            if (e.target.closest('#newGroupBtn')) return;
            const isHidden = groupsList.style.display === 'none';
            groupsList.style.display = isHidden ? 'flex' : 'none';
            groupsChevron.style.transform = isHidden ? 'rotate(90deg)' : 'rotate(0deg)';
        });
    }
    
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

    // Line Numbers Elements
    const bodyEditorLines = document.getElementById('bodyEditorLines');
    const scriptInputLines = document.getElementById('scriptInputLines');
    const envEditorLines = document.getElementById('envEditorLines');
    const scriptInput = document.getElementById('scriptInput');

    let savedCollections = [];
    let savedEnvironment = {};
    let savedGroups = ['Default'];
    let currentGroup = 'Default';
    let activeRequestId = null;
    let expandedFlows = new Set(); // Track expanded flows by "groupName:flowName"

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

                // Update line numbers if necessary when tabs change
                if (tab.dataset.target === 'body' && !bodyEditor.disabled) {
                    updateLineNumbers(bodyEditor, bodyEditorLines);
                }
            });
        });
    }
    setupTabs(reqTabs);
    setupTabs(resTabs);

    // --- Line Numbers Sync Logic ---
    function updateLineNumbers(textarea, lineDiv) {
        if (!textarea || !lineDiv) return;
        const lines = textarea.value.split('\n').length;
        if (lineDiv.dataset.lineCount !== String(lines)) {
            lineDiv.innerHTML = Array(lines).fill(0).map((_, i) => i + 1).join('<br>');
            lineDiv.dataset.lineCount = lines;
        }
    }

    function syncScroll(textarea, lineDiv) {
        if (!textarea || !lineDiv) return;
        lineDiv.scrollTop = textarea.scrollTop;
    }

    function attachLineNumberEvents(textarea, lineDiv) {
        if (!textarea || !lineDiv) return;
        textarea.addEventListener('input', () => {
            updateLineNumbers(textarea, lineDiv);
        });
        textarea.addEventListener('scroll', () => {
            syncScroll(textarea, lineDiv);
        });
        // Initial setup
        updateLineNumbers(textarea, lineDiv);
    }

    attachLineNumberEvents(bodyEditor, bodyEditorLines);
    attachLineNumberEvents(scriptInput, scriptInputLines);
    attachLineNumberEvents(envEditor, envEditorLines);

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
        
        // Reset all fields
        authBasicUser.value = '';
        authBasicPass.value = '';
        authBearerToken.value = '';

        document.querySelector(`input[name="authType"][value="${auth.type}"]`).checked = true;
        document.querySelector(`input[name="authType"][value="${auth.type}"]`).dispatchEvent(new Event('change'));
        if (auth.type === 'basic') {
            authBasicUser.value = auth.username || '';
            authBasicPass.value = auth.password || '';
        } else if (auth.type === 'bearer') {
            authBearerToken.value = auth.token || '';
        }
    }

    const applyAuthToHeadersBtn = document.getElementById('applyAuthToHeadersBtn');
    if (applyAuthToHeadersBtn) {
        applyAuthToHeadersBtn.addEventListener('click', () => {
            const auth = getAuth();
            let headerValue = '';
            
            if (auth.type === 'basic') {
                if (!auth.username && !auth.password) return alert("Please enter a username and password.");
                headerValue = 'Basic ' + btoa(auth.username + ':' + auth.password);
            } else if (auth.type === 'bearer') {
                if (!auth.token) return alert("Please enter a token.");
                headerValue = 'Bearer ' + auth.token;
            } else {
                // "No Auth" selected: search for existing headers to remove
                const rows = Array.from(document.querySelectorAll('#headersEditor .key-value-row'));
                const authRows = rows.filter(row => row.querySelector('.h-key').value.trim().toLowerCase() === 'authorization');
                
                if (authRows.length > 0) {
                    if (confirm("No Auth is selected. Do you want to remove the existing Authorization header from the Headers tab?")) {
                        authRows.forEach(row => row.remove());
                        document.querySelector('.tab[data-target="headers"]').click();
                    }
                } else {
                    alert("No Authorization header found to remove.");
                }
                return;
            }

            // Remove any existing Authorization headers first to avoid duplicates
            document.querySelectorAll('#headersEditor .key-value-row').forEach(row => {
                const key = row.querySelector('.h-key').value.trim();
                if (key.toLowerCase() === 'authorization') row.remove();
            });

            // Add the new row
            addHeaderRow('Authorization', headerValue);

            // Clear the Auth tab to signify it's been moved
            setAuth({ type: 'none' });

            // Switch to Headers tab
            document.querySelector('.tab[data-target="headers"]').click();
        });
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

    function getDynamicVar(name) {
        const now = new Date();
        const activeStep = savedCollections.find(r => r.id === activeRequestId);

        switch (name) {
            case '$iso': return now.toISOString();
            case '$timestamp': return Math.floor(Date.now() / 1000).toString();
            case '$date': return now.toISOString().split('T')[0];
            case '$datetime': return now.getFullYear() + "-" + 
                                     String(now.getMonth() + 1).padStart(2, '0') + "-" + 
                                     String(now.getDate()).padStart(2, '0') + " " + 
                                     String(now.getHours()).padStart(2, '0') + ":" + 
                                     String(now.getMinutes()).padStart(2, '0') + ":" + 
                                     String(now.getSeconds()).padStart(2, '0');
            case '$YYYY': return now.getFullYear().toString();
            case '$YY': return String(now.getFullYear()).slice(-2);
            case '$MM': return String(now.getMonth() + 1).padStart(2, '0');
            case '$DD': return String(now.getDate()).padStart(2, '0');
            case '$hh': return String(now.getHours()).padStart(2, '0');
            case '$mm': return String(now.getMinutes()).padStart(2, '0');
            case '$ss': return String(now.getSeconds()).padStart(2, '0');
            case '$guid': 
                if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            case '$randomInt': return Math.floor(Math.random() * 1000).toString();
            case '$group': return currentGroup;
            case '$flow': return activeStep ? (activeStep.collection || 'Default') : 'Default';
            default: return null;
        }
    }

    async function interpolateStr(str) {
        if (typeof str !== 'string') return str;
        
        let match;
        const missing = [];
        const regex = /\{\{([^}]+)\}\}/g;
        while ((match = regex.exec(str)) !== null) {
            const key = match[1].trim();
            
            // If it's a dynamic variable, we don't check savedEnvironment
            if (key.startsWith('$')) {
                const dynVal = getDynamicVar(key);
                if (dynVal !== null) continue; // Found a valid dynamic var
            }

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
            if (k.startsWith('$')) {
                const dynVal = getDynamicVar(k);
                return dynVal !== null ? dynVal : mOriginal;
            }
            return savedEnvironment[k] !== undefined ? savedEnvironment[k] : mOriginal;
        });
    }

    // --- Body Editor Logic ---
    const validateBodyBtn = document.getElementById('validateBodyBtn');

    bodyRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'none') {
                bodyEditor.disabled = true;
                bodyEditor.value = '';
                if(validateBodyBtn) validateBodyBtn.classList.add('hidden');
            } else {
                bodyEditor.disabled = false;
                if (e.target.value === 'json' && !bodyEditor.value) {
                    bodyEditor.value = '{\n  \n}';
                } else if (e.target.value === 'xml' && !bodyEditor.value) {
                    bodyEditor.value = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  \n</root>';
                }
                
                if (validateBodyBtn) {
                    if (e.target.value === 'json' || e.target.value === 'xml') {
                        validateBodyBtn.classList.remove('hidden');
                    } else {
                        validateBodyBtn.classList.add('hidden');
                    }
                }
                updateLineNumbers(bodyEditor, bodyEditorLines);
            }
        });
    });

    if (validateBodyBtn) {
        validateBodyBtn.addEventListener('click', () => {
            const bodyType = document.querySelector('input[name="bodyType"]:checked').value;
            const content = bodyEditor.value.trim();
            if (!content) {
                alert("Body is empty.");
                return;
            }

            if (bodyType === 'json') {
                try {
                    JSON.parse(content);
                    alert("✅ Valid JSON!");
                } catch (e) {
                    alert("❌ Invalid JSON:\n" + e.message);
                }
            } else if (bodyType === 'xml') {
                // First, check with DOMParser for structural errors
                const parser = new DOMParser();
                const doc = parser.parseFromString(content, "application/xml");
                const parserError = doc.querySelector("parsererror");
                if (parserError) {
                    const errorDiv = parserError.querySelector("div");
                    const errorMessage = errorDiv ? errorDiv.textContent : parserError.textContent;
                    alert("❌ Invalid XML:\n" + errorMessage);
                    return;
                }

                // Stricter checks: look for bare < or > in text content
                // Strip all valid XML constructs, then check for leftover angle brackets
                let stripped = content;
                // Remove XML declarations, processing instructions, CDATA, comments
                stripped = stripped.replace(/<\?[\s\S]*?\?>/g, '');
                stripped = stripped.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '');
                stripped = stripped.replace(/<!--[\s\S]*?-->/g, '');
                // Remove all well-formed tags (self-closing, opening, closing)
                stripped = stripped.replace(/<[^>]+>/g, '');

                if (stripped.includes('>') || stripped.includes('<')) {
                    const lines = content.split('\n');
                    let errorLines = [];
                    for (let i = 0; i < lines.length; i++) {
                        let line = lines[i];
                        line = line.replace(/<\?[\s\S]*?\?>/g, '');
                        line = line.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '');
                        line = line.replace(/<!--[\s\S]*?-->/g, '');
                        line = line.replace(/<[^>]+>/g, '');
                        if (line.includes('>') || line.includes('<')) {
                            errorLines.push(`  Line ${i + 1}: ${lines[i].trim()}`);
                        }
                    }
                    alert("⚠️ XML parsed but contains suspicious bare angle brackets:\n" + errorLines.join('\n'));
                } else {
                    alert("✅ Valid XML!");
                }
            }
        });
    }

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
                } else if (bodyType === 'xml') {
                    // Inject xml header automatically if missing
                    if(!requestData.headers['Content-Type']){
                        requestData.headers['Content-Type'] = 'application/xml';
                    }
                    requestData.body = await interpolateStr(bodyEditor.value);
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
        } else if (data.is_xml) {
            responseBody.innerHTML = generateXMLHTML(data.body);
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

    function formatXML(xml) {
        let formatted = '';
        let pad = 0;
        xml = xml.replace(/(>)(<)(\/*)/g, '$1\r\n$2$3');
        const lines = xml.split('\r\n');
        lines.forEach((line) => {
            let indent = 0;
            if (line.match(/.+<\/\w[^>]*>$/)) {
                indent = 0;
            } else if (line.match(/^<\/\w/)) {
                if (pad !== 0) { pad -= 1; }
            } else if (line.match(/^<\w[^>]*[^\/]>.*$/)) {
                indent = 1;
            } else {
                indent = 0;
            }
            formatted += '  '.repeat(pad) + line + '\n';
            pad += indent;
        });
        return formatted;
    }

    function generateXMLHTML(xmlString) {
        const formatted = formatXML(xmlString);
        let colored = escapeHTML(formatted);
        colored = colored.replace(/&lt;([/?]?[a-zA-Z0-9_:-]+)/g, '&lt;<span style="color: #60a5fa;">$1</span>');
        colored = colored.replace(/([a-zA-Z0-9_:-]+)=(&quot;[^&]*&quot;)/g, '<span style="color: #34d399;">$1</span>=<span style="color: #fbbf24;">$2</span>');
        return colored;
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

    // --- Context Menu Logic ---
    function hideContextMenu() {
        contextMenu.classList.add('hidden');
    }

    document.addEventListener('mousedown', (e) => {
        if (!contextMenu.contains(e.target)) hideContextMenu();
    });

    function showContextMenu(e, type, data) {
        e.preventDefault();
        contextMenu.innerHTML = '';
        
        const items = [];
        if (type === 'group') {
            items.push({ label: 'Rename Group', icon: 'edit', action: () => renameGroup(data) });
            items.push({ label: 'Copy Group', icon: 'copy', action: () => copyGroup(data) });
            items.push({ label: 'Delete Group', icon: 'trash', class: 'delete', action: () => deleteGroup(data) });
        } else if (type === 'flow') {
            items.push({ label: 'Rename Flow', icon: 'edit', action: () => renameFlow(data.name, data.group) });
            items.push({ label: 'Copy Flow', icon: 'copy', action: () => copyFlow(data.name, data.group) });
            items.push({ label: 'Delete Flow', icon: 'trash', class: 'delete', action: () => deleteFlow(data.name, data.group) });
            items.push({ label: 'Move to Group', icon: 'share-square', action: () => moveFlow(data.name, data.group) });
        } else if (type === 'step') {
            items.push({ label: 'Rename Step', icon: 'edit', action: () => renameStep(data) });
            items.push({ label: 'Copy Step', icon: 'copy', action: () => copyStep(data) });
            items.push({ label: data.disabled ? 'Enable Step' : 'Disable Step', icon: data.disabled ? 'eye' : 'eye-slash', action: () => toggleStepDisabled(data) });
            items.push({ label: 'Delete Step', icon: 'trash', class: 'delete', action: () => deleteStep(data) });
            items.push({ label: 'Move to Flow', icon: 'share-square', action: () => moveStep(data) });
        }

        items.forEach(item => {
            const div = document.createElement('div');
            div.className = `context-menu-item ${item.class || ''}`;
            div.innerHTML = `<i class="fas fa-${item.icon}"></i> ${item.label}`;
            div.onclick = () => {
                hideContextMenu();
                item.action();
            };
            contextMenu.appendChild(div);
        });

        contextMenu.classList.remove('hidden');
        
        // Position menu
        const menuWidth = 160;
        const menuHeight = items.length * 36 + 8;
        let x = e.pageX;
        let y = e.pageY;

        if (x + menuWidth > window.innerWidth) x -= menuWidth;
        if (y + menuHeight > window.innerHeight) y -= menuHeight;

        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
    }

    // --- Action Handlers ---
    // --- Utilities ---
    function getUniqueName(baseName, existingNames) {
        if (!existingNames.includes(baseName)) return baseName;
        let counter = 1;
        while (existingNames.includes(`${baseName}-${counter}`)) {
            counter++;
        }
        return `${baseName}-${counter}`;
    }

    function updateBreadcrumbs(step) {
        const breadcrumbContent = document.getElementById('breadcrumbContent');
        if (!breadcrumbContent) return;
        if (!step) {
            breadcrumbContent.innerHTML = 'Select a step from the sidebar...';
            return;
        }
        breadcrumbContent.innerHTML = `
            <span style="color: var(--text-main); font-weight: 500;">${escapeHTML(step.flowGroup || 'Default')}</span>
            <i class="fas fa-chevron-right" style="font-size: 0.6rem; opacity: 0.4; margin: 0 4px;"></i>
            <span style="color: var(--text-main); font-weight: 500;">${escapeHTML(step.collection || 'Default')}</span>
            <i class="fas fa-chevron-right" style="font-size: 0.6rem; opacity: 0.4; margin: 0 4px;"></i>
            <span style="color: var(--accent); font-weight: 600;">${escapeHTML(step.name)}</span>
        `;
    }

    // --- Input Modal Logic ---
    function openInputModal(title, initialValue, existingNames, onConfirm) {
        inputModalTitle.textContent = title;
        inputModalField.value = initialValue || '';
        inputModalError.textContent = '';
        confirmInputBtn.disabled = false;
        
        const validate = () => {
            const val = inputModalField.value.trim();
            const safeCharsRegex = /^[a-zA-Z0-9\s\-_.]+$/;
            
            if (!val) {
                inputModalError.textContent = "Name cannot be empty.";
                confirmInputBtn.disabled = true;
                return false;
            }
            if (!safeCharsRegex.test(val)) {
                inputModalError.textContent = "Only letters, numbers, spaces, and -_. are allowed.";
                confirmInputBtn.disabled = true;
                return false;
            }
            if (existingNames.includes(val) && val !== initialValue) {
                inputModalError.textContent = "This name already exists.";
                confirmInputBtn.disabled = true;
                return false;
            }
            
            inputModalError.textContent = "";
            confirmInputBtn.disabled = false;
            return true;
        };

        inputModalField.oninput = validate;
        
        currentInputCallback = () => {
            if (validate()) {
                onConfirm(inputModalField.value.trim());
                inputModal.classList.add('hidden');
            }
        };

        inputModal.classList.remove('hidden');
        inputModalField.focus();
        validate();
    }

    cancelInputBtn.onclick = () => inputModal.classList.add('hidden');
    confirmInputBtn.onclick = () => { if (currentInputCallback) currentInputCallback(); };
    inputModalField.onkeydown = (e) => { if (e.key === 'Enter') confirmInputBtn.click(); };

    // --- Action Modal Logic ---
    function openActionModal(title, showFlow, group, flow, onConfirm) {
        actionModalTitle.textContent = title;
        actionGroupName.innerHTML = '';
        const allGroups = Array.from(new Set([...savedGroups, ...savedCollections.map(r => r.flowGroup || 'Default')]));
        allGroups.sort().forEach(g => {
            const opt = document.createElement('option');
            opt.value = g; opt.textContent = g;
            actionGroupName.appendChild(opt);
        });
        actionGroupName.value = group || currentGroup;

        if (showFlow) {
            actionFlowNameContainer.style.display = 'block';
            const updateFlows = (g) => {
                actionFlowName.innerHTML = '';
                const flowsSet = new Set();
                savedCollections.forEach(r => { if ((r.flowGroup || 'Default') === g) flowsSet.add(r.collection || 'Default'); });
                if (flowsSet.size === 0) flowsSet.add('Default');
                
                const sortedFlows = Array.from(flowsSet).sort();
                sortedFlows.forEach(f => {
                    const opt = document.createElement('option');
                    opt.value = f; opt.textContent = f;
                    actionFlowName.appendChild(opt);
                });

                // If the original flow name exists in the new group, select it.
                // Otherwise, default to the first flow in the list.
                if (flow && flowsSet.has(flow)) {
                    actionFlowName.value = flow;
                } else if (sortedFlows.length > 0) {
                    actionFlowName.value = sortedFlows[0];
                }
            };
            actionGroupName.onchange = (e) => updateFlows(e.target.value);
            updateFlows(actionGroupName.value);
        } else {
            actionFlowNameContainer.style.display = 'none';
        }

        currentActionCallback = () => {
            const res = onConfirm(actionGroupName.value, showFlow ? actionFlowName.value : null);
            if (res !== false) actionModal.classList.add('hidden');
        };
        actionModal.classList.remove('hidden');
    }

    cancelActionBtn.onclick = () => actionModal.classList.add('hidden');
    confirmActionBtn.onclick = () => { if (currentActionCallback) currentActionCallback(); };

    async function addNewStep(flowName, groupName) {
        const existingNames = savedCollections
            .filter(r => (r.flowGroup || 'Default') === groupName && (r.collection || 'Default') === flowName)
            .map(r => r.name);
        
        const uniqueName = getUniqueName("New Step", existingNames);

        const newStep = {
            id: Date.now().toString(),
            name: uniqueName,
            collection: flowName,
            flowGroup: groupName,
            type: 'request',
            url: "",
            method: "GET",
            headers: {},
            auth: { type: 'none' },
            extractors: {},
            bodyType: 'none',
            body: null
        };
        savedCollections.push(newStep);
        expandedFlows.add(`${groupName}:${flowName}`);
        await saveServerData();
        renderCollectionsList();
        loadRequestIntoUI(newStep);
    }

    async function renameGroup(oldName) {
        openInputModal("Rename Group", oldName, savedGroups, async (name) => {
            savedCollections.forEach(r => {
                if ((r.flowGroup || 'Default') === oldName) r.flowGroup = name;
            });
            const idx = savedGroups.indexOf(oldName);
            if (idx !== -1) savedGroups[idx] = name;
            
            if (currentGroup === oldName) currentGroup = name;
            await saveServerData();
            renderCollectionsList();
            
            const activeStep = savedCollections.find(r => r.id === activeRequestId);
            if (activeStep && (activeStep.flowGroup || 'Default') === name) updateBreadcrumbs(activeStep);
        });
    }

    async function copyGroup(oldName) {
        const suggestedName = getUniqueName(oldName + " Copy", savedGroups);
        openInputModal("Copy Group", suggestedName, savedGroups, async (name) => {
            if (!savedGroups.includes(name)) savedGroups.push(name);
            
            const newSteps = [];
            savedCollections.forEach(r => {
                if ((r.flowGroup || 'Default') === oldName) {
                    const clone = JSON.parse(JSON.stringify(r));
                    clone.id = Date.now().toString() + Math.random();
                    clone.flowGroup = name;
                    newSteps.push(clone);
                }
            });
            savedCollections.push(...newSteps);
            await saveServerData();
            renderCollectionsList();
        });
    }

    async function deleteGroup(name) {
        if (confirm(`Are you sure you want to delete the group "${name}" and all its flows?`)) {
            savedCollections = savedCollections.filter(r => r.flowGroup !== name);
            savedGroups = savedGroups.filter(g => g !== name);
            if (currentGroup === name) {
                currentGroup = savedGroups[0] || 'Default';
                activeRequestId = null;
                updateBreadcrumbs(null);
            }
            if (savedGroups.length === 0) savedGroups.push('Default');
            await saveServerData();
            renderCollectionsList();
        }
    }

    async function renameFlow(oldName, group) {
        const existingFlows = Array.from(new Set(savedCollections.filter(r => (r.flowGroup || 'Default') === group).map(r => r.collection || 'Default')));
        openInputModal("Rename Flow", oldName, existingFlows, async (name) => {
            savedCollections.forEach(r => {
                if (r.collection === oldName && (r.flowGroup || 'Default') === group) r.collection = name;
            });
            await saveServerData();
            renderCollectionsList();

            const activeStep = savedCollections.find(r => r.id === activeRequestId);
            if (activeStep && activeStep.collection === name && (activeStep.flowGroup || 'Default') === group) updateBreadcrumbs(activeStep);
        });
    }

    async function copyFlow(oldName, group) {
        openActionModal(`Copy Flow: ${oldName}`, false, group, null, async (targetGroup) => {
            let newFlowName = oldName;
            const existingFlowsInTarget = Array.from(new Set(savedCollections.filter(r => (r.flowGroup || 'Default') === targetGroup).map(r => r.collection || 'Default')));
            
            if (targetGroup === group || existingFlowsInTarget.includes(oldName)) {
                const suggestedName = getUniqueName(oldName + " Copy", existingFlowsInTarget);
                openInputModal("Copy Flow Name", suggestedName, existingFlowsInTarget, async (name) => {
                    const newSteps = [];
                    savedCollections.forEach(r => {
                        if (r.collection === oldName && (r.flowGroup || 'Default') === group) {
                            const clone = JSON.parse(JSON.stringify(r));
                            clone.id = Date.now().toString() + Math.random();
                            clone.collection = name;
                            clone.flowGroup = targetGroup;
                            newSteps.push(clone);
                        }
                    });
                    savedCollections.push(...newSteps);
                    await saveServerData();
                    renderCollectionsList();
                });
            } else {
                const newSteps = [];
                savedCollections.forEach(r => {
                    if (r.collection === oldName && (r.flowGroup || 'Default') === group) {
                        const clone = JSON.parse(JSON.stringify(r));
                        clone.id = Date.now().toString() + Math.random();
                        clone.collection = oldName;
                        clone.flowGroup = targetGroup;
                        newSteps.push(clone);
                    }
                });
                savedCollections.push(...newSteps);
                await saveServerData();
                renderCollectionsList();
            }
        });
    }

    async function deleteFlow(name, group) {
        if (confirm(`Are you sure you want to delete the flow "${name}"?`)) {
            const activeStep = savedCollections.find(r => r.id === activeRequestId);
            if (activeStep && activeStep.collection === name && activeStep.flowGroup === group) {
                activeRequestId = null;
                updateBreadcrumbs(null);
            }
            savedCollections = savedCollections.filter(r => !(r.collection === name && r.flowGroup === group));
            await saveServerData();
            renderCollectionsList();
        }
    }

    async function moveFlow(name, group) {
        const currentGroupFixed = group || 'Default';
        openActionModal(`Move Flow: ${name}`, false, currentGroupFixed, null, async (targetGroup) => {
            if (targetGroup === currentGroupFixed) return false;
            const existingFlowsInTarget = Array.from(new Set(savedCollections.filter(r => (r.flowGroup || 'Default') === targetGroup).map(r => r.collection || 'Default')));
            if (existingFlowsInTarget.includes(name)) {
                alert(`A flow named "${name}" already exists in the target group.`);
                return false;
            }
            
            // Determine if the active step is in this flow before we move it
            const activeStep = savedCollections.find(r => r.id === activeRequestId);
            const isMovingActiveFlow = activeStep && activeStep.collection === name && (activeStep.flowGroup || 'Default') === currentGroupFixed;

            savedCollections.forEach(r => {
                if (r.collection === name && (r.flowGroup || 'Default') === currentGroupFixed) {
                    r.flowGroup = targetGroup;
                }
            });

            if (isMovingActiveFlow) {
                currentGroup = targetGroup;
                expandedFlows.add(`${targetGroup}:${name}`);
            }

            await saveServerData();
            renderCollectionsList();
            
            if (isMovingActiveFlow && activeStep) {
                loadRequestIntoUI(activeStep);
            }
        });
    }

    async function renameStep(step) {
        const existingNames = savedCollections
            .filter(r => (r.flowGroup || 'Default') === (step.flowGroup || 'Default') && (r.collection || 'Default') === (step.collection || 'Default'))
            .map(r => r.name);
            
        openInputModal("Rename Step", step.name, existingNames, async (name) => {
            step.name = name;
            await saveServerData();
            renderCollectionsList();
            if (step.id === activeRequestId) updateBreadcrumbs(step);
        });
    }

    async function copyStep(step) {
        openActionModal(`Copy Step: ${step.name}`, true, step.flowGroup, step.collection, async (targetGroup, targetFlow) => {
            const existingNames = savedCollections
                .filter(r => (r.flowGroup || 'Default') === targetGroup && (r.collection || 'Default') === targetFlow)
                .map(r => r.name);
            
            const name = getUniqueName(step.name, existingNames);
            const clone = JSON.parse(JSON.stringify(step));
            clone.id = Date.now().toString() + Math.random();
            clone.name = name;
            clone.flowGroup = targetGroup;
            clone.collection = targetFlow;
            savedCollections.push(clone);
            await saveServerData();
            renderCollectionsList();
        });
    }

    async function deleteStep(step) {
        if (confirm(`Delete step "${step.name}"?`)) {
            if (step.id === activeRequestId) {
                activeRequestId = null;
                updateBreadcrumbs(null);
            }
            savedCollections = savedCollections.filter(r => r.id !== step.id);
            await saveServerData();
            renderCollectionsList();
        }
    }

    async function toggleStepDisabled(step) {
        step.disabled = !step.disabled;
        await saveServerData();
        renderCollectionsList();
    }

    async function moveStep(step) {
        openActionModal(`Move Step: ${step.name}`, true, step.flowGroup || 'Default', step.collection || 'Default', async (targetGroup, targetFlow) => {
            if (targetGroup === (step.flowGroup || 'Default') && targetFlow === (step.collection || 'Default')) return false;
            
            const existingNames = savedCollections
                .filter(r => (r.flowGroup || 'Default') === targetGroup && (r.collection || 'Default') === targetFlow)
                .map(r => r.name);
            
            if (existingNames.includes(step.name)) {
                alert(`A step named "${step.name}" already exists in the target flow.`);
                return false;
            }
            
            const isCurrentlyActive = step.id === activeRequestId;
            
            step.flowGroup = targetGroup;
            step.collection = targetFlow;

            if (isCurrentlyActive) {
                currentGroup = targetGroup;
                expandedFlows.add(`${targetGroup}:${targetFlow}`);
            }

            await saveServerData();
            renderCollectionsList();
            
            if (isCurrentlyActive) {
                loadRequestIntoUI(step);
            }
        });
    }

    // --- Save/Load Logic ---
    async function saveServerData() {
        try {
            await fetch('/api/collections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ collections: savedCollections, environment: savedEnvironment, groups: savedGroups })
            });
        } catch(e) { console.error("Failed to save data to server"); }
    }

    async function loadCollections() {
        try {
            const res = await fetch('/api/collections');
            const data = await res.json();
            savedCollections = data.collections || [];
            savedEnvironment = data.environment || {};
            savedGroups = data.groups || ['Default'];
            
            // Scrub existing auth data from loaded collections
            let needsResave = false;
            savedCollections.forEach(req => {
                if (req.auth && req.auth.type !== 'none') {
                    req.auth = { type: 'none' };
                    needsResave = true;
                }
            });

            if (needsResave) {
                await saveServerData();
            }

            if (!savedGroups.includes('Default')) savedGroups.unshift('Default');
            renderCollectionsList();
        } catch (e) {
            console.error("Failed to load collections");
        }
    }

    function renderCollectionsList() {
        // 1. Render Groups
        groupsList.innerHTML = '';
        
        // Ensure all groups from collections are in savedGroups
        savedCollections.forEach(req => {
            const g = req.flowGroup || 'Default';
            if (!savedGroups.includes(g)) savedGroups.push(g);
        });

        savedGroups.forEach(g => {
            const div = document.createElement('div');
            div.className = `group-item ${g === currentGroup ? 'active' : ''}`;
            div.draggable = true;
            div.innerHTML = `<i class="fas fa-grip-vertical group-drag-handle" style="color: #475569; margin-right: 6px; cursor: grab;"></i><i class="fas fa-folder"></i> <span>${escapeHTML(g)}</span>`;
            
            div.onclick = (e) => {
                if (e.target.closest('.group-drag-handle')) return;
                currentGroup = g;
                renderCollectionsList();
            };
            
            div.oncontextmenu = (e) => showContextMenu(e, 'group', g);

            // Group Drag and Drop
            div.addEventListener('dragstart', function(e) {
                window.draggedGroupEle = this;
                setTimeout(() => this.classList.add('dragging'), 0);
                e.dataTransfer.effectAllowed = 'move';
            });

            div.addEventListener('dragend', function() {
                this.classList.remove('dragging');
                window.draggedGroupEle = null;
            });

            div.addEventListener('dragover', function(e) {
                e.preventDefault();
                if (!window.draggedGroupEle || !groupsList.contains(window.draggedGroupEle)) return;
                e.dataTransfer.dropEffect = 'move';
                
                const rect = this.getBoundingClientRect();
                const midY = rect.top + rect.height / 2;
                if (e.clientY < midY) {
                    this.parentNode.insertBefore(window.draggedGroupEle, this);
                } else {
                    this.parentNode.insertBefore(window.draggedGroupEle, this.nextSibling);
                }
            });

            div.addEventListener('drop', async function(e) {
                e.preventDefault();
                if (window.draggedGroupEle) {
                    const newOrder = Array.from(groupsList.querySelectorAll('.group-item span')).map(span => span.textContent);
                    savedGroups = newOrder;
                    await saveServerData();
                    // No need to re-render everything, order is already updated in DOM
                }
            });

            groupsList.appendChild(div);
        });

        // Update flows header with current group name
        const flowsHeaderText = document.getElementById('flowsHeaderText');
        if (flowsHeaderText) {
            flowsHeaderText.textContent = `Flows in ${currentGroup}`;
        }

        const activeGroupNameDisplay = document.getElementById('activeGroupNameDisplay');
        if (activeGroupNameDisplay) {
            activeGroupNameDisplay.textContent = currentGroup;
        }

        // 2. Render Flows for current group
        collectionList.innerHTML = '';
        const flows = {};
        savedCollections.forEach(req => {
            if ((req.flowGroup || 'Default') !== currentGroup) return;
            const flowName = req.collection || 'Default';
            if (!flows[flowName]) flows[flowName] = [];
            flows[flowName].push(req);
        });

        Object.keys(flows).forEach(flowName => {
            const flowSection = document.createElement('div');
            flowSection.className = 'flow-group';
            const flowKey = `${currentGroup}:${flowName}`;
            const isExpanded = expandedFlows.has(flowKey);
            
            const header = document.createElement('div');
            header.className = 'flow-group-header';
            header.draggable = true;
            header.style.cursor = 'pointer';
            header.innerHTML = `
                <i class="fas fa-grip-vertical flow-drag-handle" style="color: #475569; margin-right: 6px; cursor: grab;"></i>
                <span style="flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;"><i class="fas fa-chevron-right flow-chevron" style="margin-right: 10px; transition: transform 0.2s; font-size: 0.7rem; transform: ${isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'}"></i><i class="fas fa-layer-group" style="margin-right: 6px;"></i>${escapeHTML(flowName)}</span>
                <div style="display:flex; gap:4px; align-items:center;">
                    <button class="btn-icon add-step-btn" title="Add Step" style="font-size: 0.7rem; color: var(--accent); background: rgba(59, 130, 246, 0.1); padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(59, 130, 246, 0.2);"><i class="fas fa-plus"></i></button>
                    <button class="btn-icon run-flow-btn" title="Run Flow" style="font-size: 0.7rem; color: #34d399; background: rgba(16, 185, 129, 0.15); padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(52, 211, 153, 0.25);"><i class="fas fa-play"></i></button>
                </div>
            `;
            
            header.oncontextmenu = (e) => showContextMenu(e, 'flow', { name: flowName, group: currentGroup });
            
            header.querySelector('.add-step-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                addNewStep(flowName, currentGroup);
            });

            header.querySelector('.run-flow-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                runFlow(flowName, flows[flowName]);
            });

            // Flow Drag and Drop
            header.addEventListener('dragstart', function(e) {
                window.draggedFlowName = flowName;
                window.draggedFlowEle = flowSection;
                setTimeout(() => flowSection.classList.add('dragging'), 0);
                e.dataTransfer.effectAllowed = 'move';
            });

            header.addEventListener('dragend', function() {
                flowSection.classList.remove('dragging');
                window.draggedFlowName = null;
                window.draggedFlowEle = null;
            });

            header.addEventListener('dragover', function(e) {
                e.preventDefault();
                if (!window.draggedFlowEle || !collectionList.contains(window.draggedFlowEle)) return;
                e.dataTransfer.dropEffect = 'move';
                
                const rect = flowSection.getBoundingClientRect();
                const midY = rect.top + rect.height / 2;
                if (e.clientY < midY) {
                    flowSection.parentNode.insertBefore(window.draggedFlowEle, flowSection);
                } else {
                    flowSection.parentNode.insertBefore(window.draggedFlowEle, flowSection.nextSibling);
                }
            });

            header.addEventListener('drop', async function(e) {
                e.preventDefault();
                if (window.draggedFlowName) {
                    const newFlowOrder = Array.from(collectionList.querySelectorAll('.flow-group-header span')).map(span => {
                        // Extract just the flow name from the span
                        return span.textContent.trim();
                    });
                    
                    // Re-sort savedCollections based on the new flow order
                    const otherGroupItems = savedCollections.filter(r => (r.flowGroup || 'Default') !== currentGroup);
                    const currentGroupItems = savedCollections.filter(r => (r.flowGroup || 'Default') === currentGroup);
                    
                    const sortedCurrentGroupItems = [];
                    newFlowOrder.forEach(fName => {
                        const flowSteps = currentGroupItems.filter(r => (r.collection || 'Default') === fName);
                        sortedCurrentGroupItems.push(...flowSteps);
                    });
                    
                    savedCollections = [...otherGroupItems, ...sortedCurrentGroupItems];
                    await saveServerData();
                }
            });

            const reqsContainer = document.createElement('div');
            reqsContainer.className = 'flow-requests';
            reqsContainer.style.display = isExpanded ? 'block' : 'none';

            const chevron = header.querySelector('.flow-chevron');
            header.addEventListener('click', (e) => {
                if (e.target.closest('.run-flow-btn')) return;
                const currentlyOpen = reqsContainer.style.display !== 'none';
                if (currentlyOpen) {
                    reqsContainer.style.display = 'none';
                    chevron.style.transform = 'rotate(0deg)';
                    expandedFlows.delete(flowKey);
                } else {
                    reqsContainer.style.display = 'block';
                    chevron.style.transform = 'rotate(90deg)';
                    expandedFlows.add(flowKey);
                }
            });

            flows[flowName].forEach(req => {
                const isAction = req.type && req.type !== 'request';
                const div = document.createElement('div');
                div.className = `saved-request-item ${req.id === activeRequestId ? 'active-request' : ''} ${isAction ? 'action-item' : ''} ${req.disabled ? 'disabled-step' : ''}`;
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
                    <div class="req-name"><i class="fas fa-grip-vertical" style="color: #475569; margin-right: 6px;"></i>${iconHtml} ${escapeHTML(req.name)}</div>
                    <div class="req-meta">
                        ${methodHtml}
                        <span class="url-trunc" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px; display:inline-block; vertical-align:bottom;">${descHtml}</span>
                    </div>
                `;
                
                div.addEventListener('click', () => loadRequestIntoUI(req));
                div.oncontextmenu = (e) => showContextMenu(e, 'step', req);
                
                // Drag & Drop
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
                    if (e.clientY < midY) this.parentNode.insertBefore(window.draggedRequestEle, this);
                    else this.parentNode.insertBefore(window.draggedRequestEle, this.nextSibling);
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
                            if ((r.collection || 'Default') === flowName && (r.flowGroup || 'Default') === currentGroup) {
                                updatedCollections.push(newOrder[flowIdx]);
                                flowIdx++;
                            } else updatedCollections.push(r);
                        });
                        savedCollections = updatedCollections;
                        await saveServerData();
                        renderCollectionsList();
                    }
                });

                reqsContainer.appendChild(div);
            });

            flowSection.appendChild(header);
            flowSection.appendChild(reqsContainer);
            collectionList.appendChild(flowSection);
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
            
            if (req.disabled) {
                logFlow(`\n[Step ${i+1}/${requests.length}] ${req.name} (SKIPPED)`, '#94a3b8');
                successCount++;
                continue;
            }

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
                    } else if (req.bodyType === 'xml' || (typeof req.body === 'string' && req.body.trim().startsWith('<'))) {
                        if (!requestData.headers['Content-Type']) requestData.headers['Content-Type'] = 'application/xml';
                        requestData.body = await interpolateStr(req.body);
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
        activeRequestId = req.id;
        // Re-render only if we need to update active-request class
        document.querySelectorAll('.saved-request-item').forEach(el => {
            el.classList.toggle('active-request', el.reqData.id === activeRequestId);
        });

        updateBreadcrumbs(req);

        if (req.type && req.type !== 'request') {
            stepType.value = req.type;
            stepType.dispatchEvent(new Event('change'));
            
            if (req.type === 'clear_vars') {
                document.getElementById('clearVarsInput').value = req.actionData.vars || '';
            } else if (req.type === 'delay') {
                document.getElementById('delayMsInput').value = req.actionData.ms || '';
            } else if (req.type === 'script') {
                document.getElementById('scriptInput').value = req.actionData.script || '';
                updateLineNumbers(scriptInput, scriptInputLines);
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
                let bodyTypeStr = 'text';
                if (isObj) {
                    bodyTypeStr = 'json';
                } else if (req.bodyType === 'xml' || (typeof req.body === 'string' && req.body.trim().startsWith('<'))) {
                    bodyTypeStr = 'xml';
                }
                document.querySelector(`input[name="bodyType"][value="${bodyTypeStr}"]`).checked = true;
                bodyEditor.disabled = false;
                bodyEditor.value = isObj ? JSON.stringify(req.body, null, 2) : req.body;
            } else {
                document.querySelector(`input[name="bodyType"][value="none"]`).checked = true;
                bodyEditor.disabled = true;
                bodyEditor.value = '';
            }
            // Trigger change event to update validate button visibility & line numbers
            const activeRadio = document.querySelector(`input[name="bodyType"]:checked`);
            if (activeRadio) activeRadio.dispatchEvent(new Event('change'));
        }
    }

    newGroupBtn.addEventListener('click', async () => {
        openInputModal("New Group", "New Group", savedGroups, async (name) => {
            if (!savedGroups.includes(name)) {
                savedGroups.push(name);
                await saveServerData();
            }
            currentGroup = name;
            renderCollectionsList();
        });
    });

    newFlowBtn.addEventListener('click', async () => {
        const existingFlows = Array.from(new Set(savedCollections.filter(r => (r.flowGroup || 'Default') === currentGroup).map(r => r.collection || 'Default')));
        const suggestedName = getUniqueName("New Flow", existingFlows);
        
        openInputModal("New Flow", suggestedName, existingFlows, async (flowName) => {
            // Create a default initial step so the flow appears in the list
            const initialRequest = {
                id: Date.now().toString(),
                name: getUniqueName("New Step", []),
                collection: flowName,
                flowGroup: currentGroup,
                type: 'request',
                url: "",
                method: "GET",
                headers: {},
                auth: { type: 'none' },
                extractors: {},
                bodyType: 'none',
                body: null
            };
            savedCollections.push(initialRequest);
            expandedFlows.add(`${currentGroup}:${flowName}`);
            await saveServerData();
            renderCollectionsList();
            
            // Auto-load the new step
            loadRequestIntoUI(initialRequest);
        });
    });

    saveBtn.addEventListener('click', async () => {
        if (!activeRequestId) {
            alert("Please select a step from the sidebar first, or create a new one using the + button on a flow.");
            return;
        }

        const step = savedCollections.find(r => r.id === activeRequestId);
        if (!step) return;

        const type = stepType.value;
        step.type = type;

        if (type === 'request') {
            step.url = reqUrl.value.trim();
            step.method = reqMethod.value;
            step.headers = getHeaders();
            step.auth = { type: 'none' }; // Never save plaintext credentials in the auth object
            step.extractors = getExtractors();
            step.bodyType = document.querySelector('input[name="bodyType"]:checked').value;
            
            const bType = step.bodyType;
            if (bType === 'json') {
                try { step.body = JSON.parse(bodyEditor.value || '{}'); } 
                catch(e) { return alert("Invalid JSON in body"); }
            } else if (bType !== 'none') {
                step.body = bodyEditor.value;
            } else {
                step.body = null;
            }
        } else {
            if (!step.actionData) step.actionData = {};
            if (type === 'clear_vars') step.actionData.vars = document.getElementById('clearVarsInput').value.trim();
            if (type === 'delay') step.actionData.ms = parseInt(document.getElementById('delayMsInput').value) || 0;
            if (type === 'script') step.actionData.script = document.getElementById('scriptInput').value;
            if (type === 'conditional') {
                step.actionData.var = document.getElementById('condVar').value;
                step.actionData.op = document.getElementById('condOp').value;
                step.actionData.val = document.getElementById('condVal').value;
            }
        }

        await saveServerData();
        renderCollectionsList();
        
        // Show a brief success feedback on the button
        const originalHtml = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved';
        saveBtn.classList.remove('btn-secondary');
        saveBtn.classList.add('btn-primary');
        setTimeout(() => {
            saveBtn.innerHTML = originalHtml;
            saveBtn.classList.remove('btn-primary');
            saveBtn.classList.add('btn-secondary');
        }, 2000);
    });

    // Environment Handlers
    envBtn.addEventListener('click', () => {
        envEditor.value = JSON.stringify(savedEnvironment, null, 2);
        updateLineNumbers(envEditor, envEditorLines);
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

    if (exitBtn) {
        exitBtn.addEventListener('click', async () => {
            if (confirm("Are you sure you want to exit? This will shut down the server and close this window.")) {
                try {
                    // Inform the user immediately
                    document.body.innerHTML = `
                        <div style="height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #0f172a; color: #f8fafc; font-family: 'Inter', sans-serif;">
                            <i class="fas fa-power-off" style="font-size: 3rem; color: #f87171; margin-bottom: 24px;"></i>
                            <h2 style="margin: 0; font-weight: 600;">Shutting down...</h2>
                            <p style="color: #94a3b8; margin-top: 12px;">The server is stopping. You can now safely close this tab.</p>
                        </div>
                    `;
                    
                    // Send exit request to backend
                    await fetch('/api/exit', { method: 'POST' });
                    
                    // Try to close the window
                    window.close();
                    
                    // Fallback for browsers that prevent script-initiated close
                    setTimeout(() => {
                        window.location.href = "about:blank";
                    }, 500);
                } catch (error) {
                    console.error("Exit failed:", error);
                }
            }
        });
    }
});
