
import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const caminho = ".env";
const variavel = "ARTESAO_DADOS_ENCRYPTION_KEY";

let conteudo = "";

try {
  conteudo = await readFile(caminho, "utf8");
} catch {
  // O arquivo ainda não existe.
}

const possuiChave = conteudo
  .split(/\r?\n/)
  .some((linha) => linha.startsWith(`${variavel}=`) &&
    linha.slice(variavel.length + 1).trim().length >= 32);

if (possuiChave) {
  console.log("Arquivo .env já está configurado.");
} else {
  const chave = randomBytes(32).toString("hex");
  const novasLinhas = conteudo
    .split(/\r?\n/)
    .filter((linha) => !linha.startsWith(`${variavel}=`));

  const restante = novasLinhas.join("\n").trim();

  await writeFile(
    caminho,
    `${restante ? restante + "\n" : ""}${variavel}=${chave}\n`,
    { mode: 0o600 }
  );

  console.log("Arquivo .env configurado com sucesso!");
}
