// AI Assistant SidePanel - JavaScript Logic v0.1.2

// Глобальные переменные
let currentSiteName = 'AI Assistant';
let autoThemeEnabled = false;
let currentTheme = 'dark';

// Функция для получения названия текущего сайта
async function getCurrentSiteName() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.title) {
      // Извлекаем домен из URL
      const url = new URL(tab.url);
      const domain = url.hostname.replace('www.', '');
      
      // Используем title страницы, но ограничиваем длину
      let siteName = tab.title;
      if (siteName.length > 30) {
        siteName = siteName.substring(0, 27) + '...';
      }
      
      return siteName;
    }
  } catch (error) {
    // Тихая обработка ошибки
  }
  return 'AI Assistant';
}

// Функция для определения темы веб-страницы
async function detectPageTheme() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return 'dark';

    // Выполняем скрипт на странице для анализа темы
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // Получаем цвет фона body
        const bodyStyle = window.getComputedStyle(document.body);
        const bgColor = bodyStyle.backgroundColor;
        
        // Извлекаем RGB значения
        const rgbMatch = bgColor.match(/rgb\((\d+), (\d+), (\d+)\)/);
        if (rgbMatch) {
          const [, r, g, b] = rgbMatch.map(Number);
          
          // Вычисляем brightness
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          
          return brightness < 128 ? 'dark' : 'light';
        }
        
        // Fallback: проверяем системную тему
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
    });

    return results[0]?.result || 'dark';
  } catch (error) {
    // Fallback на системную тему
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}

// Функция применения темы
function applyTheme(theme) {
  const body = document.body;
  
  if (theme === 'auto') {
    // Для авто-темы определяем тему динамически
    detectPageTheme().then(detectedTheme => {
      body.setAttribute('data-theme', detectedTheme);
      currentTheme = detectedTheme;
    });
  } else {
    body.setAttribute('data-theme', theme);
    currentTheme = theme;
  }
  
  // Сохраняем выбранную тему
  chrome.storage.sync.set({ selectedTheme: theme });
}

// Функция для переключения раскрывающихся блоков настроек
function toggleSettingsItem(itemId) {
  const item = document.querySelector(`[data-item="${itemId}"]`);
  const details = document.getElementById(`${itemId}-details`);
  const arrow = item.querySelector('.expand-arrow');
  
  if (!item || !details) return;

  const isExpanded = item.classList.contains('expanded');

  // Закрываем все остальные блоки
  document.querySelectorAll('.settings-item.expandable.expanded').forEach(expandedItem => {
    if (expandedItem !== item) {
      expandedItem.classList.remove('expanded');
      const expandedDetails = expandedItem.querySelector('.item-details');
      const expandedArrow = expandedItem.querySelector('.expand-arrow');
      if (expandedDetails) {
        expandedDetails.style.display = 'none';
        expandedDetails.classList.remove('expanding');
        expandedDetails.classList.add('collapsing');
      }
      if (expandedArrow) {
        expandedArrow.style.transform = 'rotate(0deg)';
      }
    }
  });

  if (isExpanded) {
    // Сворачиваем
    item.classList.remove('expanded');
    details.classList.remove('expanding');
    details.classList.add('collapsing');
    arrow.style.transform = 'rotate(0deg)';
    setTimeout(() => {
      details.style.display = 'none';
      details.classList.remove('collapsing');
    }, 300);
  } else {
    // Разворачиваем
    item.classList.add('expanded');
    details.style.display = 'block';
    details.classList.remove('collapsing');
    details.classList.add('expanding');
    arrow.style.transform = 'rotate(180deg)';
    setTimeout(() => {
      details.classList.remove('expanding');
    }, 300);
  }
}

