// =================================
// Kaiyu Invest V5.1 Stable
// =================================



// ================================
// 市场数据
// ================================


let markets =
JSON.parse(
localStorage.getItem("markets")
)
||
[
{
name:"纳斯达克100",
type:"PE",
value:30,
low:25,
high:35
},

{
name:"标普500",
type:"PE",
value:22,
low:18,
high:28
},

{
name:"中证红利",
type:"PE",
value:8,
low:7,
high:12
},

{
name:"红利低波",
type:"PE",
value:7.5,
low:6.5,
high:10
},

{
name:"黄金",
type:"PRICE",
value:780,
low:600,
high:850
}

];

const MARKET_PRESETS = {
  "纳斯达克100": { name:"纳斯达克100", type:"PE", value:31.4, low:25, high:35 },
  "纳指100": { name:"纳斯达克100", type:"PE", value:31.4, low:25, high:35 },
  "NASDAQ100": { name:"纳斯达克100", type:"PE", value:31.4, low:25, high:35 },
  "标普500": { name:"标普500", type:"PE", value:26.74, low:18, high:28 },
  "S&P500": { name:"标普500", type:"PE", value:26.74, low:18, high:28 },
  "中证红利": { name:"中证红利", type:"PE", value:12.55, low:7, high:12 },
  "红利低波": { name:"红利低波", type:"PE", value:11.25, low:6.5, high:10 },
  "红利低波100": { name:"红利低波", type:"PE", value:11.25, low:6.5, high:10 },
  "黄金": { name:"黄金", type:"PRICE", value:887.67, low:600, high:850 }
};

function normalizeMarketName(name){
  return name.trim().replace(/\s+/g,"").toUpperCase();
}

let marketCatalog=[];





let accounts =
JSON.parse(
localStorage.getItem("accounts")
)
||
[
{
name:"生活账户",
money:0
},

{
name:"投资账户",
money:0
},

{
name:"机会账户",
money:0
}

];







function saveData(){


localStorage.setItem(
"markets",
JSON.stringify(markets)
);



localStorage.setItem(
"accounts",
JSON.stringify(accounts)
);


}







// ================================
// 页面切换
// ================================


function showPage(id){


document
.querySelectorAll(".page")
.forEach(
p=>{

p.classList.add("hidden");

}

);



document
.getElementById(id)
.classList.remove("hidden");


}








// ================================
// 判断估值
// ================================


function judge(item){

if(item.autoJudge==="low"){
return `<span class="low">🟢低估</span>`;
}

if(item.autoJudge==="high"){
return `<span class="high">🔴高估</span>`;
}

if(item.autoJudge==="normal"){
return `<span class="normal">🟡正常</span>`;
}

if(item.value <= item.low){


return `<span class="low">🟢低估</span>`;


}



if(item.value >= item.high){


return `<span class="high">🔴高估</span>`;


}



return `<span class="normal">🟡正常</span>`;


}







// ================================
// 市场显示
// ================================


function renderMarkets(){


let box =
document.getElementById("markets");


if(!box)return;


box.innerHTML="";



markets.forEach(
(item,index)=>{


box.innerHTML+=`

<div class="card market-card">


<div class="market-name">

${item.name}

</div>


<div class="market-info">


<span>

${item.value}

</span>


${judge(item)}



<button
class="edit"
onclick="editMarket(${index})">

修改

</button>


<button
class="delete"
onclick="deleteMarket(${index})">

删除

</button>


</div>


</div>


`;


});


}









// ================================
// 添加估值
// ================================


function openAdd(){


document
.getElementById("addBox")
.classList
.remove("hidden");

document.getElementById("nameInput").value="";
document.getElementById("nameInput").focus();

}



function closeAdd(){


document
.getElementById("addBox")
.classList
.add("hidden");


}




function addMarket(){
  const inputName = document.getElementById("nameInput").value;
  const key = normalizeMarketName(inputName);

  if(!key){
    alert("请输入名称");
    return;
  }

  const preset = MARKET_PRESETS[key];
  const exactCatalogItem = marketCatalog.find(item =>
    normalizeMarketName(item.name) === key ||
    normalizeMarketName(item.code) === key
  );
  const fuzzyMatches = exactCatalogItem ? [] : marketCatalog.filter(item =>
    normalizeMarketName(item.name).includes(key)
  );
  const catalogItem = exactCatalogItem ||
    (fuzzyMatches.length === 1 ? fuzzyMatches[0] : null);

  if(!preset && !catalogItem){
    if(fuzzyMatches.length > 1){
      alert("找到多个相似指数，请输入更完整的名称或指数代码");
    }else{
      alert("没有找到这个指数，请检查名称或改用指数代码");
    }
    return;
  }

  const newItem = preset ? {...preset} : {
    name:catalogItem.name,
    type:"PE",
    value:catalogItem.value,
    low:0,
    high:Number.MAX_SAFE_INTEGER,
    autoJudge:catalogItem.judge || "normal",
    sourceCode:catalogItem.code
  };

  if(markets.some(item =>
    item.name === newItem.name ||
    (newItem.sourceCode && item.sourceCode === newItem.sourceCode)
  )){
    alert("该估值已经存在");
    return;
  }

  markets.push(newItem);
  saveData();
  renderMarkets();
  closeAdd();
  refreshData().catch(error => console.log("新增估值刷新失败:", error));
}







