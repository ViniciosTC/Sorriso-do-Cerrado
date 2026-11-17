export const propriedadesBusca = {
  busca: { type: "string", maxLength: 100 },
  categoria: { type: "array", items: { type: "string" } },
  precoMin: { type: "number", minimum: 0 },
  precoMax: { type: "number", minimum: 0 },
};
