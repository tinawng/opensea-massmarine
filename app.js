import fs from 'fs';
import clone from 'just-clone';
import got from 'got';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());

const os_api = "https://api.opensea.io/api/v1/asset/0xc3f8a0f5841abff777d3eefa5047e8d413a1c9ab/"
const fetch = got.extend({ prefixUrl: os_api, responseType: 'json', resolveBodyOnly: true });

const alpha_url = "https://opensea.io/collection/m?search[numericTraits][0][name]=Alpha&search[numericTraits][0][ranges][0][max]=1&search[numericTraits][0][ranges][0][min]=1";
const yellows_url = "https://opensea.io/collection/m?search[numericTraits][0][name]=Tier&search[numericTraits][0][ranges][0][max]=2&search[numericTraits][0][ranges][0][min]=2";
const blues_url = "https://opensea.io/collection/m?search[numericTraits][0][name]=Tier&search[numericTraits][0][ranges][0][max]=3&search[numericTraits][0][ranges][0][min]=3";
const reds_url = "https://opensea.io/collection/m?search[numericTraits][0][name]=Tier&search[numericTraits][0][ranges][0][max]=4&search[numericTraits][0][ranges][0][min]=4&search[numericTraits][1][name]=Alpha&search[numericTraits][1][ranges][0][min]=0&search[numericTraits][1][ranges][0][max]=0";
const top10_url = "https://opensea.io/collection/m?search[numericTraits][0][name]=Mass&search[numericTraits][0][ranges][0][max]=999999&search[numericTraits][0][ranges][0][min]=1800";
const merged_url = "https://opensea.io/collection/m?search[numericTraits][0][name]=Merges&search[numericTraits][0][ranges][0][max]=27&search[numericTraits][0][ranges][0][min]=1";

const token_obj = { id: 0, traits: { tier: 0, alpha: 0, class: 0, mass: 0, merges: 0 }, image_url: "" };

// should have 45 blue & 93 yellow & 70 merged ones => use scroll
// optimise scraping for alpha, yellows, reds, blues, top10, merged, on only one page ?
//    - alpha & reds & yellows & blues & merged
//    - top10

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setViewport({
  width: 21892,
  height: 2164
});
await page.goto(yellows_url);
await page.waitForSelector('.cf-browser-verification', { hidden: true });
await page.waitForNetworkIdle();
page.waitForTimeout(5000);
// await autoScroll(page);
// await page.waitForFunction(() => document.querySelectorAll('.AssetCardFooter--name') > 40);

await page.waitForFunction(() => !(document.querySelector('.Image--loader') || document.querySelector('.Skeletonreact__SkeletonBlock-sc-9nopaf-0')));
// await page.waitForFunction(() => !document.querySelector('.Skeletonreact__SkeletonBlock-sc-9nopaf-0'));
// await page.waitForFunction(() => !document.querySelector('.Image--loader'));

await page.screenshot({
  path: 'sc.png',
  fullPage: true
});

const content = await page.content();
// const __wired__ = _parseWiredVariable(content);
// let assets = _extractAssets(__wired__);

fs.writeFile('content.html', JSON.stringify(content), () => {});
// fs.writeFile('wired.json', JSON.stringify(__wired__), () => {});

// assets.forEach(async (asset) => {
//   console.log(await getTokenInfos(asset.tokenId));
// })

// console.log(content.split('AssetCardFooter--name').length);



let a = content.split('AssetCardFooter--name\">').map(s => {
  if (s.startsWith('m(')) {
    return s.split('</div>')[0]
  }
  else
    return null;
}).filter(s => s)
console.log(a);
console.log(a.length);



await browser.close();



function _parseWiredVariable(html) {
  const str = html.split("window.__wired__=")[1].split("</script>")[0];
  return JSON.parse(str);
}

function _extractAssets(__wired__) {
  let assets = [];
  Object.values(__wired__.records)
    .filter(o => o.__typename === "AssetType" && o.name).forEach(o => { assets.push(o) });

  return assets;
}

async function getTokenInfos(token_id) {
  let { traits, image_url } = await fetch.get(token_id).json();
  let token = deepSeal(clone(token_obj));

  token.id = token_id;
  token.image_url = image_url;
  token.traits = Object.fromEntries(traits.map(t => [t.trait_type.toLowerCase(), t.value]));

  return token;
}

function deepSeal(object) {
  const propNames = Object.getOwnPropertyNames(object);
  for (const name of propNames) {
    const value = object[name];
    if (value && typeof value === "object") deepSeal(value);
  }
  return Object.seal(object);
}


async function autoScroll(page){
  await page.evaluate(async () => {
      await new Promise((resolve, reject) => {
          var totalHeight = 0;
          var distance = 100;
          var timer = setInterval(() => {
              var scrollHeight = document.body.scrollHeight;
              window.scrollBy(0, distance);
              totalHeight += distance;

              if(totalHeight >= scrollHeight){
                  clearInterval(timer);
                  resolve();
              }
          }, 100);
      });
  });
}