const REQUIRED_COLUMNS = [
  "SubscriptionName", "subscriptionid", "ResourceGroup", "VNet", "Subnet",
  "Prefix", "AzureUsableIps", "UsedIPs", "FreeIPs", "UtilizationPct"
];

const DEMO_DATA = [
  {SubscriptionName:"Production",subscriptionid:"8f2a16d0-9e3b-4ca2-b241-100000000001",ResourceGroup:"rg-prod-canadacentral",VNet:"vnet-prod-hub-01",Subnet:"AzureFirewallSubnet",Prefix:"10.10.0.0/26",AzureUsableIps:59,UsedIPs:52,FreeIPs:7,UtilizationPct:88.1},
  {SubscriptionName:"Production",subscriptionid:"8f2a16d0-9e3b-4ca2-b241-100000000001",ResourceGroup:"rg-prod-canadacentral",VNet:"vnet-prod-hub-01",Subnet:"GatewaySubnet",Prefix:"10.10.0.64/27",AzureUsableIps:27,UsedIPs:16,FreeIPs:11,UtilizationPct:59.3},
  {SubscriptionName:"Production",subscriptionid:"8f2a16d0-9e3b-4ca2-b241-100000000001",ResourceGroup:"rg-prod-apps",VNet:"vnet-prod-app-01",Subnet:"snet-frontend",Prefix:"10.20.1.0/24",AzureUsableIps:251,UsedIPs:203,FreeIPs:48,UtilizationPct:80.9},
  {SubscriptionName:"Production",subscriptionid:"8f2a16d0-9e3b-4ca2-b241-100000000001",ResourceGroup:"rg-prod-apps",VNet:"vnet-prod-app-01",Subnet:"snet-backend",Prefix:"10.20.2.0/24",AzureUsableIps:251,UsedIPs:228,FreeIPs:23,UtilizationPct:90.8},
  {SubscriptionName:"Production",subscriptionid:"8f2a16d0-9e3b-4ca2-b241-100000000001",ResourceGroup:"rg-prod-data",VNet:"vnet-prod-data-01",Subnet:"snet-database",Prefix:"10.30.1.0/25",AzureUsableIps:123,UsedIPs:71,FreeIPs:52,UtilizationPct:57.7},
  {SubscriptionName:"Production",subscriptionid:"8f2a16d0-9e3b-4ca2-b241-100000000001",ResourceGroup:"rg-prod-data",VNet:"vnet-prod-data-01",Subnet:"snet-private-endpoints",Prefix:"10.30.2.0/26",AzureUsableIps:59,UsedIPs:43,FreeIPs:16,UtilizationPct:72.9},
  {SubscriptionName:"Développement",subscriptionid:"b71c80a5-70de-49d1-8575-200000000002",ResourceGroup:"rg-dev-shared",VNet:"vnet-dev-shared-01",Subnet:"snet-build-agents",Prefix:"10.110.0.0/24",AzureUsableIps:251,UsedIPs:98,FreeIPs:153,UtilizationPct:39.0},
  {SubscriptionName:"Développement",subscriptionid:"b71c80a5-70de-49d1-8575-200000000002",ResourceGroup:"rg-dev-apps",VNet:"vnet-dev-app-01",Subnet:"snet-containers",Prefix:"10.120.1.0/24",AzureUsableIps:251,UsedIPs:164,FreeIPs:87,UtilizationPct:65.3},
  {SubscriptionName:"Développement",subscriptionid:"b71c80a5-70de-49d1-8575-200000000002",ResourceGroup:"rg-dev-apps",VNet:"vnet-dev-app-01",Subnet:"snet-integration",Prefix:"10.120.2.0/25",AzureUsableIps:123,UsedIPs:41,FreeIPs:82,UtilizationPct:33.3},
  {SubscriptionName:"Connectivité",subscriptionid:"d4038721-274a-41fe-a0cf-300000000003",ResourceGroup:"rg-connectivity-core",VNet:"vnet-connectivity-hub",Subnet:"AzureBastionSubnet",Prefix:"10.200.0.0/26",AzureUsableIps:59,UsedIPs:13,FreeIPs:46,UtilizationPct:22.0},
  {SubscriptionName:"Connectivité",subscriptionid:"d4038721-274a-41fe-a0cf-300000000003",ResourceGroup:"rg-connectivity-core",VNet:"vnet-connectivity-hub",Subnet:"snet-dns-resolver",Prefix:"10.200.0.64/27",AzureUsableIps:27,UsedIPs:19,FreeIPs:8,UtilizationPct:70.4},
  {SubscriptionName:"Connectivité",subscriptionid:"d4038721-274a-41fe-a0cf-300000000003",ResourceGroup:"rg-connectivity-edge",VNet:"vnet-connectivity-edge",Subnet:"snet-nva",Prefix:"10.210.0.0/27",AzureUsableIps:27,UsedIPs:25,FreeIPs:2,UtilizationPct:92.6}
];

