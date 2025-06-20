// AI Assistant SidePanel - JavaScript Logic v0.1.1

// Функция для переключения раскрывающихся блоков настроек
function toggleSettingsItem(itemId) {
  const item = document.querySelector(`[data-item="${itemId}"]`);
  const details = document.getElementById(`${itemId}-details`);
  const arrow = item.querySelector('.expand-arrow');

  if (!item || !details) return;

  const isExpanded = item.classList.contains('expanded');

  // Закрываем все остальные блоки настроек (кроме changelog items)
  if (!item.classList.contains('changelog-item')) {
    document.querySelectorAll('.settings-item.expandable.expanded').forEach(expandedItem => {
      if (expandedItem !== item && !expandedItem.classList.contains('changelog-item')) {
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
  }

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

// Функция для переключения MCP серверов на странице локальных MCP
function toggleLocalMcpItem(mcpId) {
  const item = document.querySelector(`[data-mcp="${mcpId}"]`);
  const config = document.getElementById(`${mcpId}-config`);
  const arrow = item.querySelector('.expand-arrow');

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

// Функция для переключения changelog items
function toggleChangelogItem(itemId) {
  const item = document.querySelector(`[data-item="${itemId}"]`);
  const details = item.querySelector('.changelog-details');
  const arrow = item.querySelector('.changelog-arrow');

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
  const mcpId = toggleElement.id.replace('-toggle', '');

  console.log(`MCP переключатель ${toggleElement.id}: ${isChecked ? 'включен' : 'отключен'}`);

  if (isChecked) {
    // Попытка включения сервера (заглушка)
    updateMcpToggleStatus(toggleElement.id, 'active');
    console.log(`MCP сервер ${mcpId} активирован`);
  } else {
    // Отключение сервера вручную
    updateMcpToggleStatus(toggleElement.id, 'disabled');
    console.log(`MCP сервер ${mcpId} отключен вручную`);
  }
}

class SidePanelUI {
  constructor() {
    this.currentSection = 'chat';
    this.currentTab = 'chat';
    this.isConnected = false;
    this.isAuthenticated = false;
    this.currentTheme = 'dark';
    this.init();
  }

  init() {
    this.bindElements();
    this.setupEventListeners();
    this.loadSettings();
    this.checkConnectionStatus();
    this.initTheme();
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

    // Настройки темы
    this.themeStatus = document.getElementById('theme-status');
    this.themeOptions = document.querySelectorAll('.theme-option');

    // Настройки аккаунта
    this.accountStatus = document.getElementById('account-status');
    this.authBtn = document.getElementById('auth-btn');

    // Настройки сервера
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

    // Настройки темы
    this.themeOptions.forEach(option => {
      option.addEventListener('click', () => this.setTheme(option.dataset.theme));
    });

    // Настройки аккаунта
    this.authBtn?.addEventListener('click', () => this.toggleAuth());

    // Настройки сервера
    this.testServerBtn?.addEventListener('click', () => this.testServerConnection());
    this.saveServerBtn?.addEventListener('click', () => this.saveServerConfig());

    // MCP
    this.refreshServerMcpBtn?.addEventListener('click', () => this.refreshServerMcp());
    this.editLocalMcpBtn?.addEventListener('click', () => this.showLocalMcpEditor());
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

    // Раскрывающиеся блоки changelog
    document.querySelectorAll('.changelog-item.expandable').forEach(item => {
      const header = item.querySelector('.changelog-header');
      if (header) {
        header.addEventListener('click', () => {
          const itemId = item.dataset.item;
          if (itemId) {
            toggleChangelogItem(itemId);
          }
        });
      }
    });

    // Раскрывающиеся блоки локальных MCP
    document.querySelectorAll('.local-mcp-item.expandable').forEach(item => {
      const header = item.querySelector('.mcp-header');
      if (header) {
        header.addEventListener('click', () => {
          const mcpId = item.dataset.mcp;
          if (mcpId) {
            toggleLocalMcpItem(mcpId);
          }
        });
      }
    });

    // MCP переключатели (ИСПРАВЛЕНО)
    document.querySelectorAll('.mcp-toggle input[type="checkbox"]').forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        e.stopPropagation(); // Предотвращаем всплытие события
        handleMcpToggleChange(toggle);
      });
    });

    // Кнопки удаления MCP (ИСПРАВЛЕНО)
    document.querySelectorAll('.delete-mcp-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteMcpServer(btn.dataset.mcp);
      });
    });
  }

  // === НАВИГАЦИЯ ===
  showSettings() {
    this.currentSection = 'settings';
    this.updateUI();
  }

  showLocalMcpEditor() {
    this.currentSection = 'local-mcp';
    this.updateUI();
  }

  handleBackButton() {
    if (this.currentSection === 'settings') {
      this.currentSection = 'chat';
      this.updateUI();
    } else if (this.currentSection === 'local-mcp') {
      this.currentSection = 'settings';
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
    this.chatSection.classList.toggle('active', this.currentSection === 'chat');
    this.settingsSection.classList.toggle('active', this.currentSection === 'settings');
    this.localMcpSection.classList.toggle('active', this.currentSection === 'local-mcp');

    // Обновление заголовка и кнопок
    if (this.currentSection === 'chat') {
      this.headerTitle.textContent = 'AI Assistant';
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

  // === ТЕМА ===
  initTheme() {
    const savedTheme = localStorage.getItem('ai-assistant-theme') || 'dark';
    this.setTheme(savedTheme);
  }

  setTheme(theme) {
    this.currentTheme = theme;
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('ai-assistant-theme', theme);

    // Обновляем активную опцию темы
    this.themeOptions.forEach(option => {
      option.classList.toggle('active', option.dataset.theme === theme);
    });

    // Обновляем статус темы
    const themeNames = {
      'light': 'Светлая',
      'dark': 'Темная',
      'auto': 'Авто'
    };
    this.themeStatus.textContent = themeNames[theme];
  }

  // === СТАТУС ПОДКЛЮЧЕНИЯ ===
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
    this.connectionIndicator.classList.toggle('online', connected);
    this.connectionIndicator.classList.toggle('offline', !connected);

    // Обновляем статус сервера в настройках
    if (this.serverStatusIndicator) {
      this.serverStatusIndicator.classList.toggle('online', connected);
      this.serverStatusIndicator.classList.toggle('offline', !connected);
    }

    if (this.serverStatusText) {
      this.serverStatusText.textContent = connected ? 'Подключен' : 'Отключен';
    }
  }

  // === ЧАТ ===
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
    this.addMessageToChat('assistant', 'Функция отправки сообщений будет реализована на следующем этапе.');
  }

  addMessageToChat(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.innerHTML = `
      <div class="message-content">${text}</div>
      <div class="message-time">${new Date().toLocaleTimeString()}</div>
    `;

    // Удаляем welcome сообщение если есть
    const welcomeMsg = this.chatMessages.querySelector('.welcome-message');
    if (welcomeMsg) {
      welcomeMsg.remove();
    }

    this.chatMessages.appendChild(messageDiv);

    // ИСПРАВЛЕНО: Безопасная прокрутка
    if (this.chatMessages) {
      this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
  }

  // === ИНСТРУМЕНТЫ СТРАНИЦЫ ===
  analyzePage() {
    this.addMessageToChat('system', 'Анализ страницы будет реализован на следующем этапе.');
  }

  extractData() {
    this.addMessageToChat('system', 'Извлечение данных будет реализовано на следующем этапе.');
  }

  summarizePage() {
    this.addMessageToChat('system', 'Суммирование страницы будет реализовано на следующем этапе.');
  }

  // === НАСТРОЙКИ АККАУНТА ===
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

  // === НАСТРОЙКИ СЕРВЕРА ===
  testServerConnection() {
    const serverUrl = this.serverUrlInput.value.trim();
    if (!serverUrl) return;

    this.testServerBtn.textContent = 'Тестирование...';
    this.testServerBtn.disabled = true;

    // Заглушка: тест подключения
    setTimeout(() => {
      this.testServerBtn.textContent = 'Тест';
      this.testServerBtn.disabled = false;

      // Имитируем результат теста
      const isConnected = Math.random() > 0.5; // Случайный результат
      this.updateConnectionStatus(isConnected);

      const resultMessage = isConnected 
        ? 'Подключение к серверу успешно!' 
        : 'Не удалось подключиться к серверу';
      this.addMessageToChat('system', resultMessage);
    }, 2000);
  }

  saveServerConfig() {
    const newUrl = this.serverUrlInput.value.trim();
    if (newUrl) {
      chrome.storage.sync.set({serverUrl: newUrl});
      this.addMessageToChat('system', `Адрес сервера сохранен: ${newUrl}`);
    }
  }

  // === MCP СЕРВЕРЫ ===
  refreshServerMcp() {
    // Заглушка: обновление серверных MCP
    console.log('Обновление статуса серверных MCP...');

    // Имитируем обновление
    const serverItems = document.querySelectorAll('#server-mcp-list .mcp-server-item');
    serverItems.forEach((item, index) => {
      const indicator = item.querySelector('.status-indicator');
      indicator.classList.remove('online', 'offline');
      indicator.classList.add('offline');

      // Случайно делаем некоторые серверы активными
      if (Math.random() > 0.5) {
        setTimeout(() => {
          indicator.classList.remove('offline');
          indicator.classList.add('online');
        }, 500 + index * 200);
      }
    });

    // Обновляем счетчик
    setTimeout(() => this.updateMcpCounts(), 1000);
  }

  addMcpServer() {
    // Заглушка: добавление MCP сервера
    alert('Функция добавления MCP сервера будет реализована на следующем этапе');
  }

  deleteMcpServer(mcpId) {
    // ИСПРАВЛЕНО: Корректное удаление MCP сервера
    const mcpItem = document.querySelector(`[data-mcp="${mcpId}"]`);
    if (!mcpItem) return;

    const serverName = mcpItem.querySelector('.mcp-name').textContent;

    if (confirm(`Удалить MCP сервер "${serverName}"?`)) {
      mcpItem.remove();
      this.updateMcpCounts();
      console.log(`MCP сервер ${mcpId} удален`);
    }
  }

  updateMcpCounts() {
    const localActive = document.querySelectorAll('#local-mcp-list .status-indicator.online').length;
    const localTotal = document.querySelectorAll('#local-mcp-list .mcp-server-item').length;
    const serverActive = document.querySelectorAll('#server-mcp-list .status-indicator.online').length;
    const serverTotal = document.querySelectorAll('#server-mcp-list .mcp-server-item').length;

    if (this.localMcpCount) this.localMcpCount.textContent = `${localActive} из ${localTotal}`;
    if (this.serverMcpCount) this.serverMcpCount.textContent = `${serverActive} из ${serverTotal}`;
  }

  // === ОБЩИЕ ФУНКЦИИ ===
  closeSidePanel() {
    window.close();
  }

  loadSettings() {
    chrome.storage.sync.get(['serverUrl', 'isAuthenticated', 'theme'], (result) => {
      if (result.serverUrl) {
        this.serverUrlInput.value = result.serverUrl;
      }

      if (result.isAuthenticated) {
        this.isAuthenticated = true;
        this.toggleAuth();
      }

      if (result.theme) {
        this.setTheme(result.theme);
      }
    });
  }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  // ИСПРАВЛЕНО: Правильная инициализация
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
      default:
        break;
    }
  }
});