import express from 'express';
import cors from 'cors';
import db from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 1. Servir arquivos estáticos da pasta dist
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// --- API ROUTES ---
app.get('/api/health', (req, res) => res.json({ status: 'ok', server: 'Hostinger', database: 'MySQL' }));

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
    if (rows.length > 0) {
      const user = rows[0];
      delete user.password;
      res.json({ user });
    } else {
      res.status(401).json({ error: 'Credenciais inválidas' });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/faturamento/listar', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM faturamento ORDER BY date DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/faturamento/salvar', async (req, res) => {
  const data = req.body;
  try {
    await db.query(`
      INSERT INTO faturamento (id, date, companyName, bloqueiraValue, agentValue, idep40hValue, idep20hValue)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE date=VALUES(date), companyName=VALUES(companyName), bloqueiraValue=VALUES(bloqueiraValue), agentValue=VALUES(agentValue), idep40hValue=VALUES(idep40hValue), idep20hValue=VALUES(idep20hValue)
    `, [data.id, data.date, data.companyName, data.bloqueiraValue, data.agentValue, data.idep40hValue, data.idep20hValue]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/faturamento/excluir/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM faturamento WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/saidas/listar', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM saidas ORDER BY data DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/saidas/salvar', async (req, res) => {
  const data = req.body;
  try {
    await db.query(`
      INSERT INTO saidas (id, data, nome, valor, local)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE data=VALUES(data), nome=VALUES(nome), valor=VALUES(valor), local=VALUES(local)
    `, [data.id, data.data, data.nome, data.valor, data.local]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/saidas/excluir/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM saidas WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/goals/listar', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM metas');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/goals/salvar', async (req, res) => {
  const data = req.body;
  try {
    await db.query(`
      INSERT INTO metas (id, code, companyName, bloqueiraMeta, agentMeta, idep40hMeta, idep20hMeta)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE code=VALUES(code), companyName=VALUES(companyName), bloqueiraMeta=VALUES(bloqueiraMeta), agentMeta=VALUES(agentMeta), idep40hMeta=VALUES(idep40hMeta), idep20hMeta=VALUES(idep20hMeta)
    `, [data.id, data.code, data.companyName, data.bloqueiraMeta, data.agentMeta, data.idep40hMeta, data.idep20hMeta]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/system/backup', async (req, res) => {
  const backupData = req.body;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, 'backups');
  try {
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
    const fileName = `backup_${timestamp}.json`;
    fs.writeFileSync(path.join(backupDir, fileName), JSON.stringify(backupData, null, 2));
    res.json({ success: true, file: fileName });
  } catch (err) { res.status(500).json({ error: 'Erro no backup.' }); }
});

// 2. Fallback para o React SPA
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Aguardando construção inicial do site...');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`RIOS Server Ativo na porta ${PORT}`));