let data = [...DEMO_DATA];
let filteredData = [...data];
let selectedRow = null;
let sortState = { key: "UtilizationPct", dir: -1 };
let mapScale = 1;
let toastTimer;

const $ = (id) => document.getElementById(id);
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const fmt = (n, max=0) => new Intl.NumberFormat("fr-CA", {maximumFractionDigits:max}).format(Number(n) || 0);
const statusOf = pct => Number(pct) >= 85 ? "critical" : Number(pct) >= 65 ? "warning" : "healthy";
const statusLabel = s => ({critical:"Critique",warning:"À surveiller",healthy:"Sain"})[s];
const colorOf = s => ({critical:"#ff5e68",warning:"#f5b942",healthy:"#39e6b0"})[s];

function normalizeRow(row) {
  const clean = {};
  Object.entries(row).forEach(([k,v]) => clean[String(k).trim()] = v);
  const usable = Number(clean.AzureUsableIps) || 0;
  const used = Number(clean.UsedIPs) || 0;
  const free = clean.FreeIPs === "" || clean.FreeIPs == null ? Math.max(0, usable-used) : Number(clean.FreeIPs);
  let pct = Number(String(clean.UtilizationPct ?? "").replace("%","").replace(",","."));
  if (!Number.isFinite(pct)) pct = usable ? used / usable * 100 : 0;
  return {
    SubscriptionName: String(clean.SubscriptionName ?? ""),
    subscriptionid: String(clean.subscriptionid ?? ""),
    ResourceGroup: String(clean.ResourceGroup ?? ""),
    VNet: String(clean.VNet ?? ""),
    Subnet: String(clean.Subnet ?? ""),
    Prefix: String(clean.Prefix ?? ""),
    AzureUsableIps: usable,
    UsedIPs: used,
    FreeIPs: free,
    UtilizationPct: Math.round(pct * 10) / 10
  };
}

function showToast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), 2800);
}

function calculateQuality(rows) {
  if (!rows.length) return 0;
  let valid = 0, total = rows.length * REQUIRED_COLUMNS.length;
  rows.forEach(row => REQUIRED_COLUMNS.forEach(col => {
    const val = row[col];
    if (val !== "" && val !== null && val !== undefined && !(typeof val === "number" && !Number.isFinite(val))) valid++;
  }));
  return Math.round(valid / total * 100);
}

