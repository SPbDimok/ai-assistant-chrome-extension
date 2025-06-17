
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

document.addEventListener('DOMContentLoaded', function() {
  // Получаем элементы индикатора
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');

  // Отправляем сообщение фоновому скрипту для проверки соединения
  chrome.runtime.sendMessage({action: "checkConnection"}, function(response) {
    if (response && response.connected) {
      // Если соединение активно
      statusDot.classList.remove('status-offline');
      statusDot.classList.add('status-online');
      statusText.textContent = 'Подключено';
    } else {
      // Если соединение отсутствует
      statusDot.classList.remove('status-online');
      statusDot.classList.add('status-offline');
      statusText.textContent = 'Отключено';
    }
  });
});
