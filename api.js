// ===============================
// Kaiyu Invest V7.0
// 实时行情层：JSONP 避免 GitHub Pages 跨域和 CSP eval 问题
// ===============================

function jsonp(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const callback = `kaiyu_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    let finished = false;

    const timer = setTimeout(() => finish(new Error("请求超时")), timeout);

    function finish(error, data) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      delete window[callback];
      script.remove();
      error ? reject(error) : resolve(data);
    }

    window[callback] = data => finish(null, data);
    script.onerror = () => finish(new Error("行情接口无法访问"));
    script.src = `${url}${url.includes("?") ? "&" : "?"}cb=${callback}&_=${Date.now()}`;
    document.head.appendChild(script);
  });
}

function readScaled(data, field) {
  const raw = Number(data[field]);
  const decimals = Number(data.f59 || 0);
  if (!Number.isFinite(raw) || raw <= 0) throw new Error("没有有效行情");
  return raw / Math.pow(10, decimals);
}

async function getEastmoneyQuote(secid, fields = []) {
  const wanted = [...new Set(["f43", "f57", "f58", "f59", "f124", ...fields])];
  const url =
    `https://push2.eastmoney.com/api/qt/stock/get?secid=${encodeURIComponent(secid)}` +
    `&fields=${wanted.join(",")}`;
  const response = await jsonp(url);
  if (!response || !response.data) throw new Error("行情为空");
  return response.data;
}

// 国内指数直接读取最新动态 PE。
async function getChinaIndexPE(secid) {
  const data = await getEastmoneyQuote(secid, ["f162"]);
  const raw = Number(data.f162);
  if (!Number.isFinite(raw) || raw <= 0) throw new Error("PE 数据为空");
  return {
    value: Number((raw / 100).toFixed(2)),
    updated: Number(data.f124) ? new Date(data.f124 * 1000).toISOString() : new Date().toISOString()
  };
}

// Siblis 提供最新 PE 基准；价格通过实时行情修正到当前水平。
async function getPEBase(tickers) {
  for (const ticker of tickers) {
    try {
      const url =
        `https://siblisresearch.supabase.co/functions/v1/free-data-api/v1/` +
        `${encodeURIComponent(ticker)}/pe-forward`;
      const response = await fetch(url);
      if (!response.ok) continue;
      const json = await response.json();
      const rows = Array.isArray(json.data) ? json.data : [];
      const latest = rows[rows.length - 1];
      const value = Number(latest && latest.value);
      const date = latest && (latest["trading_day (EOD)"] || latest.date);
      if (Number.isFinite(value) && value > 0 && date) return { value, date };
    } catch (error) {
      console.log(`${ticker} PE 基准获取失败:`, error.message);
    }
  }
  throw new Error("PE 基准不可用");
}

async function getCloseNearDate(secid, date) {
  const end = String(date).slice(0, 10).replaceAll("-", "");
  const url =
    `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${encodeURIComponent(secid)}` +
    `&klt=101&fqt=1&lmt=15&end=${end}&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53`;
  const response = await jsonp(url);
  const rows = response && response.data && response.data.klines;
  if (!Array.isArray(rows) || !rows.length) throw new Error("基准价格不可用");
  const last = rows[rows.length - 1].split(",");
  const close = Number(last[2]);
  if (!Number.isFinite(close) || close <= 0) throw new Error("基准价格无效");
  return close;
}

async function getRealtimeUSPE(secid, tickers) {
  const [quote, base] = await Promise.all([
    getEastmoneyQuote(secid),
    getPEBase(tickers)
  ]);
  const currentPrice = readScaled(quote, "f43");
  const basePrice = await getCloseNearDate(secid, base.date);
  return {
    value: Number((base.value * currentPrice / basePrice).toFixed(2)),
    updated: Number(quote.f124) ? new Date(quote.f124 * 1000).toISOString() : new Date().toISOString()
  };
}

async function getGoldPrice() {
  const data = await getEastmoneyQuote("118.AU9999");
  return {
    priceCNY: Number(readScaled(data, "f43").toFixed(2)),
    updated: Number(data.f124) ? new Date(data.f124 * 1000).toISOString() : new Date().toISOString()
  };
}

async function safeRequest(key, request) {
  try {
    return [key, await request()];
  } catch (error) {
    console.error(`${key} 更新失败:`, error);
    return [key, null];
  }
}

async function getAllMarketData() {
  const entries = await Promise.all([
    safeRequest("gold", getGoldPrice),
    safeRequest("ndx", () => getRealtimeUSPE("100.NDX", ["NDX"])),
    safeRequest("spx", () => getRealtimeUSPE("100.SPX", ["SPX", "USA"])),
    safeRequest("csiDividend", () => getChinaIndexPE("1.000922")),
    safeRequest("dividendLowVol", () => getChinaIndexPE("2.930955"))
  ]);
  return Object.fromEntries(entries);
}