function updateDashboard() {
  const subscriptions = new Set(data.map(r=>r.SubscriptionName));
  const vnets = new Set(data.map(r=>`${r.subscriptionid}|${r.VNet}`));
  const resourceGroups = new Set(data.map(r=>r.ResourceGroup));
  const free = data.reduce((s,r)=>s+r.FreeIPs,0);
  const usable = data.reduce((s,r)=>s+r.AzureUsableIps,0);
  const used = data.reduce((s,r)=>s+r.UsedIPs,0);
  const util = usable ? used / usable * 100 : 0;
  const alerts = data.filter(r=>r.UtilizationPct >= 85);
  $("kpiSubscriptions").textContent = fmt(subscriptions.size);
  $("kpiSubDetail").textContent = `${subscriptions.size === 1 ? "environnement" : "environnements"} Azure`;
  $("kpiVnets").textContent = fmt(vnets.size);
  $("kpiVnetDetail").textContent = `${resourceGroups.size} groupes de ressources`;
  $("kpiSubnets").textContent = fmt(data.length);
  $("kpiSubnetDetail").textContent = `${data.filter(r=>r.Prefix).length} plages CIDR analysées`;
  $("kpiFree").textContent = fmt(free);
  $("kpiFreeDetail").textContent = `sur ${fmt(usable)} utilisables`;
  $("kpiUtil").textContent = `${fmt(util,1)}%`;
  $("kpiAlertDetail").textContent = `${alerts.length} alerte${alerts.length>1?"s":""} capacité`;
  const q = calculateQuality(data);
  document.querySelector(".quality-ring").textContent = q;
  $("qualityText").textContent = q === 100 ? "Toutes les colonnes sont valides" : `${100-q}% de champs à vérifier`;
  renderAlerts();
}

function populateFilters() {
  const current = $("subscriptionFilter").value;
  const options = [...new Set(data.map(r=>r.SubscriptionName))].sort();
  $("subscriptionFilter").innerHTML = `<option value="">Tous les abonnements</option>` + options.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join("");
  if (options.includes(current)) $("subscriptionFilter").value = current;
}

function applyFilters() {
  const q = $("searchInput").value.trim().toLowerCase();
  const sub = $("subscriptionFilter").value;
  const status = $("statusFilter").value;
  filteredData = data.filter(row => {
    const haystack = [row.SubscriptionName,row.ResourceGroup,row.VNet,row.Subnet,row.Prefix].join(" ").toLowerCase();
    return (!q || haystack.includes(q)) && (!sub || row.SubscriptionName === sub) && (!status || statusOf(row.UtilizationPct) === status);
  }).sort((a,b) => {
    const av=a[sortState.key], bv=b[sortState.key];
    return (typeof av === "number" ? av-bv : String(av).localeCompare(String(bv),"fr")) * sortState.dir;
  });
  renderTable();
}

function renderTable() {
  const body = $("inventoryBody");
  body.innerHTML = filteredData.map((r,i) => {
    const status = statusOf(r.UtilizationPct);
    const selected = selectedRow && selectedRow.subscriptionid===r.subscriptionid && selectedRow.VNet===r.VNet && selectedRow.Subnet===r.Subnet;
    return `<tr data-index="${i}" class="${selected?"selected":""}">
      <td>${esc(r.Subnet)}</td><td>${esc(r.VNet)}</td><td class="mono">${esc(r.Prefix)}</td>
      <td class="mono">${fmt(r.UsedIPs)}</td><td class="mono">${fmt(r.FreeIPs)}</td>
      <td><div class="util-cell"><span class="mini-track"><i style="width:${Math.min(100,r.UtilizationPct)}%;background:${colorOf(status)}"></i></span><span class="mono">${fmt(r.UtilizationPct,1)}%</span></div></td>
      <td><span class="status-badge ${status}">${statusLabel(status)}</span></td>
    </tr>`;
  }).join("") || `<tr><td colspan="7" style="text-align:center;padding:35px;color:var(--muted)">Aucun résultat pour ces filtres.</td></tr>`;
  $("rowCount").textContent = `${filteredData.length} sous-réseau${filteredData.length>1?"x":""}`;
  body.querySelectorAll("tr[data-index]").forEach(tr => tr.addEventListener("click", () => selectRow(filteredData[Number(tr.dataset.index)], true)));
}

