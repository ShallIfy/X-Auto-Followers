# X Auto Followers

**X Auto Followers** is a Node.js-based tool designed to automate the process of adding followers across multiple accounts with proxy support. This README provides an overview of the project, prerequisites, setup instructions, and usage guidance.

## Features

- Automatic Add Followers (Blue Checkmark if you're lucky!)
- Multi-account support
- Multi-proxy support
- Compatible with both Windows and Linux
- Easy-to-setup and run

## Prerequisites

- [Node.js](https://nodejs.org/) (version 18.x or higher required)
- [Visual Studio Code](https://code.visualstudio.com/) (recommended code editor)
- [Git Bash](https://gitforwindows.org/) (required for cloning the repository on Windows)
- `jq` for JSON parsing (included in the repository for Windows users, Linux users will need to install it)
- Internet connection

## Installation and Setup

For detailed setup instructions, please select your operating system below:

### Step 1: Clone the Repository

Using Git Bash or your terminal, clone this repository to your local machine:

```bash
git clone https://github.com/ShallIfy/X-Auto-Followers.git
cd x-auto-followers
```

### Step 2: Configure Accounts and Proxies

In the `initial-config.json` file, add each account configuration as a separate entry. Each entry should include an `auth_token` for the account and a `proxy` object specifying the `server`, `username`, and `password` for proxy access.

**Example `initial-config.json`:**

```json
[
    {
        "auth_token": "YOUR_TWITTER_AUTH_TOKEN",
        "proxy": {
            "server": "PROXY_PROTOCOL://HOST:PORT", 
            "username": "PROXY_USERNAME",
            "password": "PROXY_PASSWORD"
        }
    },
    {
        "auth_token": "YOUR_SECOND_TWITTER_AUTH_TOKEN",
        "proxy": {
            "server": "PROXY_PROTOCOL://HOST:PORT",
            "username": "PROXY_USERNAME",
            "password": "PROXY_PASSWORD"
        }
    }
]
```

### Step 3: Run Setup Script

Use `run.sh` to automatically create folders for each account and set up dependencies. This script will create directories such as `Account-1`, `Account-2`, etc., and will:

- Copy `x.js` and `package.json` to each account folder.
- Install required dependencies in each folder.
- Set up Playwright for browser automation.

To run the setup:

```bash
bash run.sh
```

After running `run.sh`, you will see individual folders created for each account configuration with the necessary dependencies installed.

---

## Operating System Specific Setup

### Windows Setup

1. The repository includes a `jq` executable file for Windows. Copy this file to the `C:\Windows\System32` folder to make it accessible from the command line.
2. Run the `run.sh` script to configure account folders, install dependencies, and set up Playwright.

   ```bash
   bash run.sh
   ```

### Linux Setup

1. Install `jq` by running the following command in your terminal:

   ```bash
   sudo apt-get install jq
   ```

2. Ensure `run.sh` is executable by using the following command:

   ```bash
   chmod +x run.sh
   ```

3. Run the `run.sh` script to configure account folders, install dependencies, and set up Playwright.

   ```bash
   ./run.sh
   ```

---

## Usage

After setting up, navigate to each `Account-X` folder and run the `x.js` script to start the automated follower process:

```bash
cd Account-1
node x.js
```

Repeat this step for each account folder.

### Optional: Using `screen` for Multi-Account Parallel Processing

If you want to run multiple accounts in parallel on Linux, you can use `screen` to keep each account running in separate terminal sessions:

1. Start a new screen session for an account:

    ```bash
    screen -S account1
    ```

2. Navigate to the account folder and start the process:

    ```bash
    cd Account-1
    node x.js
    ```

3. Detach from the screen session by pressing `Ctrl + A` followed by `D`.

4. Repeat these steps for each account, using unique screen names (e.g., `account2`, `account3`, etc.).

To reattach to a screen session:

```bash
screen -r account1
```

This allows you to monitor and manage each account independently without needing multiple open terminal windows.

---

## Multi-Account and Multi-Proxy Support

This tool supports multiple accounts and proxies by using the configurations defined in `initial-config.json`. Each account is assigned its own folder with a corresponding configuration and proxy setup, ensuring independent operations for each account.

---

## Troubleshooting

If you encounter any issues, please feel free to reach out via email, Twitter (X), or Telegram as listed on my profile.

---

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

---

Please refer to the setup documentation for any specific instructions per operating system.