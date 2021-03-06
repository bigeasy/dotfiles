#!/usr/bin/env node

var $ = require('programmatic')

var pwd = process.cwd(), path = require('path')
var json = require(path.join(pwd, 'package.json'))

function format (json) {
    ;[ 'dependencies', 'devDependencies' ].forEach(function (property) {
        for (var module in json[property]) {
            var loaded = require(path.join(pwd, 'node_modules', module, 'package.json'))
            if (/\.x$/.test(json[property][module])) {
                json[property][module] = loaded.version.replace(/\.\d+$/, '.x')
            }
        }
    })

    for (var key in json) {
        var value = json[key]
        switch (typeof value) {
        case 'object':
            if (Array.isArray(value) && value.length == 0) {
                json[key] = '[]'
            }
            break
        case 'number':
        case 'boolean':
        case 'string':
            json[key] = JSON.stringify(value)
            break
        }
    }

    var fields = ([
            'private', 'name', 'version', 'description', 'keywords', 'author',
            'contributors', 'homepage', 'bugs', 'license', 'repository',
            'dependencies', 'devDependencies', 'main', 'bin', 'scripts', 'nyc',
            'dots'
        ])
        .filter(function (key) {
            return json[key]
        })
        .map(function (key) {
            if (key == 'description') {
                return $(`
                    "description":

                      ${json[key]},

                `)
            } else if (typeof json[key] == 'string') {
                var name = JSON.stringify(key) + ':'
                var spaces = new Array(25 - name.length).join(' ')
                return name + spaces + json[key] + ','
            } else if (Array.isArray(json[key])) {
                if (typeof json[key][0] == 'string') {
                    var lengths = []
                    var array = json[key].map(function (value, index) {
                        value = JSON.stringify(value)
                        lengths[index] = value.length
                        return value
                    })
                    var lines = [], line = [], length = 0
                    for (var i = 0, I = array.length; i < I; i++) {
                        if (length > 44) {
                            length = 0
                            lines.push(line.join(', '))
                            line = []
                        }
                        line.push(array[i])
                        length += lengths[i] + 2
                    }
                    lines.push(line.join(', '))
                    lines = lines.map(function (line) {
                        return line
                    })
                    return $(`
                        ${JSON.stringify(key)}:
                        [
                                                `, lines.join(',\n'), `
                        ],
                    `)
                        
                } else {
                    var contributors = json[key].map(function (contributor) {
                        var fields = []
                        for (var key in contributor) {
                            var name = JSON.stringify(key)
                            var spaces = new Array(9 - name.length).join(' ')
                            fields.push(`${JSON.stringify(key)}:${spaces}${JSON.stringify(contributor[key])}`)
                        }
                        return fields.join(',\n')
                    }).join('\n},\n{\n')
                    return $(`
                        ${JSON.stringify(key)}:
                        [{
                                                `, contributors, `
                        }],
                    `)
                }
            } else {
                var properties = Object.keys(json[key])
                if (key == '_nyc') {
                    return $(`
                        ${JSON.stringify(key)}:
                        {
                            `, "[ " + json[key].exclude.map(function (pattern) {
                                return JSON.stringify(pattern)
                            }).join(', ') + " ]", `
                        },
                    `)
                }
                if (
                    key == 'dependencies' || key == 'devDependencies' ||
                    key == 'bin' || key == 'dots'
                ) {
                    properties.sort()
                }
                properties = properties.map(function (property) {
                    var value = json[key][property]
                    property = JSON.stringify(property)
                    if (
                        key == 'dependencies' || key == 'devDependencies' ||
                        key == 'bin' || key == 'dots'
                    ) {
                        var spaces = new Array(32 - property.length).join(' ')
                    } else {
                        var spaces = ' '
                    }
                    return property + ':' + spaces + JSON.stringify(value)
                })

                if (properties.length == 0) {
                    return $(`
                        ${JSON.stringify(key)}:
                        {
                        },
                    `)
                }
                return $(`
                    ${JSON.stringify(key)}:
                    {
                                            `, properties.join(',\n'), `
                    },
                `)
            }
        })

    fields[fields.length - 1] = fields[fields.length - 1].replace(/,([^,]*$)/, '$1')

    return $(`
        {
            `, fields.join('\n'), `
        }
    `)
}

module.exports = format

if (module === process.mainModule) {
    console.log(format(json))
}

// vim: set tw=0:
