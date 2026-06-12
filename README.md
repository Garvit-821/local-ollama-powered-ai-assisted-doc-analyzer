# Walkthrough - Modern Document Analyzer (FastAPI + HTML/CSS/JS)

We have successfully migrated the document analyzer from a static Streamlit layout to a high-end, responsive HTML/CSS/JS interface powered by a FastAPI backend. This architecture drastically improves performance, keeps system RAM lightweight, and provides a premium, customized user experience.

---

## 🛠️ Key Components Built

### 1. Backend Server ([backend.py](file:///mnt/Garvit%20Prakash/Projects/documents-analyzer/backend.py))
- **Dynamic Chunker**: Splices documents line-by-line into overlapping blocks (roughly ~1000 characters, with 200-character overlap), tracking the exact 1-indexed `start_line` and `end_line` for each block.
- **TF-IDF Search Index**: A lightweight, zero-dependency token indexing search engine. For large documents (>= 6000 chars), it retrieves only the top $K$ matching context blocks to send to the local `qwen2.5:3b` model.
- **Server-Sent Events (SSE) Streamer**: Streams tokens in real time directly from Ollama to the browser. It passes matched block metadata (like referenced lines) in the first frame of the stream so the UI can highlight them instantly.

### 2. Frontend Interface (`static/` Directory)
- **Top HUD & Telemetry Bar**: Displays real-time stats (parsed lines count, word count, active CUDA model indicator, and estimated RAM savings compared to Streamlit).
- **Left Panel (Datalink Stream)**: Renders the active document with line numbers.
  - Matches the exact lines retrieved by the backend and paints them with a neon highlight.
  - Features a local search bar to filter and scroll to specific terms in the active document.
- **Right Panel (Neural Execution Deck)**:
  - Custom user (👤) and assistant (🤖) message bubbles.
  - Renders streamed markdown (bold text, lists, blockquotes, code blocks) dynamically.
  - Renders citation badges (e.g. `Lines 15-28`). Clicking a badge scrolls the document viewer directly to those lines.
  - Creates clickable suggested follow-up questions at the bottom of assistant bubbles. Clicking a suggestion automatically submits it.
- **Ingestion Dropzone Modal**: An upload overlay that displays on startup or memory purging. Users can drag and drop `.txt` files or browse local directories to load files.

---

## 🚀 How to Run the Application

Since terminal commands are restricted in this environment, please run the following commands in your local system shell:

1. **Activate the Virtual Environment and Start the Server**:
   ```bash
    nvidia-smi
    curl -fsSL [https://ollama.com/install.sh](https://ollama.com/install.sh) | sh
    git clone [https://github.com/Garvit-821/local-ollama-powered-ai-assisted-doc-analyzer.git]
    cd local-ollama-powered-ai-assisted-doc-analyzer
    python3 -m venv venv
    source venv/bin/activate
    pip install langchain-community langchain-ollama
   ./venv/bin/uvicorn backend:app --host 127.0.0.1 --port 8000 --reload
   ```

2. **Access the Interface**:
   Open your web browser and navigate to:
   [http://127.0.0.1:8000](http://127.0.0.1:8000)

3. **Verify the Features**:
   - **Upload**: Drop a text file (like `sample_doc.txt`). The modal will close, and the document will stream into the left pane.
   - **Chat**: Ask a question (e.g. *"What is the daily calorie target?"*).
   - **Check Highlights**: The backend will search and stream the response. Watch the left panel scroll and highlight the source lines (e.g. lines 1-13) and check the clickable citation badges!
   - **Suggestions**: Click one of the suggestions at the end of the AI's answer to test auto-submitting.
   - **Purge**: Click **Purge Core Memory** in the top right to wipe state and return to the upload screen.
