const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const chalk = require('chalk');
const readline = require('readline');

// Load all configurations from config.json
const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Extract configurations
const auth_token = config.auth_token;
const { server: proxyServer, username: proxyUsername, password: proxyPassword } = config.proxy;

// Setting up readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Display proxy credentials if needed
console.log("Proxy Server:", proxyServer);
console.log("Proxy Username:", proxyUsername);
console.log("Proxy Password:", proxyPassword);

// Function to ask if user wants to use proxy
const getProxyChoice = () => {
    return new Promise((resolve) => {
        rl.question('Use proxy? (Y/N): ', (answer) => {
            resolve(answer.trim().toLowerCase() === 'y');
        });
    });
};

// Rest of your script logic here


// Function to handle errors with retries
async function handlePageError(page, action, maxRetries = 10) {
    let attempts = 0;
    while (attempts < maxRetries) {
        try {
            return await action();
        } catch (error) {
            attempts++;
            console.log(chalk.yellow(`Error encountered: ${error.message}. Retrying (${attempts}/${maxRetries})...`));
            await page.reload(); // Reload the page on each error
        }
    }
    throw new Error(`Failed after ${maxRetries} attempts.`);
}

// Define the file path for the new followers count
const filePath = path.join(__dirname, 'new_followers_count.txt');

// Function to delete and create the followers count file with an initial count of 0
const resetFollowersCountFile = () => {
    fs.writeFileSync(filePath, '0', 'utf-8');
    console.log("Resetting 'new_followers_count.txt' to initial count of 0.");
};

// Initialize the file if it doesn’t exist
resetFollowersCountFile ();

// Function to update the new followers count
const updateNewFollowersCount = () => {
    let currentCount = parseInt(fs.readFileSync(filePath, 'utf-8'), 10) || 0;
    currentCount += 10;
    fs.writeFileSync(filePath, currentCount.toString(), 'utf-8');
    return currentCount;
};