// Функция для переключения MCP серверов на странице настроек локальных MCP
function toggleLocalMcpItem(mcpId) {
  const item = document.querySelector(`[data-mcp="${mcpId}"]`);
  const config = document.getElementById(`${mcpId}-config`);
  const arrow = item?.querySelector('.expand-arrow');
  
  if (!item || !config) return;

  const isExpanded = item.classList.contains('expanded');

  if (isExpanded) {
    // Сворачиваем
    item.classList.remove('expanded');
    config.classList.remove('expanding');
    config.classList.add('collapsing');
    arrow.style.transform = 'rotate(0deg)';
    setTimeout(() => {
      config.style.display = 'none';
      config.classList.remove('collapsing');
    }, 300);
  } else {
    // Разворачиваем
    item.classList.add('expanded');
    config.style.display = 'block';
    config.classList.remove('collapsing');
    config.classList.add('expanding');
    arrow.style.transform = 'rotate(180deg)';
    setTimeout(() => {
      config.classList.remove('expanding');
    }, 300);
  }
}

// Функция для переключения элементов changelog
function toggleChangelogItem(versionId) {
  const item = document.querySelector(`[data-version="${versionId}"]`);
  const details = item?.querySelector('.changelog-details');
  const arrow = item?.querySelector('.expand-arrow');
  
  if (!item || !details) return;

  const isExpanded = item.classList.contains('expanded');

  if (isExpanded) {
    // Сворачиваем
    item.classList.remove('expanded');
    details.style.display = 'none';
    arrow.style.transform = 'rotate(0deg)';
  } else {
    // Разворачиваем
    item.classList.add('expanded');
    details.style.display = 'block';
    arrow.style.transform = 'rotate(180deg)';
  }
}

// Обновляем статус переключателей MCP
function updateMcpToggleStatus(toggleId, status) {
  const toggle = document.getElementById(toggleId);
  const toggleSwitch = toggle?.parentElement?.querySelector('.toggle-switch');
  
  if (!toggle || !toggleSwitch) return;

  // Сбрасываем все классы
  toggleSwitch.classList.remove('active', 'error', 'disabled');

  switch (status) {
    case 'active':
      toggle.checked = true;
      toggleSwitch.classList.add('active');
      break;
    case 'error':
      toggle.checked = false;
      toggleSwitch.classList.add('error');
      break;
    case 'disabled':
      toggle.checked = false;
      toggleSwitch.classList.add('disabled');
      break;
  }
}

// Обработчик для переключателей MCP
function handleMcpToggleChange(toggleElement) {
  const isChecked = toggleElement.checked;
  const serverId = toggleElement.id;
  
  if (isChecked) {
    // Попытка включения сервера (заглушка)
    updateMcpToggleStatus(serverId, 'active');
    console.log(`MCP сервер ${serverId} включен (заглушка)`);
  } else {
    // Отключение сервера вручную
    updateMcpToggleStatus(serverId, 'disabled');
    console.log(`MCP сервер ${serverId} отключен вручную`);
  }
}

// Основной класс управления интерфейсом
class SidePanelUI {
  constructor() {
    this.currentSection = 'chat';
    this.currentTab = 'chat';
    this.isConnected = false;
    this.isAuthenticated = false;
    this.init();
  }

  async init() {
    this.bindElements();
    this.setupEventListeners();
    await this.loadSettings();
    this.checkConnectionStatus();
    this.initMcpServers();
    await this.updateSiteName();
  }

  async updateSiteName() {
    currentSiteName = await getCurrentSiteName();
    if (this.headerTitle && this.currentSection === 'chat') {
      this.headerTitle.textContent = currentSiteName;
    }
  }

