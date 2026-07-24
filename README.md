# NetScope

Visualisateur autonome d’inventaire réseau Azure à partir d’un fichier Excel.

## Démarrage

```bash
python3 -m http.server 8080
```

Puis ouvrir `http://localhost:8080`.

Le fichier `exemple-inventaire-azure.xlsx` contient les colonnes attendues :

`SubscriptionName`, `subscriptionid`, `ResourceGroup`, `VNet`, `Subnet`, `Prefix`, `AzureUsableIps`, `UsedIPs`, `FreeIPs`, `UtilizationPct`.

Toutes les données importées restent dans le navigateur. Aucun fichier n’est transmis à un service externe.

## Grands inventaires

La topologie dispose de filtres par abonnement et VNet, d’une recherche et d’une pagination. Seuls 12 sous-réseaux sont dessinés simultanément afin de conserver un SVG lisible, sans limiter le nombre d’actifs importés.

L’outil **Address Space Explorer** accepte une plage CIDR, par exemple `10.0.0.0/8`, et liste les VNets dont au moins un préfixe de sous-réseau est inclus dans la plage ou la chevauche. Les associations sont déduites de la colonne `Prefix`.