function renderAlerts() {
  const alerts = [...data].filter(r=>r.UtilizationPct>=65).sort((a,b)=>b.UtilizationPct-a.UtilizationPct);
  $("alertCount").textContent = alerts.length;
  $("alertsList").innerHTML = alerts.slice(0,6).map((r,i)=>{
    const s=statusOf(r.UtilizationPct);
    return `<div class="alert-item" data-alert="${i}"><span class="alert-icon ${s}"><svg><use href="#i-alert"/></svg></span><div><strong>${esc(r.Subnet)}</strong><small>${esc(r.VNet)} • ${fmt(r.FreeIPs)} IP libres</small></div><strong style="color:${colorOf(s)}">${fmt(r.UtilizationPct,1)}%</strong></div>`;
  }).join("") || `<div class="no-alerts">Aucune alerte de capacité.</div>`;
  $("alertsList").querySelectorAll("[data-alert]").forEach(el=>el.addEventListener("click",()=>selectRow(alerts[Number(el.dataset.alert)],true)));
}

function renderTopology() {
  const svg = $("networkSvg");
  const displayed = data.slice(0, 12);
  const rowGap = displayed.length > 1 ? Math.min(41, 450 / (displayed.length - 1)) : 0;
  const rowY = new Map(displayed.map((row, i) => [row, 42 + i * rowGap]));
  const avgY = rows => rows.reduce((sum, row) => sum + rowY.get(row), 0) / rows.length;
  const hierarchy = [...new Set(displayed.map(r=>r.SubscriptionName))].map(subscription => ({
    name: subscription,
    rows: displayed.filter(r=>r.SubscriptionName===subscription)
  }));
  const nodes=[], links=[];
  const root={type:"root",x:82,y:avgY(displayed),w:120,h:50,label:"Azure Tenant",sub:`${hierarchy.length} abonnements`};
  nodes.push(root);
  hierarchy.forEach(sub=>{
    const sy=avgY(sub.rows);
    const subNode={type:"subscription",x:250,y:sy,w:138,h:44,label:sub.name,sub:`${new Set(sub.rows.map(r=>r.VNet)).size} VNets`};
    nodes.push(subNode); links.push([root,subNode,"subscription"]);
    const vnets=[...new Set(sub.rows.map(r=>r.VNet))];
    vnets.forEach(vnet=>{
      const rows=sub.rows.filter(r=>r.VNet===vnet);
      const vy=avgY(rows);
      const vn={type:"vnet",x:475,y:vy,w:150,h:40,label:vnet,sub:rows[0].ResourceGroup};
      nodes.push(vn);links.push([subNode,vn,""]);
      rows.forEach(row=>{
        const sn={type:"subnet",x:785,y:rowY.get(row),w:174,h:32,label:row.Subnet,sub:row.Prefix,row};
        nodes.push(sn);links.push([vn,sn,""]);
      });
    });
  });
  const line = ([a,b,cls]) => {
    const ax=a.x+a.w/2, ay=a.y, bx=b.x-b.w/2, by=b.y;
    return `<path class="topology-link ${cls}" d="M${ax} ${ay} C${ax+55} ${ay},${bx-55} ${by},${bx} ${by}"/>`;
  };
  const node = n => {
    const x=n.x-n.w/2,y=n.y-n.h/2;
    const row=n.row,status=row?statusOf(row.UtilizationPct):"";
    const icon = n.type==="root" ? `<path class="node-icon" d="M${x+17} ${n.y-6}l9-5 9 5-9 5zM${x+17} ${n.y}l9 5 9-5M${x+17} ${n.y+6}l9 5 9-5"/>`
      : n.type==="subscription" ? `<rect class="node-icon" x="${x+15}" y="${n.y-9}" width="18" height="18" rx="3"/><path class="node-icon" d="M${x+20} ${n.y}h8M${x+24} ${n.y-4}v8"/>`
      : n.type==="vnet" ? `<circle class="node-icon" cx="${x+24}" cy="${n.y}" r="9"/><circle class="node-icon" cx="${x+24}" cy="${n.y}" r="3"/><path class="node-icon" d="M${x+24} ${n.y-9}v6m0 6v6m-9-9h6m6 0h6"/>`
      : `<circle cx="${x+18}" cy="${n.y}" r="5" fill="${colorOf(status)}" stroke="none"/><circle cx="${x+18}" cy="${n.y}" r="10" fill="none" stroke="${colorOf(status)}" stroke-opacity=".18"/>`;
    const labelX=x+(n.type==="subnet"?34:43);
    return `<g class="node-group ${n.type}${row&&selectedRow&&row.Subnet===selectedRow.Subnet&&row.VNet===selectedRow.VNet?" selected":""}" ${row?`data-key="${encodeURIComponent(row.subscriptionid+"|"+row.VNet+"|"+row.Subnet)}"`:""}>
      <rect class="node-shape" x="${x}" y="${y}" width="${n.w}" height="${n.h}" rx="${n.type==="subnet"?7:10}"/>${icon}
      <text class="topology-label" x="${labelX}" y="${n.y-(n.type==="subnet"?1:4)}">${esc(shorten(n.label,n.type==="subnet"?17:16))}</text>
      <text class="topology-sublabel" x="${labelX}" y="${n.y+(n.type==="subnet"?10:9)}">${esc(shorten(n.sub,n.type==="subnet"?21:18))}</text>
      ${row?`<text class="node-util" x="${x+n.w-10}" y="${n.y+3}" fill="${colorOf(status)}" text-anchor="end">${fmt(row.UtilizationPct,0)}%</text>`:""}
    </g>`;
  };
  svg.innerHTML=`<g id="mapScene" transform="translate(0 0) scale(${mapScale})">
    <text class="svg-section-label" x="26" y="18">TENANT</text><text class="svg-section-label" x="205" y="18">ABONNEMENTS</text><text class="svg-section-label" x="400" y="18">RÉSEAUX VIRTUELS</text><text class="svg-section-label" x="700" y="18">SOUS-RÉSEAUX</text>
    ${links.map(line).join("")}${nodes.map(node).join("")}
  </g>`;
  svg.querySelectorAll("[data-key]").forEach(el=>el.addEventListener("click",e=>{
    e.stopPropagation();
    const [sid,vnet,subnet]=decodeURIComponent(el.dataset.key).split("|");
    selectRow(data.find(r=>r.subscriptionid===sid&&r.VNet===vnet&&r.Subnet===subnet),false);
  }));
}

