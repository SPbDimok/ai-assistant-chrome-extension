# Создание прототипа Chrome Extension - основные файлы

# 1. manifest.json - конфигурация расширения
manifest_json = '''
{
  "manifest_version": 3,
  "name": "AI Assistant Browser Plugin",
  "version": "1.0.0",
  "description": "AI-powered browser assistant with MCP integration",
  "permissions": [
    "activeTab",
    "storage",
    "scripting",
    "webNavigation"
  ],
  "host_permissions": [
    "http://localhost:*/*",
    "<all_urls>"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "css": ["content.css"]
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_title": "AI Assistant",
    "default_icon": {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "options_page": "options.html",
  "web_accessible_resources": [
    {
      "resources": ["injected.js"],
      "matches": ["<all_urls>"]
    }
  ]
}
'''

# 2. background.js - Service Worker для API взаимодействия
background_js = '''
// Background Service Worker для Chrome Extension
class AIAssistantBackground {
  constructor() {
    this.serverUrl = null;
    this.mcpEnabled = false;
    this.websocket = null;
    this.keepAliveInterval = null;
    
    this.initializeListeners();
    this.loadSettings();
  }

  initializeListeners() {
    // Слушатель установки расширения
    chrome.runtime.onInstalled.addListener(() => {
      console.log('AI Assistant Extension installed');
    });

    // Слушатель сообщений от content scripts и popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // для асинхронных ответов
    });

    // Слушатель изменений настроек
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync') {
        this.handleSettingsChange(changes);
      }
    });
  }

  async loadSettings() {
    const settings = await chrome.storage.sync.get(['serverUrl', 'mcpEnabled']);
    this.serverUrl = settings.serverUrl || 'http://localhost:8000';
    this.mcpEnabled = settings.mcpEnabled || false;
    
    if (this.serverUrl) {
      this.connectToServer();
    }
  }

  handleSettingsChange(changes) {
    if (changes.serverUrl) {
      this.serverUrl = changes.serverUrl.newValue;
      this.reconnectToServer();
    }
    if (changes.mcpEnabled) {
      this.mcpEnabled = changes.mcpEnabled.newValue;
    }
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'sendQuery':
          const response = await this.sendToLLMServer(request.query, request.context);
          sendResponse({ success: true, data: response });
          break;
          
        case 'analyzeElement':
          const analysis = await this.analyzePageElement(request.elementData);
          sendResponse({ success: true, data: analysis });
          break;
          
        case 'executeMCPCommand':
          if (this.mcpEnabled) {
            const result = await this.executeMCPCommand(request.command, request.params);
            sendResponse({ success: true, data: result });
          } else {
            sendResponse({ success: false, error: 'MCP servers disabled' });
          }
          break;
          
        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  connectToServer() {
    if (this.websocket) {
      this.websocket.close();
    }

    try {
      const wsUrl = this.serverUrl.replace('http', 'ws') + '/ws';
      this.websocket = new WebSocket(wsUrl);
      
      this.websocket.onopen = () => {
        console.log('Connected to LLM server');
        this.startKeepAlive();
      };
      
      this.websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleServerMessage(data);
      };
      
      this.websocket.onclose = () => {
        console.log('Disconnected from LLM server');
        this.stopKeepAlive();
        // Переподключение через 5 секунд
        setTimeout(() => this.connectToServer(), 5000);
      };
      
      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
    } catch (error) {
      console.error('Failed to connect to server:', error);
    }
  }

  startKeepAlive() {
    this.keepAliveInterval = setInterval(() => {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({ type: 'keepalive' }));
      }
    }, 20000); // каждые 20 секунд
  }

  stopKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  reconnectToServer() {
    this.connectToServer();
  }

  async sendToLLMServer(query, context = {}) {
    const requestData = {
      query: query,
      context: context,
      timestamp: Date.now(),
      mcpEnabled: this.mcpEnabled
    };

    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      // Отправляем через WebSocket
      return new Promise((resolve, reject) => {
        const requestId = Date.now().toString();
        requestData.requestId = requestId;
        
        const timeout = setTimeout(() => {
          reject(new Error('Request timeout'));
        }, 30000);
        
        const responseHandler = (event) => {
          const data = JSON.parse(event.data);
          if (data.requestId === requestId) {
            clearTimeout(timeout);
            this.websocket.removeEventListener('message', responseHandler);
            resolve(data);
          }
        };
        
        this.websocket.addEventListener('message', responseHandler);
        this.websocket.send(JSON.stringify(requestData));
      });
    } else {
      // Fallback на HTTP
      const response = await fetch(this.serverUrl + '/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    }
  }

  async analyzePageElement(elementData) {
    return await this.sendToLLMServer(
      `Analyze this webpage element: ${elementData.tagName} with text "${elementData.text}"`,
      { elementData }
    );
  }

  async executeMCPCommand(command, params) {
    const requestData = {
      action: 'mcp_command',
      command: command,
      params: params
    };
    
    const response = await fetch(this.serverUrl + '/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      throw new Error(`MCP command failed: ${response.status}`);
    }
    
    return await response.json();
  }

  handleServerMessage(data) {
    // Обработка сообщений от сервера
    switch (data.type) {
      case 'notification':
        this.showNotification(data.message);
        break;
      case 'update':
        this.broadcastToContentScripts(data);
        break;
    }
  }

  showNotification(message) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon32.png',
      title: 'AI Assistant',
      message: message
    });
  }

  broadcastToContentScripts(data) {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, data).catch(() => {
          // Игнорируем ошибки для неактивных вкладок
        });
      });
    });
  }
}

// Инициализация
const aiAssistant = new AIAssistantBackground();
'''

# Сохраняем файлы
with open('manifest.json', 'w', encoding='utf-8') as f:
    f.write(manifest_json)

with open('background.js', 'w', encoding='utf-8') as f:
    f.write(background_js)

print("Созданы файлы:")
print("- manifest.json (конфигурация расширения)")
print("- background.js (Service Worker)")
print("\nФайлы готовы для Chrome Extension!")