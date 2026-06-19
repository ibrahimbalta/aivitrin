// Yapay Zeka Vitrini — Araç Verileri
'use strict';

/**
 * Yapay Zeka Vitrini — Kategori ve Araç Veritabanı
 * Tüm veriler window nesnesine atanarak global erişim sağlanır.
 */

// ─────────────────────────────────────────────
// KATEGORİLER
// ─────────────────────────────────────────────
window.AI_CATEGORIES = [
  { id: 'yazma-icerik',       name: 'Yazma & İçerik',              icon: '✍️',  count: 7 },
  { id: 'kodlama-gelistirme', name: 'Kodlama & Geliştirme',        icon: '💻',  count: 7 },
  { id: 'gorsel-tasarim',     name: 'Görsel & Tasarım',            icon: '🎨',  count: 7 },
  { id: 'video-ses',          name: 'Video & Ses',                 icon: '🎬',  count: 7 },
  { id: 'pazarlama',          name: 'Pazarlama',                   icon: '📈',  count: 5 },
  { id: 'otomasyon',          name: 'Otomasyon & Entegrasyon',     icon: '⚙️',  count: 5 },
  { id: 'egitim',             name: 'Eğitim',                      icon: '📚',  count: 4 },
  { id: 'sohbet-asistan',     name: 'Sohbet & Asistan',            icon: '💬',  count: 6 },
  { id: 'veri-analiz',        name: 'Veri & Analiz',               icon: '📊',  count: 4 },
  { id: 'is-uretkenlik',      name: 'İş & Üretkenlik',            icon: '🚀',  count: 7 }
];

