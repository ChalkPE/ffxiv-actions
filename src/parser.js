const puppeteer = require('puppeteer')
const defaultViewport = { width: 1920, height: 1080 }

const util = () => {
  window.link = e => e && e.getAttribute(e.tagName === 'IMG' ? 'src' : 'href').replace(/^\/\//, 'https://')
  window.textNode = n => n.nodeType === Node.TEXT_NODE && n.textContent.trim()
  window.text = e => e && [...e.childNodes].find(textNode).textContent.trim()
  window.Q = (a, b) => b ? a.querySelector(b) : [...document.querySelectorAll(a)]
}

async function parseJobs(browser, server) {
  const page = await browser.newPage()
  await page.goto(server.baseURL + server.endpoint)
  await page.waitFor(server.selector.job)

  await page.evaluate(util)
  return page.evaluate(s => Q(s.job).map(a => ({
    name: text(a),
    link: link(a)
  })), server.selector)
}

async function parseSkills (browser, server, link) {
  const page = await browser.newPage()
  await page.goto(server.baseURL + link)
  await page.waitFor(server.selector.skill)
  
  await page.evaluate(util)
  return page.evaluate(s => [s.pve, s.pvp].map(p => Q(`${p} ${s.skill}`).map(tr => ({
    name: text(Q(tr, s.skillName)) || text(Q(tr, s.skillNameFallback)),
    icon: link(Q(tr, s.skillIcon)),
    effect: Q(tr, s.skillEffect).innerHTML.trim()
  }))), server.selector)
}

module.exports = async function parse (server) {
  const browser = await puppeteer.launch({ defaultViewport, headless: false })

  const jobs = await parseJobs(browser, server)
  const data = await Promise.all(jobs.map(async job => ({
    name: job.name,
    link: job.link.split('/').filter(s => s).slice(-1)[0],
    skills: await parseSkills(browser, server, job.link)
  })))

  await browser.close()
  return data
}