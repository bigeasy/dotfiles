#!/usr/bin/env zsh

set -e

zmodload zsh/pcre
setopt REMATCH_PCRE

source $dots <<- usage
  usage: dots node install

  description:

    Bump version number and publish a release.
usage

zparseopts -K -D \
    -help=o_help h=o_help \
    -title:=o_title t:=o_title \
    -version:=o_version v:=o_version \
    -canary=o_canary c=o_canary \
    -dry-run=o_dry_run d=o_dry_run

package=$1
shift

[[ $# -ne 0 ]] && \
    abend "single package name argument expected after options"

if [ -z "$title" ]; then
    title='' separator=''
    parts=(${(s:.:)package})
    for part in $parts; do
        part=${part#@*/}
        title="$title$separator${(C)part[1,1]}$part[2,-1]"
        separator=' '
    done
fi

current=$(jq -r --arg key $package \
    '[(.devDependencies | to_entries[]), (.dependencies | to_entries[])][] | select(.key == $key) | .value' < package.json)

cache=~/.usr/var/cache/dots/node/outdated/dist-tags
info="$cache/$package/package.json "
mkdir -p "${info%/*}"
if [[ ! -e "$info" ]]; then
    mv =(npm view "$package" --json) "$info"
fi

typeset -A releases
releases=($(jq -r '[ .["dist-tags"] | to_entries[] | .key, .value ] | join(" ")' < "$info"))
print ${releases[@]}

if [ -n "$o_version" ]; then
    release=$o_version
elif [[ -z $o_canary ]]; then
    release=${releases[latest]} 
else
    s_releases=($(semver ${(v)releases} | tail -r))
    release=${s_releases[1]}
fi

if [[ $current =~ '(>=?)(.*)' ]]; then
    release="${match[1]}${release%.*}.0"
elif [[ $current = '*.x' ]]; then
    release=${release%.*}.x
fi

echo "$title $current -> $release"
[[ -n $dry_run ]] && exit

sed 's/\("'"$package"'":[[:space:]]*\)".*"/\1"'$release'"/' package.json  > package.tmp.json
mv package.tmp.json package.json

git commit -a -m 'Upgrade `'$package'` to '$release'.'
