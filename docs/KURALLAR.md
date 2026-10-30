# Papaz Kaçtı kuralları

Bu belge, motorun (`src/engine/papazkacti.js`) uyguladığı kuralları anlatır. Kaynak: Türkiye'de oynanan Papaz Kaçtı (Papaz Kimde) ve İngilizce "Old Maid" oyunu; [Vikipedi, Old maid](https://en.wikipedia.org/wiki/Old_maid_(card_game)) Türkçe adını "Papaz kaçtı" diye verir. Masadan masaya değişen yerler için motor aşağıdaki seçimleri yapar. Değişiklik yapılacaksa önce proje sahibine sorulur.

## Deste ve dağıtım

- 52 kartlık deste, jokersiz. Üç papaz çıkarılır, **maça papazı kalır**: 49 kart, bir papaz çiftsiz.
- 2, 3 ya da 4 oyuncu. Bütün kartlar sırayla, eşit dağıtılır (49 kart eşit bölünmezse ilk oyunculara bir fazla gelir).
- Dağıtıcıdan sonraki oyuncu ilk çeken oyuncudur.

## Çiftler

- **Aynı sayılı** iki kart (renk önemsiz; iki 7, iki Vale gibi) çifttir. Çift açık atılır, herkes görür.
- Dağıtımdan sonra herkes elindeki çiftleri kendiliğinden atar. Aynı sayıdan üç kart varsa bir çift atılır, biri kalır; dört kart iki çift olur.
- Papaz tek olduğu için hiçbir zaman çift olmaz.

## Oynama

- Sırası gelen oyuncu, **elinde kart bulunan bir sonraki oyuncunun** (saat yönünde) kapalı elinden **bir kart çeker**. Kart seçimi, elin sırasından bağımsızdır: kartlar her değişiklikten sonra karıştırılır.
- Çekilen kart elindeki bir kartla aynı sayıdaysa çift olarak atılır; değilse ele katılır.
- Çekilen kartı yalnız çeken ve kartı veren oyuncu bilir (çift olursa herkes görür).

## Kurtulmak ve kaybetmek

- Elindeki kartlar biten oyuncu **kurtulur** ve oyundan çıkar; sıra ona uğramaz, ondan kart çekilmez.
- Bir oyuncunun son kartı çekilirse, o oyuncu da kurtulur.
- Elinde son kart olarak papaz kalan oyuncu **eli kaybeder**. Her el ayrı bir oyundur; maç bir kaybeden sayacı tutar ("papaz kalma").

## Bilgisayar oyuncusu

Kapalı kartlar karıştırılmış olduğu için her kartın papaz olma ihtimali eşittir; bilgisayar rastgele kart çeker. Tek seviye vardır.