function shorten(s,n){s=String(s||"");return s.length>n?s.slice(0,n-1)+"…":s}

function selectRow(row, scroll=false) {
  if (!row) return;
  selectedRow=row;
  renderInspector(row);
  renderTable();
  renderTopology();
  if (scroll) document.querySelector("#topology").scrollIntoView({behavior:"smooth",block:"center"});
}

function renderInspector(r) {
  const status=statusOf(r.UtilizationPct), circumference=2*Math.PI*55, offset=circumference*(1-Math.min(100,r.UtilizationPct)/100);
  let recommendation = r.UtilizationPct>=85
    ? "Extension recommandée : planifiez une nouvelle plage ou réduisez les allocations avant le prochain déploiement."
    : r.UtilizationPct>=65 ? "Surveillance renforcée : vérifiez la croissance et les interfaces réseau orphelines." : "Capacité confortable : aucune action immédiate requise.";
  $("inspector").innerHTML=`<div class="inspect-title"><span class="status-badge ${status}">${statusLabel(status)}</span><h3>${esc(r.Subnet)}</h3><p>${esc(r.VNet)} · ${esc(r.ResourceGroup)}</p></div>
    <div class="capacity-ring"><svg viewBox="0 0 130 130"><circle class="track" cx="65" cy="65" r="55"/><circle class="value" cx="65" cy="65" r="55" stroke="${colorOf(status)}" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/></svg><div class="ring-label"><strong>${fmt(r.UtilizationPct,1)}%</strong><small>UTILISÉ</small></div></div>
    <div class="inspect-stats"><div class="inspect-stat"><span>PRÉFIXE</span><strong>${esc(r.Prefix)}</strong></div><div class="inspect-stat"><span>UTILISABLES</span><strong>${fmt(r.AzureUsableIps)}</strong></div><div class="inspect-stat"><span>UTILISÉES</span><strong>${fmt(r.UsedIPs)}</strong></div><div class="inspect-stat"><span>LIBRES</span><strong style="color:${colorOf(status)}">${fmt(r.FreeIPs)}</strong></div></div>
    <div class="recommendation"><strong>Conseil capacité</strong><br>${recommendation}</div>`;
}

