#!/bin/bash +x

project_dir=$1

cd $project_dir

report=$(license-report)

output_file="../powered-by.md"

if [ ! -f $output_file ]; then
    echo "# Dependencies Report" > $output_file
    echo "" >> $output_file
    echo "The following is a list of all the dependencies of the projects:" >> $output_file
fi

echo "## Project: ${project_dir}" >> $output_file
echo "" >> $output_file

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

    if [[ $author == *" <"* ]]; then
        author="[${author%% <*}](${author##*<}"
        author="${author%?}"    # remove the extra ">" at the end
        author="${author})"     # adding ")" at the end
    fi

    echo "### [${name}](${url})" >> $output_file
    echo "" >> $output_file
    echo "**License:** ${licenseType} - ${licensePeriod}" >> $output_file
    echo "" >> $output_file
    echo "**Used version:** ${installedVersion}" >> $output_file
    echo "" >> $output_file
    echo "**Many thanks to:** ${author}" >> $output_file
    echo "" >> $output_file
done

cd -
