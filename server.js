
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Rota de Saúde
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// --- AUTENTICAÇÃO ---
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
    if (rows.length > 0) {
      const user = rows[0];
      // Não enviamos a senha de volta por segurança
      delete user.password;
      res.json({ user });
    } else {
      res.status(401).json({ error: 'Credenciais inválidas' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- USUÁRIOS (EQUIPE) ---
app.get('/api/users/listar', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, username, displayName, email FROM users');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/users/salvar', async (req, res) => {
  const { id, username, password, displayName, email } = req.body;
  try {
    await db.query(`
      INSERT INTO users (id, username, password, displayName, email)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        username = VALUES(username),
        password = VALUES(password),
        displayName = VALUES(displayName),
        email = VALUES(email)
    `, [id, username, password, displayName, email]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/users/excluir/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- FATURAMENTO ---
app.get('/api/faturamento/listar', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM faturamento ORDER BY date DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/faturamento/salvar', async (req, res) => {
  const { id, date, companyName, bloqueiraValue, agentValue, idep40hValue, idep20hValue } = req.body;
  try {
    await db.query(`
      INSERT INTO faturamento (id, date, companyName, bloqueiraValue, agentValue, idep40hValue, idep20hValue)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        date = VALUES(date), 
        companyName = VALUES(companyName),
        bloqueiraValue = VALUES(bloqueiraValue),
        agentValue = VALUES(agentValue),
        idep40hValue = VALUES(idep40hValue),
        idep20hValue = VALUES(idep20hValue)
    `, [id, date, companyName, bloqueiraValue, agentValue, idep40hValue, idep20hValue]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/faturamento/excluir/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM faturamento WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- SAIDAS ---
app.get('/api/saidas/listar', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM saidas ORDER BY data DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/saidas/salvar', async (req, res) => {
  const { id, data, nome, valor, local } = req.body;
  try {
    await db.query(`
      INSERT INTO saidas (id, data, nome, valor, local)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        data = VALUES(data), 
        nome = VALUES(nome),
        valor = VALUES(valor),
        local = VALUES(local)
    `, [id, data, nome, valor, local]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/saidas/excluir/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM saidas WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- METAS ---
app.get('/api/goals/listar', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM metas');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/goals/salvar', async (req, res) => {
  const { id, code, companyName, bloqueiraMeta, agentMeta, idep40hMeta, idep20hMeta } = req.body;
  try {
    await db.query(`
      INSERT INTO metas (id, code, companyName, bloqueiraMeta, agentMeta, idep40hMeta, idep20hMeta)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        code = VALUES(code),
        companyName = VALUES(companyName),
        bloqueiraMeta = VALUES(bloqueiraMeta),
        agentMeta = VALUES(agentMeta),
        idep40hMeta = VALUES(idep40hMeta),
        idep20hMeta = VALUES(idep20hMeta)
    `, [id, code, companyName, bloqueiraMeta, agentMeta, idep40hMeta, idep20hMeta]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server Rios rodando na porta ${PORT}`));
