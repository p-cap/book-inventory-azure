# Deployment and Architecture Issues Log

This document lists the architectural, implementation, and deployment issues encountered during the development and Azure migration of the Book Inventory application, along with their resolutions.

---

## 1. Missing Project-Level Git Ignores
*   **Issue**: The repository lacked a root-level `.gitignore` file. While the frontend had a basic `.gitignore`, build artifacts from the C# backend (`bin/`, `obj/`), frontend package assets (`node_modules/`, `dist/`), sensitive environment variables (`.env`, `.env.local`), and local IDE files (`.vscode/`, `.idea/`, `.DS_Store`) were untracked.
*   **Impact**: High risk of committing build/binaries and secrets into source control.
*   **Resolution**: Created a comprehensive [root .gitignore](file:///Users/pckap/.gemini/antigravity-ide/scratch/book-inventory/.gitignore) to properly ignore OS, IDE, C# backend, and Node.js frontend build files.

---

## 2. Lack of DTOs (Data Transfer Objects)
*   **Issue**: The backend minimal API endpoints were receiving and returning raw Entity Framework `Book` model instances.
*   **Impact**:
    *   Exposed internal database schema directly to API clients.
    *   Coupled database model constraints with API request validations.
    *   No control over which fields are readable vs. writable.
*   **Resolution**: 
    *   Created read, write, and update DTOs under a new [DTOs directory](file:///Users/pckap/.gemini/antigravity-ide/scratch/book-inventory/backend/DTOs/): [`BookDto`](file:///Users/pckap/.gemini/antigravity-ide/scratch/book-inventory/backend/DTOs/BookDto.cs), [`BookCreateDto`](file:///Users/pckap/.gemini/antigravity-ide/scratch/book-inventory/backend/DTOs/BookCreateDto.cs), and [`BookUpdateDto`](file:///Users/pckap/.gemini/antigravity-ide/scratch/book-inventory/backend/DTOs/BookUpdateDto.cs).
    *   Moved validation attributes to the DTOs.
    *   Implemented [`MappingExtensions`](file:///Users/pckap/.gemini/antigravity-ide/scratch/book-inventory/backend/DTOs/MappingExtensions.cs) for performant and clean mapping.
    *   Refactored the endpoints in [`Program.cs`](file:///Users/pckap/.gemini/antigravity-ide/scratch/book-inventory/backend/Program.cs) to bind and return the new DTO models.

---

## 3. Azure CLI DB Creation Argument Bug
*   **Issue**: The `az postgres flexible-server create` command included the `--database-name` flag, which threw the error:
    > *The --database-name argument can only be used when --node-count is present, as it only applies to elastic clusters.*
*   **Impact**: Blocked database server provisioning entirely.
*   **Resolution**: Removed `--database-name` from the server provisioning step in [`deploy-to-azure.sh`](file:///Users/pckap/.gemini/antigravity-ide/scratch/book-inventory/deploy-to-azure.sh) and added a dedicated, sequential database creation step:
    ```bash
    az postgres flexible-server db create \
        --resource-group "$RG" \
        --server-name "$PSQL_SERVER" \
        --database-name "$PSQL_DB"
    ```

---

## 4. macOS/BSD `tr` Illegal Byte Sequence
*   **Issue**: Generating the random `UNIQUE_SUFFIX` and `PSQL_PASSWORD` using `head /dev/urandom | tr -dc ...` crashed on macOS with:
    > *tr: Illegal byte sequence*
*   **Impact**: Suffix variable remained blank, causing resource names to collate inappropriately (e.g. `rg-book-inventory-` or `psql-book-inventory-`).
*   **Resolution**: Modified [`deploy-to-azure.sh`](file:///Users/pckap/.gemini/antigravity-ide/scratch/book-inventory/deploy-to-azure.sh) to prepend `LC_ALL=C` to the `tr` commands to handle the binary stream as raw ASCII bytes across both macOS and Linux environments.

---

## 5. Pre-existing Resource Group Location Collision
*   **Issue**: The Resource Group name `rg-book-inventory` was hardcoded. When changing target locations, the command `az group create -n "$RG" -l "$LOCATION"` failed if `rg-book-inventory` was already created in a different location (like `eastus`).
*   **Impact**: Failed to create resources in the newly selected region.
*   **Resolution**: Suffix-configured the Resource Group (`rg-book-inventory-$UNIQUE_SUFFIX`) and the App Service Plan (`plan-book-inventory-$UNIQUE_SUFFIX`) to ensure isolated, conflict-free deployments.

---

## 6. Azure Subscription Regional Capacity Restrictions
*   **Issue**: The target regions `eastus` and `eastus2` returned:
    > *The location is restricted from performing this operation.*
*   **Impact**: Prevented database server provisioning.
*   **Resolution**: 
    *   Queried regional capabilities (`list-skus` capabilities) to inspect available locations under the user's active subscription (`MSSA April 2026_Paul_Capili`).
    *   Identified that **`westus`** and **`centralus`** are unrestricted for PostgreSQL Flexible Servers.
    *   Refactored [`deploy-to-azure.sh`](file:///Users/pckap/.gemini/antigravity-ide/scratch/book-inventory/deploy-to-azure.sh) to accept location input dynamically.