  bindElements() {
    // Навигация
    this.backBtn = document.getElementById('back-btn');
    this.headerTitle = document.getElementById('header-title');
    this.clearChatBtn = document.getElementById('clear-chat-btn');
    this.settingsBtn = document.getElementById('settings-btn');
    this.closeBtn = document.getElementById('close-btn');

    // Индикатор подключения
    this.connectionIndicator = document.getElementById('connection-indicator');

    // Разделы
    this.chatSection = document.getElementById('chat-section');
    this.settingsSection = document.getElementById('settings-section');
    this.localMcpSection = document.getElementById('local-mcp-section');

    // Вкладки чата
    this.tabButtons = document.querySelectorAll('.tab-btn');
    this.tabContents = document.querySelectorAll('.tab-content');

    // Чат
    this.chatInput = document.getElementById('chat-input');
    this.sendBtn = document.getElementById('send-btn');
    this.chatMessages = document.getElementById('chat-messages');

    // Инструменты страницы
    this.analyzePageBtn = document.getElementById('analyze-page-btn');
    this.extractDataBtn = document.getElementById('extract-data-btn');
    this.summarizeBtn = document.getElementById('summarize-btn');

    // Настройки
    this.accountStatus = document.getElementById('account-status');
    this.authBtn = document.getElementById('auth-btn');
    this.serverStatusIndicator = document.getElementById('server-status-indicator');
    this.serverStatusText = document.getElementById('server-status-text');
    this.serverUrlInput = document.getElementById('server-url-input');
    this.testServerBtn = document.getElementById('test-server-btn');
    this.saveServerBtn = document.getElementById('save-server-btn');

    // MCP
    this.localMcpCount = document.getElementById('local-mcp-count');
    this.serverMcpCount = document.getElementById('server-mcp-count');
    this.refreshServerMcpBtn = document.getElementById('refresh-server-mcp');
    this.editLocalMcpBtn = document.getElementById('edit-local-mcp');

    // Тема
    this.currentThemeSpan = document.getElementById('current-theme');
    this.themeOptions = document.querySelectorAll('input[name="theme"]');

    // Локальные MCP
    this.addMcpBtn = document.getElementById('add-mcp-btn');
  }

