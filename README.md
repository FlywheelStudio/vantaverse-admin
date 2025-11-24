# Vantaverse Admin - Setup Guide for macOS

This guide will help you set up the Vantaverse Admin project on your Mac from scratch.

## Prerequisites

### 1. Install Homebrew (Package Manager)

Open **Terminal** (press `Cmd + Space`, type "Terminal", and press Enter) and run:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Follow the on-screen instructions. You may be prompted to enter your Mac password.

### 2. Install Node.js and npm

After Homebrew is installed, run:

```bash
brew install node
```

Verify the installation:

```bash
node --version
npm --version
```

You should see version numbers (Node.js 18+ recommended).

### 3. Install Git

Git may already be installed. Check with:

```bash
git --version
```

If not installed, install it:

```bash
brew install git
```

### 4. Install a Code Editor (Optional but Recommended)

- **Cursor**: Download from [cursor.sh](https://cursor.sh/) or install via Homebrew:
  ```bash
  brew install --cask cursor
  ```

- **Antigravity**: Download from [antigravity.dev](https://antigravity.google/):
  ```bash
  brew install --cask antigravity
  ```

## Project Setup

### 1. Clone the Repository

Navigate to where you want to store the project (e.g., your Desktop or Documents folder):

```bash
cd ~/Desktop
```

Clone the repository (replace with the actual repository URL if different):

```bash
git clone <repository-url>
cd vantaverse-admin
```

### 2. Install Project Dependencies

Install all required packages:

```bash
npm install
```

This may take a few minutes. Wait for it to complete.

## Running the Project

### Start the Development Server

In the project directory, run:

```bash
npm run dev
```

You should see output like:
```
▲ Next.js 15.x.x
- Local:        http://localhost:3000
```

### Open in Browser

Open your browser and go to:
```
http://localhost:3000
```

The application should now be running!

### Stop the Server

Press `Ctrl + C` in the Terminal to stop the development server.

## Troubleshooting

### Port 3000 Already in Use

If you see an error about port 3000 being in use:

```bash
# Find what's using port 3000
lsof -ti:3000

# Kill the process (replace PID with the number from above)
kill -9 PID
```

Or use a different port:

```bash
npm run dev -- -p 3001
```

### Node Version Issues

If you encounter version-related errors, ensure you're using Node.js 18 or higher:

```bash
node --version
```

If needed, update Node.js:

```bash
brew upgrade node
```

### Permission Errors

If you get permission errors, you may need to fix npm permissions:

```bash
sudo chown -R $(whoami) ~/.npm
```

## Next Steps

- The app should now be running at `http://localhost:3000`
- You can start developing and making changes
- Changes will automatically reload in your browser (hot reload)

## Need Help?

If you run into any issues, check:
- All prerequisites are installed correctly
- You're in the correct project directory when running commands
