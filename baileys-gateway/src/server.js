import 'dotenv/config'
import express from 'express'
import qrcode from 'qrcode-terminal'
import pino from 'pino'
import makeWASocket, {
  DisconnectReason,
  delay,
  fetchLatestBaileysVersion,
  useMultiFileAuthState
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'

const config = {
  port: Number(process.env.PORT || 3010),
  apiKey: process.env.API_KEY || '',
  authDir: process.env.AUTH_DIR || './.baileys-auth',
  logLevel: process.env.LOG_LEVEL || 'info',
  sendDelayMs: Number(process.env.SEND_DELAY_MS || 1200)
}

const logger = pino({ level: config.logLevel })
const app = express()

let sock = null
let connectionState = 'starting'
let lastQrAt = null
let lastError = ''
let reconnecting = false

app.use(express.json({ limit: '1mb' }))

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('62')) return digits
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  if (digits.startsWith('8')) return `62${digits}`
  return digits
}

function phoneToJid(phone) {
  const normalized = normalizePhone(phone)
  if (!/^62\d{8,13}$/.test(normalized)) {
    throw new Error('Nomor WA tidak valid. Gunakan format Indonesia seperti 628xxxxxxxxxx.')
  }
  return `${normalized}@s.whatsapp.net`
}

function requireApiKey(req, res, next) {
  if (!config.apiKey) return next()

  const auth = req.get('authorization') || ''
  const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
  const key = req.get('x-api-key') || bearer

  if (key !== config.apiKey) {
    return res.status(401).json({ ok: false, message: 'API key tidak valid' })
  }

  next()
}

async function startSocket() {
  if (reconnecting) return
  reconnecting = true

  try {
    const { state, saveCreds } = await useMultiFileAuthState(config.authDir)
    const { version } = await fetchLatestBaileysVersion()

    sock = makeWASocket({
      auth: state,
      version,
      logger: logger.child({ module: 'baileys' }),
      markOnlineOnConnect: false,
      syncFullHistory: false
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', update => {
      const { connection, lastDisconnect, qr } = update

      if (qr) {
        connectionState = 'qr'
        lastQrAt = new Date().toISOString()
        logger.info('Scan QR berikut dari WhatsApp > Perangkat tertaut > Tautkan perangkat')
        qrcode.generate(qr, { small: true })
      }

      if (connection === 'open') {
        connectionState = 'open'
        lastError = ''
        logger.info('WhatsApp gateway terhubung')
      }

      if (connection === 'close') {
        const statusCode = new Boom(lastDisconnect?.error).output?.statusCode
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut
        connectionState = shouldReconnect ? 'reconnecting' : 'logged_out'
        lastError = lastDisconnect?.error?.message || String(lastDisconnect?.error || '')
        logger.warn({ statusCode, shouldReconnect, lastError }, 'Koneksi WhatsApp tertutup')

        if (shouldReconnect) {
          reconnecting = false
          setTimeout(() => startSocket().catch(error => logger.error(error)), 3000)
        }
      }
    })

    sock.ev.on('messages.upsert', event => {
      if (event.type !== 'notify') return
      for (const message of event.messages || []) {
        if (message.key?.fromMe) continue
        logger.debug({ jid: message.key?.remoteJid }, 'Pesan masuk diabaikan')
      }
    })
  } finally {
    reconnecting = false
  }
}

app.get('/status', (req, res) => {
  res.json({
    ok: true,
    state: connectionState,
    ready: connectionState === 'open',
    lastQrAt,
    lastError
  })
})

app.post('/send', requireApiKey, async (req, res) => {
  try {
    if (!sock || connectionState !== 'open') {
      return res.status(503).json({
        ok: false,
        message: 'WhatsApp belum terhubung. Jalankan server dan scan QR dulu.',
        state: connectionState
      })
    }

    const phone = req.body.phone || req.body.number || req.body.to
    const message = req.body.message || req.body.text
    if (!message || !String(message).trim()) {
      return res.status(400).json({ ok: false, message: 'Pesan wajib diisi' })
    }

    const jid = phoneToJid(phone)
    await delay(config.sendDelayMs)
    const result = await sock.sendMessage(jid, { text: String(message) })

    res.json({
      ok: true,
      phone: normalizePhone(phone),
      jid,
      messageId: result?.key?.id || ''
    })
  } catch (error) {
    logger.error({ error }, 'Gagal mengirim pesan')
    res.status(500).json({ ok: false, message: error.message || String(error) })
  }
})

app.listen(config.port, () => {
  logger.info(`Baileys gateway berjalan di http://localhost:${config.port}`)
  startSocket().catch(error => {
    lastError = error.message || String(error)
    logger.error(error, 'Gagal memulai socket WhatsApp')
  })
})
