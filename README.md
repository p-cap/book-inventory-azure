
<img width="1024" height="559" alt="image" src="https://github.com/user-attachments/assets/790b4ca7-526a-4932-abb1-b530cfe5a8c0" />

## 🗺️ Replicate the App (AI Implementation Plan)

This section contains a deterministic blueprint designed for AI agents or LLM clients to completely rebuild LuminaBooks from scratch.

### Phase 1: Initialize the Multi-Tier Workspace

Provide this prompt to your AI client to spin up the decoupled workspace structures securely without tracking junk data:

> **System Initialization Prompt:**
> *"Create a decoupled workspace directory for an inventory application called 'LuminaBooks'. Establish a root-level `.gitignore` that excludes OS files, `.vscode/`, `.idea/`, standard C# backend build folders (`bin/`, `obj/`), and React frontend folders (`node_modules/`, `dist/`). Under the root workspace, initialize two sub-directories: `/backend` and `/frontend`."*

### Phase 2: Build the .NET 10.0 Minimal API Backend

Instruct the AI client to model the high-performance decoupled backend using robust Data Transfer Objects (DTOs) rather than letting internal database schemas leak:

> **Backend Architecture Prompt:**
> *"Inside the `/backend` directory, initialize an empty ASP.NET Core web project targeting `.NET 10.0`.
> 1. Add packages for `Microsoft.EntityFrameworkCore` and Npgsql PostgreSQL drivers.
> 2. Create a `/DTOs` directory containing `BookDto`, `BookCreateDto`, and `BookUpdateDto` to safely abstract fields. Add validation attributes like `[Required]` directly to the DTO parameters.
> 3. Implement a static `MappingExtensions.cs` class to cleanly transform internal Entity models to/from public DTO layers.
> 4. In `Program.cs`, set up a modern Minimal API using `.MapGroup("/api/books")` to map clean REST endpoints. Configure the database connection string parsing to read from an environment variable named `DefaultConnection`. Ensure CORS is configured before mapping routes to safely allow connections from the React frontend SPA."*
> 
> 

### Phase 3: Build the React SPA Frontend

Orchestrate the user interface layer cleanly by linking it to the backend endpoint variables:

> **Frontend Architecture Prompt:**
> *"Inside the `/frontend` directory, use Vite to scaffold a standard React application. Build out a responsive inventory tracking board. Ensure that all API fetch/Axios requests prefix their targets using a configurable environment variable named `VITE_API_URL`. Ensure that the `package.json` file contains a native `"build": "vite build"` pipeline script."*

### Phase 4: Non-Interactive Cloud Deployment Orchestration

To prevent automated deployment engines from getting stuck, use a completely non-interactive, fail-safe infrastructure script layout:

> **Deployment Script Prompt:**
> *"Generate a non-interactive bash deployment script named `deploy-to-azure.sh` that targets a single location input argument, defaulting safely to `centralus`. The script must perform the following actions sequentially using the Azure CLI:
> 1. Verify `az account show` login state.
> 2. Set an isolated random uppercase/lowercase ASCII suffix variable using `LC_ALL=C tr` to avoid duplicate name errors across macOS/Linux.
> 3. Create a resource group and provision an Azure Database for PostgreSQL (Flexible Server) using the Burstable `Standard_B1ms` compute tier.
> 4. Explicitly split database creation into a separate step using `az postgres flexible-server db create` to avoid cluster bugs.
> 5. Create a PostgreSQL firewall rule mapping `AllowAllAzureIPs` with `0.0.0.0` start/end parameters.
> 6. Provision a Linux App Service plan (SKU B1) and create a `.NET 10` web app with `--runtime "DOTNET:10.0"`.
> 7. Inject the connection strings and `ASPNETCORE_ENVIRONMENT=Production` variables into the Web App settings.
> 8. Publish and zip the backend, deploy it via zip deploy, then provision an Azure Static Web App in `centralus` to build and host the React frontend app assets using its deployment token."*
> 
> 

---

For an exhaustive, walk-through guide on managing routes and structuring this layer, you can watch this helpful [Building REST APIs with .NET Minimal API Tutorial](https://www.youtube.com/watch?v=dgd4GmvI3TA). This specific video breaks down how to decouple routes, plug in database contexts via Entity Framework Core, and implement clean status code practices that perfectly match your LuminaBooks requirements.