(async () => {
    const useProxy = await getProxyChoice();
    rl.close(); // Close readline interface after getting input

    // Function to start the browser and context
    const startBrowser = async () => {
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            proxy: useProxy ? {
                server: proxyServer,
                username: proxyUsername,
                password: proxyPassword,
            } : undefined,
            storageState: {
                cookies: [
                    {
                        name: "auth_token",
                        value: auth_token,
                        domain: ".x.com",
                        path: "/",
                        secure: true,
                        httpOnly: true,
                    },
                ],
            },
        });
        return { browser, context };
    };

    const checkCredits = async (page, creditSelector) => {
        const creditText = await page.waitForSelector(creditSelector);
        const creditValue = await creditText.innerText();
        return parseInt(creditValue.replace('Credit : ', '').trim(), 10);
    };

    const checkRemainingTime = async (page, remainingTimeSelector) => {
        const remainingTimeText = await page.waitForSelector(remainingTimeSelector);
        return remainingTimeText.innerText();
    };

    let insufficientCreditCount = 0;

    while (true) {
        const { browser, context } = await startBrowser();
        const page = await context.newPage();

        // Intercept requests and block media, images, and fonts
        await context.route('**/*', (route, request) => {
            const resourceType = request.resourceType();
            if (resourceType === 'image' || resourceType === 'media' || resourceType === 'font') {
                route.abort();
            } else {
                route.continue();
            }
        });

        // Check public IP address
        console.log(chalk.blue('Checking public IP address...'));
        const ipCheckPage = await context.newPage();
        await ipCheckPage.goto('https://api.ipify.org?format=json');
        const ipData = await ipCheckPage.evaluate(() => {
            return JSON.parse(document.body.innerText);
        });
        console.log(chalk.green(`Public IP Address: ${ipData.ip}`));
        await ipCheckPage.close();

        try {
            // Step 2: Go to Toolkity website
            console.log(chalk.blue('Navigating to Toolkity website...'));
            await handlePageError(page, () => page.goto('https://toolkity.com/twitter/free-twitter-followers'));

            const authLinkSelector = '//*[@id="twitterFollowersApp"]/div[1]/div/div/div[2]/form/div[2]/a';
            let attempts = 0;
            let buttonFound = false;

            while (attempts < 3) {
                try {
                    await handlePageError(page, () => page.waitForSelector(authLinkSelector, { timeout: 3000 }));
                    buttonFound = true;
                    console.log(chalk.green('   -> Authorization button found! (delaying for 10 seconds)'));
                    await new Promise(resolve => setTimeout(resolve, 10000));
                    break;
                } catch (error) {
                    console.log(chalk.red(`   -> Attempt ${attempts + 1}: Button not found, retrying...`));
                    attempts++;
                }
            }

            if (!buttonFound) {
                throw new Error(chalk.red('Authorization button not found after 3 attempts.'));
            }

            const [newTab] = await Promise.all([
                context.waitForEvent('page'),
                page.click(authLinkSelector),
            ]);

            await newTab.waitForLoadState();

            const allowButtonSelector = '//*[@id="allow"]';
            await handlePageError(newTab, () => newTab.waitForSelector(allowButtonSelector));
            await newTab.click(allowButtonSelector);

            const codeSelector = '//*[@id="oauth_pin"]/p/kbd/code';
            await handlePageError(newTab, () => newTab.waitForSelector(codeSelector));
            const authorizationCode = await newTab.$eval(codeSelector, el => el.innerText);

            console.log(chalk.green(`   -> Authorization Code: ${authorizationCode}`));

            await newTab.close();

            await handlePageError(page, () => page.waitForSelector('//*[@id="code"]'));
            await page.fill('//*[@id="code"]', authorizationCode);

            const loginButtonSelector = '//*[@id="twitterFollowersApp"]/div[1]/div/div/div[2]/form/button';
            await page.click(loginButtonSelector);

            console.log(chalk.green("   -> Login completed with Toolkity!"));

            // Tunggu 10 detik setelah login selesai
            await new Promise(resolve => setTimeout(resolve, 10000));

            // Retrieve account data
            console.log(chalk.blue("Account Data..."));

            // Menunggu accountUsername hingga 30 detik
            const accountUsernameSelector = '//*[@id="twitterFollowersApp"]/div[1]/div[1]/div/div/div/div[1]/div[2]';
            await handlePageError(page, () => page.waitForSelector(accountUsernameSelector, { timeout: 30000 }));
            const accountUsername = await page.$eval(accountUsernameSelector, el => el.innerText);
            console.log(chalk.green(`   -> Username: ${accountUsername}`));

            // Menunggu initialFollowers hingga 30 detik
            const initialFollowersSelector = '//*[@id="twitterFollowersApp"]/div[1]/div[2]/div/div/div/div[1]/div[2]';
            await handlePageError(page, () => page.waitForSelector(initialFollowersSelector, { timeout: 30000 }));
            let accountFollowers = parseInt(await page.$eval(initialFollowersSelector, el => el.innerText), 10);
            console.log(chalk.green(`   -> Followers: ${accountFollowers}`));

            console.log(chalk.blue("Adding Followers ..."));

            const creditSelector = '//*[@id="twitterFollowersApp"]/div[2]/div/div/div/form/div[3]/span[2]';
            const remainingTimeSelector = '//*[@id="twitterFollowersApp"]/div[2]/div/div/div/form/div[3]/span[1]';
            const actionButtonSelector = '//*[@id="twitterFollowersApp"]/div[2]/div/div/div/form/div[2]/button';

            let previousMessage = ''; // Untuk menyimpan pesan sebelumnya

            while (true) {
                const currentCredit = await checkCredits(page, creditSelector);
                const remainingTime = await checkRemainingTime(page, remainingTimeSelector);
        
                // Clear the previous message on the same line
                process.stdout.write(`\r   -> ${chalk.yellow(`Credit: ${currentCredit} | ${remainingTime}`)}`);
        
                if (currentCredit > 9) {
                    console.log("\n   -> Credits are sufficient. Clicking the action button...");
                    await handlePageError(page, () => page.click(actionButtonSelector));
                    await new Promise(resolve => setTimeout(resolve, 10000));
        
                    // Update and display new followers count
                    const newFollowersCount = updateNewFollowersCount();
                    console.clear();
                    console.log(chalk.green(`Public IP Address: ${ipData.ip}`));
                    console.log(chalk.blue(`\n Account Data...`));
                    console.log(chalk.green(`   -> Username: ${accountUsername}`));
                    console.log(chalk.green(`   -> Followers: ${accountFollowers}`));
                    console.log(chalk.green(`   -> New Followers: ${newFollowersCount}`));
                    console.log(chalk.blue(`\n Adding Followers ...`));
                } else {
                    insufficientCreditCount++;
                    console.clear();
                    console.log(chalk.green(`Public IP Address: ${ipData.ip}`));
                    console.log(chalk.blue(`\n Account Data...`));
                    console.log(chalk.green(`   -> Username: ${accountUsername}`));
                    console.log(chalk.green(`   -> Followers: ${accountFollowers}`));
                    const fileContent = fs.readFileSync(filePath, 'utf-8') || '0';
                    console.log(chalk.green(`   -> New Followers: ${fileContent.trim()}`));
                    console.log(chalk.blue(`\n Adding Followers ...`));
                    console.log(chalk.red(`\r   -> ${chalk.yellow(`Credit: ${currentCredit} | ${remainingTime}`)}.`));
                }
        
                // Wait for 10 seconds before checking again
                await new Promise(resolve => setTimeout(resolve, 10000));
            }            

        } catch (error) {
            console.error(chalk.red(`Error encountered: ${error.message}`));
        } finally {
            await page.close();
            await browser.close();
        }
    }
})();
