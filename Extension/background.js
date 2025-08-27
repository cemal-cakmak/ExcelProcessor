// Background Script - Chrome Extension

console.log('Excel Yapıştırıcı Extension yüklendi!');

// Web panel ile iletişim için message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background mesaj aldı:', request);
  
  if (request.action === 'pasteData') {
    // Content script'e veri gönder
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'fillForm',
          data: request.data,
          mapping: request.mapping || 'bolum1'
        }, (response) => {
          console.log('Content script yanıtı:', response);
          sendResponse(response);
        });
      }
    });
    return true; // async response için
  }
  
  if (request.action === 'checkConnection') {
    sendResponse({status: 'connected', version: '1.0.0'});
  }
});

// Extension yüklendiğinde
chrome.runtime.onInstalled.addListener(() => {
  console.log('Excel Yapıştırıcı Extension kuruldu!');
  
  // Varsayılan ayarları kaydet
  chrome.storage.local.set({
    settings: {
      autoFill: true,
      showNotifications: true,
      targetFormat: 'bolum1' // ContentPlaceHolder1_txtsoru{N}aciklama
    }
  });
});

// Tab güncellendiğinde
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Hedef sayfa olup olmadığını kontrol et
    if (tab.url.includes('ContentPlaceHolder1') || 
        tab.url.includes('txtsoru') ||
        isTargetSite(tab.url)) {
      
      // Badge göster
      chrome.action.setBadgeText({
        text: '✓',
        tabId: tabId
      });
      
      chrome.action.setBadgeBackgroundColor({
        color: '#4CAF50',
        tabId: tabId
      });
    }
  }
});

// Hedef site kontrolü
function isTargetSite(url) {
  const targetDomains = [
    // Buraya hedef domain'leri ekleyebilirsiniz
    'example.com',
    'test.com'
  ];
  
  return targetDomains.some(domain => url.includes(domain));
}

// External web panel ile iletişim
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  console.log('External mesaj:', request, 'Gönderen:', sender);
  
  if (request.action === 'sendDataToExtension') {
    // Web panelinden gelen veriyi işle
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'fillForm',
          data: request.data,
          mapping: 'bolum1'
        }, (response) => {
          sendResponse(response || {success: true, message: 'Veri gönderildi'});
        });
      } else {
        sendResponse({success: false, message: 'Aktif tab bulunamadı'});
      }
    });
    return true;
  }
  
  sendResponse({success: false, message: 'Bilinmeyen işlem'});
});
