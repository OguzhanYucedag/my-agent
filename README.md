# İngilizce Öğretmeni Agent

Resmi Türkçe konuşan bir AI İngilizce öğretmeni. Yazını düzeltir, İngilizce çevirisini verir ve kullandığın kelimelerden anlık ders çıkarır.

Proje, Rise In **agentmaxxin** şablonundan türetilmiştir; crypto/wallet demosu yerine dil öğrenme agent’ına dönüştürülmüştür.

## Ne yapar?

Her kullanıcı mesajında agent şu sırayı izler:

1. **Düzeltme** — Dilbilgisi, yazım ve anlatım hatalarını nazikçe düzeltir.
2. **İngilizce çeviri** — Düzeltilmiş metnin doğal İngilizce karşılığını verir.
3. **Anlık ders** — 1–3 kelime/ifade üzerinden anlam, kullanım ve örnek cümle öğretir.

Gerekirse sözlük veya alıştırma araçlarını kendi çağırır.

## Kullanılan teknolojiler

| Teknoloji | Ne için |
| :--- | :--- |
| [Next.js](https://nextjs.org) 16 | Uygulama ve API route’ları |
| [React](https://react.dev) 19 | Arayüz |
| [TypeScript](https://www.typescriptlang.org) | Tip güvenli kod |
| [Google Gemini](https://aistudio.google.com) (`@google/genai`) | Agent modeli ve tool calling |
| [Tailwind CSS](https://tailwindcss.com) 4 | Stil |
| [shadcn/ui](https://ui.shadcn.com) | Buton, kart, input vb. UI bileşenleri |
| [lucide-react](https://lucide.dev) | İkonlar |
| [Free Dictionary API](https://dictionaryapi.dev) | `lookup_english` tool’u için kelime bakma |
| [viem](https://viem.sh) | Şablondan kalan cüzdan altyapısı (şu an aktif kullanılmıyor) |

## Gereksinimler

1. **Node.js 20+** — `node -v` ile kontrol et.
2. **Gemini API anahtarı** — [Google AI Studio](https://aistudio.google.com/apikey) üzerinden ücretsiz alınır.

## Kurulum

### 1. Bağımlılıkları yükle

```bash
cd my-agent
npm install
```

### 2. Ortam değişkenlerini ayarla

Proje kökünde `.env` dosyasını oluştur (veya `.env.example` dosyasını kopyala):

```bash
cp .env.example .env
```

`.env` içine anahtarını yaz:

```bash
GEMINI_API_KEY=your_key_here

# İsteğe bağlı — varsayılan: gemini-flash-latest
GEMINI_MODEL=gemini-flash-latest
```

Anahtar makinede kalır; git’e commit edilmez.

### 3. Uygulamayı başlat

```bash
npm run dev
```

Tarayıcıda aç: [http://localhost:3000](http://localhost:3000)

Port 3000 doluysa Next.js otomatik olarak 3001’e geçebilir; terminaldeki `Local:` adresini kullan.

### 4. Agent ile konuş

Örnek prompt’lar:

1. `Bugün toplantıya geç kaldım çünkü trafik çoktu.`
2. `I need improve my english for work.`
3. `Bu kelimelerle alıştırma ver: deadline, improve, feedback`

Cevabın üstündeki tool satırlarına tıklayarak agent’ın ne çağırdığını görebilirsin. **Temizle** ile sohbeti sıfırlarsın.

## Proje içeriği

### Agent araçları (`agent/tools.ts`)

| Tool | Açıklama |
| :--- | :--- |
| `lookup_english` | İngilizce kelimeyi sözlükten bakar: anlam, telaffuz, örnek, eş anlamlılar |
| `practice_prompt` | Verilen kelimelerle kısa alıştırma (boşluk doldurma, yeniden yazma, konuşma) üretir |

Yeni tool eklemek için bu dosyaya bir obje eklemen yeterlidir:

```ts
{
  name: "get_joke",
  description: "Get a random joke.",
  parameters: { type: "object", properties: {} },
  run: async () => {
    const res = await fetch("https://official-joke-api.appspot.com/random_joke");
    return res.json();
  },
},
```

### Agent döngüsü (`agent/agent.ts`)

1. Mesaj + tool listesi Gemini’ye gider.
2. Gemini tool isterse ilgili `run` çalışır, sonuç geri gönderilir.
3. Metin cevabı gelene kadar tekrarlanır (en fazla 5 adım).
4. System prompt: resmi Türkçe konuşan İngilizce öğretmeni.

### Arayüz (`app/page.tsx`)

Tek sayfa:

- **Kurulum** — Gemini API anahtarı durumu
- **Araçlar** — Aktif tool listesi
- **Sohbet** — Mesajlaşma, tool adımları, örnek prompt’lar

## Proje yapısı

| Yol | Açıklama |
| :--- | :--- |
| `agent/agent.ts` | Gemini agent döngüsü ve system prompt |
| `agent/tools.ts` | Agent’ın çağırdığı tool’lar (asıl düzenleme yeri) |
| `agent/wallet.ts` | Şablondan kalan x402 cüzdan mantığı (şu an kullanılmıyor) |
| `app/page.tsx` | Ana arayüz: kurulum, tool listesi, sohbet |
| `app/layout.tsx` | Fontlar, tema, sayfa iskeleti |
| `app/globals.css` | Global stiller |
| `app/api/agent/route.ts` | Agent’ı çalıştıran API (`GET` durum, `POST` sohbet) |
| `app/api/wallet/route.ts` | Eski cüzdan API’si (pasif) |
| `app/api/weather/route.ts` | Eski sahte ücretli hava API’si / x402 demosu (pasif) |
| `components/ui/` | shadcn/ui bileşenleri |
| `lib/utils.ts` | `cn()` yardımcı fonksiyonu |
| `.env` | API anahtarı ve isteğe bağlı ayarlar |

## Yapılandırma

| Değişken | Zorunlu | Açıklama |
| :--- | :---: | :--- |
| `GEMINI_API_KEY` | Evet | Google Gemini API anahtarı |
| `GEMINI_MODEL` | Hayır | Model adı; varsayılan `gemini-flash-latest` |
| `WALLET_PRIVATE_KEY` | Hayır | Eski wallet demosu için; dil öğretmeni bunu kullanmaz |

`.env` değişince `npm run dev`’i yeniden başlat.

## Nasıl çalışır?

```
Sen yazıyorsun (app/page.tsx)
    → POST /api/agent
        → runAgent (agent/agent.ts)
            → Gemini (+ system prompt + tools)
            → gerekirse lookup_english / practice_prompt
        ← cevap + tool adımları
    ← sohbette görünür
```

## Sorun giderme

| Sorun | Çözüm |
| :--- | :--- |
| Sayfa API anahtarı istiyor | `.env` içine `GEMINI_API_KEY` ekle, `npm run dev`’i yeniden başlat |
| Yeni tool hiç kullanılmıyor | `description` alanını daha net yaz, sunucuyu yeniden başlat |
| Port 3000 dolu | Terminaldeki alternatif portu aç veya `npm run dev -- -p 3001` |
| Model hatası | Anahtarın geçerli olduğundan emin ol veya `GEMINI_MODEL` değiştir |

## Lisans

MIT
