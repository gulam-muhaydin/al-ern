
# Deployment Guide for All Star Trades Clone

This guide covers the steps to deploy the All Star Trades clone to Vercel with MongoDB Atlas.

## Prerequisites
- GitHub Account
- Vercel Account
- MongoDB Atlas Account

## Step 1: MongoDB Atlas Setup
1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new **Cluster** (Free Tier M0 is fine).
3. In **Database Access**, create a database user (e.g., `admin`) and password.
4. In **Network Access**, allow access from anywhere (`0.0.0.0/0`).
5. Go to **Database** > **Connect** > **Drivers**.
6. Copy the **Connection String**. It looks like:
   `mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority`
7. Replace `<username>` and `<password>` with your credentials.

## Step 2: GitHub Upload
1. Create a new repository on GitHub (e.g., `allstartrade-clone`).
2. Open your terminal in the project folder.
3. Initialize git and push:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/allstartrade-clone.git
   git push -u origin main
   ```

## Step 3: Vercel Deployment
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New** > **Project**.
3. Import your `allstartrade-clone` repository.
4. Vercel will auto-detect the settings. The default framework preset "Other" is fine.
   - **Root Directory**: `./` (default)
   - **Build Command**: (None needed for this setup)
   - **Output Directory**: (None needed)

## Step 4: Environment Variables Setup
1. In the Vercel project deployment screen, find the **Environment Variables** section.
2. Add the following variables:
   - `MONGODB_URI`: Paste your MongoDB connection string from Step 1.
   - `JWT_SECRET`: Enter a long random string (e.g., `mysecretkey123`).
3. Click **Deploy**.

## Step 5: Run Website Live
1. Wait for the deployment to finish.
2. Vercel will provide a production URL (e.g., `https://allstartrade-clone.vercel.app`).
3. Open the URL.
4. Go to `/register` to create an account.
5. Go to `/login` to sign in.
6. Access your dashboard at `/dashboard.html` (or via login redirect).

## Troubleshooting
- **Database Connection Error**: Check your `MONGODB_URI` in Vercel settings. Ensure `0.0.0.0/0` is whitelisted in Atlas.
- **404 Errors**: Ensure `vercel.json` is present and correctly configured.
