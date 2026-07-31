// ===============================
// Kaiyu Invest V7.2
// 读取由 GitHub Actions 自动更新的同源行情文件
// ===============================

async function getAllMarketData() {
  const response = await fetch(`market-data.json?v=${Date.now()}`, {
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error(`行情文件读取失败：HTTP ${response.status}`);
  }
  const data = await response.json();
  if (!data || typeof data !== "object") {
    throw new Error("行情文件格式错误");
  }
  return data;
}
