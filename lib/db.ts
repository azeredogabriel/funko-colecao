import * as SQLite from "expo-sqlite";

export type Funko = {
  id: number;
  nome: string;
  numero: string;
  fotoUri: string | null;
  franquia: string | null;
  condicao: string | null;
  observacoes: string | null;
  createdAt: string;
};

const db = SQLite.openDatabaseSync("funkos.db");

export function initDb() {
  db.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS funkos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      numero TEXT NOT NULL,
      fotoUri TEXT,
      franquia TEXT,
      condicao TEXT,
      observacoes TEXT,
      createdAt TEXT NOT NULL
    );
  `);

  // Compatibilidade com bancos antigos
  try {
    db.execSync(`ALTER TABLE funkos ADD COLUMN fotoUri TEXT;`);
  } catch (e) {
    // já existe, ignora
  }
}

export function insertFunko(data: Omit<Funko, "id" | "createdAt">) {
  const createdAt = new Date().toISOString();

  const stmt = db.prepareSync(
    `INSERT INTO funkos (nome, numero, fotoUri, franquia, condicao, observacoes, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  try {
    const result = stmt.executeSync([
      data.nome,
      data.numero,
      data.fotoUri,
      data.franquia,
      data.condicao,
      data.observacoes,
      createdAt,
    ]);

    return { id: Number(result.lastInsertRowId), createdAt };
  } finally {
    stmt.finalizeSync();
  }
}

export function listFunkos(): Funko[] {
  return db.getAllSync<Funko>(`SELECT * FROM funkos ORDER BY id DESC;`);
}

// ✅ NOVO: buscar 1 Funko por ID
export function getFunkoById(id: number): Funko | null {
  const rows = db.getAllSync<Funko>(
    `SELECT * FROM funkos WHERE id = ? LIMIT 1;`,
    [id]
  );
  return rows.length ? rows[0] : null;
}

// ✅ NOVO: deletar Funko por ID
export function deleteFunko(id: number) {
  db.runSync(`DELETE FROM funkos WHERE id = ?;`, [id]);
}
export function updateFunko(
  id: number,
  data: Omit<Funko, "id" | "createdAt">
) {
  db.runSync(
    `UPDATE funkos
     SET nome = ?, numero = ?, fotoUri = ?, franquia = ?, condicao = ?, observacoes = ?
     WHERE id = ?;`,
    [
      data.nome,
      data.numero,
      data.fotoUri,
      data.franquia,
      data.condicao,
      data.observacoes,
      id,
    ]
  );
}