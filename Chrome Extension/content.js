// AI Assistant SidePanel - Content Script

// Класс для взаимодействия с веб-страницей
class ContentInteractor {
  constructor() {
    this.isAnalyzing = false;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Горячие клавиши
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+A для анализа страницы
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        this.analyzeCurrentPage();
      }

      // Escape для закрытия панели
      if (e.key === 'Escape' && document.getElementById('ai-assistant-panel')) {
        this.closePanel();
      }
    });

    // Обработка сообщений от background или sidepanel
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'ANALYZE_PAGE':
          this.analyzeCurrentPage();
          sendResponse({ success: true });
          break;
        case 'EXTRACT_DATA':
          this.extractData();
          sendResponse({ success: true });
          break;
        case 'SUMMARIZE_PAGE':
          this.summarizePage();
          sendResponse({ success: true });
          break;
        default:
          break;
      }
    });
  }

  // Анализ текущей страницы
  analyzeCurrentPage() {
    if (this.isAnalyzing) return;

    this.isAnalyzing = true;
    this.showNotification('Анализ страницы...', 'info');

    // Заглушка для этапа 1
    setTimeout(() => {
      this.isAnalyzing = false;
      this.showNotification('Функция анализа страницы будет реализована на следующем этапе', 'success');
    }, 2000);
  }

  // Извлечение данных со страницы
  extractData() {
    this.showNotification('Функция извлечения данных будет реализована на следующем этапе', 'info');
  }

  // Суммирование контента страницы
  summarizePage() {
    this.showNotification('Функция суммирования будет реализована на следующем этапе', 'info');
  }

  // Закрытие панели помощника
  closePanel() {
    const panel = document.getElementById('ai-assistant-panel');
    if (panel) {
      panel.classList.add('closing');
      setTimeout(() => {
        panel.remove();
      }, 300);
    }
  }

  // Показ уведомления
  showNotification(text, type = 'info') {
    // Удаляем старые уведомления
    const oldNotifications = document.querySelectorAll('.ai-assistant-notification');
    oldNotifications.forEach(notification => {
      notification.classList.add('closing');
      setTimeout(() => {
        notification.remove();
      }, 300);
    });

    // Создаем новое уведомление
    const notification = document.createElement('div');
    notification.className = `ai-assistant-notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-text">${text}</span>
        <button class="notification-close">×</button>
      </div>
    `;

    // Добавляем на страницу
    document.body.appendChild(notification);

    // Анимация появления
    setTimeout(() => {
      notification.classList.add('visible');
    }, 10);

    // Автоматическое закрытие через 5 секунд
    setTimeout(() => {
      notification.classList.remove('visible');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 5000);

    // Обработчик закрытия
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      notification.classList.remove('visible');
      setTimeout(() => {
        notification.remove();
      }, 300);
    });
  }
}

// Инициализация
const contentInteractor = new ContentInteractor();
