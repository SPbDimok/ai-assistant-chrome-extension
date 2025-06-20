// AI Assistant - Service Worker v0.1.1

class ConnectionManager {
  constructor() {
    this.websocket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnect = 5;
    this.reconnectTimeout = null;
  }

  async connect() {
    try {
      // Если соединение уже существует, прерываем процесс
      if (this.websocket && (this.websocket.readyState === WebSocket.CONNECTING || 
                             this.websocket.readyState === WebSocket.OPEN)) {
        return;
      }

      // Создаем новое соединение
      // Используем глобальную переменную для хранения WebSocket соединения
      // Чтобы избежать проблем с garbage collection в Service Worker
      this.setupWebSocket();
    } catch (error) {
      // Тихая обработка ошибок, без логирования в консоль
      this.handleConnectionError();
    }
  }

  setupWebSocket() {
    try {
      // Тихая обработка ошибок при создании WebSocket
      this.websocket = new WebSocket('ws://localhost:8000/ws');

      // Настраиваем обработчики событий WebSocket
      this.websocket.addEventListener('open', () => {
        this.handleConnectSuccess();
      });

      this.websocket.addEventListener('error', () => {
        // Тихая обработка ошибок соединения, без логирования в консоль
        this.handleConnectionError();
      });

      this.websocket.addEventListener('close', () => {
        this.handleConnectionClose();
      });

      this.websocket.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          // Тихая обработка ошибок сообщений
        }
      });
    } catch (error) {
      // Тихая обработка ошибок при создании WebSocket
      this.handleConnectionError();
    }
  }

  handleConnectSuccess() {
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.updateBadgeStatus(true);
    this.notifyConnectionStatus(true);

    // Запускаем механизм поддержания соединения
    this.startKeepAlive();
  }

  handleConnectionError() {
    this.isConnected = false;
    this.updateBadgeStatus(false);
    this.notifyConnectionStatus(false);

    // Попытка переподключения с экспоненциальной задержкой
    this.scheduleReconnect();
  }

  handleConnectionClose() {
    this.isConnected = false;
    this.updateBadgeStatus(false);
    this.notifyConnectionStatus(false);

    // Очищаем keepalive интервал
    this.stopKeepAlive();

    // Попытка переподключения
    this.scheduleReconnect();
  }

  scheduleReconnect() {
    // Очищаем предыдущий таймер переподключения
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    // Проверяем лимит попыток переподключения
    if (this.reconnectAttempts < this.maxReconnect) {
      this.reconnectAttempts++;

      // Экспоненциальная задержка: 2^n секунд, но не более 30 секунд
      const delay = Math.min(Math.pow(2, this.reconnectAttempts) * 1000, 30000);

      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, delay);
    }
  }

  startKeepAlive() {
    this.keepAliveInterval = setInterval(() => {
      try {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
          // Отправляем пинг для поддержания соединения
          this.websocket.send(JSON.stringify({ type: "ping" }));
        }
      } catch (error) {
        // Тихая обработка ошибок keepalive
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
      chrome.action.setBadgeText({text: ' '});
    } catch (error) {
      // Тихая обработка ошибок
    }
  }

  notifyConnectionStatus(connected) {
    try {
      chrome.runtime.sendMessage({
        type: 'CONNECTION_STATUS_UPDATE',
        connected: connected
      }).catch(() => {
        // Тихая обработка ошибок отправки сообщения
      });
    } catch (error) {
      // Тихая обработка ошибок
    }
  }

  handleMessage(data) {
    try {
      // Отправляем сообщение в sidepanel
      chrome.runtime.sendMessage({
        type: 'MESSAGE_FROM_SERVER',
        message: data
      }).catch(() => {
        // Тихая обработка ошибок отправки сообщения
      });
    } catch (error) {
      // Тихая обработка ошибок
    }
  }

  async sendMessage(message) {
    try {
      if (!this.isConnected || !this.websocket) {
        return { success: false, error: 'Нет подключения к серверу' };
      }

      this.websocket.send(JSON.stringify(message));
      return { success: true };
    } catch (error) {
      // Тихая обработка ошибок
      return { success: false, error: 'Ошибка отправки сообщения' };
    }
  }
}

// Создаем экземпляр менеджера соединений
const connectionManager = new ConnectionManager();

// Обработка сообщений от sidepanel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    switch (message.type) {
      case 'CHECK_CONNECTION_STATUS':
        sendResponse({ connected: connectionManager.isConnected });
        break;
      case 'RETRY_CONNECTION':
        connectionManager.connect();
        sendResponse({ success: true });
        break;
      case 'SEND_MESSAGE':
        connectionManager.sendMessage(message.data)
          .then(result => sendResponse(result))
          .catch(() => sendResponse({ success: false, error: 'Ошибка обработки сообщения' }));
        return true; // Для асинхронного ответа
      default:
        break;
    }
  } catch (error) {
    // Тихая обработка ошибок
    sendResponse({ success: false, error: 'Ошибка обработки сообщения' });
  }
  return true; // Для асинхронного ответа
});

// Инициализация при установке/обновлении расширения
chrome.runtime.onInstalled.addListener(() => {
  // Устанавливаем начальный статус
  connectionManager.updateBadgeStatus(false);

  // Первая попытка подключения
  connectionManager.connect();
});

// Инициализация при запуске браузера
chrome.runtime.onStartup.addListener(() => {
  // Первая попытка подключения
  connectionManager.connect();
});