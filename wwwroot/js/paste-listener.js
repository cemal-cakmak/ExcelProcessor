// Excel Paste Listener - Hedef sayfalarda kullanılacak
// Bu dosyayı hedef web sayfalarına ekleyin

(function() {
    'use strict';
    
    console.log('📋 Excel Paste Listener yüklendi!');
    
    // Paste event listener
    document.addEventListener('paste', function(e) {
        try {
            // Clipboard verisini al
            const clipboardData = e.clipboardData || window.clipboardData;
            const pastedData = clipboardData.getData('text');
            
            // Excel verimiz mi kontrol et
            if (pastedData && pastedData.includes('ExcelPasteData_Bolum1')) {
                e.preventDefault(); // Normal paste işlemini durdur
                processExcelData(pastedData);
            }
        } catch (error) {
            console.error('Paste işlemi hatası:', error);
        }
    });
    
    // Excel verisini işle
    function processExcelData(jsonString) {
        try {
            const clipboardData = JSON.parse(jsonString);
            
            // Veri formatını kontrol et
            if (clipboardData.type !== 'ExcelPasteData_Bolum1') {
                console.log('Bu bir Excel verisi değil, normal paste işlemi devam ediyor...');
                return;
            }
            
            console.log('✅ Excel verisi tespit edildi!', clipboardData);
            
            // Verileri forma doldur
            fillFormWithData(clipboardData.data, clipboardData.headers);
            
        } catch (error) {
            console.error('JSON parse hatası:', error);
            // Hata durumunda normal paste devam etsin
        }
    }
    
    // Form doldurma fonksiyonu (Akıllı - Tüm Bölümler)
    function fillFormWithData(data, headers) {
        if (!data || !Array.isArray(data) || data.length === 0) {
            showNotification('❌ Veri bulunamadı!', 'error');
            return;
        }
        
        // Sayfadaki mevcut textarea'ları otomatik tespit et
        const availableTextareas = findAvailableTextareas();
        const availableDropdowns = findAvailableDropdowns();
        
        console.log('🔍 Bulunan textarea\'lar:', availableTextareas);
        console.log('📋 Bulunan dropdown\'lar:', availableDropdowns);
        
        if (availableTextareas.length === 0) {
            showNotification('❌ Hiç textarea bulunamadı!\n\nBu sayfa MEB form sayfası mı?', 'error');
            return;
        }
        
        let successCount = 0;
        let totalCount = Math.min(data.length, availableTextareas.length);
        const failedItems = [];
        
        console.log('📊 Form dolduruluyor...', {data, headers, availableTextareas: availableTextareas.length});
        
        // Debug: Clipboard data kontrolü
        if (data.length > 0) {
            const firstRow = data[0];
            const allKeys = Object.keys(firstRow);
            console.log('🔍 Gelen veri sütunları:', allKeys);
            console.log('📋 İlk satır tüm verileri:', firstRow);
        }
        
        try {
            for (let i = 0; i < totalCount; i++) {
                const row = data[i];
                const textareaId = availableTextareas[i];
                
                // Akıllı sütun seçimi - Cevap sütununu otomatik bul
                const rowKeys = Object.keys(row);
                let cevap = '';
                let cevapColumnName = '';
                
                // DataTable otomatik sıra numarası eklediği için sütunlar kayıyor
                // Excel: [Soru No, Sorular, Cevaplar, Evet] → DataTable: [Auto#, Soru No, Sorular, Cevaplar, Evet]
                // Bu yüzden 4. sütunu (index 3) alacağız
                
                // İlk önce sütun isimlerinden "cevap" içereni bul
                for (let colName of rowKeys) {
                    if (colName.toLowerCase().includes('cevap') || colName.toLowerCase().includes('answer')) {
                        if (row[colName] && row[colName].toString().trim()) {
                            cevap = row[colName];
                            cevapColumnName = colName;
                            console.log(`✅ Cevap sütunu bulundu: "${colName}" = "${cevap.substring(0, 50)}..."`);
                            break;
                        }
                    }
                }
                
                // Bulamazsa, 4. sütunu dene (DataTable sıra ekledigi için kayıyor)
                if (!cevap && rowKeys.length >= 4) {
                    cevapColumnName = rowKeys[3]; // 4. sütun (index 3)
                    cevap = row[cevapColumnName];
                    console.log(`📋 4. sütun alındı (DataTable kayması): "${cevapColumnName}" = "${cevap.substring(0, 50)}..."`);
                }
                
                // Bulamazsa, en uzun metni içeren sütunu al (genelde cevap en uzundur)
                if (!cevap) {
                    let longestText = '';
                    let longestColumn = '';
                    
                    for (let colName of rowKeys) {
                        const value = row[colName];
                        if (value && value.toString().length > longestText.length && value.toString().length > 20) {
                            longestText = value.toString();
                            longestColumn = colName;
                        }
                    }
                    
                    if (longestColumn) {
                        cevap = longestText;
                        cevapColumnName = longestColumn;
                        console.log(`📝 En uzun metin sütunu alındı: "${longestColumn}" = "${cevap.substring(0, 50)}..."`);
                    }
                }
                
                // Excel'deki 5. sütunu al (Evet/Hayır) - DataTable kayması ile
                const evetHayirColumn = rowKeys[4]; // 5. sütun (index 4) - DataTable otomatik sıra ekler
                const evetHayir = row[evetHayirColumn] || '';
                
                // Sadece ilk satırda debug bilgisi göster
                if (i === 0) {
                    console.log(`🔍 Debug - Tüm sütunlar:`, rowKeys);
                    console.log(`📊 Debug - İlk satır değerleri:`, Object.values(row));
                    console.log(`✅ Cevap sütunu (index 3): "${rowKeys[3]}" = "${cevap?.substring(0, 30)}..."`);
                    console.log(`📋 Evet/Hayır sütunu (index 4): "${evetHayirColumn}" = "${evetHayir}"`);
                }
                
                console.log(`📋 Satır ${i + 1} - Cevap: "${cevap?.substring(0, 20)}...", Evet/Hayır: "${evetHayir}"`);
                
                let itemSuccess = false;
                
                // 1. Önce textarea'yı doldur
                if (cevap && cevap.toString().trim()) {
                    const element = document.getElementById(textareaId);
                    
                    if (element) {
                        element.value = cevap.toString().trim();
                        element.focus();
                        element.blur();
                        
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                        element.dispatchEvent(new Event('change', { bubbles: true }));
                        element.dispatchEvent(new Event('keyup', { bubbles: true }));
                        
                        highlightElement(element);
                        itemSuccess = true;
                        console.log(`✅ Soru ${i + 1}: Cevap yapıştırıldı - ${textareaId}`);
                    } else {
                        console.log(`❌ Soru ${i + 1}: Textarea bulunamadı - ${textareaId}`);
                    }
                }
                
                // 2. Sonra dropdown'ı seç
                if (evetHayir && evetHayir.toString().trim() && i < availableDropdowns.length) {
                    const dropdownId = availableDropdowns[i];
                    const dropdownElement = document.getElementById(dropdownId);
                    
                    if (dropdownElement) {
                        const value = evetHayir.toString().trim().toLowerCase();
                        let selectedValue = '';
                        
                        // Dropdown seçeneklerini kontrol et
                        const options = Array.from(dropdownElement.options);
                        console.log(`🔍 Excel'den gelen değer: "${evetHayir}" → lowercase: "${value}"`);
                        console.log(`🔍 Dropdown ${dropdownId} seçenekleri:`);
                        options.forEach((opt, idx) => {
                            console.log(`   ${idx}: text="${opt.text}" value="${opt.value}"`);
                        });
                        
                        // Basit eşleşme mantığı
                        for (let option of options) {
                            const optionText = option.text.toLowerCase().trim();
                            const optionValue = option.value.toLowerCase().trim();
                            
                            // EVET kontrolü - MEB sitesi: value="2" = "Evet"
                            if (value === 'evet') {
                                if (optionText === 'evet' || optionValue === '2') {
                                    selectedValue = option.value;
                                    console.log(`✅ EVET bulundu! Text: "${option.text}", Value: "${option.value}"`);
                                    break;
                                }
                            }
                            // HAYIR kontrolü - MEB sitesi: value="1" = "Hayır"
                            else if (value === 'hayır' || value === 'hayir') {
                                if (optionText === 'hayır' || optionText === 'hayir' || optionValue === '1') {
                                    selectedValue = option.value;
                                    console.log(`✅ HAYIR bulundu! Text: "${option.text}", Value: "${option.value}"`);
                                    break;
                                }
                            }
                        }
                        
                        if (selectedValue) {
                            dropdownElement.value = selectedValue;
                            dropdownElement.dispatchEvent(new Event('change', { bubbles: true }));
                            highlightElement(dropdownElement);
                            console.log(`✅ Soru ${i + 1}: Dropdown seçildi - ${dropdownId} = ${selectedValue}`);
                        } else {
                            console.log(`⚠️ Soru ${i + 1}: Dropdown değer bulunamadı - "${evetHayir}"`);
                        }
                    } else {
                        console.log(`❌ Soru ${i + 1}: Dropdown bulunamadı - ${dropdownId}`);
                    }
                }
                
                if (itemSuccess) {
                    successCount++;
                } else {
                    failedItems.push(`Soru ${i + 1}`);
                }
            }
            
            // Sonuç mesajı
            const message = `🎉 İşlem Tamamlandı!

✅ Başarılı: ${successCount}/${totalCount} cevap dolduruldu

${failedItems.length > 0 ? `❌ Başarısız: ${failedItems.slice(0, 5).join(', ')}${failedItems.length > 5 ? '...' : ''}` : ''}`;
            
            showNotification(message, successCount > 0 ? 'success' : 'warning');
            
            // Sayfanın üstüne scroll
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
        } catch (error) {
            console.error('Form doldurma hatası:', error);
            showNotification('❌ Hata oluştu: ' + error.message, 'error');
        }
    }
    
    // Sayfadaki mevcut textarea'ları otomatik tespit et
    function findAvailableTextareas() {
        const textareas = [];
        
        // MEB formatındaki textarea'ları ara
        const pattern = /^ContentPlaceHolder1_txtsoru(\d+)aciklama$/;
        
        // Tüm elementleri tara
        const allElements = document.querySelectorAll('textarea[id*="ContentPlaceHolder1_txtsoru"], textarea[id*="aciklama"]');
        
        const foundIds = [];
        allElements.forEach(element => {
            const id = element.id;
            if (pattern.test(id)) {
                const match = id.match(pattern);
                const number = parseInt(match[1]);
                foundIds.push({ id: id, number: number });
            }
        });
        
        // Numaraya göre sırala
        foundIds.sort((a, b) => a.number - b.number);
        
        // Sadece ID'leri döndür
        const sortedIds = foundIds.map(item => item.id);
        
        console.log('🔍 Tespit edilen textarea\'lar:', sortedIds);
        
        return sortedIds;
    }
    
    function findAvailableDropdowns() {
        const dropdowns = [];
        
        // MEB formatındaki dropdown'ları ara
        const pattern = /^ContentPlaceHolder1_drpcevap(\d+)$/;
        
        // Tüm dropdown elementlerini tara
        const allElements = document.querySelectorAll('select[id*="ContentPlaceHolder1_drpcevap"]');
        
        const foundIds = [];
        allElements.forEach(element => {
            const id = element.id;
            if (pattern.test(id)) {
                const match = id.match(pattern);
                const number = parseInt(match[1]);
                foundIds.push({ id: id, number: number });
            }
        });
        
        // Numaraya göre sırala
        foundIds.sort((a, b) => a.number - b.number);
        
        // Sadece ID'leri döndür
        const sortedIds = foundIds.map(item => item.id);
        
        console.log('📋 Tespit edilen dropdown\'lar:', sortedIds);
        
        return sortedIds;
    }
    
    // Element vurgulama
    function highlightElement(element) {
        const originalStyle = {
            backgroundColor: element.style.backgroundColor,
            border: element.style.border,
            transition: element.style.transition
        };
        
        // Yeşil vurgu
        element.style.backgroundColor = '#d4edda';
        element.style.border = '2px solid #28a745';
        element.style.transition = 'all 0.3s ease';
        
        // 3 saniye sonra eski haline döndür
        setTimeout(() => {
            element.style.backgroundColor = originalStyle.backgroundColor;
            element.style.border = originalStyle.border;
            element.style.transition = originalStyle.transition;
        }, 3000);
    }
    
    // Notification göster
    function showNotification(message, type = 'info') {
        // Mevcut notification'ları temizle
        const existingNotifications = document.querySelectorAll('.excel-paste-notification');
        existingNotifications.forEach(notif => notif.remove());
        
        // Yeni notification oluştur
        const notification = document.createElement('div');
        notification.className = 'excel-paste-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${getNotificationColor(type)};
            color: white;
            padding: 20px 25px;
            border-radius: 10px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
            z-index: 999999;
            font-family: Arial, sans-serif;
            font-size: 14px;
            font-weight: 500;
            max-width: 400px;
            white-space: pre-line;
            animation: slideInRight 0.4s ease-out;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 12px;">
                <span style="font-size: 18px; flex-shrink: 0;">${getNotificationIcon(type)}</span>
                <div style="flex: 1;">${message}</div>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: none; border: none; color: white; font-size: 20px; cursor: pointer; 
                               margin-left: 10px; padding: 0; width: 20px; height: 20px; flex-shrink: 0;">×</button>
            </div>
        `;
        
        // CSS animation ekle
        if (!document.querySelector('#excel-paste-styles')) {
            const styles = document.createElement('style');
            styles.id = 'excel-paste-styles';
            styles.textContent = `
                @keyframes slideInRight {
                    from { 
                        transform: translateX(100%); 
                        opacity: 0; 
                    }
                    to { 
                        transform: translateX(0); 
                        opacity: 1; 
                    }
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(notification);
        
        // 10 saniye sonra otomatik kapat
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideInRight 0.3s ease-out reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, 10000);
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
    
    // Sayfa yüklendiğinde bilgi ver
    console.log('🎯 Excel Paste Listener hazır! Ctrl+V ile veri yapıştırabilirsiniz.');
    
    // Test için global fonksiyon
    window.testExcelPaste = function() {
        const testData = {
            type: 'ExcelPasteData_Bolum1',
            version: '1.0',
            data: [
                {'Soru': 'Test sorusu 1', 'Cevap': 'Bu bir test cevabıdır', 'Durum': 'Evet'},
                {'Soru': 'Test sorusu 2', 'Cevap': 'İkinci test cevabı', 'Durum': 'Hayır'}
            ],
            headers: ['Soru', 'Cevap', 'Durum']
        };
        
        processExcelData(JSON.stringify(testData));
    };
    
})();
