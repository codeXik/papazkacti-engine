# papazkacti-engine

Papaz Kaçtı (Old Maid) kart oyunu için kural motoru ve bilgisayar oyuncusu. Ücretsizdir ve MIT lisansıyla dağıtılır. Başka hiçbir pakete ihtiyaç duymaz; düz JavaScript olduğu için tarayıcıda da Node.js'te de derlemeden çalışır.

- 52 kartlık desteden 3 papaz çıkarır (maça papazı kalır), 49 kartı 2, 3 ya da 4 oyuncuya dağıtır.
- Aynı sayılı çiftleri kendiliğinden atar; sırası gelen oyuncu bir sonraki oyuncunun kapalı elinden kart çeker.
- Eli biten kurtulur; sonda papaz elinde kalan eli kaybeder. Maç, kaybetme sayacını tutar.
- Her oyuncuya yalnız görebileceğini verir (`view(seat)`); kaydedilip kaldığı yerden sürdürülebilir.
- Bilgisayar oyuncusu içerir.

Kurallar: [docs/KURALLAR.md](docs/KURALLAR.md). Eklenti: [papazkacti98](https://skynonlabs.com/browser-extensions/papazkacti98/) (Skynon Labs).

```js
import { PapazKactiHand, botAction } from './src/index.js';
const el = new PapazKactiHand({ players: 3 });
while (el.phase === 'play') {
  const a = botAction(el.view(el.turn));
  el.draw(el.turn, a.index);
}
console.log(el.loser, el.places); // papaz kalan ve bitiş sırası
```

## Test

```
npm test
```

Testler taşları ve dağıtımı, per/seri/çift çözücüyü (rastgele kurulmuş yüzlerce eli çözdürerek), hamle denetimini, bitirme ve puanlamayı, kaydetme ve yüklemeyi, rastgele oynanan yüzlerce tam turu, üç seviyedeki bilgisayarı ve bütün maçları sınar.

## Lisans

MIT lisansı, © 2026 Skynon Labs Ltd. Motoru kullanan uygulamaların motorun adını (örneğin "Hakkında" ekranında) anması rica edilir; zorunlu değildir.

Bu motor [okey98](https://skynonlabs.com/browser-extensions/papazkacti98/) eklentisinde kullanılır.

---

*English:* A dependency-free rules engine and computer player for Turkish Okey (a 4-player tile game with an indicator tile, a wild okey and false jokers). Written in plain JavaScript modules, it runs in browsers and in Node.js. MIT licensed. See the code examples above. It powers the [okey98](https://skynonlabs.com/browser-extensions/papazkacti98/) browser extension.
