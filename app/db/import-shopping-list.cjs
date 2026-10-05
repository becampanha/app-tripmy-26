// Importa a planilha "🛍️ Lista de compras em Orlando.xlsx" (uma aba por
// viajante) pra tabela shopping_items. Rodar uma vez: node db/import-shopping-list.cjs
//
// Formato de cada aba: colunas [checkbox, QTD, ITENS, MARCA, preço, "Ver
// link"/link embutido na célula, ...bloco de controle financeiro irrelevante
// nas colunas seguintes]. Linhas de seção são texto em CAIXA ALTA na coluna
// ITENS (ex: "ROUPAS CASUAIS"); linhas de item real vêm logo depois, até a
// próxima linha "Total" ou seção nova. Linhas placeholder (qualquer campo
// "-") são puladas.
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { neon } = require('@neondatabase/serverless');

const env = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf-8');
const dbUrlMatch = env.match(/^DATABASE_URL="(.+)"$/m);
const sql = neon(dbUrlMatch[1]);

const XLSX_PATH = '/Users/becampanha/Downloads/🛍️ Lista de compras em Orlando.xlsx';

// Nome da aba -> nome do viajante salvo em shopping_items.traveler (precisa
// bater exatamente com TRAVELERS em src/data/travelers.js).
const SHEET_TO_TRAVELER = {
  '👱🏼‍♂️ Bruno': 'Bruno',
  '👩🏻 Giulia': 'Giulia',
  '👦🏼 Nicolas': 'Nicolas',
  '👶🏼 Anna': 'Anna',
};

// Seção da planilha (texto em caixa alta na coluna ITENS) -> categoria fixa
// do app (ver src/data/shoppingCategories.js) — confirmado com o usuário.
const SECTION_TO_CATEGORY = {
  'ROUPAS CASUAIS': 'Vestuário',
  'ROUPAS SOCIAIS': 'Vestuário',
  'ROUPA': 'Vestuário',
  'CALÇADOS': 'Calçados',
  'ELETRÔNICOS': 'Eletrônicos',
  'TECNOLOGIA': 'Eletrônicos',
  'BRINQUEDOS': 'Brinquedos',
  'MOCHILAS': 'Outros',
  'OUTROS': 'Outros',
};

function isPlaceholder(value) {
  return value == null || value === '-' || value === '';
}

function isSectionTitle(value) {
  return typeof value === 'string' && value === value.toUpperCase() && value.trim().length > 2 && value.trim() !== 'ITENS';
}

function parseSheet(sheet) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  const links = {};
  for (const key in sheet) {
    if (key[0] === '!') continue;
    if (sheet[key].l) links[key] = sheet[key].l.Target;
  }

  const items = [];
  let currentSection = null;

  rows.forEach((row, rowIndex) => {
    const [, , name, brand, price] = row;

    if (isSectionTitle(name)) {
      currentSection = name.trim();
      return;
    }

    if (isPlaceholder(name) || name.trim() === 'Total' || !currentSection) return;

    const category = SECTION_TO_CATEGORY[currentSection];
    if (!category) return; // seção desconhecida — não deveria acontecer, mas não derruba o import

    // Linha do xlsx é 1-indexed e a coluna F é a 6ª (índice 5) — chave tipo "F23".
    const cellRef = `F${rowIndex + 1}`;
    const link = links[cellRef] ? links[cellRef].replace(/&amp;/g, '&') : null;

    items.push({
      category,
      name: name.trim(),
      brand: isPlaceholder(brand) ? null : String(brand).trim(),
      price: isPlaceholder(price) || typeof price !== 'number' ? null : price,
      link,
    });
  });

  return items;
}

async function main() {
  const wb = XLSX.readFile(XLSX_PATH);
  let totalInserted = 0;

  for (const [sheetName, traveler] of Object.entries(SHEET_TO_TRAVELER)) {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) {
      console.log(`⚠ aba "${sheetName}" não encontrada, pulando`);
      continue;
    }

    const items = parseSheet(sheet);
    console.log(`${traveler}: ${items.length} itens`);

    for (const item of items) {
      await sql.query(
        `INSERT INTO shopping_items (traveler, category, name, brand, link, price)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [traveler, item.category, item.name, item.brand, item.link, item.price]
      );
      console.log(`  ✓ [${item.category}] ${item.name}${item.brand ? ' (' + item.brand + ')' : ''}`);
      totalInserted++;
    }
  }

  console.log(`\nConcluído: ${totalInserted} itens inseridos.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