async function importFile(file) {
  try {
    const ext=file.name.split(".").pop().toLowerCase();
    let rows;
    if (ext==="csv") {
      const wb=XLSX.read(await file.text(),{type:"string"});
      rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:""});
    } else {
      const wb=XLSX.read(await file.arrayBuffer(),{type:"array"});
      rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:""});
    }
    if (!rows.length) throw new Error("La première feuille ne contient aucune donnée.");
    const actual=Object.keys(rows[0]).map(x=>String(x).trim());
    const missing=REQUIRED_COLUMNS.filter(c=>!actual.includes(c));
    if (missing.length) throw new Error(`Colonnes manquantes : ${missing.join(", ")}`);
    data=rows.map(normalizeRow).filter(r=>r.SubscriptionName&&r.VNet&&r.Subnet);
    if (!data.length) throw new Error("Aucune ligne réseau valide détectée.");
    selectedRow=null;
    $("inspector").innerHTML=`<div class="empty-inspector"><span class="pulse-icon">⌁</span><h3>Sélectionnez un sous-réseau</h3><p>Cliquez sur un nœud pour afficher sa capacité et ses recommandations.</p></div>`;
    $("fileName").textContent=file.name;
    $("fileMeta").textContent=`${fmt(data.length)} lignes • ${(file.size/1024).toFixed(1)} Ko • importé à ${new Date().toLocaleTimeString("fr-CA",{hour:"2-digit",minute:"2-digit"})}`;
    $("lastUpdated").textContent=`Mis à jour ${new Date().toLocaleTimeString("fr-CA",{hour:"2-digit",minute:"2-digit"})}`;
    refreshAll();
    showToast(`${data.length} sous-réseaux importés avec succès`);
  } catch(err) { showToast(err.message || "Impossible de lire ce fichier."); }
}

function refreshAll(){updateDashboard();populateFilters();applyFilters();renderTopology()}

function ipToInt(ip) {
  const parts=ip.split(".");
  if(parts.length!==4||parts.some(p=>!/^\\d+$/.test(p)||Number(p)>255)) throw new Error("Adresse IPv4 invalide.");
  return parts.reduce((acc,p)=>(acc*256+Number(p))>>>0,0)>>>0;
}
function intToIp(n){return [n>>>24,(n>>>16)&255,(n>>>8)&255,n&255].join(".")}
function calculateCidr() {
  try {
    const [ip,prefixRaw]=$("cidrInput").value.trim().split("/");
    const prefix=Number(prefixRaw);
    if(!Number.isInteger(prefix)||prefix<0||prefix>32) throw new Error("Le préfixe CIDR doit être entre /0 et /32.");
    const ipInt=ipToInt(ip);
    const mask=prefix===0?0:(0xffffffff<<(32-prefix))>>>0;
    const network=(ipInt&mask)>>>0;
    const total=2**(32-prefix);
    const end=(network+total-1)>>>0;
    const usable=Math.max(0,total-5);
    const used=Math.max(0,Number($("usedInput").value)||0);
    const free=Math.max(0,usable-used);
    $("calcRange").textContent=`${intToIp(network)} — ${intToIp(end)}`;
    $("calcUsable").textContent=fmt(usable);
    $("calcFree").textContent=fmt(free);
    $("calcMask").textContent=intToIp(mask);
    $("calcFirst").textContent=usable?intToIp((network+4)>>>0):"—";
    $("calcLast").textContent=usable?intToIp((end-1)>>>0):"—";
    $("calcError").style.display="none";
  } catch(err) {$("calcError").textContent=err.message;$("calcError").style.display="block"}
}

