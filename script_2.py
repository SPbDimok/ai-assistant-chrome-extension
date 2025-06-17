# Создание пользовательского интерфейса Chrome Extension

# 5. popup.html - Всплывающее окно расширения
popup_html = '''
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Assistant</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="popup-container">
    <div class="header">
      <div class="logo">🤖 AI Assistant</div>
      <div class="status-indicator" id="connection-status">●</div>
    </div>
    
    <div class="quick-actions">
      <button id="analyze-current-page" class="action-btn">
        📄 Анализировать страницу
      </button>
      <button id="summarize-page" class="action-btn">
        📝 Суммировать контент
      </button>
      <button id="extract-data" class="action-btn">
        📊 Извлечь данные
      </button>
    </div>
    
    <div class="chat-section">
      <div class="chat-header">Чат с AI</div>
      <div id="chat-messages" class="chat-messages">
        <div class="message ai-message">
          Привет! Я ваш AI-помощник. Выберите действие выше или задайте вопрос.
        </div>
      </div>
      <div class="chat-input-container">
        <input type="text" id="chat-input" placeholder="Введите ваш вопрос..." />
        <button id="send-message">📤</button>
      </div>
    </div>
    
    <div class="footer">
      <button id="open-options" class="link-btn">⚙️ Настройки</button>
      <div class="mcp-status">
        <label class="switch">
          <input type="checkbox" id="mcp-toggle">
          <span class="slider"></span>
        </label>
        <span class="mcp-label">MCP серверы</span>
      </div>
    </div>
  </div>
  
  <script src="popup.js"></script>
</body>
</html>
'''

# 6. popup.css - Стили для popup
popup_css = '''
/* Стили для popup окна AI Assistant */
body {
  margin: 0;
  padding: 0;
  width: 350px;
  min-height: 400px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #ffffff;
}

.popup-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.header {
  background: linear-gradient(135deg, #4285f4, #34a853);
  color: white;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 16px;
  font-weight: 600;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ff4444;
  animation: pulse 2s infinite;
}

.status-indicator.connected {
  background: #44ff44;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.quick-actions {
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-bottom: 1px solid #e1e5e9;
}

.action-btn {
  background: #f8f9fa;
  border: 1px solid #e1e5e9;
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  text-align: left;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #e8f0fe;
  border-color: #4285f4;
}

.action-btn:active {
  background: #d2e3fc;
}

.chat-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 15px;
}

.chat-header {
  font-size: 14px;
  font-weight: 600;
  color: #5f6368;
  margin-bottom: 10px;
}

.chat-messages {
  flex: 1;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 10px;
  background: #fafbfc;
}

.message {
  margin-bottom: 10px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.4;
}

.user-message {
  background: #4285f4;
  color: white;
  align-self: flex-end;
  margin-left: 20px;
}

.ai-message {
  background: #e8f0fe;
  color: #1a73e8;
  margin-right: 20px;
}

.chat-input-container {
  display: flex;
  gap: 8px;
}

#chat-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #e1e5e9;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
}

#chat-input:focus {
  border-color: #4285f4;
}

#send-message {
  background: #4285f4;
  color: white;
  border: none;
  padding: 10px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

#send-message:hover {
  background: #3367d6;
}

.footer {
  padding: 15px;
  border-top: 1px solid #e1e5e9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
}

.link-btn {
  background: none;
  border: none;
  color: #4285f4;
  cursor: pointer;
  font-size: 14px;
  text-decoration: none;
}

.link-btn:hover {
  text-decoration: underline;
}

.mcp-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mcp-label {
  font-size: 12px;
  color: #5f6368;
}

/* Toggle switch для MCP */
.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .3s;
  border-radius: 20px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #4285f4;
}

input:checked + .slider:before {
  transform: translateX(20px);
}

/* Скроллбар для чата */
.chat-messages::-webkit-scrollbar {
  width: 4px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Индикатор загрузки */
.loading {
  position: relative;
}

.loading:after {
  content: "●●●";
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0%, 60%, 100% { opacity: 1; }
  30% { opacity: 0.3; }
}
'''