// ─────────────────────────────────────────────
// ARAÇLAR (50+ gerçek yapay zekâ aracı)
// ─────────────────────────────────────────────
window.AI_TOOLS = [

  // ═══════════════════════════════════════════
  // 💬 Sohbet & Asistan (6)
  // ═══════════════════════════════════════════
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    description: 'OpenAI tarafından geliştirilen, doğal dilde sohbet edebilen ve metin üretebilen güçlü yapay zekâ asistanı.',
    category: 'sohbet-asistan',
    tags: ['sohbet', 'metin üretimi', 'yapay zekâ', 'GPT'],
    pricing: 'freemium',
    rating: 4.8,
    url: 'https://chat.openai.com',
    featured: true,
    isNew: false
  },
  {
    id: 'claude',
    name: 'Claude',
    description: 'Anthropic tarafından oluşturulan, uzun bağlam penceresiyle öne çıkan güvenli ve yardımsever yapay zekâ asistanı.',
    category: 'sohbet-asistan',
    tags: ['sohbet', 'analiz', 'yazma', 'güvenlik'],
    pricing: 'freemium',
    rating: 4.7,
    url: 'https://claude.ai',
    featured: true,
    isNew: false
  },
  {
    id: 'gemini',
    name: 'Gemini',
    description: 'Google\'ın çok modlu yapay zekâ modeli; metin, görsel ve kod anlama yetenekleriyle donatılmıştır.',
    category: 'sohbet-asistan',
    tags: ['sohbet', 'çok modlu', 'Google', 'arama'],
    pricing: 'freemium',
    rating: 4.6,
    url: 'https://gemini.google.com',
    featured: true,
    isNew: false
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    description: 'Yapay zekâ destekli arama motoru; kaynaklı ve güncel yanıtlar sunarak araştırma sürecinizi hızlandırır.',
    category: 'sohbet-asistan',
    tags: ['arama', 'araştırma', 'kaynak', 'bilgi'],
    pricing: 'freemium',
    rating: 4.6,
    url: 'https://www.perplexity.ai',
    featured: false,
    isNew: true
  },
  {
    id: 'microsoft-copilot',
    name: 'Microsoft Copilot',
    description: 'Microsoft ekosistemiyle entegre çalışan yapay zekâ asistanı; web araması, metin ve görsel üretimi sunar.',
    category: 'sohbet-asistan',
    tags: ['Microsoft', 'asistan', 'arama', 'üretkenlik'],
    pricing: 'freemium',
    rating: 4.4,
    url: 'https://copilot.microsoft.com',
    featured: false,
    isNew: false
  },
  {
    id: 'poe',
    name: 'Poe',
    description: 'Quora tarafından geliştirilen, birden fazla yapay zekâ modeline tek platformdan erişim sağlayan sohbet uygulaması.',
    category: 'sohbet-asistan',
    tags: ['sohbet', 'çoklu model', 'platform', 'Quora'],
    pricing: 'freemium',
    rating: 4.3,
    url: 'https://poe.com',
    featured: false,
    isNew: false
  },

  // ═══════════════════════════════════════════
  // 🎨 Görsel & Tasarım (7)
  // ═══════════════════════════════════════════
  {
    id: 'midjourney',
    name: 'Midjourney',
    description: 'Metin açıklamalarından yüksek kaliteli, sanatsal görseller üreten popüler yapay zekâ görsel oluşturucu.',
    category: 'gorsel-tasarim',
    tags: ['görsel üretimi', 'sanat', 'tasarım', 'AI art'],
    pricing: 'ucretli',
    rating: 4.8,
    url: 'https://www.midjourney.com',
    featured: true,
    isNew: false
  },
  {
    id: 'dall-e',
    name: 'DALL-E',
    description: 'OpenAI\'ın metin-görsel dönüşüm modeli; yaratıcı ve gerçekçi görseller üretir, düzenleme özellikleri sunar.',
    category: 'gorsel-tasarim',
    tags: ['görsel üretimi', 'OpenAI', 'yaratıcı', 'düzenleme'],
    pricing: 'freemium',
    rating: 4.5,
    url: 'https://openai.com/dall-e-3',
    featured: false,
    isNew: false
  },
  {
    id: 'stable-diffusion',
    name: 'Stable Diffusion',
    description: 'Açık kaynaklı görsel üretim modeli; yerel bilgisayarda çalıştırılabilir ve sınırsız özelleştirme imkânı sunar.',
    category: 'gorsel-tasarim',
    tags: ['açık kaynak', 'görsel üretimi', 'yerel', 'özelleştirme'],
    pricing: 'ucretsiz',
    rating: 4.5,
    url: 'https://stability.ai',
    featured: false,
    isNew: false
  },
  {
    id: 'canva-ai',
    name: 'Canva AI',
    description: 'Canva\'nın yapay zekâ özellikleri; otomatik tasarım önerileri, görsel üretimi ve metin düzenleme araçları içerir.',
    category: 'gorsel-tasarim',
    tags: ['tasarım', 'şablon', 'sosyal medya', 'kolay kullanım'],
    pricing: 'freemium',
    rating: 4.6,
    url: 'https://www.canva.com/ai-image-generator/',
    featured: false,
    isNew: false
  },
  {
    id: 'adobe-firefly',
    name: 'Adobe Firefly',
    description: 'Adobe\'un ticari kullanıma uygun yapay zekâ görsel üretici ve düzenleyicisi; Creative Cloud ile entegre çalışır.',
    category: 'gorsel-tasarim',
    tags: ['Adobe', 'ticari', 'görsel üretimi', 'düzenleme'],
    pricing: 'freemium',
    rating: 4.5,
    url: 'https://firefly.adobe.com',
    featured: false,
    isNew: false
  },
  {
    id: 'leonardo-ai',
    name: 'Leonardo AI',
    description: 'Oyun ve dijital sanat odaklı yapay zekâ görsel üretim platformu; özel modeller eğitme imkânı sunar.',
    category: 'gorsel-tasarim',
    tags: ['oyun', 'dijital sanat', 'model eğitimi', 'görsel'],
    pricing: 'freemium',
    rating: 4.4,
    url: 'https://leonardo.ai',
    featured: false,
    isNew: false
  },
  {
    id: 'ideogram',
    name: 'Ideogram',
    description: 'Metin içeren görseller üretmede başarılı yapay zekâ aracı; tipografi ve logo tasarımı için idealdir.',
    category: 'gorsel-tasarim',
    tags: ['tipografi', 'logo', 'metin', 'görsel üretimi'],
    pricing: 'freemium',
    rating: 4.4,
    url: 'https://ideogram.ai',
    featured: false,
    isNew: true
  },

  // ═══════════════════════════════════════════
  // ✍️ Yazma & İçerik (7)
  // ═══════════════════════════════════════════
  {
    id: 'jasper',
    name: 'Jasper',
    description: 'Pazarlama odaklı yapay zekâ yazma asistanı; blog, reklam ve sosyal medya içerikleri oluşturur.',
    category: 'yazma-icerik',
    tags: ['pazarlama', 'blog', 'reklam', 'içerik'],
    pricing: 'ucretli',
    rating: 4.5,
    url: 'https://www.jasper.ai',
    featured: false,
    isNew: false
  },
  {
    id: 'copy-ai',
    name: 'Copy.ai',
    description: 'Satış ve pazarlama metinleri oluşturmaya yönelik yapay zekâ aracı; onlarca şablon ve dil desteği sunar.',
    category: 'yazma-icerik',
    tags: ['metin yazarlığı', 'satış', 'şablon', 'pazarlama'],
    pricing: 'freemium',
    rating: 4.3,
    url: 'https://www.copy.ai',
    featured: false,
    isNew: false
  },
  {
    id: 'writesonic',
    name: 'Writesonic',
    description: 'SEO uyumlu blog yazıları, reklam metinleri ve ürün açıklamaları oluşturabilen yapay zekâ yazma platformu.',
    category: 'yazma-icerik',
    tags: ['SEO', 'blog', 'reklam', 'e-ticaret'],
    pricing: 'freemium',
    rating: 4.3,
    url: 'https://writesonic.com',
    featured: false,
    isNew: false
  },
  {
    id: 'grammarly-ai',
    name: 'Grammarly AI',
    description: 'Yapay zekâ destekli dilbilgisi ve yazım denetleyicisi; ton ayarlama ve metin yeniden yazma özellikleri sunar.',
    category: 'yazma-icerik',
    tags: ['dilbilgisi', 'yazım', 'düzenleme', 'İngilizce'],
    pricing: 'freemium',
    rating: 4.6,
    url: 'https://www.grammarly.com',
    featured: true,
    isNew: false
  },
  {
    id: 'notion-ai-yazma',
    name: 'Notion AI',
    description: 'Notion çalışma alanınızda yapay zekâ ile metin oluşturma, özetleme ve düzenleme yapmanızı sağlar.',
    category: 'yazma-icerik',
    tags: ['not alma', 'özetleme', 'düzenleme', 'üretkenlik'],
    pricing: 'freemium',
    rating: 4.5,
    url: 'https://www.notion.so/product/ai',
    featured: false,
    isNew: false
  },
  {
    id: 'rytr',
    name: 'Rytr',
    description: 'Uygun fiyatlı yapay zekâ yazma asistanı; 30\'dan fazla dilde ve çeşitli tonda içerik üretir.',
    category: 'yazma-icerik',
    tags: ['çok dilli', 'uygun fiyat', 'içerik', 'yazma'],
    pricing: 'freemium',
    rating: 4.2,
    url: 'https://rytr.me',
    featured: false,
    isNew: false
  },
  {
    id: 'quillbot',
    name: 'QuillBot',
    description: 'Yapay zekâ ile metin yeniden yazma, özetleme ve çeviri yapabilen kapsamlı yazım destek aracı.',
    category: 'yazma-icerik',
    tags: ['yeniden yazma', 'özetleme', 'çeviri', 'akademik'],
    pricing: 'freemium',
    rating: 4.3,
    url: 'https://quillbot.com',
    featured: false,
    isNew: false
  },

  // ═══════════════════════════════════════════
  // 💻 Kodlama & Geliştirme (7)
  // ═══════════════════════════════════════════
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    description: 'GitHub ve OpenAI ortaklığıyla geliştirilen yapay zekâ kod asistanı; gerçek zamanlı kod önerileri sunar.',
    category: 'kodlama-gelistirme',
    tags: ['kod tamamlama', 'GitHub', 'IDE', 'geliştirici'],
    pricing: 'ucretli',
    rating: 4.7,
    url: 'https://github.com/features/copilot',
    featured: true,
    isNew: false
  },
  {
    id: 'cursor',
    name: 'Cursor',
    description: 'Yapay zekâ odaklı kod editörü; doğal dille kod yazma, düzenleme ve hata ayıklama yapabilirsiniz.',
    category: 'kodlama-gelistirme',
    tags: ['editör', 'kod yazma', 'hata ayıklama', 'AI-first'],
    pricing: 'freemium',
    rating: 4.7,
    url: 'https://cursor.sh',
    featured: true,
    isNew: true
  },
  {
    id: 'replit-ai',
    name: 'Replit AI',
    description: 'Tarayıcı tabanlı geliştirme ortamında yapay zekâ destekli kod yazma ve çalıştırma imkânı sunar.',
    category: 'kodlama-gelistirme',
    tags: ['tarayıcı', 'bulut', 'kod yazma', 'öğrenme'],
    pricing: 'freemium',
    rating: 4.4,
    url: 'https://replit.com',
    featured: false,
    isNew: false
  },
  {
    id: 'tabnine',
    name: 'Tabnine',
    description: 'Gizlilik odaklı yapay zekâ kod tamamlama aracı; yerel modeller ve ekip bazlı özelleştirme destekler.',
    category: 'kodlama-gelistirme',
    tags: ['kod tamamlama', 'gizlilik', 'yerel', 'ekip'],
    pricing: 'freemium',
    rating: 4.3,
    url: 'https://www.tabnine.com',
    featured: false,
    isNew: false
  },
  {
    id: 'codeium',
    name: 'Codeium',
    description: 'Bireysel geliştiriciler için ücretsiz yapay zekâ kod tamamlama aracı; 70\'ten fazla dili destekler.',
    category: 'kodlama-gelistirme',
    tags: ['ücretsiz', 'kod tamamlama', 'çok dilli', 'IDE'],
    pricing: 'ucretsiz',
    rating: 4.4,
    url: 'https://codeium.com',
    featured: false,
    isNew: false
  },
  {
    id: 'v0-dev',
    name: 'V0.dev',
    description: 'Vercel tarafından geliştirilen, doğal dille kullanıcı arayüzü bileşenleri oluşturan yapay zekâ aracı.',
    category: 'kodlama-gelistirme',
    tags: ['UI', 'React', 'frontend', 'Vercel'],
    pricing: 'freemium',
    rating: 4.5,
    url: 'https://v0.dev',
    featured: false,
    isNew: true
  },
  {
    id: 'bolt-new',
    name: 'Bolt.new',
    description: 'Tarayıcıda tam yığın web uygulamaları oluşturmanızı sağlayan yapay zekâ destekli geliştirme platformu.',
    category: 'kodlama-gelistirme',
    tags: ['full-stack', 'web', 'hızlı prototip', 'tarayıcı'],
    pricing: 'freemium',
    rating: 4.5,
    url: 'https://bolt.new',
    featured: false,
    isNew: true
  },

  // ═══════════════════════════════════════════
  // 🎬 Video & Ses (7)
  // ═══════════════════════════════════════════
  {
    id: 'runway-ml',
    name: 'Runway ML',
    description: 'Yapay zekâ ile video oluşturma, düzenleme ve görsel efektler ekleme imkânı sunan yaratıcı platform.',
    category: 'video-ses',
    tags: ['video üretimi', 'düzenleme', 'efekt', 'yaratıcı'],
    pricing: 'freemium',
    rating: 4.6,
    url: 'https://runwayml.com',
    featured: true,
    isNew: false
  },
  {
    id: 'synthesia',
    name: 'Synthesia',
    description: 'Yapay zekâ avatarları ve seslendirme ile profesyonel eğitim ve tanıtım videoları oluşturur.',
    category: 'video-ses',
    tags: ['avatar', 'eğitim videosu', 'seslendirme', 'kurumsal'],
    pricing: 'ucretli',
    rating: 4.5,
    url: 'https://www.synthesia.io',
    featured: false,
    isNew: false
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    description: 'Son derece gerçekçi yapay zekâ seslendirme ve ses klonlama teknolojisi; çok dilli ses üretimi yapar.',
    category: 'video-ses',
    tags: ['seslendirme', 'ses klonlama', 'çok dilli', 'TTS'],
    pricing: 'freemium',
    rating: 4.7,
    url: 'https://elevenlabs.io',
    featured: true,
    isNew: false
  },
  {
    id: 'descript',
    name: 'Descript',
    description: 'Metin tabanlı video ve podcast düzenleme aracı; yapay zekâ ile transkripsiyon ve düzenleme yapar.',
    category: 'video-ses',
    tags: ['podcast', 'düzenleme', 'transkripsiyon', 'metin tabanlı'],
    pricing: 'freemium',
    rating: 4.4,
    url: 'https://www.descript.com',
    featured: false,
    isNew: false
  },
  {
    id: 'heygen',
    name: 'HeyGen',
    description: 'Yapay zekâ avatarlarıyla dakikalar içinde profesyonel videolar oluşturabilen video üretim platformu.',
    category: 'video-ses',
    tags: ['avatar', 'video üretimi', 'pazarlama', 'hızlı'],
    pricing: 'freemium',
    rating: 4.4,
    url: 'https://www.heygen.com',
    featured: false,
    isNew: false
  },
  {
    id: 'suno-ai',
    name: 'Suno AI',
    description: 'Metin açıklamalarından orijinal şarkılar ve müzikler üreten yapay zekâ müzik oluşturucu.',
    category: 'video-ses',
    tags: ['müzik', 'şarkı', 'ses üretimi', 'yaratıcı'],
    pricing: 'freemium',
    rating: 4.5,
    url: 'https://suno.com',
    featured: false,
    isNew: true
  },
  {
    id: 'udio',
    name: 'Udio',
    description: 'Yapay zekâ ile yüksek kaliteli müzik parçaları oluşturabilen yeni nesil müzik üretim platformu.',
    category: 'video-ses',
    tags: ['müzik', 'üretim', 'yaratıcı', 'yeni nesil'],
    pricing: 'freemium',
    rating: 4.4,
    url: 'https://www.udio.com',
    featured: false,
    isNew: true
  },

  // ═══════════════════════════════════════════
  // 📈 Pazarlama (5)
  // ═══════════════════════════════════════════
  {
    id: 'surfer-seo',
    name: 'Surfer SEO',
    description: 'Yapay zekâ destekli SEO optimizasyon aracı; içerik puanlama ve anahtar kelime analizi sunar.',
    category: 'pazarlama',
    tags: ['SEO', 'içerik optimizasyonu', 'anahtar kelime', 'analiz'],
    pricing: 'ucretli',
    rating: 4.5,
    url: 'https://surferseo.com',
    featured: false,
    isNew: false
  },
  {
    id: 'semrush-ai',
    name: 'Semrush AI',
    description: 'Kapsamlı dijital pazarlama platformu; yapay zekâ ile SEO, reklam ve rekabet analizi yapar.',
    category: 'pazarlama',
    tags: ['SEO', 'reklam', 'rekabet analizi', 'dijital pazarlama'],
    pricing: 'ucretli',
    rating: 4.6,
    url: 'https://www.semrush.com',
    featured: false,
    isNew: false
  },
  {
    id: 'hubspot-ai',
    name: 'HubSpot AI',
    description: 'HubSpot CRM platformundaki yapay zekâ araçları; e-posta, içerik ve müşteri yönetimini otomatikleştirir.',
    category: 'pazarlama',
    tags: ['CRM', 'e-posta', 'otomasyon', 'müşteri yönetimi'],
    pricing: 'freemium',
    rating: 4.4,
    url: 'https://www.hubspot.com/artificial-intelligence',
    featured: false,
    isNew: false
  },
  {
    id: 'jasper-marketing',
    name: 'Jasper Marketing',
    description: 'Jasper\'ın pazarlama ekiplerine özel çözümü; marka sesi ile tutarlı kampanya içerikleri üretir.',
    category: 'pazarlama',
    tags: ['marka sesi', 'kampanya', 'içerik', 'ekip'],
    pricing: 'ucretli',
    rating: 4.4,
    url: 'https://www.jasper.ai/marketing',
    featured: false,
    isNew: false
  },
  {
    id: 'adcreative-ai',
    name: 'AdCreative.ai',
    description: 'Yapay zekâ ile dönüşüm odaklı reklam görselleri ve metinleri oluşturan reklam tasarım platformu.',
    category: 'pazarlama',
    tags: ['reklam', 'dönüşüm', 'görsel', 'otomatik tasarım'],
    pricing: 'ucretli',
    rating: 4.3,
    url: 'https://www.adcreative.ai',
    featured: false,
    isNew: false
  },

  // ═══════════════════════════════════════════
  // ⚙️ Otomasyon & Entegrasyon (5)
  // ═══════════════════════════════════════════
  {
    id: 'zapier-ai',
    name: 'Zapier AI',
    description: 'Binlerce uygulama arasında yapay zekâ destekli otomasyon iş akışları oluşturmanızı sağlar.',
    category: 'otomasyon',
    tags: ['otomasyon', 'entegrasyon', 'iş akışı', 'bağlantı'],
    pricing: 'freemium',
    rating: 4.5,
    url: 'https://zapier.com',
    featured: false,
    isNew: false
  },
  {
    id: 'make',
    name: 'Make (Integromat)',
    description: 'Görsel sürükle-bırak arayüzüyle karmaşık otomasyon senaryoları kurmanızı sağlayan güçlü platform.',
    category: 'otomasyon',
    tags: ['otomasyon', 'görsel', 'senaryo', 'entegrasyon'],
    pricing: 'freemium',
    rating: 4.5,
    url: 'https://www.make.com',
    featured: false,
    isNew: false
  },
  {
    id: 'bardeen',
    name: 'Bardeen',
    description: 'Tarayıcı tabanlı yapay zekâ otomasyon aracı; web kazıma ve tekrarlayan görevleri otomatikleştirir.',
    category: 'otomasyon',
    tags: ['tarayıcı', 'web kazıma', 'otomasyon', 'uzantı'],
    pricing: 'freemium',
    rating: 4.3,
    url: 'https://www.bardeen.ai',
    featured: false,
    isNew: false
  },
  {
    id: 'relevance-ai',
    name: 'Relevance AI',
    description: 'Kodsuz yapay zekâ iş akışları ve ajan oluşturma platformu; veri analizi ve otomasyonu kolaylaştırır.',
    category: 'otomasyon',
    tags: ['kodsuz', 'AI ajanları', 'iş akışı', 'veri'],
    pricing: 'freemium',
    rating: 4.2,
    url: 'https://relevanceai.com',
    featured: false,
    isNew: true
  },
  {
    id: 'n8n',
    name: 'n8n',
    description: 'Açık kaynaklı iş akışı otomasyon aracı; kendi sunucunuzda barındırabilir ve yapay zekâ entegrasyonları ekleyebilirsiniz.',
    category: 'otomasyon',
    tags: ['açık kaynak', 'self-hosted', 'otomasyon', 'geliştirici'],
    pricing: 'freemium',
    rating: 4.4,
    url: 'https://n8n.io',
    featured: false,
    isNew: false
  },

  // ═══════════════════════════════════════════
  // 📚 Eğitim (4)
  // ═══════════════════════════════════════════
  {
    id: 'duolingo-max',
    name: 'Duolingo Max',
    description: 'Yapay zekâ ile kişiselleştirilmiş dil öğrenme deneyimi; rol yapma ve açıklama özellikleri sunar.',
    category: 'egitim',
    tags: ['dil öğrenme', 'kişiselleştirme', 'oyunlaştırma', 'GPT-4'],
    pricing: 'ucretli',
    rating: 4.5,
    url: 'https://www.duolingo.com/max',
    featured: false,
    isNew: false
  },
  {
    id: 'khanmigo',
    name: 'Khanmigo',
    description: 'Khan Academy\'nin yapay zekâ öğretmen asistanı; bire bir rehberlik ve kişiselleştirilmiş öğrenme sunar.',
    category: 'egitim',
    tags: ['öğretmen', 'matematik', 'bire bir', 'Khan Academy'],
    pricing: 'freemium',
    rating: 4.4,
    url: 'https://www.khanacademy.org/khan-labs',
    featured: false,
    isNew: false
  },
  {
    id: 'quizlet-ai',
    name: 'Quizlet AI',
    description: 'Yapay zekâ ile otomatik bilgi kartı oluşturma ve kişiselleştirilmiş çalışma planları sunan öğrenme aracı.',
    category: 'egitim',
    tags: ['bilgi kartları', 'çalışma planı', 'sınav hazırlık', 'öğrenme'],
    pricing: 'freemium',
    rating: 4.3,
    url: 'https://quizlet.com',
    featured: false,
    isNew: false
  },
  {
    id: 'socratic',
    name: 'Socratic by Google',
    description: 'Google\'ın öğrencilere yönelik yapay zekâ destekli ödev yardımcısı; görsel soru çözme özelliği sunar.',
    category: 'egitim',
    tags: ['ödev', 'matematik', 'görsel çözüm', 'Google'],
    pricing: 'ucretsiz',
    rating: 4.2,
    url: 'https://socratic.org',
    featured: false,
    isNew: false
  },

  // ═══════════════════════════════════════════
  // 📊 Veri & Analiz (4)
  // ═══════════════════════════════════════════
  {
    id: 'julius-ai',
    name: 'Julius AI',
    description: 'Doğal dille veri analizi ve görselleştirme yapabilen yapay zekâ aracı; Excel ve CSV dosyalarını analiz eder.',
    category: 'veri-analiz',
    tags: ['veri analizi', 'görselleştirme', 'Excel', 'doğal dil'],
    pricing: 'freemium',
    rating: 4.4,
    url: 'https://julius.ai',
    featured: false,
    isNew: true
  },
  {
    id: 'tableau-ai',
    name: 'Tableau AI',
    description: 'Tableau\'nun yapay zekâ özellikleri; otomatik içgörüler, doğal dil sorguları ve akıllı görselleştirmeler sunar.',
    category: 'veri-analiz',
    tags: ['iş zekâsı', 'görselleştirme', 'dashboard', 'analitik'],
    pricing: 'ucretli',
    rating: 4.5,
    url: 'https://www.tableau.com/products/ai-analytics',
    featured: false,
    isNew: false
  },
  {
    id: 'monkeylearn',
    name: 'MonkeyLearn',
    description: 'Kodsuz metin analizi platformu; duygu analizi, sınıflandırma ve anahtar kelime çıkarma işlemleri yapar.',
    category: 'veri-analiz',
    tags: ['metin analizi', 'duygu analizi', 'kodsuz', 'NLP'],
    pricing: 'ucretli',
    rating: 4.2,
    url: 'https://monkeylearn.com',
    featured: false,
    isNew: false
  },
  {
    id: 'obviously-ai',
    name: 'Obviously AI',
    description: 'Kodsuz makine öğrenimi platformu; dakikalar içinde tahmin modelleri oluşturmanızı sağlar.',
    category: 'veri-analiz',
    tags: ['kodsuz ML', 'tahmin', 'model', 'otomasyon'],
    pricing: 'ucretli',
    rating: 4.1,
    url: 'https://www.obviously.ai',
    featured: false,
    isNew: false
  },

  // ═══════════════════════════════════════════
  // 🚀 İş & Üretkenlik (7)
  // ═══════════════════════════════════════════
  {
    id: 'notion-ai-uretkenlik',
    name: 'Notion AI',
    description: 'Proje yönetimi ve bilgi tabanınızda yapay zekâ ile görev otomasyonu, özetleme ve içerik üretimi yapar.',
    category: 'is-uretkenlik',
    tags: ['proje yönetimi', 'wiki', 'özetleme', 'otomasyon'],
    pricing: 'freemium',
    rating: 4.6,
    url: 'https://www.notion.so/product/ai',
    featured: false,
    isNew: false
  },
  {
    id: 'otter-ai',
    name: 'Otter.ai',
    description: 'Yapay zekâ ile toplantı kaydı, canlı transkripsiyon ve otomatik not alma hizmeti sunan üretkenlik aracı.',
    category: 'is-uretkenlik',
    tags: ['toplantı', 'transkripsiyon', 'not alma', 'canlı'],
    pricing: 'freemium',
    rating: 4.4,
    url: 'https://otter.ai',
    featured: false,
    isNew: false
  },
  {
    id: 'fireflies-ai',
    name: 'Fireflies.ai',
    description: 'Toplantıları otomatik olarak kaydedip özetleyen ve aranabilir transkriptler oluşturan yapay zekâ asistanı.',
    category: 'is-uretkenlik',
    tags: ['toplantı', 'özet', 'transkript', 'arama'],
    pricing: 'freemium',
    rating: 4.3,
    url: 'https://fireflies.ai',
    featured: false,
    isNew: false
  },
  {
    id: 'loom-ai',
    name: 'Loom AI',
    description: 'Video mesajlarınızı yapay zekâ ile özetleyen, başlık ve bölüm ekleyen asenkron iletişim aracı.',
    category: 'is-uretkenlik',
    tags: ['video mesaj', 'özet', 'asenkron', 'iletişim'],
    pricing: 'freemium',
    rating: 4.3,
    url: 'https://www.loom.com',
    featured: false,
    isNew: false
  },
  {
    id: 'gamma',
    name: 'Gamma',
    description: 'Yapay zekâ ile saniyeler içinde profesyonel sunumlar, belgeler ve web sayfaları oluşturan platform.',
    category: 'is-uretkenlik',
    tags: ['sunum', 'belge', 'web sayfası', 'otomatik tasarım'],
    pricing: 'freemium',
    rating: 4.5,
    url: 'https://gamma.app',
    featured: true,
    isNew: false
  },
  {
    id: 'beautiful-ai',
    name: 'Beautiful.ai',
    description: 'Yapay zekâ destekli sunum tasarım aracı; otomatik düzenleme ve profesyonel şablonlar sunar.',
    category: 'is-uretkenlik',
    tags: ['sunum', 'tasarım', 'şablon', 'otomatik düzenleme'],
    pricing: 'ucretli',
    rating: 4.3,
    url: 'https://www.beautiful.ai',
    featured: false,
    isNew: false
  },
  {
    id: 'tome',
    name: 'Tome',
    description: 'Yapay zekâ ile hikâye anlatımı formatında sunumlar ve içerikler oluşturan yeni nesil sunum aracı.',
    category: 'is-uretkenlik',
    tags: ['sunum', 'hikâye', 'içerik', 'yaratıcı'],
    pricing: 'freemium',
    rating: 4.2,
    url: 'https://tome.app',
    featured: false,
    isNew: false
  }
];
