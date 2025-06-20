// AI Assistant Background Service Worker v0.1.2

class ConnectionManager {
  constructor() {
    this.websocket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
    this.keepAliveInterval = null;
    this.reconnectTimeout = null;
    this.currentServerUrl = 'ws://localhost:8000/ws';
  }

  async init() {
    // Загружаем настройки из storage
    try {
      const result = await chrome.storage.sync.get(['serverUrl']);
      if (result.serverUrl) {
        this.currentServerUrl = result.serverUrl;
      }
    } catch (error) {
      // Тихая обработка ошибок
    }
    
    this.connect();
  }

  connect() {
    if (this.websocket) return;

    try {
      this.websocket = new WebSocket(this.currentServerUrl);
      
      this.websocket.onopen = () => {
        this.handleConnectionSuccess();
      };
      
      this.websocket.onmessage = (event) => {
        this.handleMessage(event);
      };
      
      this.websocket.onclose = () => {
        this.handleConnectionClose();
      };
      
      this.websocket.onerror = () => {
        this.handleConnectionError();
      };

    } catch (error) {
      this.handleConnectionError();
    }
  }

  handleConnectionSuccess() {
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.updateBadgeStatus(true);
    this.startKeepAlive();
    this.notifyUI('CONNECTION_STATUS_UPDATE', { connected: true });
  }

  handleConnectionError() {
    this.isConnected = false;
    this.websocket = null;
    this.updateBadgeStatus(false);
    this.stopKeepAlive();
    this.scheduleReconnect();
  }

  handleConnectionClose() {
    this.isConnected = false;
    this.websocket = null;
    this.updateBadgeStatus(false);
    this.stopKeepAlive();
    this.scheduleReconnect();
  }

  handleMessage(event) {
    try {
      const message = JSON.parse(event.data);
      this.notifyUI('MESSAGE_FROM_SERVER', { message });
    } catch (error) {
      // Тихая обработка ошибок парсинга
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), 30000);
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  startKeepAlive() {
    this.stopKeepAlive();
    
    this.keepAliveInterval = setInterval(() => {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        try {
          this.websocket.send(JSON.stringify({ type: 'keepalive' }));
        } catch (error) {
          // Тихая обработка ошибок
        }
      }
    }, 30000); // Каждые 30 секунд
  }

  stopKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  updateBadgeStatus(connected) {
    try {
      chrome.action.setBadgeBackgroundColor({
        color: connected ? '#4CAF50' : '#F44336'
      });
      chrome.action.setBadgeText({ text: ' ' });
    } catch (error) {
      // Тихая обработка ошибок
    }
  }

  notifyUI(type, data) {
    try {
      chrome.runtime.sendMessage({ type, ...data });
    } catch (error) {
      // Тихая обработка ошибок
    }
  }

  async sendMessage(message) {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      try {
        this.websocket.send(JSON.stringify(message));
        return { success: true };
      } catch (error) {
        return { success: false, error: 'Failed to send message' };
      }
    } else {
      // Fallback на HTTP
      return await this.sendViaHTTP(message);
    }
  }

  async sendViaHTTP(message) {
    try {
      const httpUrl = this.currentServerUrl.replace('ws://', 'http://').replace('wss://', 'https://');
      const response = await fetch(`${httpUrl}/api/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message)
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, data: result };
      } else {
        return { success: false, error: 'HTTP request failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  async updateServerUrl(newUrl) {
    this.currentServerUrl = newUrl;
    
    // Закрываем текущее соединение
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    
    this.stopKeepAlive();
    this.reconnectAttempts = 0;
    
    // Подключаемся к новому серверу
    this.connect();
    
    // Сохраняем в storage
    try {
      await chrome.storage.sync.set({ serverUrl: newUrl });
    } catch (error) {
      // Тихая обработка ошибок
    }
  }

  getStatus() {
    return {
      connected: this.isConnected,
      serverUrl: this.currentServerUrl,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Создаем глобальный экземпляр менеджера соединений
const connectionManager = new ConnectionManager();

// Инициализация при запуске расширения
chrome.runtime.onStartup.addListener(() => {
  connectionManager.init();
});

chrome.runtime.onInstalled.addListener(() => {
  connectionManager.init();
});

// Инициализируем сразу
connectionManager.init();

// Обработка сообщений от UI
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'CHECK_CONNECTION_STATUS':
      sendResponse(connectionManager.getStatus());
      break;
      
    case 'SEND_MESSAGE':
      connectionManager.sendMessage(message.data).then(result => {
        sendResponse(result);
      });
      return true; // Для асинхронного ответа
      
    case 'UPDATE_SERVER_URL':
      connectionManager.updateServerUrl(message.url).then(() => {
        sendResponse({ success: true });
      });
      return true; // Для асинхронного ответа
      
    case 'RETRY_CONNECTION':
      connectionManager.reconnectAttempts = 0;
      connectionManager.connect();
      sendResponse({ success: true });
      break;
      
    default:
      break;
  }
});

// Мониторинг изменений активных вкладок
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab) {
      connectionManager.notifyUI('SITE_CHANGED', { 
        url: tab.url, 
        title: tab.title 
      });
    }
  } catch (error) {
    // Тихая обработка ошибок
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    connectionManager.notifyUI('SITE_CHANGED', { 
      url: tab.url, 
      title: tab.title 
    });
  }
});

// Обработка ошибок расширения
chrome.runtime.onSuspend.addListener(() => {
  connectionManager.stopKeepAlive();
  if (connectionManager.websocket) {
    connectionManager.websocket.close();
  }
});

// Функция для тестирования соединения
async function testConnection(url) {
  try {
    // Пробуем HTTP endpoint
    const httpUrl = url.replace('ws://', 'http://').replace('wss://', 'https://');
    const response = await fetch(`${httpUrl}/api/status`, {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.ok) {
      return { success: true, method: 'http' };
    }
  } catch (httpError) {
    // Пробуем WebSocket
    try {
      return new Promise((resolve) => {
        const testWs = new WebSocket(url);
        const timeout = setTimeout(() => {
          testWs.close();
          resolve({ success: false, error: 'Connection timeout' });
        }, 5000);
        
        testWs.onopen = () => {
          clearTimeout(timeout);
          testWs.close();
          resolve({ success: true, method: 'websocket' });
        };
        
        testWs.onerror = () => {
          clearTimeout(timeout);
          resolve({ success: false, error: 'WebSocket connection failed' });
        };
      });
    } catch (wsError) {
      return { success: false, error: 'All connection methods failed' };
    }
  }
  
  return { success: false, error: 'Unknown error' };
}

// Экспортируем функцию тестирования для использования в UI
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TEST_CONNECTION') {
    testConnection(message.url).then(result => {
      sendResponse(result);
    });
    return true;
  }
});