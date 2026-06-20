#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "=========================================================="
echo "          LuminaBooks - Azure Deployment Script           "
echo "=========================================================="

# 1. Verification of login status
echo "Checking Azure authentication status..."
if ! az account show &> /dev/null; then
    echo "Error: You are not logged into Azure CLI."
    echo "Please run 'az login' and select your subscription first, then re-run this script."
    exit 1
fi

SUBSCRIPTION_NAME=$(az account show --query "name" -o tsv)
echo "Deploying to active subscription: $SUBSCRIPTION_NAME"

# 2. Setup variables
UNIQUE_SUFFIX=$(LC_ALL=C tr -dc 'a-z0-9' < /dev/urandom | head -c 5)

# Allow location override via command-line argument or interactive prompt
LOCATION="eastus"
if [ ! -z "$1" ]; then
    LOCATION="$1"
else
    echo "Azure location is set to 'eastus' by default. If this location is restricted,"
    echo "you can specify a different one (e.g. eastus2, westus2, centralus, westeurope)."
    read -p "Enter Azure location [default: eastus]: " user_location
    if [ ! -z "$user_location" ]; then
        LOCATION="$user_location"
    fi
fi

RG="rg-book-inventory-$UNIQUE_SUFFIX"
PLAN="plan-book-inventory-$UNIQUE_SUFFIX"
API_APP="app-book-inventory-api-$UNIQUE_SUFFIX"
SWA_APP="swa-book-inventory-$UNIQUE_SUFFIX"

PSQL_SERVER="psql-book-inventory-$UNIQUE_SUFFIX"
PSQL_DB="bookinventory"
PSQL_USER="dbadmin"
# Generate a secure password: 16 chars with mixed characters
PSQL_PASSWORD="P$(LC_ALL=C tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c 12)1!"

echo "----------------------------------------------------------"
echo "Deployment target variables:"
echo "Resource Group:       $RG"
echo "Location:             $LOCATION"
echo "PostgreSQL Server:    $PSQL_SERVER.postgres.database.azure.com"
echo "PostgreSQL User:      $PSQL_USER"
echo "PostgreSQL Password:  $PSQL_PASSWORD"
echo "App Service Plan:     $PLAN"
echo "Backend Web App URL:  https://$API_APP.azurewebsites.net"
echo "Static Web App (FE):  $SWA_APP"
echo "----------------------------------------------------------"

# Confirm deployment
read -p "Proceed with provisioning and deployment? (y/N): " confirm
if [[ $confirm != [yY] && $confirm != [yY][eE][sS] ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# 3. Create Resource Group
echo "Creating Resource Group '$RG' in '$LOCATION'..."
az group create -n "$RG" -l "$LOCATION"

# 4. Provision PostgreSQL Flexible Server
echo "Provisioning Azure Database for PostgreSQL (Flexible Server)..."
echo "Note: This command may take 5-10 minutes to complete. Please wait..."
az postgres flexible-server create \
    -g "$RG" \
    -n "$PSQL_SERVER" \
    -l "$LOCATION" \
    --admin-user "$PSQL_USER" \
    --admin-password "$PSQL_PASSWORD" \
    --sku-name Standard_B1ms \
    --tier Burstable \
    --yes

echo "Creating PostgreSQL database '$PSQL_DB'..."
az postgres flexible-server db create \
    --resource-group "$RG" \
    --server-name "$PSQL_SERVER" \
    --name "$PSQL_DB"
    

echo "Configuring PostgreSQL server firewall to allow connection from Azure App Services..."
az postgres flexible-server firewall-rule create \
    -g "$RG" \
    -n "${PSQL_SERVER}_FW" \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 0.0.0.0 \
    --server-name "$PSQL_SERVER"

# 5. Provision App Service Plan (B1 Basic - supports standard operations)
echo "Creating App Service Plan '$PLAN'..."
az appservice plan create -g "$RG" -n "$PLAN" --is-linux --sku B1

# 6. Provision App Service Web App running .NET 10.0 runtime
echo "Creating App Service Web App '$API_APP'..."
az webapp create -g "$RG" -p "$PLAN" -n "$API_APP" --runtime "DOTNETCORE|10.0"

# 7. Configure App Service Database Connection String and Environment
CONN_STRING="Host=$PSQL_SERVER.postgres.database.azure.com;Database=$PSQL_DB;Username=$PSQL_USER;Password=$PSQL_PASSWORD;Port=5432;Ssl Mode=Require;Trust Server Certificate=true;"

echo "Setting database connection string and environment variables in Web App..."
az webapp config connection-string set \
    -g "$RG" \
    -n "$API_APP" \
    --connection-string-type Custom \
    --settings DefaultConnection="$CONN_STRING"

az webapp config appsettings set \
    -g "$RG" \
    -n "$API_APP" \
    --settings ASPNETCORE_ENVIRONMENT=Production

# 8. Deploy Backend C# API Code
echo "Publishing backend C# application..."
cd backend
dotnet publish -c Release -o ./publish

echo "Zipping build artifacts..."
cd publish
zip -r ../publish.zip .
cd ..

echo "Deploying ZIP package to Azure App Service..."
az webapp deploy -g "$RG" -n "$API_APP" --src-path publish.zip --type zip

# Cleanup publish artifacts
rm -rf publish publish.zip
cd ..

# 9. Provision Azure Static Web App
echo "Creating Azure Static Web App '$SWA_APP'..."
az staticwebapp create -g "$RG" -n "$SWA_APP" -l "$LOCATION"

echo "Fetching Static Web App deployment token..."
SWA_TOKEN=$(az staticwebapp secrets list -n "$SWA_APP" -g "$RG" --query "properties.apiKey" -o tsv)

# 10. Build and Deploy Frontend
echo "Building React frontend pointing to backend API 'https://$API_APP.azurewebsites.net'..."
cd frontend
VITE_API_URL="https://$API_APP.azurewebsites.net" npm run build

echo "Deploying static assets to Azure Static Web App..."
npx -y @azure/static-web-apps-cli deploy ./dist --deployment-token "$SWA_TOKEN" --env production

cd ..

# 11. Final output details
echo "=========================================================="
echo "Deployment complete! LuminaBooks is live."
echo "=========================================================="
SWA_HOSTNAME=$(az staticwebapp show -n "$SWA_APP" -g "$RG" --query "defaultHostname" -o tsv)
echo "Frontend SWA URL:  https://$SWA_HOSTNAME"
echo "Backend API URL:   https://$API_APP.azurewebsites.net"
echo "Database:          $PSQL_SERVER.postgres.database.azure.com"
echo "Resource Group:    $RG"
echo "=========================================================="
echo "Please set up your database parameters if needed."
