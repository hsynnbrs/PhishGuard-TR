chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
        
        // Riskli kelimeler ve uzantılar
        const lowerUrl = tab.url.toLowerCase();
        const riskyKeywords = ['garantibbva-onay', 'ziraatbank-giris', 'akbank-dogrula', 'edevlet-onay', 'bedava-bitcoin', 'ptt-takip', 'giris', 'dogrulama'];
        
        const isRisky = riskyKeywords.some(kw => lowerUrl.includes(kw)) || 
                        ['.tk', '.ml', '.ga', '.cf', '.gq'].some(tld => lowerUrl.includes(tld));

        if (isRisky) {
            // Sayfaya kırmızı uyarı ekranını enjekte et
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: injectWarning
            }).catch(err => console.log("Enjeksiyon hatası:", err));
        }
    }
});

function injectWarning() {
    // Eğer zaten uyarı eklenmişse tekrar ekleme
    if (document.getElementById('phishguard-warning')) return;

    const warningDiv = document.createElement('div');
    warningDiv.id = 'phishguard-warning';
    warningDiv.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(5, 8, 15, 0.95); z-index: 999999;
        display: flex; flex-direction: column; justify-content: center; align-items: center;
        font-family: 'Inter', Arial, sans-serif; color: white; text-align: center;
    `;
    warningDiv.innerHTML = `
        <div style="font-size: 80px; margin-bottom: 20px;">🚨</div>
        <h1 style="color: #ff3366; font-size: 36px; margin-bottom: 10px;">DİKKAT! SAHTE SİTE TESPİT EDİLDİ</h1>
        <p style="font-size: 18px; color: #ccc; margin-bottom: 30px; max-width: 600px;">
            PhishGuard-TR eklentisi bu sitenin oltalama (phishing) amaçlı olduğunu tespit etti. 
            Lütfen TC Kimlik, şifre veya kart bilgilerinizi <strong>KESİNLİKLE</strong> girmeyin.
        </p>
        <button onclick="this.parentElement.remove()" style="
            padding: 15px 30px; background: #00ff88; color: #000; border: none; 
            border-radius: 10px; font-size: 16px; font-weight: bold; cursor: pointer;
            transition: transform 0.2s;
        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
            Riskleri Kabul Ediyorum, Devam Et
        </button>
    `;
    document.body.appendChild(warningDiv);
}
