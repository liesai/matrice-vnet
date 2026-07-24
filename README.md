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
