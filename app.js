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


}



function closeAdd(){


document
.getElementById("addBox")
.classList
.add("hidden");


}




function addMarket(){


let name=
document.getElementById("nameInput").value;


let type=
document.getElementById("typeInput").value;


let value=
Number(
document.getElementById("valueInput").value
);


let low=
Number(
document.getElementById("lowInput").value
);


let high=
Number(
document.getElementById("highInput").value
);



if(!name){

alert("请输入名称");

return;

}



markets.push({

name,

type,

value,

low,

high

});



saveData();

renderMarkets();


closeAdd();


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
