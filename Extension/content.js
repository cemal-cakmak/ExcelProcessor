// Content Script - Sayfa manipülasyonu

console.log('Excel Yapıştırıcı Content Script yüklendi!');

// Background script'ten mesaj dinleyici
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script mesaj aldı:', request);
  
  if (request.action === 'fillForm') {
    const result = fillBolum1Form(request.data);
    sendResponse(result);
  }
  
  if (request.action === 'checkPage') {
    const isTargetPage = checkIfTargetPage();
    sendResponse({isTargetPage: isTargetPage, url: window.location.href});
  }
  
  return true;
});

// Bölüm 1 form doldurma fonksiyonu
function fillBolum1Form(data) {
  console.log('Bölüm 1 form dolduruluyor...', data);
  
  if (!data || !Array.isArray(data) || data.length === 0) {
    return {success: false, message: 'Veri bulunamadı'};
  }
  
  let successCount = 0;
  let totalCount = data.length;
  const failedItems = [];
  
  try {
    data.forEach((row, index) => {
      // Excel'deki 3. sütun (cevaplar)
      const cevapColumnName = Object.keys(row)[2];
      const cevap = row[cevapColumnName];
      
      if (cevap && cevap.toString().trim()) {
        // Bölüm 1 textarea ID formatı
        const textareaId = `ContentPlaceHolder1_txtsoru${index + 1}aciklama`;
        const element = document.getElementById(textareaId);
        
        if (element) {
          // Textarea'yı doldur
          element.value = cevap.toString().trim();
          element.focus();
          element.blur();
          
          // Events tetikle
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          element.dispatchEvent(new Event('keyup', { bubbles: true }));
          
          // Visual feedback
          element.style.backgroundColor = '#d4edda';
          element.style.border = '2px solid #28a745';
          element.style.transition = 'all 0.3s ease';
          
          setTimeout(() => {
            element.style.backgroundColor = '';
            element.style.border = '';
          }, 3000);
          
          successCount++;
          console.log(`✅ Soru ${index + 1}: Başarılı - ${textareaId}`);
        } else {
          failedItems.push(`Soru ${index + 1} (ID: ${textareaId})`);
          console.log(`❌ Soru ${index + 1}: Element bulunamadı - ${textareaId}`);
        }
      } else {
        console.log(`⚠️ Soru ${index + 1}: Boş cevap atlandı`);
      }
    });
    
    // Sayfanın üstüne scroll
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Sonuç mesajı
    const message = `🎉 İşlem Tamamlandı!

✅ Başarılı: ${successCount}/${totalCount} cevap dolduruldu

${failedItems.length > 0 ? `❌ Başarısız: ${failedItems.join(', ')}` : ''}`;
    
    // Notification göster
    showNotification(message, successCount > 0 ? 'success' : 'warning');
    
    return {
      success: true,
      successCount: successCount,
      totalCount: totalCount,
      failedItems: failedItems,
      message: message
    };
    
  } catch (error) {
    console.error('Form doldurma hatası:', error);
    const errorMsg = 'Hata oluştu: ' + error.message;
    showNotification(errorMsg, 'error');
    
    return {
      success: false,
      message: errorMsg,
      error: error.message
    };
  }
}

// Hedef sayfa kontrolü
function checkIfTargetPage() {
  // ContentPlaceHolder1_txtsoru1aciklama gibi elementler var mı?
  const testElement = document.getElementById('ContentPlaceHolder1_txtsoru1aciklama');
  return testElement !== null;
}

// Notification göster
function showNotification(message, type = 'info') {
  // Mevcut notification'ları temizle
  const existingNotifications = document.querySelectorAll('.excel-extension-notification');
  existingNotifications.forEach(notif => notif.remove());
  
  // Yeni notification oluştur
  const notification = document.createElement('div');
  notification.className = 'excel-extension-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${getNotificationColor(type)};
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    font-family: Arial, sans-serif;
    font-size: 14px;
    max-width: 400px;
    white-space: pre-line;
    animation: slideIn 0.3s ease-out;
  `;
  
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <span>${getNotificationIcon(type)}</span>
      <div>${message}</div>
      <button onclick="this.parentElement.parentElement.remove()" 
              style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; margin-left: auto;">×</button>
    </div>
  `;
  
  // CSS animation ekle
  if (!document.querySelector('#excel-extension-styles')) {
    const styles = document.createElement('style');
    styles.id = 'excel-extension-styles';
    styles.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(styles);
  }
  
  document.body.appendChild(notification);
  
  // 8 saniye sonra otomatik kapat
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 8000);
}

function getNotificationColor(type) {
  switch (type) {
    case 'success': return '#28a745';
    case 'error': return '#dc3545';
    case 'warning': return '#ffc107';
    default: return '#17a2b8';
  }
}

function getNotificationIcon(type) {
  switch (type) {
    case 'success': return '✅';
    case 'error': return '❌';
    case 'warning': return '⚠️';
    default: return 'ℹ️';
  }
}

// Sayfa yüklendiğinde kontrol et
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (checkIfTargetPage()) {
      console.log('✅ Hedef sayfa tespit edildi!');
    }
  });
} else {
  if (checkIfTargetPage()) {
    console.log('✅ Hedef sayfa tespit edildi!');
  }
}
