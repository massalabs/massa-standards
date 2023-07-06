#!/bin/bash +x

project_dir=$1

cd "$project_dir"

fileName="powered-by.md"
report=$(license-report)

echo "# Dependencies Report" > "$fileName"
echo "" >> "$fileName"
echo "The following is a list of all the dependencies of this project:" >> "$fileName"

# base64 encoding/decoding used to handle any potential special characters or escape sequences in the JSON data.

for row in $(echo "${report}" | jq -r '.[] | @base64'); do
    _jq() {
     echo "${row}" | base64 --decode | jq -r ${1}
    }

    name=$(_jq '.name')
    url=$(_jq '.link')
    licenseType=$(_jq '.licenseType')
    licensePeriod=$(_jq '.licensePeriod')
    installedVersion=$(_jq '.installedVersion')
    author=$(_jq '.author')

    # Handle the "n/a" and empty cases for licenseType
    if [[ "$licenseType" == "n/a" || -z "$licenseType" ]]; then
        licenseType="Not specified"
    fi

    # Handle the "n/a" and empty cases for installedVersion
    if [[ "$installedVersion" == "n/a" || -z "$installedVersion" ]]; then
        installedVersion="Not specified"
    fi

    # Handle the "n/a" and empty cases for author, and format if email is present
    if [[ "$author" == "n/a" || -z "$author" ]]; then
        author="Not specified"
    elif [[ "$author" == *" <"* ]]; then
        name_part="${author%% <*}"
        email_part="<${author##*<}"
        author="${name_part} ${email_part}"
    fi

    echo "## [${name}](${url})" >> "$fileName"
    echo "" >> "$fileName"
    echo "**License:** ${licenseType} - ${licensePeriod}" >> "$fileName"
    echo "" >> "$fileName"
    echo "**Used version:** ${installedVersion}" >> "$fileName"
    echo "" >> "$fileName"
    echo "**Many thanks to:** ${author}" >> "$fileName"
    echo "" >> "$fileName"
done

cd -
