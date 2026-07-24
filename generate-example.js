const XLSX = require("./xlsx.full.min.js");
const fs = require("node:fs");

const rows = [
  ["SubscriptionName","subscriptionid","ResourceGroup","VNet","Subnet","Prefix","AzureUsableIps","UsedIPs","FreeIPs","UtilizationPct"],
  ["Production","8f2a16d0-9e3b-4ca2-b241-100000000001","rg-prod-canadacentral","vnet-prod-hub-01","AzureFirewallSubnet","10.10.0.0/26",59,52,7,88.1],
  ["Production","8f2a16d0-9e3b-4ca2-b241-100000000001","rg-prod-canadacentral","vnet-prod-hub-01","GatewaySubnet","10.10.0.64/27",27,16,11,59.3],
  ["Production","8f2a16d0-9e3b-4ca2-b241-100000000001","rg-prod-apps","vnet-prod-app-01","snet-frontend","10.20.1.0/24",251,203,48,80.9],
  ["Production","8f2a16d0-9e3b-4ca2-b241-100000000001","rg-prod-apps","vnet-prod-app-01","snet-backend","10.20.2.0/24",251,228,23,90.8],
  ["Production","8f2a16d0-9e3b-4ca2-b241-100000000001","rg-prod-data","vnet-prod-data-01","snet-database","10.30.1.0/25",123,71,52,57.7],
  ["Production","8f2a16d0-9e3b-4ca2-b241-100000000001","rg-prod-data","vnet-prod-data-01","snet-private-endpoints","10.30.2.0/26",59,43,16,72.9],
  ["Développement","b71c80a5-70de-49d1-8575-200000000002","rg-dev-shared","vnet-dev-shared-01","snet-build-agents","10.110.0.0/24",251,98,153,39.0],
  ["Développement","b71c80a5-70de-49d1-8575-200000000002","rg-dev-apps","vnet-dev-app-01","snet-containers","10.120.1.0/24",251,164,87,65.3],
  ["Développement","b71c80a5-70de-49d1-8575-200000000002","rg-dev-apps","vnet-dev-app-01","snet-integration","10.120.2.0/25",123,41,82,33.3],
  ["Connectivité","d4038721-274a-41fe-a0cf-300000000003","rg-connectivity-core","vnet-connectivity-hub","AzureBastionSubnet","10.200.0.0/26",59,13,46,22.0],
  ["Connectivité","d4038721-274a-41fe-a0cf-300000000003","rg-connectivity-core","vnet-connectivity-hub","snet-dns-resolver","10.200.0.64/27",27,19,8,70.4],
  ["Connectivité","d4038721-274a-41fe-a0cf-300000000003","rg-connectivity-edge","vnet-connectivity-edge","snet-nva","10.210.0.0/27",27,25,2,92.6]
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(rows);
ws["!cols"] = [{wch:22},{wch:40},{wch:28},{wch:28},{wch:26},{wch:18},{wch:18},{wch:12},{wch:12},{wch:18}];
XLSX.utils.book_append_sheet(wb, ws, "Inventaire Azure");
const output = XLSX.write(wb, {bookType:"xlsx", type:"buffer", compression:true});
fs.writeFileSync("exemple-inventaire-azure.xlsx", output);