function exportCsv() {
  const rows=filteredData.length?filteredData:data;
  const csv=[REQUIRED_COLUMNS.join(","),...rows.map(r=>REQUIRED_COLUMNS.map(k=>`"${String(r[k]??"").replaceAll('"','""')}"`).join(","))].join("\\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\\ufeff"+csv],{type:"text/csv;charset=utf-8"}));a.download="inventaire-reseau-filtre.csv";a.click();URL.revokeObjectURL(a.href);
  showToast(`${rows.length} lignes exportées`);
}

$("importBtn").addEventListener("click",()=>$("fileInput").click());
$("fileInput").addEventListener("change",e=>e.target.files[0]&&importFile(e.target.files[0]));
["dragenter","dragover"].forEach(ev=>$("dropZone").addEventListener(ev,e=>{e.preventDefault();$("dropZone").classList.add("dragover")}));
["dragleave","drop"].forEach(ev=>$("dropZone").addEventListener(ev,e=>{e.preventDefault();$("dropZone").classList.remove("dragover")}));
$("dropZone").addEventListener("drop",e=>e.dataTransfer.files[0]&&importFile(e.dataTransfer.files[0]));
$("searchInput").addEventListener("input",applyFilters);
$("subscriptionFilter").addEventListener("change",applyFilters);
$("statusFilter").addEventListener("change",applyFilters);
document.querySelectorAll("th[data-sort]").forEach(th=>th.addEventListener("click",()=>{sortState.dir=sortState.key===th.dataset.sort?-sortState.dir:1;sortState.key=th.dataset.sort;applyFilters()}));
$("exportCsv").addEventListener("click",exportCsv);
$("calculateBtn").addEventListener("click",calculateCidr);
$("cidrInput").addEventListener("keydown",e=>e.key==="Enter"&&calculateCidr());
$("themeToggle").addEventListener("click",()=>{
  const light=document.documentElement.dataset.theme==="light";
  document.documentElement.dataset.theme=light?"dark":"light";
  $("themeToggle").innerHTML=`<svg><use href="#i-${light?"moon":"sun"}"/></svg>`;
  localStorage.setItem("netscope-theme",light?"dark":"light");
});
$("mobileMenu").addEventListener("click",()=>document.querySelector(".sidebar").classList.toggle("open"));
document.querySelectorAll(".nav-item").forEach(a=>a.addEventListener("click",()=>{document.querySelectorAll(".nav-item").forEach(x=>x.classList.remove("active"));a.classList.add("active");document.querySelector(".sidebar").classList.remove("open")}));
$("zoomIn").addEventListener("click",()=>{mapScale=Math.min(1.3,mapScale+.1);renderTopology()});
$("zoomOut").addEventListener("click",()=>{mapScale=Math.max(.7,mapScale-.1);renderTopology()});
$("zoomReset").addEventListener("click",()=>{mapScale=1;renderTopology()});

const savedTheme=localStorage.getItem("netscope-theme");
if(savedTheme){document.documentElement.dataset.theme=savedTheme;$("themeToggle").innerHTML=`<svg><use href="#i-${savedTheme==="light"?"sun":"moon"}"/></svg>`}
refreshAll();
calculateCidr();