# 7. popup.js - JavaScript для popup
popup_js = '''
// JavaScript для popup окна AI Assistant
class AIAssistantPopup {
  constructor() {
    this.chatMessages = document.getElementById('chat-messages');
    this.chatInput = document.getElementById('chat-input');
    this.sendButton = document.getElementById('send-message');
    this.connectionStatus = document.getElementById('connection-status');
    this.mcpToggle = document.getElementById('mcp-toggle');
    
    this.init();
  }

  init() {
    this.attachEventListeners();
    this.loadSettings();
    this.checkConnectionStatus();
  }

  attachEventListeners() {
    // Быстрые действия
    document.getElementById('analyze-current-page').addEventListener('click', () => {
      this.analyzeCurrentPage();
    });
    
    document.getElementById('summarize-page').addEventListener('click', () => {
      this.summarizePage();
    });
    
    document.getElementById('extract-data').addEventListener('click', () => {
      this.extractData();
    });

    // Чат
    this.sendButton.addEventListener('click', () => {
      this.sendMessage();
    });
    
    this.chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });

    // MCP переключатель
    this.mcpToggle.addEventListener('change', (e) => {
      this.toggleMCP(e.target.checked);
    });

    // Настройки
    document.getElementById('open-options').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  }

  async loadSettings() {
    const settings = await chrome.storage.sync.get(['mcpEnabled', 'serverUrl']);
    this.mcpToggle.checked = settings.mcpEnabled || false;
    
    // Проверяем соединение с сервером
    if (settings.serverUrl) {
      this.updateConnectionStatus(true);
    }
  }

  async checkConnectionStatus() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'checkConnection'
      });
      
      this.updateConnectionStatus(response.success);
    } catch (error) {
      this.updateConnectionStatus(false);
    }
  }

  updateConnectionStatus(connected) {
    if (connected) {
      this.connectionStatus.classList.add('connected');
      this.connectionStatus.title = 'Подключено к серверу';
    } else {
      this.connectionStatus.classList.remove('connected');
      this.connectionStatus.title = 'Нет соединения с сервером';
    }
  }

  async sendMessage() {
    const message = this.chatInput.value.trim();
    if (!message) return;

    // Добавляем сообщение пользователя
    this.addMessage(message, 'user');
    this.chatInput.value = '';

    // Показываем индикатор загрузки
    const loadingMessage = this.addMessage('Думаю...', 'ai', true);

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'sendQuery',
        query: message,
        context: { source: 'popup' }
      });

      // Удаляем индикатор загрузки
      loadingMessage.remove();

      if (response.success) {
        this.addMessage(response.data.response || response.data, 'ai');
      } else {
        this.addMessage('Ошибка: ' + response.error, 'ai');
      }
    } catch (error) {
      loadingMessage.remove();
      this.addMessage('Ошибка соединения: ' + error.message, 'ai');
    }
  }

  addMessage(text, sender, isLoading = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    if (isLoading) messageDiv.classList.add('loading');
    messageDiv.textContent = text;
    
    this.chatMessages.appendChild(messageDiv);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    
    return messageDiv;
  }

  async analyzeCurrentPage() {
    this.addMessage('Анализирую текущую страницу...', 'ai', true);
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const response = await chrome.runtime.sendMessage({
        action: 'sendQuery',
        query: 'Проанализируй текущую веб-страницу и дай краткое описание',
        context: { 
          source: 'popup',
          tabId: tab.id,
          url: tab.url,
          title: tab.title
        }
      });

      // Удаляем последнее loading сообщение
      const loadingMessages = this.chatMessages.querySelectorAll('.loading');
      if (loadingMessages.length > 0) {
        loadingMessages[loadingMessages.length - 1].remove();
      }

      if (response.success) {
        this.addMessage(response.data.response || response.data, 'ai');
      } else {
        this.addMessage('Ошибка анализа: ' + response.error, 'ai');
      }
    } catch (error) {
      this.addMessage('Ошибка: ' + error.message, 'ai');
    }
  }

  async summarizePage() {
    this.addMessage('Создаю краткое изложение страницы...', 'ai', true);
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const response = await chrome.runtime.sendMessage({
        action: 'sendQuery',
        query: 'Создай краткое изложение контента этой веб-страницы',
        context: { 
          source: 'popup',
          tabId: tab.id,
          action: 'summarize'
        }
      });

      const loadingMessages = this.chatMessages.querySelectorAll('.loading');
      if (loadingMessages.length > 0) {
        loadingMessages[loadingMessages.length - 1].remove();
      }

      if (response.success) {
        this.addMessage(response.data.response || response.data, 'ai');
      } else {
        this.addMessage('Ошибка создания изложения: ' + response.error, 'ai');
      }
    } catch (error) {
      this.addMessage('Ошибка: ' + error.message, 'ai');
    }
  }

  async extractData() {
    this.addMessage('Извлекаю структурированные данные...', 'ai', true);
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const response = await chrome.runtime.sendMessage({
        action: 'sendQuery',
        query: 'Извлеки и структурируй важные данные с этой страницы (контакты, цены, ссылки)',
        context: { 
          source: 'popup',
          tabId: tab.id,
          action: 'extract'
        }
      });

      const loadingMessages = this.chatMessages.querySelectorAll('.loading');
      if (loadingMessages.length > 0) {
        loadingMessages[loadingMessages.length - 1].remove();
      }

      if (response.success) {
        this.addMessage(response.data.response || response.data, 'ai');
      } else {
        this.addMessage('Ошибка извлечения данных: ' + response.error, 'ai');
      }
    } catch (error) {
      this.addMessage('Ошибка: ' + error.message, 'ai');
    }
  }

  async toggleMCP(enabled) {
    try {
      await chrome.storage.sync.set({ mcpEnabled: enabled });
      
      if (enabled) {
        this.addMessage('MCP серверы включены', 'ai');
      } else {
        this.addMessage('MCP серверы отключены', 'ai');
      }
    } catch (error) {
      console.error('Error toggling MCP:', error);
      this.mcpToggle.checked = !enabled; // Возвращаем обратно
    }
  }
}

// Инициализация popup при загрузке
document.addEventListener('DOMContentLoaded', () => {
  new AIAssistantPopup();
});
'''

# Сохраняем файлы
with open('popup.html', 'w', encoding='utf-8') as f:
    f.write(popup_html)

with open('popup.css', 'w', encoding='utf-8') as f:
    f.write(popup_css)

with open('popup.js', 'w', encoding='utf-8') as f:
    f.write(popup_js)

print("Созданы файлы пользовательского интерфейса:")
print("- popup.html (HTML всплывающего окна)")
print("- popup.css (стили для popup)")
print("- popup.js (JavaScript для popup)")