// ================================
// 修改 删除
// ================================


function deleteMarket(index){


if(confirm("确定删除？")){


markets.splice(index,1);


saveData();

renderMarkets();


}


}




function editMarket(index){


let item =
markets[index];



let value =
prompt(
"请输入新的估值",
item.value
);



if(value!==null){


item.value =
Number(value);


saveData();

renderMarkets();


}


}








// ================================
// 账户
// ================================


function renderAccounts(){


let box =
document.getElementById("accounts");


if(!box)return;


box.innerHTML="";



accounts.forEach(
(item,index)=>{


box.innerHTML+=`

<div class="card market-card">


<div class="market-name">

${item.name}

</div>


<div>


${item.money} 元


${index>0 ? `
<button
class="move"
onclick="moveAccountUp(${index})">

上移

</button>
` : ""}


<button
class="edit"
onclick="editAccount(${index})">

修改

</button>



<button
class="delete"
onclick="deleteAccount(${index})">

删除

</button>


</div>


</div>


`;

});


}






function moveAccountUp(index){
  if(index<=0 || index>=accounts.length)return;
  [accounts[index-1],accounts[index]]=
    [accounts[index],accounts[index-1]];
  saveData();
  renderAccounts();
}


function addAccount(){


let name =
prompt("账户名称");


if(!name)return;



accounts.push({

name:name,

money:0

});


saveData();

renderAccounts();


}




function editAccount(index){


let money =
prompt(
"修改金额",
accounts[index].money
);



if(money!==null){


accounts[index].money =
Number(money);


saveData();

renderAccounts();


}


}





function deleteAccount(index){


accounts.splice(index,1);


saveData();

renderAccounts();


}







// ================================
// 备用金
// ================================


function saveReserve(){


localStorage.setItem(
"reserveTarget",
document.getElementById("reserveTarget").value
);


localStorage.setItem(
"reserveNow",
document.getElementById("reserveNow").value
);



alert("保存成功");


}







// ================================
// 初始化
// ================================


renderMarkets();

renderAccounts();



let oldTime =
localStorage.getItem("updateTime");


if(oldTime){


document
.getElementById("updateTime")
.innerText=oldTime;


}

// ================================
// Kaiyu Invest V7.0 - 真实数据刷新
// ================================

async function updateRealData(){
  const data = await getAllMarketData();
  marketCatalog = Array.isArray(data.catalog) ? data.catalog : [];
  const mappings = [
    { names:["黄金"], result:data.gold, field:"priceCNY" },
    { names:["纳斯达克100","纳指100"], result:data.ndx, field:"value" },
    { names:["标普500"], result:data.spx, field:"value" },
    { names:["中证红利"], result:data.csiDividend, field:"value" },
    { names:["红利低波","红利低波100"], result:data.dividendLowVol, field:"value" }
  ];
  let updatedCount = 0;
  let newestTime = null;

  mappings.forEach(mapping => {
    if(!mapping.result) return;
    const item = markets.find(market => mapping.names.includes(market.name));
    const value = Number(mapping.result[mapping.field]);
    if(!item || !Number.isFinite(value)) return;
    item.value = value;
    updatedCount++;
    const time = new Date(mapping.result.updated || Date.now());
    if(!newestTime || time > newestTime) newestTime = time;
  });

  markets.forEach(item => {
    if(!item.sourceCode)return;
    const latest = marketCatalog.find(entry => entry.code === item.sourceCode);
    if(!latest || !Number.isFinite(Number(latest.value)))return;
    item.value = Number(latest.value);
    item.autoJudge = latest.judge || "normal";
    updatedCount++;
    const time = new Date(data.generatedAt || Date.now());
    if(!newestTime || time > newestTime)newestTime = time;
  });

  if(updatedCount > 0){
    saveData();
    renderMarkets();
  }
  return { updatedCount, newestTime };
}

let refreshing = false;

async function refreshData(){
  if(refreshing) return;
  refreshing = true;
  const btn = document.querySelector('button[onclick="refreshData()"]');
  if(btn) btn.innerText = "刷新中...";
  try{
    const result = await updateRealData();
    if(result.updatedCount > 0){
      const date = result.newestTime || new Date();
      const time = date.getFullYear() + "-" +
        String(date.getMonth()+1).padStart(2,"0") + "-" +
        String(date.getDate()).padStart(2,"0") + " " +
        String(date.getHours()).padStart(2,"0") + ":" +
        String(date.getMinutes()).padStart(2,"0");
      document.getElementById("updateTime").innerText = time;
      localStorage.setItem("updateTime", time);
      if(btn) btn.innerText = `✓ 已刷新 ${result.updatedCount}项`;
    }else{
      if(btn) btn.innerText = "刷新失败";
    }
  }catch(error){
    console.error("刷新失败:", error);
    if(btn) btn.innerText = "刷新失败";
  }finally{
    refreshing = false;
  }
}

// 页面加载初始化
(function(){
  // 恢复更新时间
  const t = localStorage.getItem("updateTime");
  if(t) document.getElementById("updateTime").innerText = t;

  // 延迟自动刷新
  setTimeout(() => {
    refreshData().catch(e => console.log("自动刷新失败:", e));
  }, 800);
})();
