#!/bin/bash

# Read each configuration entry from initial-config.json
configs=$(jq -c '.[]' initial-config.json)

# Loop through each configuration and create a folder for each instance
index=1
for config in $configs; do
    folder="Account-$index"
    
    # Create folder and copy x.js and package.json files
    mkdir -p "$folder"
    cp x.js "$folder/"
    cp package.json "$folder/"
    
    # Write the current configuration to config.json in the instance folder
    echo "$config" > "$folder/config.json"
    
    # Enter folder, install dependencies, and install Playwright
    (
        cd "$folder" || exit
        npm install
        yes | npx playwright install  # Automatically confirm prompts with 'yes'
    )

    index=$((index + 1))
done

echo "All account folders created, dependencies installed, and Playwright setup completed in each folder."
