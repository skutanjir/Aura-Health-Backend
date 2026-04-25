# Aura Health REST API

Aura Health is a comprehensive backend service for a Tuberculosis (TBC) Education and Community Platform. This RESTful API provides endpoints for user management, community interactions (posts, comments, likes), educational content delivery, AI-assisted chat history, and notification systems.

## Architecture

This application employs a layered architecture pattern, separating concerns into distinct modules for improved maintainability, testability, and scalability.

- **Controllers**: Handle incoming HTTP requests, validate input structures, and dispatch to appropriate services.
- **Services**: Contain the core business logic of the application.
- **Repositories**: Handle direct data access and interactions with the database via Prisma ORM.
- **Routes**: Define the API endpoints and map them to specific controllers.
- **Middlewares**: Process requests before they reach the controllers (e.g., authentication, rate limiting, error handling).
- **Validations**: Define schemas (using Zod) to strictly validate incoming payloads.

## Technology Stack

The project utilizes a modern Node.js backend stack:

| Category | Technology | Purpose |
|----------|------------|---------|
| **Runtime** | Node.js (v18+) | JavaScript runtime environment |
| **Framework** | Express.js | Web framework for routing and middleware |
| **Database**| PostgreSQL | Primary relational database |
| **ORM** | Prisma ORM | Type-safe database client and schema management |
| **Caching** | Redis / ioredis | Rate limiting and temporary data storage |
| **Authentication** | JWT & bcryptjs | Secure stateless authentication and password hashing |
| **Validation** | Zod | Schema declaration and payload validation |
| **Security** | Helmet, CORS | HTTP headers protection and Cross-Origin Resource Sharing |
| **Storage** | Supabase JS | Remote object storage integration |
| **Logging** | Winston & Morgan | Application monitoring and request logging |
| **File Handling**| Multer | Multipart/form-data upload management |

## Project Structure

```text
backend/
├── src/
│   ├── controllers/      # Request handlers and response formatting
│   ├── middlewares/      # Express middlewares (auth, validation, error, rate-limit)
│   ├── prisma/           # Prisma schema, migrations, and seeders
│   ├── repositories/     # Database abstraction layer
│   ├── routes/           # API route definitions
│   ├── services/         # Application business logic
│   ├── utils/            # Shared utilities (logger, jwt, hashing, response parsers)
│   ├── validations/      # Zod validation schemas
│   └── server.js         # Application entry point and configuration
├── .env                  # Environment variables (not in VCS)
├── .gitignore            # Git exclusion rules
├── package.json          # Dependency and script definitions
└── README.md             # Project documentation
```

## Database Schema

The database schema is managed via Prisma and PostgreSQL. Below is the structural representation of the primary models.

### `users`
Management of application user accounts.
| Field | Type | Modifiers | Description |
|-------|------|-----------|-------------|
| id | String | PK, UUID | Unique identifier |
| email | String | Unique | User's email address |
| password | String | | Hashed password |
| name | String | | User's full name |
| avatar | String | Optional | URL to profile picture |
| bio | String | Optional | Short biography |
| createdAt | DateTime | | Timestamp of creation |
| updatedAt | DateTime | | Timestamp of last update |

### `articles`
General publications and health articles.
| Field | Type | Modifiers | Description |
|-------|------|-----------|-------------|
| id | String | PK, UUID | Unique identifier |
| title | String | | Article headline |
| content | String | | Full article text |
| summary | String | Optional | Short abstract |
| imageUrl | String | Optional | Header image URL |
| category | String | | Grouping topic |
| author | String | | Writer's name |
| publishedAt| DateTime | | Publication timestamp |

### `education_contents`
TBC specific learning materials modules.
| Field | Type | Modifiers | Description |
|-------|------|-----------|-------------|
| id | String | PK, UUID | Unique identifier |
| title | String | | Material title |
| content | String | | Educational text body |
| category | String | | Grouping topic |
| imageUrl | String | Optional | Associated media |
| order | Int | Default(0)| Sequencing arrangement |

### `posts`
Community forum posts created by users.
| Field | Type | Modifiers | Description |
|-------|------|-----------|-------------|
| id | String | PK, UUID | Unique identifier |
| userId | String | mapped | Foreign key to `users` |
| content | String | | Body of the post |
| image | String | Optional | Attached media URL |

### `comments` & `likes`
Community engagement entities related to `posts`.
| Entity | Fields | Relations |
|--------|--------|-----------|
| **comments** | id, postId, userId, comment, createdAt | Belongs to Post, Belongs to User |
| **likes** | id, postId, userId, createdAt | Belongs to Post, Belongs to User (Unique constraint on postId+userId) |

### `notifications`
System alerts directed at targeted users.
| Field | Type | Modifiers | Description |
|-------|------|-----------|-------------|
| id | String | PK, UUID | Unique identifier |
| userId | String | mapped | Foreign key to `users` |
| message | String | | Alert text content |
| type | String | Default | Categorization (e.g., 'general')|
| isRead | Boolean | Default(false)| Read status flag |

### `chat_histories`
Records of interactions with the AI assistant.
| Field | Type | Modifiers | Description |
|-------|------|-----------|-------------|
| id | String | PK, UUID | Unique identifier |
| userId | String | mapped | Foreign key to `users` |
| message | String | | User's prompt |
| response | String | | System's reply |

