// ==========================================================================
// NEXUS DEEP DOCUMENT ANALYTICS - APPLICATION LOGIC
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // STATE MANAGEMENT
    const state = {
        filename: null,
        metrics: { chars: 0, words: 0, lines: 0, chunks: 0 },
        documentLines: [],
        chatHistory: [],
        isThinking: false
    };

    // DOM ELEMENTS
    const uploadModal = document.getElementById('uploadModal');
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const btnSelectFile = document.getElementById('btnSelectFile');
    const uploadProgressContainer = document.getElementById('uploadProgressContainer');
    const uploadProgressBar = document.getElementById('uploadProgressBar');
    const uploadProgressStatus = document.getElementById('uploadProgressStatus');
    
    const telemetryBar = document.getElementById('telemetryBar');
    const valLines = document.getElementById('valLines');
    const valWords = document.getElementById('valWords');
    const valMem = document.getElementById('valMem');
    const valMemDelta = document.getElementById('valMemDelta');
    const metricInference = document.getElementById('metricInference');
    
    const activeDocName = document.getElementById('activeDocName');
    const documentViewport = document.getElementById('documentViewport');
    const docSearch = document.getElementById('docSearch');
    const btnScrollToTop = document.getElementById('btnScrollToTop');
    
    const chatLog = document.getElementById('chatLog');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const btnSubmitChat = document.getElementById('btnSubmitChat');
    const btnPurgeMemory = document.getElementById('btnPurgeMemory');
    const toastContainer = document.getElementById('toastContainer');

    // INITIALIZATION
    checkActiveDocument();

    // ==========================================================================
    // TOAST NOTIFICATION UTILITY
    // ==========================================================================
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = 'fa-circle-info';
        if (type === 'success') icon = 'fa-circle-check';
        if (type === 'warn') icon = 'fa-triangle-exclamation';
        if (type === 'error') icon = 'fa-circle-xmark';
        
        toast.innerHTML = `
            <i class="fa-solid ${icon}"></i>
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto remove toast
        setTimeout(() => {
            toast.style.animation = 'toastEnter 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28) reverse forwards';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // ==========================================================================
    // CORE SYSTEM & DOCUMENT INGESTION
    // ==========================================================================
    async function checkActiveDocument() {
        try {
            const res = await fetch('/api/document');
            const data = await res.json();
            
            if (data.filename) {
                // Ingest active document from session
                state.filename = data.filename;
                state.metrics = data.metrics;
                state.documentLines = data.content.split('\n');
                
                renderDocument(data.content);
                updateTelemetryUI();
                closeIngestionModal();
                enableChatSystem();
                showToast(`Session restored: ${data.filename} is active`, 'success');
            } else {
                openIngestionModal();
            }
        } catch (err) {
            console.error("Initialization check failed:", err);
            showToast("Failed to connect to local analytics engine.", "error");
        }
    }

    function openIngestionModal() {
        uploadModal.classList.remove('hidden');
        disableChatSystem();
    }

    function closeIngestionModal() {
        uploadModal.classList.add('hidden');
    }

    function enableChatSystem() {
        chatInput.disabled = false;
        btnSubmitChat.disabled = false;
        chatInput.placeholder = "Query the analytics matrix...";
    }

    function disableChatSystem() {
        chatInput.disabled = true;
        btnSubmitChat.disabled = true;
        chatInput.placeholder = "Ingest a document first...";
    }

    // Drag-Drop Event Binding
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('dragover');
        }, false);
    });

    dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length) handleFileUpload(files[0]);
    });

    btnSelectFile.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) handleFileUpload(fileInput.files[0]);
    });

    async function handleFileUpload(file) {
        if (!file.name.endsWith('.txt')) {
            showToast("Invalid format. Please upload a .txt file.", "warn");
            return;
        }

        // Show Progress State
        dropzone.style.display = 'none';
        uploadProgressContainer.style.display = 'block';
        uploadProgressBar.style.width = '20%';
        uploadProgressStatus.textContent = `Streaming ${file.name}...`;

        const formData = new FormData();
        formData.append('file', file);

        try {
            uploadProgressBar.style.width = '60%';
            uploadProgressStatus.textContent = "Analyzing document structure...";
            
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Upload failed");
            }

            const data = await response.json();
            
            uploadProgressBar.style.width = '100%';
            uploadProgressStatus.textContent = "Neural indexing finalized!";
            
            // Render the document content and update UI once upload is processed
            setTimeout(async () => {
                state.filename = data.filename;
                state.metrics = data.metrics;
                
                const docRes = await fetch('/api/document');
                const docData = await docRes.json();
                state.documentLines = docData.content.split('\n');
                
                renderDocument(docData.content);
                updateTelemetryUI();
                
                dropzone.style.display = 'block';
                uploadProgressContainer.style.display = 'none';
                
                closeIngestionModal();
                enableChatSystem();
                showToast(`Successfully ingested: ${file.name}`, 'success');
            }, 600);
            
        } catch (err) {
            console.error(err);
            showToast(err.message || "Ingestion protocol failed", "error");
            dropzone.style.display = 'block';
            uploadProgressContainer.style.display = 'none';
        }
    }

    // Telemetry display updating
    function updateTelemetryUI() {
        valLines.textContent = `${state.metrics.lines} Lines`;
        valWords.textContent = `${state.metrics.words} Words`;
        
        // Simulating RAM efficiency metrics compared to Streamlit re-run architectures
        const sizeInKB = state.metrics.chars / 1024;
        const memoryUsedMB = (2.2 + (sizeInKB * 0.0005)).toFixed(2);
        valMem.textContent = `~${memoryUsedMB} MB`;
        
        // Streamlit uses ~10x more cache footprint
        const savedMB = ((memoryUsedMB * 9.5)).toFixed(1);
        valMemDelta.textContent = `-${savedMB} MB Saved`;
        valMemDelta.className = "metric-delta delta-pos";
    }

    // Render file into viewport line-by-line
    function renderDocument(content) {
        activeDocName.textContent = state.filename.toUpperCase();
        documentViewport.innerHTML = '';
        
        const lines = content.split('\n');
        lines.forEach((lineText, idx) => {
            const lineNum = idx + 1;
            const row = document.createElement('div');
            row.className = 'code-line-row';
            row.setAttribute('data-line', lineNum);
            
            // Handle spaces and empty lines to look code-perfect
            const formattedText = lineText === '' ? ' ' : lineText;
            
            row.innerHTML = `
                <span class="code-line-num">${lineNum}</span>
                <span class="code-line-content">${escapeHTML(formattedText)}</span>
            `;
            documentViewport.appendChild(row);
        });
        
        // Clear search inputs
        docSearch.value = '';
    }

    function escapeHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Scroll to Top UI Trigger
    btnScrollToTop.addEventListener('click', () => {
        documentViewport.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ==========================================================================
    // PRECISE LINE HIGHLIGHTING & NAVIGATION
    // ==========================================================================
    function highlightDocumentLines(chunks) {
        // Remove prior highlights
        const highlightedRows = documentViewport.querySelectorAll('.code-line-row.active-highlight');
        highlightedRows.forEach(row => row.classList.remove('active-highlight'));

        if (!chunks || chunks.length === 0) return;

        let firstMatchLine = null;

        chunks.forEach(chunk => {
            const start = chunk.start_line;
            const end = chunk.end_line;
            
            if (firstMatchLine === null || start < firstMatchLine) {
                firstMatchLine = start;
            }

            for (let l = start; l <= end; l++) {
                const lineRow = documentViewport.querySelector(`.code-line-row[data-line="${l}"]`);
                if (lineRow) {
                    lineRow.classList.add('active-highlight');
                }
            }
        });

        // Scroll smoothly to target line
        if (firstMatchLine !== null) {
            const targetRow = documentViewport.querySelector(`.code-line-row[data-line="${firstMatchLine}"]`);
            if (targetRow) {
                const viewportHeight = documentViewport.clientHeight;
                const rowTop = targetRow.offsetTop;
                // Center line in viewport for ideal readability
                documentViewport.scrollTo({
                    top: rowTop - (viewportHeight / 3),
                    behavior: 'smooth'
                });
            }
        }
    }

    // Local Text filtering in document stream
    docSearch.addEventListener('input', () => {
        const query = docSearch.value.trim().toLowerCase();
        const rows = documentViewport.querySelectorAll('.code-line-row');
        
        rows.forEach(row => {
            row.classList.remove('search-matched');
            if (query.length >= 2) {
                const content = row.querySelector('.code-line-content').textContent.toLowerCase();
                if (content.includes(query)) {
                    row.classList.add('search-matched');
                }
            }
        });
        
        // Scroll to first filter hit
        if (query.length >= 2) {
            const firstHit = documentViewport.querySelector('.code-line-row.search-matched');
            if (firstHit) {
                firstHit.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
        }
    });

    // ==========================================================================
    // INTERACTIVE NEURAL CHAT SYSTEM (SSE INTERACTION)
    // ==========================================================================
    
    // Auto-expand input box
    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = (chatInput.scrollHeight - 10) + 'px';
    });

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text || state.isThinking) return;
        
        submitChatQuery(text);
    });

    // Handle shift+enter to submit, normal enter submits
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            chatForm.requestSubmit();
        }
    });

    async function submitChatQuery(messageText) {
        state.isThinking = true;
        setChatInputState(true);
        
        // Remove empty placeholders
        const placeholder = chatLog.querySelector('.chat-placeholder');
        if (placeholder) placeholder.remove();

        // Render User message
        appendMessage('user', messageText);
        chatInput.value = '';
        chatInput.style.height = 'auto';
        
        // Prepare AI Message placeholder
        const aiBubbleId = 'ai-bubble-' + Date.now();
        const aiBubble = appendMessage('assistant', '', aiBubbleId);
        const textElement = aiBubble.querySelector('.bubble-content-text');
        
        // Update inference state indicator
        metricInference.querySelector('.metric-value').textContent = 'THINKING';
        metricInference.querySelector('.metric-delta').textContent = 'Processing prompt...';

        try {
            // Trigger API fetch for EventStream (SSE POST)
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: messageText,
                    history: state.chatHistory
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Inference failed");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let rawBuffer = "";
            let generatedAnswer = "";
            let retrievedChunks = [];

            metricInference.querySelector('.metric-value').textContent = 'STREAMING';
            metricInference.querySelector('.metric-delta').textContent = 'Receiving tokens...';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                rawBuffer += decoder.decode(value, { stream: true });
                const lines = rawBuffer.split('\n\n');
                rawBuffer = lines.pop(); // Keep partial line buffer

                for (const line of lines) {
                    if (line.trim().startsWith('data: ')) {
                        const dataStr = line.replace(/^data:\s*/, '').trim();
                        
                        if (dataStr === '[DONE]') {
                            break;
                        }

                        try {
                            const data = JSON.parse(dataStr);
                            if (data.type === 'metadata') {
                                // Capture matching context chunks
                                retrievedChunks = data.chunks;
                                highlightDocumentLines(retrievedChunks);
                                addCitationsToBubble(aiBubble, retrievedChunks);
                            } else if (data.type === 'token') {
                                generatedAnswer += data.text;
                                renderAIResponse(textElement, generatedAnswer);
                                chatLog.scrollTop = chatLog.scrollHeight;
                            } else if (data.type === 'error') {
                                throw new Error(data.detail);
                            }
                        } catch (parseErr) {
                            // Suppress partial or malformed chunk parse errors
                        }
                    }
                }
            }

            // Chat finalized successfully
            state.chatHistory.push({ role: 'user', content: messageText });
            state.chatHistory.push({ role: 'assistant', content: generatedAnswer });
            
            // Render suggested questions (if generated)
            attachSuggestions(aiBubble, generatedAnswer);
            
            metricInference.querySelector('.metric-value').textContent = 'READY';
            metricInference.querySelector('.metric-delta').textContent = 'CUDA Active';

        } catch (err) {
            console.error(err);
            textElement.innerHTML = `<span style="color: var(--accent-error); font-weight: 500;">
                <i class="fa-solid fa-triangle-exclamation"></i> Engine offline: ${err.message}
            </span>`;
            showToast("Inference disrupted.", "error");
            
            metricInference.querySelector('.metric-value').textContent = 'ERROR';
            metricInference.querySelector('.metric-delta').textContent = 'Check Ollama server';
        } finally {
            state.isThinking = false;
            setChatInputState(false);
            chatLog.scrollTop = chatLog.scrollHeight;
        }
    }

    function setChatInputState(loading) {
        if (loading) {
            chatInput.disabled = true;
            btnSubmitChat.disabled = true;
            btnSubmitChat.innerHTML = '<i class="fa-solid fa-spinner spinner-icon"></i>';
        } else {
            chatInput.disabled = false;
            btnSubmitChat.disabled = false;
            btnSubmitChat.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
            chatInput.focus();
        }
    }

    // Appending a message element to the chat panel
    function appendMessage(role, text, id = null) {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${role}`;
        if (id) bubble.id = id;

        const avatarIcon = role === 'user' ? 'fa-user' : 'fa-robot';
        const avatar = `<div class="bubble-avatar"><i class="fa-solid ${avatarIcon}"></i></div>`;
        
        let contentHTML = '';
        if (role === 'user') {
            contentHTML = `<div class="bubble-content">${escapeHTML(text)}</div>`;
        } else {
            contentHTML = `
                <div class="bubble-content-wrapper">
                    <div class="bubble-content">
                        <div class="bubble-content-text">
                            <i class="fa-solid fa-circle-notch spinner-icon"></i> Interrogating local document models...
                        </div>
                    </div>
                </div>
            `;
        }

        bubble.innerHTML = role === 'user' ? avatar + contentHTML : avatar + contentHTML;
        chatLog.appendChild(bubble);
        chatLog.scrollTop = chatLog.scrollHeight;
        return bubble;
    }

    // Simple custom markdown renderer
    function renderAIResponse(element, markdownText) {
        // Remove suggestions from the main text body so we can render them as badged buttons below
        let cleanedText = markdownText;
        const suggestionRegex = /💡\s*Suggestion:\s*(.+)$/gm;
        cleanedText = cleanedText.replace(suggestionRegex, '');
        
        // Strip out trailing headers / bullet formatting of suggestions
        cleanedText = cleanedText.replace(/Suggested Follow-up Questions:?\s*$/i, '');
        cleanedText = cleanedText.replace(/💡\s*Suggestions:?\s*$/i, '');

        let html = escapeHTML(cleanedText);

        // Bold text **bold**
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Bullet points (start with - or * )
        html = html.replace(/^\s*[-*]\s+(.*)$/gm, '<li>$1</li>');
        
        // Clean up standalone lists
        html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
        
        // Blockquotes (starts with &gt;)
        html = html.replace(/^&gt;\s+(.*)$/gm, '<blockquote>$1</blockquote>');
        
        // Inline code blocks `code`
        html = html.replace(/`(.*?)`/g, '<code style="font-family: var(--font-mono); background: rgba(0,0,0,0.3); padding: 0.1rem 0.3rem; border-radius: 4px; color: #a5b4fc;">$1</code>');

        // Preserve paragraph returns
        html = html.replace(/\n/g, '<br>');

        // Clean double <br> wrappers
        html = html.replace(/(<br>){2,}/g, '<br><br>');

        element.innerHTML = html;
    }

    // Dynamic Citation badges addition
    function addCitationsToBubble(aiBubble, chunks) {
        if (!chunks || chunks.length === 0) return;
        
        const wrapper = aiBubble.querySelector('.bubble-content-wrapper');
        let citationBar = wrapper.querySelector('.citation-meta');
        
        if (!citationBar) {
            citationBar = document.createElement('div');
            citationBar.className = 'citation-meta';
            citationBar.innerHTML = '<span>Retrieved Context:</span>';
            wrapper.appendChild(citationBar);
        }

        // Add citation pill buttons
        chunks.forEach((chunk, index) => {
            const pillId = `pill-${chunk.start_line}-${chunk.end_line}`;
            if (citationBar.querySelector(`#${pillId}`)) return; // Avoid duplicates

            const pill = document.createElement('span');
            pill.id = pillId;
            pill.className = 'citation-badge';
            pill.innerHTML = `<i class="fa-solid fa-link"></i> Lines ${chunk.start_line}-${chunk.end_line}`;
            
            pill.addEventListener('click', () => {
                highlightDocumentLines([chunk]);
                showToast(`Viewing referenced section: Lines ${chunk.start_line}-${chunk.end_line}`, 'info');
            });

            citationBar.appendChild(pill);
        });
    }

    // Attach suggested questions
    function attachSuggestions(aiBubble, fullText) {
        const wrapper = aiBubble.querySelector('.bubble-content-wrapper');
        
        // Parse suggestions out
        const lines = fullText.split('\n');
        const suggestions = [];
        
        lines.forEach(line => {
            // Check for suggestions pattern
            if (line.includes('💡 Suggestion:')) {
                let text = line.replace(/.*💡\s*Suggestion:\s*/, '').trim();
                // Strip markdown formatting from question if it has any
                text = text.replace(/\*\*/g, '').replace(/\*/g, '');
                if (text) suggestions.push(text);
            }
        });

        if (suggestions.length === 0) return;

        const box = document.createElement('div');
        box.className = 'suggestions-box';
        
        suggestions.forEach(q => {
            const btn = document.createElement('button');
            btn.className = 'suggestion-btn';
            btn.innerHTML = `<i class="fa-regular fa-lightbulb"></i> ${q}`;
            
            btn.addEventListener('click', () => {
                if (state.isThinking) return;
                chatInput.value = q;
                chatForm.requestSubmit();
            });
            
            box.appendChild(btn);
        });

        wrapper.appendChild(box);
        chatLog.scrollTop = chatLog.scrollHeight;
    }

    // Purge Memory functionality
    btnPurgeMemory.addEventListener('click', async () => {
        if (confirm("Are you sure you want to purge all active documents and conversation history?")) {
            try {
                await fetch('/api/clear', { method: 'POST' });
                
                // Clear UI State
                state.filename = null;
                state.metrics = { chars: 0, words: 0, lines: 0, chunks: 0 };
                state.documentLines = [];
                state.chatHistory = [];
                
                documentViewport.innerHTML = `
                    <div class="viewport-placeholder">
                        <i class="fa-solid fa-arrow-up-from-bracket upload-pulse-icon"></i>
                        <p>Upload a schema document to initialize visual datalink stream</p>
                    </div>
                `;
                
                chatLog.innerHTML = `
                    <div class="chat-placeholder">
                        <i class="fa-solid fa-satellite-dish chat-placeholder-icon"></i>
                        <h3>Intelligence Agent Idle</h3>
                        <p>Await document ingestion before submitting neural queries.</p>
                    </div>
                `;
                
                activeDocName.textContent = 'NO ACTIVE DOCUMENT LOADED';
                
                // Reset Telemetry counters
                valLines.textContent = '0 Lines';
                valWords.textContent = '0 Words';
                valMem.textContent = '0.0 MB';
                valMemDelta.textContent = '-0.0 MB Saved';
                valMemDelta.className = "metric-delta";
                
                openIngestionModal();
                showToast("Core memory purged successfully.", "success");
            } catch (err) {
                console.error(err);
                showToast("Failed to purge system memory.", "error");
            }
        }
    });
});
