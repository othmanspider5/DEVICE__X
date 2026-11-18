const PHONE_CSV = "https://raw.githubusercontent.com/abhinavflac/smartphone-specs-india/main/data/processed/smartphones_cleaned.csv";
const LAPTOP_CSV = "https://raw.githubusercontent.com/abhinavflac/laptops-specs-dataset/main/data/processed/laptops_cleaned.csv";
const COMMONS = "https://commons.wikimedia.org/w/api.php";
const PAGE_SIZE = 20;
let devices = [], filtered = [], page = 1, imageCache = {};
const $ = id => document.getElementById(id);

function parseCSV(text){
  const rows=[]; let row=[], field="", quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i], n=text[i+1];
    if(c==='"' && quoted && n==='"'){field+='"';i++}
    else if(c==='"') quoted=!quoted;
    else if(c===',' && !quoted){row.push(field);field=""}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&n==='\n')i++;row.push(field);if(row.some(x=>x.trim()))rows.push(row);row=[];field=""}
    else field+=c;
  }
  if(field.length||row.length){row.push(field);rows.push(row)}
  const headers=rows.shift().map(x=>x.trim());
  return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,(r[i]||"").trim()])));
}
function val(v){return v && v!=="nan" && v!=="NaN" && v!=="None" ? v : ""}
function num(v){const n=Number(v);return Number.isFinite(n)&&v!==""?n:""}
function phoneFrom(r,i){
  return {id:"ph-"+i,type:"Smartphone",brand:cap(r.brand),name:val(r.model),ram:val(r.ram_gb)?r.ram_gb+" GB":"",storage:val(r.storage_gb)?r.storage_gb+" GB":"",chip:val(r.processor_name),screen:val(r.display_inches)?r.display_inches+'"':"",resolution:val(r.res_width_px)&&val(r.res_height_px)?r.res_width_px+" × "+r.res_height_px:"",refresh:val(r.refresh_rate_hz)?r.refresh_rate_hz+" Hz":"",battery:val(r.battery_mah)?r.battery_mah+" mAh":"",camera:val(r.rear_camera_main_mp)?r.rear_camera_main_mp+" MP":"",os:val(r.os_name),source:"Smartphone Specs India dataset",sourceUrl:"https://github.com/abhinavflac/smartphone-specs-india",searchName:val(r.model)+" "+val(r.brand)};
}
function laptopFrom(r,i){
  const chip=[r.cpu_brand,r.cpu_series,r.cpu_model].map(val).filter(Boolean).join(" ");
  return {id:"lp-"+i,type:"Laptop",brand:cap(r.brand),name:val(r.model),ram:val(r.ram_gb)?r.ram_gb+" GB":"",storage:val(r.storage_gb)?r.storage_gb+" GB":"",chip,screen:val(r.display_size_inch)?r.display_size_inch+'"':"",resolution:val(r.display_width_px)&&val(r.display_height_px)?r.display_width_px+" × "+r.display_height_px:"",gpu:[r.gpu_brand,r.gpu_model].map(val).filter(Boolean).join(" "),os:val(r.os_name),category:val(r.device_category),source:"Laptop Specs India dataset",sourceUrl:"https://github.com/abhinavflac/laptops-specs-dataset",searchName:val(r.model)+" "+val(r.brand)};
}
function cap(s){return (s||"").replace(/\b\w/g,c=>c.toUpperCase())}
async function loadData(){
  try{
    const [p,l]=await Promise.all([fetch(PHONE_CSV),fetch(LAPTOP_CSV)]);
    if(!p.ok||!l.ok) throw new Error("The public dataset servers did not respond.");
    const [pt,lt]=await Promise.all([p.text(),l.text()]);
    const phones=parseCSV(pt).slice(0,500).map(phoneFrom);
    const laptops=parseCSV(lt).slice(0,300).map(laptopFrom);
    devices=[...phones,...laptops].filter(d=>d.name);
    $("totalStat").textContent=devices.length.toLocaleString();
    $("loadStatus").textContent="Public datasets loaded · "+phones.length+" smartphones · "+laptops.length+" laptops";
    buildBrands(); applyFilters();
  }catch(e){
    $("loadStatus").textContent="Could not load the public datasets. Check your internet connection and refresh.";
    $("deviceGrid").innerHTML=`<div class="loading-card"><b>Dataset connection failed</b><span>${escapeHTML(e.message)}</span><span>Refresh the page to try again.</span></div>`;
  }
}
function buildBrands(){
  const brands=[...new Set(devices.map(d=>d.brand).filter(Boolean))].sort();
  $("brandFilter").innerHTML='<option value="all">All brands</option>'+brands.map(b=>`<option>${escapeHTML(b)}</option>`).join("");
}
function applyFilters(){
  const q=$("searchInput").value.toLowerCase().trim(), type=$("categoryFilter").value, brand=$("brandFilter").value;
  filtered=devices.filter(d=>(type==="all"||d.type===type)&&(brand==="all"||d.brand===brand)&&(!q||[d.name,d.brand,d.chip,d.ram,d.storage,d.gpu,d.os,d.screen].join(" ").toLowerCase().includes(q)));
  if($("sortFilter").value==="brand") filtered.sort((a,b)=>a.brand.localeCompare(b.brand)||a.name.localeCompare(b.name));
  else filtered.sort((a,b)=>a.name.localeCompare(b.name));
  page=1; render();
}
function render(){
  const start=(page-1)*PAGE_SIZE, items=filtered.slice(start,start+PAGE_SIZE);
  $("resultCount").textContent=filtered.length.toLocaleString()+" devices";
  $("pageLabel").textContent=`Page ${page} / ${Math.max(1,Math.ceil(filtered.length/PAGE_SIZE))}`;
  $("prevBtn").disabled=page<=1; $("nextBtn").disabled=page>=Math.ceil(filtered.length/PAGE_SIZE);
  if(!items.length){$("deviceGrid").innerHTML='<div class="loading-card"><b>No devices found</b><span>Try another model name or remove a filter.</span></div>';return}
  $("deviceGrid").innerHTML=items.map(d=>`<article class="device-card" data-id="${d.id}"><div class="device-image"><span class="type-pill">${d.type.toUpperCase()}</span><div class="image-fallback">${d.type==="Laptop"?"▱":"▯"}</div><img data-image="${d.id}" alt="${escapeHTML(d.name)} product photo" hidden></div><div class="card-body"><div class="card-brand">${escapeHTML(d.brand)}</div><div class="card-title">${escapeHTML(d.name)}</div><div class="spec-mini">${[d.chip,d.ram,d.storage,d.screen].filter(Boolean).slice(0,3).map(x=>`<span>${escapeHTML(x)}</span>`).join("")}</div><div class="card-foot"><span>${d.type}</span><span>VIEW SPECS ↗</span></div></div></article>`).join("");
  document.querySelectorAll(".device-card").forEach(card=>card.addEventListener("click",()=>openDetails(devices.find(d=>d.id===card.dataset.id))));
  items.forEach(d=>loadPhoto(d));
}
async function loadPhoto(d){
  const img=document.querySelector(`img[data-image="${d.id}"]`); if(!img)return;
  if(imageCache[d.id]){img.src=imageCache[d.id];img.hidden=false;img.previousElementSibling.hidden=true;return}
  try{
    const q=encodeURIComponent(`"${d.name}" ${d.type==="Laptop"?"laptop":"smartphone"}`);
    const url=`${COMMONS}?action=query&format=json&origin=*&generator=search&gsrsearch=${q}&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url&iiurlwidth=500`;
    const res=await fetch(url); const data=await res.json();
    const pages=Object.values(data.query?.pages||{});
    const best=pages.find(p=>p.imageinfo?.[0]?.thumburl && !/logo|icon|diagram/i.test(p.title||""));
    if(best&&img.isConnected){const src=best.imageinfo[0].thumburl;imageCache[d.id]=src;img.src=src;img.hidden=false;img.previousElementSibling.hidden=true;}
  }catch(_){}
}
function openDetails(d){
  if(!d)return;
  const fields=[["Device type",d.type],["Brand",d.brand],["Processor",d.chip],["RAM",d.ram],["Storage",d.storage],["Display",d.screen],["Resolution",d.resolution],["Refresh rate",d.refresh],["Battery",d.battery],["Main camera",d.camera],["Graphics",d.gpu],["Operating system",d.os],["Category",d.category]];
  const img=imageCache[d.id];
  $("modalContent").innerHTML=`<div class="detail-head"><div class="detail-photo">${img?`<img src="${img}" alt="${escapeHTML(d.name)}">`:`<div class="image-fallback">${d.type==="Laptop"?"▱":"▯"}</div>`}</div><div><div class="card-brand">${escapeHTML(d.brand)} · ${d.type.toUpperCase()}</div><h2 id="modalTitle">${escapeHTML(d.name)}</h2><p>Specifications from a public community dataset. Some fields may be unavailable or configuration-dependent.</p></div></div><div class="spec-table">${fields.filter(x=>x[1]).map(x=>`<div class="spec-item"><span>${x[0]}</span><b>${escapeHTML(String(x[1]))}</b></div>`).join("")}</div><a class="source-link" href="${d.sourceUrl}" target="_blank" rel="noopener">DATA SOURCE: ${escapeHTML(d.source)} ↗</a>`;
  $("modalBackdrop").hidden=false;
}
function escapeHTML(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
$("searchInput").addEventListener("input",applyFilters);
$("categoryFilter").addEventListener("change",applyFilters);
$("brandFilter").addEventListener("change",applyFilters);
$("sortFilter").addEventListener("change",applyFilters);
$("prevBtn").addEventListener("click",()=>{if(page>1){page--;render();window.scrollTo({top:$("catalog").offsetTop-30,behavior:"smooth"})}});
$("nextBtn").addEventListener("click",()=>{if(page<Math.ceil(filtered.length/PAGE_SIZE)){page++;render();window.scrollTo({top:$("catalog").offsetTop-30,behavior:"smooth"})}});
$("modalClose").addEventListener("click",()=>$("modalBackdrop").hidden=true);
$("modalBackdrop").addEventListener("click",e=>{if(e.target===$("modalBackdrop"))$("modalBackdrop").hidden=true});
$("themeBtn").addEventListener("click",()=>document.body.classList.toggle("dark"));
document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("searchInput").focus()}if(e.key==="Escape")$("modalBackdrop").hidden=true});
loadData();