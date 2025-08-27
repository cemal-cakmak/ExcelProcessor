// Popup Script - Chrome Extension UI

console.log('Excel Yapıştırıcı Popup yüklendi!');

// DOM elementleri
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const pageInfo = document.getElementById('pageInfo');
const connectBtn = document.getElementById('connectBtn');
const pasteBtn = document.getElementById('pasteBtn');
const testBtn = document.getElementById('testBtn');
const resultSection = document.getElementById('resultSection');
const resultText = document.getElementById('resultText');
const loading = document.getElementById('loading');

// Global değişkenler
let webPanelData = null;
let isTargetPage = false;

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    checkPageStatus();
    setupEventListeners();
    loadStoredData();
});

// Event listeners
function setupEventListeners() {
    connectBtn.addEventListener('click', connectToWebPanel);
    pasteBtn.addEventListener('click', pasteData);
    testBtn.addEventListener('click', testPage);
}

// Sayfa durumunu kontrol et
async function checkPageStatus() {
    try {
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        
        if (tab) {
            const response = await chrome.tabs.sendMessage(tab.id, {action: 'checkPage'});
            
            if (response && response.isTargetPage) {
                setStatus('connected', 'Hedef sayfa tespit edildi ✅');
                pageInfo.textContent = `URL: ${new URL(response.url).hostname}`;
                isTargetPage = true;
            } else {
                setStatus('disconnected', 'Hedef sayfa değil');
                pageInfo.textContent = `URL: ${new URL(tab.url).hostname}`;
                isTargetPage = false;
            }
        }
    } catch (error) {
        setStatus('disconnected', 'Sayfa bilgisi alınamadı');
        console.error('Sayfa durumu kontrolü hatası:', error);
    }
}

// Web paneline bağlan
async function connectToWebPanel() {
    setLoading(true);
    setStatus('loading', 'Web paneline bağlanıyor...');
    
    try {
        // Local storage'den veri kontrol et
        const stored = await chrome.storage.local.get(['excelData']);
        
        if (stored.excelData) {
            webPanelData = stored.excelData;
            setStatus('connected', 'Veriler hazır! 📊');
            pasteBtn.disabled = false;
            showResult('success', `${webPanelData.length} satır veri yüklendi`);
        } else {
            // Web panelinden veri al
            const response = await fetchFromWebPanel();
            
            if (response && response.success) {
                webPanelData = response.data;
                await chrome.storage.local.set({excelData: webPanelData});
                setStatus('connected', 'Veriler alındı! 📊');
                pasteBtn.disabled = false;
                showResult('success', `${webPanelData.length} satır veri alındı`);
            } else {
                throw new Error('Web panelinden veri alınamadı');
            }
        }
    } catch (error) {
        setStatus('disconnected', 'Bağlantı başarısız ❌');
        showResult('error', 'Web paneli açık olmalı (localhost:5000)');
        console.error('Bağlantı hatası:', error);
    }
    
    setLoading(false);
}

// Web panelinden veri al
async function fetchFromWebPanel() {
    try {
        const response = await fetch('http://localhost:5000/api/extension/getData', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            return await response.json();
        }
        throw new Error('Web panel yanıt vermedi');
    } catch (error) {
        console.error('Web panel fetch hatası:', error);
        return null;
    }
}

// Verileri yapıştır
async function pasteData() {
    if (!webPanelData) {
        showResult('error', 'Önce web paneline bağlanın!');
        return;
    }
    
    if (!isTargetPage) {
        showResult('warning', 'Hedef sayfa açılmalı!');
        return;
    }
    
    setLoading(true);
    
    try {
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        
        const response = await chrome.tabs.sendMessage(tab.id, {
            action: 'fillForm',
            data: webPanelData
        });
        
        if (response && response.success) {
            showResult('success', 
                `✅ ${response.successCount}/${response.totalCount} alan dolduruldu!`);
            
            // İstatistik kaydet
            await updateStats(response.successCount, response.totalCount);
        } else {
            showResult('error', response.message || 'Form doldurulamadı');
        }
    } catch (error) {
        showResult('error', 'Hata: ' + error.message);
        console.error('Yapıştırma hatası:', error);
    }
    
    setLoading(false);
}

// Sayfayı test et
async function testPage() {
    setLoading(true);
    
    try {
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        
        // Test verisi oluştur
        const testData = [
            {'Soru': 'Test sorusu 1', 'Cevap': 'Bu bir test cevabıdır', 'Durum': 'Evet'},
            {'Soru': 'Test sorusu 2', 'Cevap': 'İkinci test cevabı', 'Durum': 'Hayır'}
        ];
        
        const response = await chrome.tabs.sendMessage(tab.id, {
            action: 'fillForm',
            data: testData
        });
        
        if (response && response.success) {
            showResult('success', `Test başarılı! ${response.successCount} alan dolduruldu`);
        } else {
            showResult('warning', 'Test tamamlandı ancak bazı alanlar bulunamadı');
        }
    } catch (error) {
        showResult('error', 'Test hatası: ' + error.message);
        console.error('Test hatası:', error);
    }
    
    setLoading(false);
}

// Depolanmış verileri yükle
async function loadStoredData() {
    try {
        const stored = await chrome.storage.local.get(['excelData', 'stats']);
        
        if (stored.excelData) {
            webPanelData = stored.excelData;
            pasteBtn.disabled = false;
            setStatus('connected', `${stored.excelData.length} satır veri hazır`);
        }
        
        if (stored.stats) {
            console.log('İstatistikler:', stored.stats);
        }
    } catch (error) {
        console.error('Veri yükleme hatası:', error);
    }
}

// İstatistikleri güncelle
async function updateStats(success, total) {
    try {
        const stored = await chrome.storage.local.get(['stats']);
        const stats = stored.stats || {totalFilled: 0, totalAttempts: 0, lastUsed: null};
        
        stats.totalFilled += success;
        stats.totalAttempts += total;
        stats.lastUsed = new Date().toISOString();
        
        await chrome.storage.local.set({stats: stats});
    } catch (error) {
        console.error('İstatistik güncelleme hatası:', error);
    }
}

// Utility fonksiyonlar
function setStatus(type, message) {
    statusText.textContent = message;
    statusDot.className = `status-dot ${type}`;
}

function setLoading(show) {
    loading.className = show ? 'loading show' : 'loading';
}

function showResult(type, message) {
    resultText.innerHTML = `<div style="color: ${getResultColor(type)}">${message}</div>`;
    resultSection.className = 'result-section show';
    
    setTimeout(() => {
        resultSection.className = 'result-section';
    }, 5000);
}

function getResultColor(type) {
    switch (type) {
        case 'success': return '#90EE90';
        case 'error': return '#FFB6C1';
        case 'warning': return '#FFE4B5';
        default: return '#E0E0E0';
    }
}
