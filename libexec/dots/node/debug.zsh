#!/usr/bin/env zsh

source $dots <<- usage
  usage: dots node debug <script>

  desctiption:

    Launch \`node-inspector\` for the given script.
usage

function shutdown() {
    kill -9 "$debug"
}

trap shutdown TERM INT

script=$1

if [ -z "$script" ]; then
    usage 1
fi

if [[ ! -x node_modules/.bin/node-inspector ]]; then
    abend 'you need to `npm install node-inspector`'
fi

node --debug-brk "$script" &
debug=$?

node_modules/.bin/node-inspector
