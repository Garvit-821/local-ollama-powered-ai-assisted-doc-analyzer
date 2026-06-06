#  Local Document Analysis - Multi Linguastic Chatbot Agent

A privacy-first, 100% offline, local AI-powered document analysis agent and interactive chatbot designed to run seamlessly on resource-constrained hardware. Built using **Python**, **Ollama**, and **LangChain**, this project is optimized to leverage dedicated GPU capabilities without exhausting standard system memory.

This agent is specifically engineered to execute perfectly on setups running **Ubuntu** with **8GB RAM** and a **4GB VRAM GPU (e.g., NVIDIA RTX 3050)** by utilizing high-performance, low-footprint 3B parameter models.

---

##  Features

* **100% Local & Private:** Your sensitive documents never leave your local machine. Zero cloud dependencies, zero external data leaks, and completely free to run.
* **Dual Operational Modes:** Includes both an automated markdown report generator (`local_analyst.py`) and an interactive conversational chatbot (`local_chat_agent.py`).
* **Persistent Context Tracking:** The chatbot retains the target document permanently in its context window while tracking dynamic conversation state across multi-turn dialogues.
* **Intelligent Follow-up Engine:** Automatically suggests relevant, contextual next-step questions to help you uncover hidden data points or risks within complex corporate blueprints.
* **Hardware Optimized:** Explicitly configured to load models entirely into 4GB VRAM, preventing Linux Out-Of-Memory (OOM) kernel kills and keeping the desktop responsive.
* **Multi Language Support:** Multiple LAnguage support.


---

## Setup & Installation

### 1. Prerequisites (Ubuntu Optimization)
Ensure your system has the correct NVIDIA proprietary drivers and CUDA toolkit installed. Verify your GPU availability by running:
```bash
nvidia-smi
curl -fsSL [https://ollama.com/install.sh](https://ollama.com/install.sh) | sh
git clone [https://github.com/Garvit-821/local-ollama-powered-ai-assisted-doc-analyzer.git]
cd local-ollama-powered-ai-assisted-doc-analyzer
python3 -m venv venv
source venv/bin/activate
pip install langchain-community langchain-ollama
python app.py

