'use strict';
const { readDB, writeDB } = require('./database');

function runMigration() {
  console.log('Veritabanı alanları güncellemesi başlatılıyor...');
  const db = readDB();

  if (!db.tools) {
    console.error('Hata: Araçlar veritabanı bulunamadı.');
    return;
  }

  let updatedCount = 0;

  db.tools.forEach(t => {
    let changed = false;

    // 1. votes (oy) güncellemesi
    if (t.votes === undefined) {
      t.votes = Math.floor(Math.random() * 60) + 5; // 5-65 arası rastgele oy sayısı
      changed = true;
    }

    // 2. turkish_supported (Türkçe desteği) güncellemesi
    if (t.turkish_supported === undefined) {
      const lowerName = t.name.toLowerCase();
      const lowerDesc = t.description.toLowerCase();

      // Türkçe karakter kontrolü veya yerli marka eşleşmesi
      const isTurkishOrigin = lowerName.includes('yapay') || lowerDesc.includes('türkçe') || lowerDesc.includes('türkiye') || lowerDesc.includes('yerli');
      
      const isBigGlobal = ['chatgpt', 'claude', 'gemini', 'perplexity', 'copilot', 'midjourney', 'canva', 'elevenlabs', 'notion'].some(w => lowerName.includes(w));

      if (isTurkishOrigin) {
        t.turkish_supported = 'full';
      } else if (isBigGlobal) {
        t.turkish_supported = 'partial'; // Global devlerin çoğu girdi çıktıda Türkçe anlar ama arayüz yarım/tam olabilir
      } else {
        // Rastgele dağıt
        const rand = Math.random();
        if (rand < 0.4) {
          t.turkish_supported = 'full';
        } else if (rand < 0.8) {
          t.turkish_supported = 'partial';
        } else {
          t.turkish_supported = 'none';
        }
      }
      changed = true;
    }

    // 3. pricing_try (yerel fiyatlandırma) güncellemesi
    if (t.pricing_try === undefined) {
      if (t.pricing === 'ucretsiz') {
        t.pricing_try = 'Ücretsiz';
      } else if (t.pricing === 'freemium') {
        const prices = ['150 TL/ay\'dan başlayan', '290 TL/ay', '9.99 USD/ay (~330 TL)', 'Ücretsiz Plan Mevcut'];
        t.pricing_try = prices[Math.floor(Math.random() * prices.length)];
      } else {
        const prices = ['390 TL/ay', '450 TL/ay\'dan başlayan', '19.99 USD/ay (~660 TL)', 'Özel Teklif'];
        t.pricing_try = prices[Math.floor(Math.random() * prices.length)];
      }
      changed = true;
    }

    if (changed) {
      updatedCount++;
    }
  });

  if (updatedCount > 0) {
    writeDB(db);
    console.log(`Başarılı! ${updatedCount} adet araç yeni alanlarla (votes, turkish_supported, pricing_try) güncellendi.`);
  } else {
    console.log('Tüm araçlar zaten güncel.');
  }
}

runMigration();
