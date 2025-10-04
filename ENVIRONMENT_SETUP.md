# Environment Setup

To run this application, you need to create a `.env` file in the root directory with the following variables:

```
VITE_SUPABASE_URL=https://pquncfufsmcztzidcltb.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key_here
```

## Steps to get your Supabase keys:

1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Navigate to your project dashboard
4. Go to Settings > API
5. Copy the "Project URL" and "anon public" key
6. Replace the values in the `.env` file above

## Running the application:

1. Install dependencies: `npm install`
2. Create the `.env` file with your Supabase credentials
3. Run the development server: `npm run dev`

The application will be available at `http://localhost:8080`