## Setup and Installation

### Prerequisites
- Node.js (v18.0.0 or newer)
- PostgreSQL Server
- Redis Server (for rate limiting)
- Supabase account (if using storage features)

### Installation Steps

1. **Install Dependencies**
   Run the following command in the `backend` directory:
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file in the root directory based on required variables:
   ```env
   # Application Configurations
   PORT=3000
   NODE_ENV=development
   
   # Database (PostgreSQL)
   DATABASE_URL="postgresql://user:password@localhost:5432/aura_health?schema=public"
   
   # Redis (Rate Limiting)
   REDIS_URL="redis://localhost:6379"
   
   # Authentication
   JWT_ACCESS_SECRET="your_secure_jwt_access_secret_key"
   JWT_REFRESH_SECRET="your_secure_jwt_refresh_secret_key"
   JWT_ACCESS_EXPIRES="15m"
   JWT_REFRESH_EXPIRES="7d"
   
   # Supabase Storage
   SUPABASE_URL="your_supabase_project_url"
   SUPABASE_SERVICE_KEY="your_supabase_service_role_key"
   SUPABASE_BUCKET_AVATARS="avatars"
   SUPABASE_BUCKET_POSTS="posts"

   # AI Provider Configuration
   AI_PROVIDER=auto
   AI_GEMINI_MODEL=gemini-flash-lite-latest
   AI_GEMINI_KEY_1="your_gemini_api_key_1"
   # You can add up to 10 keys (AI_GEMINI_KEY_2, etc.) for rotation
   ```

### Obtaining API Keys

To use the AI Chatbot features, you must obtain a Gemini API Key from Google AI Studio:

1. Visit Google AI Studio at: https://aistudio.google.com/app/apikey
2. Sign in with your Google account.
3. Click "Create API Key" or use an existing project.
4. Copy the generated API key.
5. Paste the key into your `.env` file as `AI_GEMINI_KEY_1`.

Note: The system supports key rotation. If you anticipate heavy usage, you can generate multiple API keys from different Google accounts and add them as `AI_GEMINI_KEY_2`, `AI_GEMINI_KEY_3`, up to `AI_GEMINI_KEY_10`. The system will automatically rotate through them when necessary.

#### Alternative AI Providers (Optional fallback)

If you prefer to use alternative AI providers or wish to set up a fallback cascade in case Gemini fails, you can obtain API keys from the following platforms:

**Groq (Blazing Fast Inference)**
1. Visit GroqCloud at: https://console.groq.com/keys
2. Sign in and create an API key.
3. Add the key to your `.env` file as `AI_GROQ_KEY`.
4. Define your preferred model, e.g., `AI_GROQ_MODEL=llama-3.1-8b-instant`.

**OpenRouter (Access to various models)**
1. Visit OpenRouter at: https://openrouter.ai/keys
2. Sign in and create an API key.
3. Add the key to your `.env` file as `AI_OPENROUTER_KEY`.
4. Define your preferred model, e.g., `AI_OPENROUTER_MODEL=meta-llama/llama-3-8b-instruct`.

**Hugging Face (Open Source models)**
1. Visit Hugging Face at: https://huggingface.co/settings/tokens
2. Create an Access Token (Fine-grained or Write permission based on inference needs).
3. Add the token to your `.env` file as `AI_HF_KEY`.
4. Define your preferred model hub ID, e.g., `AI_HF_MODEL=mistralai/Mistral-7B-Instruct-v0.2`.

The system's `AI_PROVIDER=auto` configuration is designed to prioritize Gemini first (if configured), then cascade to OpenRouter, Groq, and Hugging Face sequentially if the preceding provider fails.

3. **Database Setup**
   Push the Prisma schema to your relational database:
   ```bash
   npm run db:push
   ```
   
   Generate the Prisma Client:
   ```bash
   npm run db:generate
   ```

   (Optional) Seed the database with initial variables:
   ```bash
   npm run db:seed
   ```

4. **Running the Application**
   For development with auto-reloading:
   ```bash
   npm run dev
   ```
   
   For production environments:
   ```bash
   npm start
   ```

## Development Scripts

The `package.json` provides scripts to manage the environment effectively:

- `npm run dev`: Starts the Node.js server using `nodemon` for active development.
- `npm start`: Starts the server normally.
- `npm run db:generate`: Regenerates `@prisma/client` types based on schema.
- `npm run db:push`: Pushes schema state to the database without migration files.
- `npm run db:migrate`: Creates standard SQL migration history for production.
- `npm run db:studio`: Opens the Prisma Studio web GUI to view and edit database rows visually.
- `npm run db:seed`: Populates the database with default starting values.

## Security Controls

The platform implements Several layers of security to protect resources:
1. **Network Security**: Configured CORS for targeted origins and Helmet to obfuscate execution technologies and guard against cross-site scripting.
2. **Access Security**: JWT required on protected routes via `auth.middleware.js`. Passwords are irreversibly hashed using BCrypt prior to database insertion.
3. **Application Security**: Strict validation utilizing Zod to prevent NoSQL/SQL injection and unexpected crashes via `validate.middleware.js`.
4. **Availability Control**: Redis-backed Express Rate limiting via `rateLimit.middleware.js` restricting the volume of requests a single IP address can accomplish per minute to mitigate DDoS conditions.