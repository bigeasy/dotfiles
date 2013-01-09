if [ -e ~/.bash_profile_before ]; then
  . ~/.bash_profile_before
fi

echo $0

# Where are we?
src="$0"
dir="$( dirname "$src" )"
while [ -h "$src" ]
do 
  src="$(readlink "$src")"
  [[ $src != /* ]] && src="$dir/$source"
  dir="$( cd -P "$( dirname "$src"  )" && pwd )"
done
dir="$( cd -P "$( dirname "$src" )" && pwd )"

DOTFILES="$( dirname "$dir" )"
echo $DOTFILES

PATH=~/.dotfiles/bin:$PATH

if [ -d /opt/bin ]; then
  PATH="/opt/bin:$PATH"
fi

if [ -d /opt/share/npm/bin ]; then
  PATH=/opt/bin:$PATH
fi

if ! { which node > /dev/null; } && [ -d /node ]; then
  echo "looking for node" 
fi

if [ -e ~/.usr/bin ]; then
  PATH=~/.usr/bin:$PATH
fi

export PATH

echo $DOTFILES/etc/zprofile.d/*


# Source all bash dotfiles.
for file in $DOTFILES/etc/zprofile.d/*; do
  . "$file"
done