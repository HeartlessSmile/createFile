const fs = require('fs')
const path = require('path')
const nunjucks = require('nunjucks')

let res = nunjucks.renderString('Hello {{ username }}', { username: 'James' })
console.log(res)

nunjucks.configure('pageTemplates', { autoescape: true })
let a = nunjucks.render('tabs.ejs', { tabs: ['ss', 'bb', 'dd'] })
console.log( a)