  setupEventListeners() {
    // Навигация
    this.backBtn?.addEventListener('click', () => this.handleBackButton());
    this.clearChatBtn?.addEventListener('click', () => this.clearChat());
    this.settingsBtn?.addEventListener('click', () => this.showSettings());
    this.closeBtn?.addEventListener('click', () => this.closeSidePanel());

    // Вкладки чата
    this.tabButtons.forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });

    // Чат
    this.sendBtn?.addEventListener('click', () => this.sendMessage());
    this.chatInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Инструменты страницы
    this.analyzePageBtn?.addEventListener('click', () => this.analyzePage());
    this.extractDataBtn?.addEventListener('click', () => this.extractData());
    this.summarizeBtn?.addEventListener('click', () => this.summarizePage());

    // Настройки аккаунта
    this.authBtn?.addEventListener('click', () => this.toggleAuth());

    // Настройки сервера
    this.testServerBtn?.addEventListener('click', () => this.testServerConnection());
    this.saveServerBtn?.addEventListener('click', () => this.saveServerConfig());

    // MCP
    this.refreshServerMcpBtn?.addEventListener('click', () => this.refreshServerMcp());
    this.editLocalMcpBtn?.addEventListener('click', () => this.showLocalMcpPage());

    // Тема
    this.themeOptions.forEach(option => {
      option.addEventListener('change', () => this.handleThemeChange(option.value));
    });

    // Локальные MCP
    this.addMcpBtn?.addEventListener('click', () => this.addMcpServer());

    // Раскрывающиеся блоки настроек
    document.querySelectorAll('.settings-item.expandable').forEach(item => {
      const header = item.querySelector('.item-header');
      if (header) {
        header.addEventListener('click', () => {
          const itemId = item.dataset.item;
          if (itemId) {
            toggleSettingsItem(itemId);
          }
        });
      }
    });

    // Раскрывающиеся блоки MCP серверов
    document.querySelectorAll('.local-mcp-item.expandable').forEach(item => {
      const header = item.querySelector('.mcp-item-header');
      if (header) {
        header.addEventListener('click', (e) => {
          // Не раскрываем блок при клике на переключатель
          if (e.target.closest('.mcp-toggle')) return;
          
          const mcpId = item.dataset.mcp;
          if (mcpId) {
            toggleLocalMcpItem(mcpId);
          }
        });
      }
    });

    // MCP переключатели
    document.querySelectorAll('.mcp-toggle input[type="checkbox"]').forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        e.stopPropagation(); // Предотвращаем раскрытие блока
        handleMcpToggleChange(toggle);
      });
    });

    // Кнопки удаления MCP
    document.querySelectorAll('.delete-mcp-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteMcpServer(btn);
      });
    });

    // Кнопки сохранения конфигурации MCP
    document.querySelectorAll('.save-config-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.saveMcpConfig(btn);
      });
    });

    // Раскрывающиеся элементы changelog
    document.querySelectorAll('.changelog-item.expandable').forEach(item => {
      const header = item.querySelector('.changelog-header');
      if (header) {
        header.addEventListener('click', () => {
          const versionId = item.dataset.version;
          if (versionId) {
            toggleChangelogItem(versionId);
          }
        });
      }
    });
  }

  // Инициализация MCP серверов
  initMcpServers() {
    // Устанавливаем начальные статусы MCP серверов
    updateMcpToggleStatus('mcp-playwright-toggle', 'active');
    updateMcpToggleStatus('mcp-scraper-toggle', 'disabled');
  }

  // Навигация
  showSettings() {
    this.currentSection = 'settings';
    this.updateUI();
  }

  showLocalMcpPage() {
    this.currentSection = 'local-mcp';
    this.updateUI();
  }

  handleBackButton() {
    if (this.currentSection === 'settings' || this.currentSection === 'local-mcp') {
      this.currentSection = 'chat';
      this.updateUI();
    }
  }

  switchTab(tabName) {
    this.currentTab = tabName;
    
    // Обновляем активную вкладку
    this.tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    this.tabContents.forEach(content => {
      content.classList.toggle('active', content.id === tabName + '-tab');
    });
  }

  updateUI() {
    // Показ/скрытие разделов
    this.chatSection?.classList.toggle('active', this.currentSection === 'chat');
    this.settingsSection?.classList.toggle('active', this.currentSection === 'settings');
    this.localMcpSection?.classList.toggle('active', this.currentSection === 'local-mcp');

    // Обновление заголовка и кнопок
    if (this.currentSection === 'chat') {
      this.headerTitle.textContent = currentSiteName;
      this.backBtn.style.display = 'none';
      this.clearChatBtn.style.display = 'flex';
      this.settingsBtn.style.display = 'flex';
    } else if (this.currentSection === 'settings') {
      this.headerTitle.textContent = 'Настройки';
      this.backBtn.style.display = 'flex';
      this.clearChatBtn.style.display = 'none';
      this.settingsBtn.style.display = 'none';
    } else if (this.currentSection === 'local-mcp') {
      this.headerTitle.textContent = 'Локальные MCP';
      this.backBtn.style.display = 'flex';
      this.clearChatBtn.style.display = 'none';
      this.settingsBtn.style.display = 'none';
    }
  }

  // Статус подключения
  checkConnectionStatus() {
    chrome.runtime.sendMessage({type: 'CHECK_CONNECTION_STATUS'})
      .then(response => {
        if (response) {
          this.updateConnectionStatus(response.connected);
        }
      })
      .catch(() => {
        // Тихая обработка ошибок
        this.updateConnectionStatus(false);
      });
  }

  updateConnectionStatus(connected) {
    this.isConnected = connected;
    
    // Обновляем индикатор в шапке
    this.connectionIndicator?.classList.toggle('online', connected);
    this.connectionIndicator?.classList.toggle('offline', !connected);

    // Обновляем статус сервера в настройках
    if (this.serverStatusIndicator) {
      this.serverStatusIndicator.classList.toggle('online', connected);
      this.serverStatusIndicator.classList.toggle('offline', !connected);
    }
    
    if (this.serverStatusText) {
      this.serverStatusText.textContent = connected ? 'Подключен' : 'Отключен';
    }
  }

  // Чат
  clearChat() {
    this.chatMessages.innerHTML = `
      <div class="welcome-message">
        <h3>👋 Добро пожаловать в AI Assistant!</h3>
        <p>Напишите ваш вопрос или используйте инструменты для работы с веб-страницей.</p>
      </div>
    `;
  }

  sendMessage() {
    const message = this.chatInput.value.trim();
    if (!message) return;

    // Добавляем сообщение пользователя
    this.addMessageToChat('user', message);
    this.chatInput.value = '';

    // Заглушка: отправка на сервер (Этап 1)
    setTimeout(() => {
      this.addMessageToChat('assistant', 'Функция отправки сообщений будет реализована на следующем этапе.');
    }, 1000);
  }

  addMessageToChat(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
      <div class="message-content">${text}</div>
      <div class="message-footer">
        <div class="message-time">${timeStr}</div>
        ${sender === 'assistant' ? `
          <div class="message-actions">
            <button class="action-btn copy-btn" title="Скопировать">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
            <button class="action-btn good-btn" title="Хороший ответ">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M7 10v12M15 5.88L14 10h5.83a2 2 0 011.92 2.56l-2.33 8A2 2 0 0117.5 22H4a2 2 0 01-2-2v-8a2 2 0 012-2h2.76a2 2 0 001.79-1.11L12 2h0a3.13 3.13 0 013 3.88z" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
            <button class="action-btn bad-btn" title="Плохой ответ">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M17 14V2M9 18.12L10 14H4.17a2 2 0 01-1.92-2.56l2.33-8A2 2 0 016.5 2H20a2 2 0 012 2v8a2 2 0 01-2 2h-2.76a2 2 0 00-1.79 1.11L12 22h0a3.13 3.13 0 01-3-3.88z" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
          </div>
        ` : ''}
      </div>
    `;

    // Удаляем welcome сообщение если есть
    const welcomeMsg = this.chatMessages.querySelector('.welcome-message');
    if (welcomeMsg) {
      welcomeMsg.remove();
    }

    this.chatMessages.appendChild(messageDiv);
    
    // Добавляем обработчики для кнопок действий
    if (sender === 'assistant') {
      const copyBtn = messageDiv.querySelector('.copy-btn');
      const goodBtn = messageDiv.querySelector('.good-btn');
      const badBtn = messageDiv.querySelector('.bad-btn');
      
      copyBtn?.addEventListener('click', () => this.copyMessage(text));
      goodBtn?.addEventListener('click', () => this.rateMessage(true));
      badBtn?.addEventListener('click', () => this.rateMessage(false));
    }
    
    // Безопасная прокрутка
    if (this.chatMessages) {
      this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
  }

  copyMessage(text) {
    navigator.clipboard.writeText(text).then(() => {
      // Заглушка: показать уведомление об успешном копировании
      console.log('Сообщение скопировано');
    });
  }

  rateMessage(isGood) {
    // Заглушка: отправка рейтинга
    console.log(`Сообщение оценено как: ${isGood ? 'хорошее' : 'плохое'}`);
  }

  // Инструменты для работы с страницей
  analyzePage() {
    this.addMessageToChat('system', 'Анализ страницы будет реализован на следующем этапе.');
  }

  extractData() {
    this.addMessageToChat('system', 'Извлечение данных будет реализовано на следующем этапе.');
  }

  summarizePage() {
    this.addMessageToChat('system', 'Суммирование страницы будет реализовано на следующем этапе.');
  }

  // Настройки аккаунта
  toggleAuth() {
    this.isAuthenticated = !this.isAuthenticated;
    
    if (this.isAuthenticated) {
      this.accountStatus.textContent = 'user@example.com';
      this.authBtn.textContent = 'Выйти';
      this.authBtn.className = 'auth-btn logout';
    } else {
      this.accountStatus.textContent = 'Не авторизован';
      this.authBtn.textContent = 'Авторизоваться';
      this.authBtn.className = 'auth-btn login';
    }
  }

  // Настройки сервера
  testServerConnection() {
    this.testServerBtn.textContent = 'Тестирование...';
    this.testServerBtn.disabled = true;
    
    // Заглушка: тестирование соединения
    setTimeout(() => {
      this.testServerBtn.textContent = 'Тест';
      this.testServerBtn.disabled = false;
      // Заглушка результата
      console.log('Тест соединения завершен (заглушка)');
    }, 2000);
  }

  saveServerConfig() {
    const newUrl = this.serverUrlInput.value.trim();
    if (newUrl) {
      chrome.storage.sync.set({serverUrl: newUrl});
      console.log('Настройки сервера сохранены');
    }
  }

  // Управление темой
  handleThemeChange(theme) {
    applyTheme(theme);
    
    // Обновляем отображение текущей темы
    const themeNames = {
      light: 'Светлая',
      dark: 'Темная',
      auto: 'Авто'
    };
    
    if (this.currentThemeSpan) {
      this.currentThemeSpan.textContent = themeNames[theme] || 'Темная';
    }
  }

  // MCP серверы
  refreshServerMcp() {
    // Заглушка: обновление серверных MCP
    const indicators = document.querySelectorAll('#server-mcp-list .status-indicator');
    indicators.forEach(indicator => {
      indicator.classList.remove('online', 'offline');
      indicator.classList.add('offline');
    });
    
    setTimeout(() => {
      indicators[0]?.classList.add('online');
    }, 1000);
  }

  addMcpServer() {
    // Заглушка: добавление MCP сервера
    console.log('Добавление MCP сервера будет реализовано на следующем этапе.');
  }

  deleteMcpServer(button) {
    const serverItem = button.closest('.local-mcp-item');
    const serverName = serverItem.querySelector('.mcp-name').textContent;
    
    if (confirm(`Удалить MCP сервер "${serverName}"?`)) {
      serverItem.remove();
      console.log(`MCP сервер "${serverName}" удален`);
    }
  }

  saveMcpConfig(button) {
    // Заглушка: сохранение конфигурации MCP
    console.log('Конфигурация MCP сервера сохранена (заглушка)');
  }

  // Закрытие панели
  closeSidePanel() {
    window.close();
  }

  // Загрузка настроек
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['serverUrl', 'isAuthenticated', 'selectedTheme']);
      
      if (result.serverUrl && this.serverUrlInput) {
        this.serverUrlInput.value = result.serverUrl;
      }
      
      if (result.isAuthenticated) {
        this.isAuthenticated = true;
        this.toggleAuth();
      }
      
      // Загружаем тему
      const theme = result.selectedTheme || 'dark';
      const themeOption = document.querySelector(`input[name="theme"][value="${theme}"]`);
      if (themeOption) {
        themeOption.checked = true;
        applyTheme(theme);
      }
    } catch (error) {
      // Тихая обработка ошибок
    }
  }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  window.sidePanelUI = new SidePanelUI();
});

// Обработка сообщений от background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (window.sidePanelUI) {
    switch (message.type) {
      case 'CONNECTION_STATUS_UPDATE':
        window.sidePanelUI.updateConnectionStatus(message.connected);
        break;
      case 'MESSAGE_FROM_SERVER':
        window.sidePanelUI.addMessageToChat('assistant', message.message.content || 'Получено сообщение от сервера');
        break;
      case 'SITE_CHANGED':
        window.sidePanelUI.updateSiteName();
        if (autoThemeEnabled) {
          detectPageTheme().then(theme => applyTheme(theme));
        }
        break;
      default:
        break;
    }
  }
});